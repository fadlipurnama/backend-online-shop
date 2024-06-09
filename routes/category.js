const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Category = require("../models/Category");
const authAdmin = require("../middleware/authAdmin");
const fs = require("fs");
const path = require("path");
const { images, processImage } = require("../middleware/images");


// Create Category
router.post(
  "/createCategory",
  images.single("imageUrl"),
  processImage,
  body("name", "Nama category wajib diisi").notEmpty(),
  body("author", "Penulis wajib diisi").notEmpty(),
  body("isActive", "Status category produk wajib diisi").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    const protocol = req.protocol;
    const host = req.get("host");

    if (!errors.isEmpty()) {
      const error = errors.array()[0].msg;
      console.log(error);
      return res.status(400).json({ success: false, error });
    }

    const { name, author, isActive } = req.body;
    const imageUrl = req.file
      ? `${protocol}://${host}/api/assets/images/categories${req.file.filename}`
      : "";

    console.log("file gambar category: ", req.file);
    try {
      const newCategory = new Category({
        name,
        imageUrl,
        author,
        isActive,
      });

      await newCategory.save();
      res.status(201).json({
        success: true,
        message: "Berhasil membuat kategori",
        data: newCategory,
      });
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({
        success: false,
        message: "Gagal membuat kategori",
        error: error.message,
      });
    }
  }
);

// Get All Category
router.get("/getAllCategory", async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      success: true,
      message: "Berhasil mengambil semua kategori",
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send({
      message: "Gagal mengambil semua kategori",
      success: false,
      error,
    });
  }
});

// Get Single category by id
router.get("/getCategory/:id", async (req, res) => {
  try {
    const categoryId = await Category.findById(req.params.id);
    if (!categoryId) {
      return res.status(404).send({ message: "Kategori tidak ditemukan" });
    }
    res.status(200).json({
      success: true,
      message: "Kategori ditemukan",
      data: categoryId,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil kategori",
      error: error.message,
    });
  }
});

// Update Category
router.put("/updateCategory/:id", async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const categoryId = req.params.id;
  const updates = req.body;

  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).send("Category not found");
    }

    res.status(200).json({
      success: true,
      message: "Category successfully updated",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
});

// Delete Category
router.delete("/deleteCategory/:id", async (req, res) => {
  const categoryId = req.params.id;
  const deletedCategory = await Category.findByIdAndRemove(categoryId);

  try {
    if (!deletedCategory) {
      return res.status(404).send("Kategori tidak ditemukan");
    }

    // Hapus file gambar dari sistem file
    if (deletedCategory.imageUrl) {
      const imageUrl = new URL(deletedCategory.imageUrl);
      const imagePath = path.resolve(
        __dirname,
        "../assets/images/categories",
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

    const categories = await Category.find();

    res.status(200).json({
      success: true,
      data: categories,
      message: "Berhasil menghapus category",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus category",
      error: error.message,
    });
  }
});

module.exports = router;
