
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Rota para verificar se o servidor está online
app.get('/', (req, res) => {
  res.send('Servidor Jobby Backend Online!');
});

// Verificação simples de saúde do servidor
app.get('/health', (req, res) => {
  res.json({ sucesso: true, status: 'online' });
});

// Valida valores monetários positivos
function validarValor(valor) {
  if (
    valor === undefined ||
    valor === null ||
    (typeof valor === 'string' && valor.trim() === '')
  ) {
    return null;
  }

  const numero = Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero <= 0 ||
    numero > 100000000
  ) {
    return null;
  }

  return numero;
}

// Calcula o valor do serviço e a comissão do Jobby
app.post('/api/calcular-servico', (req, res) => {
  try {
    const {
      tipo_pagamento,
      valor_base,
      quantidade_horas
    } = req.body || {};

    const tipo = typeof tipo_pagamento === 'string'
      ? tipo_pagamento.trim().toUpperCase()
      : '';

    if (tipo !== 'FIXO' && tipo !== 'HORA') {
      return res.status(400).json({
        sucesso: false,
        error: "Tipo inválido. Use 'FIXO' ou 'HORA'."
      });
    }

    const valorBase = validarValor(valor_base);

    if (valorBase === null) {
      return res.status(400).json({
        sucesso: false,
        error: 'Informe um valor base válido e maior que zero.'
      });
    }

    let valorTrabalhador;

    if (tipo === 'FIXO') {
      valorTrabalhador = valorBase;
    } else {
      const horas = validarValor(quantidade_horas);

      if (
        horas === null ||
        !Number.isInteger(horas) ||
        horas > 10000
      ) {
        return res.status(400).json({
          sucesso: false,
          error: 'Informe uma quantidade inteira de horas, maior que zero.'
        });
      }

      valorTrabalhador = valorBase * horas;
    }

    if (
      !Number.isFinite(valorTrabalhador) ||
      valorTrabalhador > 100000000
    ) {
      return res.status(400).json({
        sucesso: false,
        error: 'O valor total do serviço excede o limite permitido.'
      });
    }

    // Arredonda os valores monetários para centavos
    const valorFuncionarioCentavos = Math.round(
      (valorTrabalhador + Number.EPSILON) * 100
    );

    const comissaoCentavos = Math.round(
      valorFuncionarioCentavos * 0.15
    );

    const totalCentavos =
      valorFuncionarioCentavos + comissaoCentavos;

    return res.json({
      sucesso: true,
      detalhes: {
        tipo,
        valor_a_pagar_ao_funcionario:
          valorFuncionarioCentavos / 100,
        sua_comissao_15_porcento:
          comissaoCentavos / 100,
        valor_total_cobranca_empresa:
          totalCentavos / 100
      }
    });
  } catch (error) {
    console.error('Erro ao calcular serviço:', error);

    return res.status(500).json({
      sucesso: false,
      error: 'Erro interno ao processar o cálculo.'
    });
  }
});

// Tratamento de JSON inválido
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({
      sucesso: false,
      error: 'O JSON enviado é inválido.'
    });
  }

  console.error('Erro inesperado:', err);

  return res.status(500).json({
    sucesso: false,
    error: 'Erro interno do servidor.'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor Jobby rodando na porta ${PORT}`);
});
