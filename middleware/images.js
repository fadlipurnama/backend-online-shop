const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

// Fungsi untuk mengganti spasi dengan garis bawah
const replaceSpaces = (filename) => {
  const basename = path.basename(filename, path.extname(filename));
  return basename.replace(/\s+/g, "_");
};

// Konfigurasi penyimpanan multer
const storage = multer.memoryStorage();

// Filter untuk memastikan hanya file gambar yang diterima
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|gif/;
  const mimetype = fileTypes.test(file.mimetype);
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Only images are allowed!");
  }
};

const images = multer({ storage, fileFilter });

const processImage = (fileLocation) => {
  return async (req, res, next) => {
    if (!req.file) return next();

    const { buffer, originalname } = req.file;
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const sanitizedFilename = replaceSpaces(originalname);
    const extension = path.extname(originalname);
    const filename = `${sanitizedFilename}-${uniqueSuffix}${extension}`;
    const outputPath = path.join(__dirname, `../assets/images/${fileLocation}`, filename);

    try {
      // Proses gambar menggunakan Sharp
      const imageBuffer = await sharp(buffer)
        .resize(1024, 1024, { fit: sharp.fit.inside, withoutEnlargement: true })
        .jpeg({ quality: 100 })
        .toBuffer();

      // Periksa ukuran file setelah kompresi
      if (imageBuffer.length > 250 * 1024) {
        return res.status(400).json({ message: "Ukuran file maximal 200KB", success: false });
      }

      // Simpan gambar yang sudah dikompres
      await sharp(imageBuffer).toFile(outputPath);

      req.file.filename = filename;
      req.file.path = outputPath;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { images, processImage };
