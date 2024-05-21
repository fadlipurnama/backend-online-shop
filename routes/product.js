const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { body, validationResult } = require("express-validator");
const authAdmin = require("../middleware/authAdmin");
const images = require("../middleware/images");
const fs = require("fs");
const path = require("path");


// Create Product
router.post(
  "/createProduct",
  authAdmin,
  images.single("imageUrl"),
  [
    body("name", "Nama produk wajib diisi").notEmpty(),
    body("brand", "Merek produk wajib diisi").notEmpty(),
    body("price", "Harga produk wajib diisi").notEmpty(),
    body("category", "Kategori produk wajib diisi").notEmpty(),
    body("rating", "Rating produk wajib diisi").notEmpty(),
    body("author", "Penulis wajib diisi").notEmpty(),
    body("description", "Deskripsi produk wajib diisi").notEmpty(),
    body("discount", "discount produk wajib diisi").notEmpty(),
    body("stock", "Stok produk wajib diisi").notEmpty(),
    body("isActive", "Status produk aktif wajib diisi").notEmpty(),
    body("best", "Status best seller aktif wajib diisi").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0].msg;
      console.log(error);
      return res.status(400).json({ success: false, error });
    }
    const {
      name,
      brand,
      price,
      category,
      rating,
      best,
      author,
      labelPromo,
      description,
      discount,
      stock,
      isActive,
    } = req.body;

    
    const protocol = req.protocol;
    const host = req.get("host");
    const imageUrl = req.file
      ? `${protocol}://${host}/images/${req.file.filename}`
      : "";


    console.log("file gambar product: ", req.file);

    try {
      const newProduct = new Product({
        name,
        brand,
        labelPromo,
        price,
        category,
        imageUrl,
        rating,
        best,
        author,
        description,
        discount,
        stock,
        isActive,
      });
      await newProduct.save();

      // Mengirim data produk yang baru dibuat sebagai respons
      res.status(200).send({
        message: "Produk berhasil dibuat",
        success: true,
        data: newProduct, // Mengirim data produk sebagai respons
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).send({ message: "Gagal membuat produk", success: false });
    }
  }
);

// Get all products
router.get("/getAllProducts", async (req, res) => {
  try {
    const products = await Product.find();
    res.json({
      success: true,
      message: "Success to fetch products",
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch products", success: false, error });
  }
});

// Get single product by id
router.get("/getProductById/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .send({ message: "Product not found", success: false });
    }
    res.json({
      data: product,
      success: true,
      message: `Berhasil mendapatkan data product ${product.name}`,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send("Failed to fetch product");
  }
});

// Search Product
router.get("/searchProducts", async (req, res) => {
  try {
    const { title, category, description, brand } = req.query;
    let query = {};
    if (title) {
      query.name = { $regex: title, $options: "i" };
    }
    if (category) {
      query.category = { $regex: category, $options: "i" };
    }
    if (description) {
      query.description = { $regex: description, $options: "i" };
    }
    if (brand) {
      query.brand = { $regex: brand, $options: "i" };
    }
    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).send("Failed to search products");
  }
});

// Update Product
router.put("/updateProduct/:id", authAdmin, async (req, res) => {
  const productId = req.params.id;
  const updates = req.body;
  console.log("Received updates:", updates); // Log request body

  try {
    const product = await Product.findByIdAndUpdate(productId, updates, {
      new: true,
      runValidators: true,
    });
    console.log("Updated product:", product); // Log updated product
    if (!product) {
      return res
        .status(404)
        .send({ message: "Product not found", success: false });
    }
    res.json({
      data: product,
      success: true,
      messgae: "Product berhasil di update",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .send({ message: "Failed to update product", success: false });
  }
});

// Delete Product
router.delete("/deleteProduct/:id", authAdmin, async (req, res) => {
  const productId = req.params.id;
  const deleteProduct = await Product.findByIdAndRemove(productId);

  try {
    if (!deleteProduct) {
      return res
        .status(404)
        .send({ message: "Product tidak ditemukan", success: false });
    }

    // Hapus file gambar dari sistem file
    if (deleteProduct.imageUrl) {
      const imageUrl = new URL(deleteProduct.imageUrl);
      const imagePath = path.resolve(
        __dirname,
        "../assets/images",
        path.basename(imageUrl.pathname)
      );
      console.log("image path", imagePath);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.log("error - image path", imagePath);
          console.error("Error deleting image file:", err);
        } else {
          console.log("Successfully deleted image file:", imagePath);
        }
      });
    }


    const products = await Product.find();
    res.status(200).send({
      data: products,
      message: "Product berhasil dihapus",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send({ message: "Product gagal dihapus", success: false });
  }
});

module.exports = router;
