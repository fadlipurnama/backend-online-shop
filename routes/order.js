const express = require("express");
const router = express.Router();
const Order = require("../models/Order"); // Import model Order
// const authUser = require("../middleware/authUser");

router.get("/getOrdersByUserId/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const orders = await Order.find({ userId });

    console.log(orders)

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

// Update Order Status
router.put("/updateOrderStatus/:id", async (req, res) => {
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
router.get("/fetchShoppingHistory", async (req, res) => {
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
