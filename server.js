const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Servidor Jobby Backend Online!');
});

// Rota para calcular o pagamento (Fixo ou Por Hora + 15% de comissão)
app.post('/api/calcular-servico', (req, res) => {
  try {
    const { tipo_pagamento, valor_base, quantidade_horas } = req.body;
    
    let valorTrabalhador = 0;

    if (tipo_pagamento === "FIXO") {
      valorTrabalhador = Number(valor_base);
    } else if (tipo_pagamento === "HORA") {
      valorTrabalhador = Number(valor_base) * Number(quantidade_horas || 1);
    } else {
      return res.status(400).json({ 
        error: "Tipo de pagamento inválido. Use 'FIXO' ou 'HORA'." 
      });
    }

    // A sua comissão de 15% cobrada da empresa
    const comissaoPlataforma = valorTrabalhador * 0.15;
    
    // O valor total que a empresa vai pagar (Valor do trabalhador + 15%)
    const valorTotalEmpresa = valorTrabalhador + comissaoPlataforma;

    return res.json({
      sucesso: true,
      detalhes: {
        tipo: tipo_pagamento,
        valor_a_pagar_ao_funcionario: Number(valorTrabalhador.toFixed(2)),
        sua_comissao_15_porcento: Number(comissaoPlataforma.toFixed(2)),
        valor_total_cobranca_empresa: Number(valorTotalEmpresa.toFixed(2))
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erro ao processar o cálculo",
      detalhes: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor a rodar na porta ${PORT}`);
});
