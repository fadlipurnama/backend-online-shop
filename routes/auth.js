const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const authUser = require("../middleware/authUser");
const dotenv = require("dotenv");
const { deleteAllUserData } = require("../controller/deleteUser");
dotenv.config();

function generateRandomUsername(length) {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomUsername = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomUsername += characters.charAt(randomIndex);
  }

  return randomUsername;
}

// create a user :post "/auth",!auth
router.post(
  "/register",
  [
    body("firstName", "Masukan nama depan yang valid").isLength({ min: 1 }),
    body("lastName", "Masukan nama belakang yang valid").isLength({ min: 1 }),
    body("email", "Masukan alamat email yang valid").isEmail(),
    body("password", "Password setidaknya berisi 5 karakter").isLength({
      min: 5,
    }),
    body("phoneNumber", "Masukan nomor telepon yang valid").isLength({
      min: 10,
      max: 12,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0].msg;
      console.log(error);
      return res.status(400).json({ success: false, error });
    }

    const { firstName, lastName, email, phoneNumber, password, isAdmin } =
      req.body;

    try {
      let user = await User.findOne({ $or: [{ email }, { phoneNumber }] });
      if (user) {
        return res.status(400).json({
          success: false,
          error: "Maaf, alamat email atau nomor telepon telah terdaftar",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(password, salt);

      user = await User.create({
        firstName,
        lastName,
        email,
        phoneNumber: String(phoneNumber),
        username: generateRandomUsername(9),
        password: secPass,
        isAdmin,
      });

      const data = { user: { id: user.id } };
      const authToken = jwt.sign(data, process.env.JWT_SECRET);

      return res.json({
        success: true,
        // authToken,
        message: "Registrasi berhasil",
      });
    } catch (error) {
      console.error(
        "Kesalahan saat pembuatan atau penyimpanan pengguna:",
        error
      );
      return res
        .status(500)
        .json({ success: false, error: "Internal server error" });
    }
  }
);

router.post(
  "/login",
  [
    body("email", "Masukan alamat email yang valid").optional().isEmail(),
    body("phoneNumber", "Masukan nomor No.Handphone yang valid").optional(),
    body("password", "Password tidak boleh kosong").exists().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
      });
    }

    let user;
    const { email, phoneNumber, password } = req.body;
    try {
      // Cari user berdasarkan email atau username
      if (email) {
        user = await User.findOne({ email });
      }

      if (phoneNumber) {
        user = await User.findOne({ phoneNumber });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Pengguna tidak ditemukan",
        });
      }

      // Lakukan autentikasi password
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({
          success: false,
          error: "Kata sandi salah",
        });
      }

      // Buat token JWT untuk user yang berhasil login
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30m",
      });

      return res.json({
        success: true,
        authToken: token,
        message: "Login berhasil",
      });
    } catch (error) {
      console.error("Kesalahan saat proses login:", error);
      return res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
);

// logged in user details
router.get("/getDetailUser", authUser, async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    console.log("user: ", user);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Pengguna tidak ditemukan" });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Kesalahan saat mengambil data pengguna:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

// update user details
router.put("/updateUser", authUser, async (req, res) => {
  const updateData = req.body;
  const userId = req.user; // Gunakan req.user sebagai ID pengguna

  try {
    // Temukan pengguna berdasarkan ID
    const user = await User.findById(userId);
    if (!user) {
      console.error("User tidak ditemukan:", userId);
      return res
        .status(400)
        .json({ success: false, error: "Pengguna tidak ditemukan" });
    }

    // Lakukan pembaruan data pengguna
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    if (!updatedUser) {
      return res
        .status(400)
        .json({ success: false, error: "Gagal memperbarui pengguna" });
    }

    // Kirim respons sukses bersama dengan data pengguna yang diperbarui
    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Kesalahan saat memperbarui pengguna:", error);
    return res.status(500).json({
      success: false,
      error: "Terjadi kesalahan saat memperbarui pengguna",
    });
  }
});

// delete user and user data
router.delete("/delete/user/:userId", authUser, deleteAllUserData);
module.exports = router;
