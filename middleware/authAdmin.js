const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/User.js");
dotenv.config();

const checkAdmin = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    console.error("Authorization header not found");
    return res.status(401).send({ message: "Akses ditolak", success: false });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data.userId;

    const checkAdmin = await User.findById(req.user);
    if (checkAdmin && checkAdmin.role === 'admin') {
      next();
    } else {
      console.error("Pengguna bukan admin");
      res.status(401).send({ message: "Tidak memiliki akses", success: false });
    }
  } catch (error) {
    console.error("Verifikasi token gagal:", error);
    res.status(401).send({message: "Verifikasi token gagal", success: false});
  }
};

module.exports = checkAdmin;
