const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Banner = require("../models/Banner");
const authAdmin = require("../middleware/authAdmin");
const fs = require("fs");
const path = require("path");
const { images, processImage } = require("../middleware/images");

// Create Banner
router.post(
  "/createBanner",
  images.single("imageUrl"),
  processImage('banners'),
  body("name", "Nama banner wajib diisi").notEmpty(),
  body("author", "Penulis wajib diisi").notEmpty(),
  body("isActive", "Status banner wajib diisi").notEmpty(),
  body("description").notEmpty().withMessage("Deskripsi wajib diisi"),
  async (req, res) => {
    const errors = validationResult(req);
    const protocol = req.protocol;
    const host = req.get("host");

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, author, isActive } = req.body;
    const imageUrl = req.file
      ? `${process.env.BACKEND_URL}/api/assets/images/banners/${req.file.filename}`
      : "";

    console.log("file gambar banner: ", req.file);
    try {
      const newBanner = new Banner({
        name,
        imageUrl,
        description,
        author,
        isActive,
      });

      await newBanner.save();
      res.status(201).json({
        success: true,
        message: "Banner berhasil dibuat",
        data: newBanner,
      });
    } catch (error) {
      console.error("Error creating banner:", error);
      res.status(500).json({
        success: false,
        message: "Gagal membuat banner",
        error: error.message,
      });
    }
  }
);

// Get All Banner
router.get("/getAllBanners", async (req, res) => {
  try {
    const banners = await Banner.find();
    res.status(200).json({
      success: true,
      message: "Berhasil mengambil semua banner",
      data: banners,
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil semua banner",
      error: error.message,
    });
  }
});

// get Single Banner by id
router.get("/getBannerById/:id", async (req, res) => {
  const bannerId = req.params.id;
  try {
    const detailBanner = await Banner.findById(bannerId);
    if (!detailBanner) {
      return res
        .status(404)
        .send({ message: "Banner not found", success: false });
    }
    res.json({
      data: detailBanner,
      success: true,
      message: `Berhasil mendapatkan data banner ${detailBanner.name}`,
    });
  } catch (error) {
    console.error("Error fetching banner:", error);
    res.status(500).send("Failed to fetch banner");
  }
});

// delete Single Banner by id
router.delete("/deleteBanner/:id", async (req, res) => {
  const bannerId = req.params.id;
  const deletedBanner = await Banner.findByIdAndRemove(bannerId);

  try {
    if (!deletedBanner) {
      return res.status(404).send("Banner tidak ditemukan");
    }

    // Hapus file gambar dari sistem file
    if (deletedBanner.imageUrl) {
      const imageUrl = new URL(deletedBanner.imageUrl);
      const imagePath = path.resolve(
        __dirname,
        "../assets/images/banners",
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
    res.status(200).json({
      success: true,
      message: "Banner berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus banner",
      error: error.message,
    });
  }
});

module.exports = router;
