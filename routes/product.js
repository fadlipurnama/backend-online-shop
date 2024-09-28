const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { body, validationResult } = require("express-validator");
const authAdmin = require("../middleware/authAdmin");
const { images, processImage } = require("../middleware/images");
const fs = require("fs");
const path = require("path");

// Create Product
router.post(
  "/createProduct",
  authAdmin,
  images.single("imageUrl"),
  processImage('products'),
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
      netWeight,
      serialNumber,
      ratedVoltage,
    } = req.body;

    const protocol = req.protocol;
    const host = req.get("host");
    const imageUrl = req.file
      ? `${protocol}://${host}/api/assets/images/products/${req.file.filename}`
      : "";

    try {
      const newProduct = new Product({
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
        imageUrl,
        netWeight,
        serialNumber,
        ratedVoltage,
      });

      await newProduct.save();

      // Mengirim data produk yang baru dibuat sebagai respons
      res.status(200).json({
        message: "Produk berhasil dibuat",
        success: true,
        data: newProduct, // Mengirim data produk sebagai respons
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Gagal membuat produk", success: false });
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
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },        
          { brand: { $regex: search, $options: "i" } },       
          { category: { $regex: search, $options: "i" } },    
        ]
      };
    }

    const products = await Product.find(query);
    res.json({
      success: true,
      message: "Produk berhasil ditemukan",
      data: products,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mencari produk",
      error: error.message,
    });
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
router.delete(
  "/deleteProduct/:id",
  //  authAdmin,
  async (req, res) => {
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
          "../assets/images/products",
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
      res
        .status(500)
        .send({ message: "Product gagal dihapus", success: false });
    }
  }
);

module.exports = router;
