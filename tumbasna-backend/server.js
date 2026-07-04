require('dotenv').config();
const express = require('express');
const cors = require('cors');
const midtransClient = require('midtrans-client');

const app = express();
app.use(cors());
app.use(express.json());

// Inisialisasi Midtrans Snap
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SERVER_KEY_ANDA_DISINI',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'Mid-client-PjI0Nu76GIkFIqVR'
});

app.post('/api/payments/create', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // Parameter transaksi yang dikirim ke Midtrans
    const parameter = {
      "transaction_details": {
        "order_id": orderId + "-" + Date.now(), // Tambahan timestamp agar order_id selalu unik saat testing
        "gross_amount": 10000 // Harga dummy, di produksi ambil dari database
      },
      "credit_card":{
        "secure" : true
      },
      "customer_details": {
        "first_name": "User",
        "last_name": "Tumbasna",
        "email": "user@tumbasna.com",
        "phone": "08123456789"
      }
    };

    const transaction = await snap.createTransaction(parameter);
    
    // Kembalikan token ke frontend
    res.json({ token: transaction.token });
  } catch (error) {
    console.error("Gagal membuat transaksi midtrans:", error.message);
    res.status(500).json({ error: 'Gagal membuat transaksi' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend Tumbasna berjalan di http://localhost:${PORT}`);
});
