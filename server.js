const express = require('express');
const cors = require('cors');
const { AbacatePay } = require('abacatepay');

const app = express();
app.use(express.json());
app.use(cors());

// Inicializa a SDK com a chave das variáveis de ambiente
const abacatePay = AbacatePay(process.env.ABACATEPAY_API_KEY);

app.get('/', (req, res) => {
  res.send('Servidor Jobby Backend Online!');
});

// Rota para gerar cobrança Pix
app.post('/api/pagar-pix', async (req, res) => {
  try {
    const { transaction_amount, description, payer } = req.body;

    const billing = await abacatePay.billing.create({
      frequency: "ONE_TIME",
      methods: ["PIX"],
      products: [
        {
          externalId: "prod-1",
          name: description || "Pagamento Jobby",
          quantity: 1,
          price: Math.round(Number(transaction_amount) * 100) // Valor em centavos
        }
      ],
      returnUrl: "https://jobby-api-krma.onrender.com",
      completionUrl: "https://jobby-api-krma.onrender.com",
      customer: {
        email: payer?.email || "cliente@jobby.com",
        taxId: payer?.identification?.number || "14678875441",
        name: payer?.first_name || "Cliente Jobby"
      }
    });

    return res.status(201).json(billing);

  } catch (error) {
    console.error('Erro no AbacatePay:', error);
    return res.status(500).json({
      error: 'Erro ao processar pagamento com AbacatePay',
      detalhes: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor a rodar na porta ${PORT}`);
});
