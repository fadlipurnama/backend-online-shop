const express = require("express");
const router = express.Router();
const Order = require("../models/Order"); // Import model Order
const authUser = require("../middleware/authUser");

// Fetch Order Status
router.get("/fetchOrderStatus", authUser, async (req, res) => {
  try {
    // Mengambil status pesanan untuk user yang sedang diautentikasi
    const orders = await Order.find({ userId: req.user.id });
    res.json({
      success: true,
      data: orders,
      message: "Order status fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order status",
      error: error.message,
    });
  }
});

// Update Order Status
router.put("/updateOrderStatus/:id", authUser, async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  try {
    // Mengupdate status pesanan berdasarkan ID
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json({
      success: true,
      data: updatedOrder,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
});

// Fetch Shopping History
router.get("/fetchShoppingHistory", authUser, async (req, res) => {
  try {
    // Mengambil riwayat belanja untuk user yang sedang diautentikasi
    const shoppingHistory = await Order.find({
      userId: req.user.id,
      status: "completed", // Anda dapat menyesuaikan kondisi ini sesuai dengan definisi selesai belanja
    });
    res.json({
      success: true,
      data: shoppingHistory,
      message: "Shopping history fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching shopping history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch shopping history",
      error: error.message,
    });
  }
});

module.exports = router;
