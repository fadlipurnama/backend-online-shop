const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Transaction = require("../models/Transaction");
const snap = require("../midtransConfig");
const Product = require("../models/Product");
const authUser = require("../middleware/authUser");
const { customAlphabet } = require("nanoid");
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;

// Create Transaction
router.post("/createTransaction", authUser, async (req, res) => {
  const {
    products,
    grossAmount,
    firstName,
    userId,
    lastName,
    customerEmail,
    phoneNumber,
    shippingService,
    shippingCourier,
    trackingNumber, // Tambahkan nomor resi
    shippingAddress, // Tambahkan alamat pengiriman
    paymentMethod, // Tambahkan metode pembayaran
  } = req.body;

  console.log("Products:", products);

  // Memastikan produk tidak kosong
  if (!products || products.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Produk tidak boleh kosong" });
  }

  // Validasi grossAmount
  if (isNaN(grossAmount) || grossAmount <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Total gross amount tidak valid" });
  }

  if (!shippingAddress || !shippingCourier || !shippingService) {
    return res.status(400).json({
      success: false,
      message: "Semua field pengiriman harus diisi.",
    });
  }

  console.log("Gross Amount:", grossAmount);

  const nanoidAlphaNumeric = customAlphabet(
    "abcdefghijklmnopqrstuvwxyz0123456789",
    8
  );

  const transaction_id = `ID${nanoidAlphaNumeric(4)}${nanoidAlphaNumeric(8)}`;


  // Buat transaksi baru di database
  const transaction = new Transaction({
    id: transaction_id,
    grossAmount,
    userId: userId,
    customerName: `${firstName} ${lastName}`,
    customerEmail,
    phoneNumber, // Simpan nomor telepon
    shippingService, // Simpan metode pengiriman
    shippingCourier,
    trackingNumber, // Simpan nomor resi
    shippingAddress, // Simpan alamat pengiriman
    paymentMethod, // Simpan metode pembayaran
    status: "PENDING_PAYMENT",
    products: products.map((product) => ({
      // Simpan produk yang dipesan
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
    })),
  });

  try {
    await transaction.save(); // Menyimpan transaksi ke database
  } catch (error) {
    console.error("Error saving transaction:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal menyimpan transaksi di database",
    });
  }

  // Konfigurasi transaksi untuk Snap Midtrans
  const midtransTransaction = {
    transaction_details: {
      order_id: transaction_id,
      gross_amount: grossAmount,
    },
    item_details: products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
    })),
    customer_details: {
      first_name: firstName,
      last_name: lastName,
      email: customerEmail,
      phone: phoneNumber,
    },
    callbacks: {
      finish: `${process.env.FRONTEND_URL_1}/transaction?transaction_id=${transaction_id}`,
      error: `${process.env.FRONTEND_URL_1}/transaction?transaction_id=${transaction_id}`,
      pending: `${process.env.FRONTEND_URL_1}/transaction?transaction_id=${transaction_id}`,
    },
  };

  // Mengirimkan permintaan Snap ke Midtrans
  try {
    const transactionResponse = await snap.createTransaction(
      midtransTransaction
    );

    // Simpan Snap token untuk digunakan di frontend
    transaction.token = transactionResponse.token;

    await transaction.save();

    console.log("Transaction Response:", transactionResponse);

    res.status(200).json({
      success: true,
      message: "Transaksi berhasil dibuat",
      data: {
        id: transaction_id,
        grossAmount: grossAmount,
        customerName: `${firstName} ${lastName}`,
        customerEmail,
        // redirectUrl: transactionResponse.redirect_url,
        token: transactionResponse.token,
      },
    });
  } catch (error) {
    console.error("Error creating Snap transaction:", error);

    // Penanganan jika Snap gagal membuat transaksi
    if (error.response) {
      return res.status(500).json({
        success: false,
        message:
          error.response.message || "Gagal membuat transaksi di Midtrans",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Gagal membuat transaksi di Midtrans",
      });
    }
  }
});

// Get All Transactions
router.get("/getAllTransactions", async (req, res) => {
  try {
    const transactions = await Transaction.find().populate("transaction_items");
    res.json({
      success: true,
      message: "Berhasil mendapatkan transaksi",
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal mendapatkan transaksi" });
  }
});

// Delete Transaction
router.delete("/deleteTransaction/:transactionId", authUser, async (req, res) => {
  const { transactionId } = req.params;

  try {
    // Cari transaksi berdasarkan id
    const transaction = await Transaction.findOne({ transactionId });

    // Jika transaksi tidak ditemukan
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan",
      });
    }

    // Hapus transaksi
    await Transaction.deleteOne({ transactionId });

    // Kirimkan respons sukses
    res.json({
      success: true,
      message: "Transaksi berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus transaksi",
    });
  }
});


router.get("/getTransactionByUserId/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tidak ada transaksi yang ditemukan untuk user ini",
      });
    }

    res.json({
      success: true,
      message: "Berhasil mendapatkan transaksi untuk user",
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching transactions by user ID:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mendapatkan transaksi untuk user",
    });
  }
});

router.get("/getTransactionById/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const transaction = await Transaction.findOne({ id });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Berhasil mendapatkan transaksi",
      data: transaction,
    });
  } catch (error) {
    console.error("Error fetching transaction by ID:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mendapatkan transaksi",
    });
  }
});

// Update Transaction Status
router.put("/updateTransactionById/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const validStatuses = ["PENDING_PAYMENT", "PAID", "CANCELED"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedTransaction) {
      return res
        .status(404)
        .json({ success: false, message: "Transaksi tidak ditemukan" });
    }

    res.json({
      success: true,
      message: "Status transaksi berhasil diperbarui",
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal memperbarui transaksi" });
  }
});

// Transaction Notification (Webhook)
router.post("/transactionNotification", async (req, res) => {
  const notificationData = req.body;

  const transactionId = notificationData.order_id;
  const status = notificationData.transaction_status;
  const fraudStatus = notificationData.fraud_status;
  const grossAmount = notificationData.gross_amount;
  const signatureKey = notificationData.signature_key;

  try {
    // Mengambil transaksi menggunakan ID melalui endpoint /getTransactionById
    const transactionResponse = await Transaction.findOne({
      id: transactionId,
    });

    if (!transactionResponse) {
      return res
        .status(404)
        .json({ success: false, message: "Transaksi tidak ditemukan" });
    }

    // Verifikasi signature key
    const hash = crypto
      .createHash("sha512")
      .update(
        `${transactionId}${notificationData.status_code}${grossAmount}${MIDTRANS_SERVER_KEY}`
      )
      .digest("hex");

    if (signatureKey !== hash) {
      return res.status(400).json({
        success: false,
        message: "Invalid Signature key",
      });
    }

    // Memperbarui status transaksi berdasarkan status yang diterima melalui endpoint /updateTransactionById
    let paymentMethod = notificationData.payment_type;
    let settlementTime = notificationData.settlement_time;

    // Jika payment_type adalah "bank_transfer", ambil bank dari va_numbers
    if (
      notificationData.payment_type === "bank_transfer" &&
      notificationData.va_numbers.length > 0
    ) {
      paymentMethod = notificationData.va_numbers[0].bank; // Ambil bank dari va_numbers
    }

    let updatedStatus;
    if (status === "capture" && fraudStatus === "accept") {
      updatedStatus = "PAID";
    } else if (status === "settlement") {
      updatedStatus = "PAID";
    } else if (
      status === "cancel" ||
      status === "deny" ||
      status === "expire"
    ) {
      updatedStatus = "CANCELED";
    } else if (status === "pending") {
      updatedStatus = "PENDING_PAYMENT";
    }

    // Memperbarui transaksi
    await Transaction.findByIdAndUpdate(
      transactionResponse._id,
      { status: updatedStatus, paymentMethod, settlementTime },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Notifikasi diterima dan status transaksi diperbarui",
      data: {
        ...transactionResponse.toObject(),
        status: updatedStatus,
        paymentMethod,
      },
    });
  } catch (error) {
    console.error("Error handling transaction notification:", error);
    res
      .status(500)
      .json({ success: false, message: "Gagal memproses notifikasi" });
  }
});

module.exports = router;
