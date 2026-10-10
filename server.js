const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';
const ASAAS_ACCESS_KEY = process.env.ASAAS_ACCESS_KEY || 'SUA_CHAVE_DE_API_AQUI'; 

app.get('/', (req, res) => {
    res.send('Servidor Jobby Backend Online e Operacional!');
});

app.post('/api/pagar-pix', async (req, res) => {
    try {
        const { title, budget, freelancerWalletId, customerName } = req.body;
        const valorTotal = parseFloat(budget);
        
        if (isNaN(valorTotal) || valorTotal <= 0) {
            return res.status(400).json({ success: false, error: 'Orçamento inválido.' });
        }

        const payloadCobranca = {
            customer: customerName || "Empresa Contratante Jobby",
            billingType: 'PIX',
            value: valorTotal,
            dueDate: new Date().toISOString().split('T')[0],
            description: `Projeto Jobby: ${title}`,
            split: [
                {
                    walletId: freelancerWalletId,
                    percentualValue: 85.00
                }
            ]
        };

        const responseCobranca = await axios.post(`${ASAAS_API_URL}/payments`, payloadCobranca, {
            headers: { 'access_token': ASAAS_ACCESS_KEY, 'Content-Type': 'application/json' }
        });

        const paymentId = responseCobranca.data.id;

        const responseQrCode = await axios.get(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
            headers: { 'access_token': ASAAS_ACCESS_KEY }
        });

        res.status(200).json({
            success: true,
            paymentId: paymentId,
            encodedImage: responseQrCode.data.encodedImage,
            payloadPix: responseQrCode.data.payload
        });

    } catch (error) {
        console.error('Erro ao gerar Pix real:', error.response?.data || error.message);
        res.status(500).json({ success: false, error: 'Falha ao comunicar com o gateway de pagamento Pix.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Jobby a correr na porta ${PORT}`);
});
