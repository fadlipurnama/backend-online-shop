const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { body, validationResult } = require("express-validator");

// Create Product
router.post("/createProduct", async (req, res) => {
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
    console.error("Error creating product:", error);
    res.status(500).send("Failed to create product");
  }
});

// Get All Product
router.get("/getProducts", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Failed to fetch products");
  }
});

// Get Single product by id
router.get("/getProduct/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.json(product);
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
router.put("/updateProduct/:id", async (req, res) => {
  const productId = req.params.id;
  const updates = req.body;
  try {
    const product = await Product.findByIdAndUpdate(productId, updates, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Failed to update product");
  }
});

// Delete Product
router.delete("/deleteProduct/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findByIdAndRemove(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send("Failed to delete product");
  }
});

module.exports = router;
