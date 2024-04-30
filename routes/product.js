const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const checkAdmin = require("../middleware/authAdmin");

// Create Product
router.post(
  "/createProduct",
  // checkAdmin,
  async (req, res) => {
    const {
      name,
      brand,
      price,
      category,
      imageUrl,
      rating,
      author,
      description,
      promo,
      stock,
      isActive,
    } = req.body;
    try {
      const product = new Product({
        name,
        brand,
        price,
        category,
        imageUrl,
        rating,
        author,
        description,
        promo,
        stock,
        isActive,
      });
      await product.save();
      res.status(201).send("Product created successfully");
    } catch (error) {
      res.status(500).send("Something went wrong");
    }
  }
);

// Get All Product
router.get("/getProducts", async (req, res) => {
  try {
    const product = await Product.find();
    res.send(product);
  } catch (error) {
    res.status(500).send("Something went wrong");
  }
});

// To get Single product by id
router.get("/getProduct/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    res.send(product);
  } catch (error) {
    res.status(500).send("Something went wrong");
  }
});
// to get products for single category
router.post("/getProduct/:type", async (req, res) => {
  const { type } = req.body.params;
  try {
    const product = await Product.find({ type });
    res.send(product);
  } catch (error) {
    res.status(500).send("Something went wrong");
  }
});

// Update Product
router.put("/updateProduct/:id", async (req, res) => {
  const productId = req.params.id;
  const updates = req.body;

  try {
    // Cari produk berdasarkan ID
    const product = await Product.findById(productId);

    // Jika produk tidak ditemukan, kirim respons 404
    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Lakukan pembaruan pada properti produk yang diterima dari body permintaan
    for (let key in updates) {
      if (updates.hasOwnProperty(key)) {
        product[key] = updates[key];
      }
    }

    // Simpan perubahan pada produk
    await product.save();

    // Kirim respons dengan produk yang diperbarui
    res.json(product);
  } catch (error) {
    // Tangani kesalahan server
    res.status(500).send("Internal server error");
  }
});

// Delete Product
router.delete("/deleteProduct/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    // Cari produk berdasarkan ID
    const product = await Product.findById(productId);

    // Jika produk tidak ditemukan, kirim respons 404
    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Hapus produk dari basis data
    await product.remove();

    // Kirim respons sukses
    res.status(204).send();
  } catch (error) {
    // Tangani kesalahan server
    res.status(500).send("Internal server error");
  }
});

// Search Product
// Route untuk pencarian produk berdasarkan nama, kategori, dan deskripsi
router.get("/searchProducts", async (req, res) => {
  try {
    const { title, category, description, brand } = req.query;
    let query = {};

    // Menambahkan kriteria pencarian berdasarkan nama, kategori, dan deskripsi
    if (title) {
      query.title = { $regex: title, $options: "i" }; // Menyertakan kriteria nama produk
    }
    if (category) {
      query.category = { $regex: category, $options: "i" }; // Menyertakan kriteria kategori produk
    }
    if (description) {
      query.description = { $regex: description, $options: "i" }; // Menyertakan kriteria deskripsi produk
    }
    if (brand) {
      query.brand = { $regex: brand, $options: "i" }; // Menyertakan kriteria deskripsi produk
    }

    // Melakukan pencarian produk berdasarkan kriteria
    const products = await Product.find(query);

    // Mengirim respons dengan produk yang ditemukan
    res.json(products);
  } catch (error) {
    // Mengirim respons status 500 jika terjadi kesalahan
    res.status(500).send("Internal server error");
  }
});

// Route untuk pencarian produk berdasarkan nama, kategori, dan deskripsi
router.get(
  "/searchProducts/:name/:brand/:category/:description",
  async (req, res) => {
    try {
      const { name, category, description } = req.params;
      let query = {};

      // Menambahkan kriteria pencarian berdasarkan nama, kategori, dan deskripsi
      if (name !== "none") {
        query.name = { $regex: name, $options: "i" }; // Menyertakan kriteria nama produk
      }
      if (category !== "none") {
        query.category = { $regex: category, $options: "i" }; // Menyertakan kriteria kategori produk
      }
      if (description !== "none") {
        query.description = { $regex: description, $options: "i" }; // Menyertakan kriteria deskripsi produk
      }

      // Melakukan pencarian produk berdasarkan kriteria
      const products = await Product.find(query);

      // Mengirim respons dengan produk yang ditemukan
      res.json(products);
    } catch (error) {
      // Mengirim respons status 500 jika terjadi kesalahan
      res.status(500).send("Internal server error");
    }
  }
);

module.exports = router;
