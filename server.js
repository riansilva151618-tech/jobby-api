const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

// Chave do AbacatePay
const ABACATEPAY_KEY = process.env.ABACATEPAY_API_KEY || "key_AWkuX4ZeSJYTMzkHutAXnbsQ";

app.get('/', (req, res) => {
  res.send('Servidor Jobby Backend Online!');
});

app.post('/api/pagar-pix', async (req, res) => {
  try {
    const { transaction_amount, description, payer } = req.body;

    // Endpoint oficial e único do AbacatePay
    const response = await axios.post(
      'https://api.abacatepay.com/v1/billing/create',
      {
        frequency: "ONE_TIME",
        methods: ["PIX"],
        products: [
          {
            externalId: "prod-1",
            name: description || "Pagamento Jobby",
            quantity: 1,
            price: Math.round(Number(transaction_amount || 10) * 100)
          }
        ],
        returnUrl: "https://jobby-api-krma.onrender.com",
        completionUrl: "https://jobby-api-krma.onrender.com",
        customer: {
          name: payer?.first_name || "Cliente Jobby",
          cellphone: "11999999999",
          email: payer?.email || "cliente@jobby.com",
          taxId: payer?.identification?.number || "14678875441"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${ABACATEPAY_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.status(201).json(response.data);

  } catch (error) {
    console.error('Erro no AbacatePay:', error.response?.data || error.message);
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
