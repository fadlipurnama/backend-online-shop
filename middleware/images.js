const multer = require("multer");
const path = require("path");

// Fungsi untuk mengganti spasi dengan garis bawah
const replaceSpaces = (filename) => {
  const basename = path.basename(filename, path.extname(filename));
  return basename.replace(/\s+/g, "_");
};

// Konfigurasi penyimpanan multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./assets/images");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "9" + Math.round(Math.random() * 1e9);
    const sanitizedFilename = replaceSpaces(file.originalname);
    const extension = path.extname(file.originalname);
    cb(null, sanitizedFilename + "-" + uniqueSuffix + extension);
  },
});

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

module.exports = images;
