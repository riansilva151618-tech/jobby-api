const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

// Token do Mercado Pago vindo das variáveis de ambiente do Render
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

// Rota de teste para ver se o servidor está online
app.get('/', (req, res) => {
    res.send('Servidor Jobby Backend Online e Operacional com Mercado Pago!');
});

// Rota para criar o pagamento Pix
app.post('/api/pagar-pix', async (req, res) => {
    try {
        const { transaction_amount, description, payer } = req.body;

        const paymentData = {
            transaction_amount: Number(transaction_amount),
            description: description || 'Pagamento Jobby',
            payment_method_id: 'pix',
            payer: {
                email: payer?.email || 'cliente@jobby.com',
                first_name: payer?.first_name || 'Cliente',
                last_name: payer?.last_name || 'Jobby',
                identification: {
                    type: payer?.identification?.type || 'CPF',
                    number: payer?.identification?.number || '12345678909'
                }
            }
        };

        const response = await axios.post(
            'https://api.mercadopago.com/v1/payments',
            paymentData,
            {
                headers: {
                    'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                    'X-Idempotency-Key': Date.now().toString()
                }
            }
        );

        const pointOfInteraction = response.data.point_of_interaction;
        const qrCode = pointOfInteraction?.transaction_data?.qr_code;
        const qrCodeBase64 = pointOfInteraction?.transaction_data?.qr_code_base64;

        return res.status(201).json({
            status: response.data.status,
            id: response.data.id,
            qr_code: qrCode,
            qr_code_base64: qrCodeBase64,
            ticket_url: pointOfInteraction?.transaction_data?.ticket_url
        });

    } catch (error) {
        console.error('Erro ao gerar Pix:', error.response?.data || error.message);
        return res.status(500).json({
            error: 'Erro ao processar pagamento Pix',
            detalhes: error.response?.data || error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});
