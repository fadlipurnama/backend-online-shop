const express = require("express");
const router = express.Router();
const Wishlist = require("../models/Wishlist"); // Import model Wishlist
const authUser = require("../middleware/authUser");

// Fetch Wishlist
router.get("/getDataWishlist", authUser, async (req, res) => {
  try {
    // Mengambil semua item dalam wishlist untuk user yang sedang diautentikasi
    const wishlists = await Wishlist.find({ user: req.user })
      .populate("user", "name email")
      .populate("product", "_id name brand price discount imageUrl stock");
    res.json({
      success: true,
      data: wishlists,
      message: "Berhasil menambil data wishlist",
    });
  } catch (error) {
    console.error("Error mengambil data wishlist:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data wishlist",
      error: error.message,
    });
  }
});

// Menambahkan produk ke wishlist
router.post("/addWishlist", authUser, async (req, res) => {
  const { productId } = req.body;

  try {
    // Periksa apakah produk sudah ada dalam wishlist pengguna
    const existingWishlistItem = await Wishlist.findOne({
      user: req.user,
      product: productId,
    });

    if (existingWishlistItem) {
      return res.status(400).json({
        success: false,
        message: "Produk sudah ada dalam wishlist",
      });
    }

    // Membuat item baru dalam wishlist
    const newWishlist = new Wishlist({
      user: req.user,
      product: productId,
    });
    await newWishlist.save();
  
    const newWishlistItem = await Wishlist.findOne({
      user: req.user,
      product: productId,
    })
      .populate("user", "name email")
      .populate("product", "_id name brand price discount imageUrl stock");

    res.json({
      success: true,
      data: newWishlistItem,
      message: "Berhasil menambahkan produk ke wishlist",
    });
  } catch (error) {
    console.error("Error menambah produk ke wishlist:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan produk ke wishlist",
      error: error.message,
    });
  }
});

// Delete produk dari Wishlist
router.delete("/deleteWishlist/:id", authUser, async (req, res) => {
  const productId = req.params.id;
  const user = req.user; // Mengambil user ID dari middleware authUser
  console.log(
    "ID Produk yang diterima untuk dihapus dari wishlist:",
    productId
  );

  try {
    // Menghapus item dari wishlist berdasarkan user ID dan product ID
    const result = await Wishlist.findOneAndRemove({
      product: productId,
      user,
    });
    if (!result) {
      return res.status(404).json({
        success: false,
        message:
          "Produk tidak ditemukan di wishlist atau Anda tidak memiliki hak untuk menghapus item ini",
      });
    }
    // const wishlists = await Wishlist.find({ user: req.user })
    //   .populate("user", "name email")
    //   .populate("product", "_id name brand price discount imageUrl stock");

    res.json({
      success: true,
      message: "Berhasil menghapus produk dari wishlist",
      // data: wishlists,
    });
  } catch (error) {
    console.error("Error menghapus produk dari wishlist:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus produk dari wishlist",
      error: error.message,
    });
  }
});

module.exports = router;
