const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
    isProduction: false, // Ganti dengan true jika sudah dalam mode produksi
    serverKey: process.env.MIDTRANS_SERVER_KEY, // Masukkan server key dari Midtrans
    clientKey: process.env.MIDTRANS_CLIENT_KEY, // Masukkan client key dari Midtrans
});

module.exports = snap;
