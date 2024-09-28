const express = require("express");
const router = express.Router();
const Order = require("../models/Order"); // Import model Order
const authUser = require("../middleware/authUser");
const authAdmin = require("../middleware/authAdmin");

// Create Order (sudah ada)
router.post("/createOrder", authUser, async (req, res) => {
  const {
    grossAmount,
    customerName,
    customerEmail,
    shippingAddress,
    shippingCourier,
    userId,
    shippingService,
    transactionId,
    paymentMethod,
    shippingNumber,
    products,
  } = req.body;

  // Validasi manual (sudah ada)
  if (typeof grossAmount !== "number" || grossAmount <= 0) {
    return res.status(400).json({
      success: false,
      errors: "Jumlah bruto diperlukan dan harus berupa angka positif",
    });
  }
  if (!customerName || typeof customerName !== "string") {
    return res
      .status(400)
      .json({ success: false, errors: "Nama pelanggan diperlukan" });
  }
  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return res
      .status(400)
      .json({ success: false, errors: "Email yang valid diperlukan" });
  }
  if (!shippingAddress || typeof shippingAddress !== "string") {
    return res
      .status(400)
      .json({ success: false, errors: "Alamat pengiriman diperlukan" });
  }
  if (!transactionId || typeof transactionId !== "string") {
    return res
      .status(400)
      .json({ success: false, errors: "ID transaksi diperlukan" });
  }
  if (!shippingCourier || typeof shippingCourier !== "string") {
    return res
      .status(400)
      .json({ success: false, errors: "Kurir pengiriman diperlukan" });
  }
  if (!userId || typeof userId !== "string") {
    return res
      .status(400)
      .json({ success: false, errors: "ID pengguna diperlukan" });
  }
  if (!shippingService || typeof shippingService !== "string") {
    return res
      .status(400)
      .json({ success: false, errors: "Layanan pengiriman diperlukan" });
  }
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      success: false,
      errors: "Produk diperlukan dan harus berupa array",
    });
  }

  try {
    const newOrder = new Order({
      grossAmount,
      customerName,
      customerEmail,
      shippingAddress,
      transactionId,
      shippingCourier,
      userId,
      shippingService,
      paymentMethod,
      shippingNumber,
      products,
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order berhasil dibuat",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Gagal membuat order",
      error: error.message,
    });
  }
});

// Get Orders by User ID (sudah ada)
router.get("/getOrdersByUserId/:userId", authUser, async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tidak ada pesanan yang ditemukan untuk user ini",
      });
    }

    res.json({
      success: true,
      message: "Berhasil mendapatkan pesanan untuk user",
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders by user ID:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mendapatkan daftar pesanan untuk user",
    });
  }
});

// **New** Get Order by Order ID
router.get("/getOrderById/:orderId", authUser, async (req, res) => {
  const { orderId: transactionId } = req.params;

  try {
    const order = await Order.findOne({ transactionId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Berhasil mendapatkan detail pesanan",
      data: order,
    });
  console.log("orderData", order);
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mendapatkan detail pesanan",
      error: error.message,
    });
  }
});

// **New** Update Order Status and Shipping Number
router.put("/updateOrderStatus/:orderId", authAdmin, async (req, res) => {
  const { orderId: transactionId } = req.params;
  const { status: deliveryStatus, shippingNumber } = req.body;

  try {
    // Validasi input status dan shippingNumber
    if (!deliveryStatus || typeof deliveryStatus !== "string") {
      return res.status(400).json({
        success: false,
        message: "Status pengiriman diperlukan dan harus berupa string",
      });
    }

    // Mengupdate status dan shippingNumber pesanan
    const updatedOrder = await Order.findOneAndUpdate(
      { transactionId },
      { deliveryStatus, shippingNumber },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Status dan nomor pengiriman berhasil diperbarui",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Gagal memperbarui status pengiriman",
      error: error.message,
    });
  }
});

module.exports = router;
