// const express = require("express");
// const router = express.Router();
// const Cart = require("../models/Cart");
// const authUser = require("../middleware/authUser");

// // get all cart products
// router.get("/fetchCart", authUser, async (req, res) => {
//     try {
//         const cart = await Cart.find({ user: req.user.id })
//             .populate("productId", "name price image rating type")
//             .populate("user", "name email");
//         res.send(cart);
//     } catch (error) {
//         res.status(500).send("Internal server error");
//     }
// });

// // add to cart
// router.post("/addCart", authUser, async (req, res) => {
//     try {
//         const { _id, quantity } = req.body;
//         const findProduct = await Cart.findOne({ $and: [{ productId: _id }, { user: req.user.id }] })
//         if (findProduct) {
//             return res.status(400).json({ msg: "Product already in a cart" })
//         }
//         else {
//             const user = req.header;
//             const cart = new Cart({
//                 user: req.user.id,
//                 productId: _id,
//                 quantity,
//             });
//             const savedCart = await cart.save();
//             res.send(savedCart);
//         }
//     } catch (error) {
//         res.status(500).send("Internal server error");
//     }
// });

// // remove from cart
// router.delete("/deleteCart/:id", authUser, async (req, res) => {
//     const { id } = req.params;
//     try {
//         const result = await Cart.findByIdAndDelete(id)
//         res.send(result);
//     } catch (error) {
//         res.status(500).send("Internal server error");
//     }
// });
// module.exports = router;

const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const authUser = require("../middleware/authUser");

// Fetch Cart
router.get("/getDataCart", authUser, async (req, res) => {
  try {
    // Mengambil semua item dalam keranjang untuk pengguna yang sedang diautentikasi
    const carts = await Cart.find({ user: req.user })
      .populate("user", "name email")
      .populate("product", "_id name brand price discount imageUrl stock netWeight");

    // Menghitung total quantity
    const totalQuantity = carts.reduce((sum, item) => sum + item.quantity, 0);
    res.json({
      success: true,
      data: carts,
      totalQuantity,
      message: "Berhasil mengambil data keranjang",
    });
  } catch (error) {
    console.error("Error mengambil produk keranjang:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data keranjang",
      error: error.message,
    });
  }
});

// Tambahkan ke Cart
router.post("/addCart", authUser, async (req, res) => {
  const { product, quantity } = req.body;

  try {
    // Periksa apakah item dengan productId yang sama sudah ada dalam keranjang pengguna
    const existingCartItem = await Cart.findOne({
      user: req.user,
      product,
    });

    if (existingCartItem) {
      // Jika item sudah ada, tambahkan quantity
      existingCartItem.quantity += quantity;
      await existingCartItem.save();
      cartItem = existingCartItem;
    } else {
      // Jika Produk belum ada, tambahkan Produk baru ke keranjang
      const newCart = new Cart({
        user: req.user, // Menggunakan ID pengguna dari req.user
        product,
        quantity,
      });
      cartItem = await newCart.save();
    }

    // Mengambil semua item dalam keranjang untuk menghitung total quantity
    const carts = await Cart.find({ user: req.user });
    // Menghitung total quantity
    const totalQuantity = carts.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      data: cartItem,
      totalQuantity,
      message: "Berhasil menambahkan produk ke keranjang",
    });
  } catch (error) {
    console.error("Error menambah produk ke keranjang:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menambah produk ke keranjang",
      error: error.message,
    });
  }
});

// Hapus dari Cart
router.delete("/deleteCart/:id", authUser, async (req, res) => {
  const itemId = req.params.id;
  try {
    // Menghapus produk dari keranjang berdasarkan ID
    await Cart.findByIdAndRemove(itemId);

    // Mengambil semua item dalam keranjang untuk menghitung total quantity
    const carts = await Cart.find({ user: req.user })

    // // Menghitung total quantity
    const totalQuantity = carts.reduce((sum, item) => sum + item.quantity, 0);
    res.json({
      success: true,
      totalQuantity,
      message: "Produk berhasil dihapus dari keranjang",
      // data: carts,
    });
  } catch (error) {
    console.error("Error menghapus produk dari keranjang:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus produk dari keranjang",
      error: error.message,
    });
  }
});

// Update Quantity in Cart
router.put("/updateQuantity/:id", authUser, async (req, res) => {
  const itemId = req.params.id;
  const { quantity } = req.body;

  try {
    // Periksa apakah produk keranjang sesuai dengan pengguna yang diautentikasi
    const cartItem = await Cart.findOne({ _id: itemId, user: req.user })
      .populate("user", "name email")
      .populate("product", "_id name brand price discount imageUrl stock");

    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan didalam keranjang" });
    }

    // Update quantity pada produk keranjang
    cartItem.quantity = quantity;
    await cartItem.save();

    // Mengambil semua item dalam keranjang untuk menghitung total quantity
    const carts = await Cart.find({ user: req.user });
    // Menghitung total quantity
    const totalQuantity = carts.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      data: cartItem,
      totalQuantity,
      message: "Berhasil mengubah quantity",
    });
  } catch (error) {
    console.error("Error mengubah quantity:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengubah jumlah quantity di keranjang",
      error: error.message,
    });
  }
});

module.exports = router;
