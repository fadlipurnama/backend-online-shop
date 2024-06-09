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

// create a user :post "/auth",!auth
router.post(
  "/register",
  [
    body("firstName", "Mohon Masukkan nama depan terlebih dahulu").isLength({
      min: 1,
    }),
    body("lastName", "Masukkan nama belakang terlebih dahulu").isLength({
      min: 1,
    }),
    body("email", "Masukkan alamat email yang valid").isEmail(),
    body("password", "Password setidaknya berisi 5 karakter").isLength({
      min: 5,
    }),
    body("phoneNumber", "Masukan nomor telepon").isLength({
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
    body("email", "Mohon tuliskan alamat email dengan benar")
      .optional()
      .isEmail(),
    body("phoneNumber", "Masukan nomor No.Handphone yang valid").optional(),
    body("password", "Mohon masukkan kata sandi terlebih dahulu")
      .exists()
      .isLength({
        min: 1,
      }),
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
          error: "Email yang anda masukkan salah",
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
        expiresIn: "60m",
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
// Ganti dengan path ke middleware authUser Anda

router.put("/updateUser", authUser, async (req, res) => {
  const { username, ...updateData } = req.body;
  const userId = req.user;

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error("User tidak ditemukan:", userId);
      return res.status(400).json({ success: false, error: "Pengguna tidak ditemukan" });
    }

    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          success: false,
          error: "Username hanya boleh berisi huruf, angka, dan underscore (_)",
        });
      }

      if (username.length < 6 || username.length > 10) {
        return res.status(400).json({
          success: false,
          error: "Panjang username minimal 6 - 10 karakter",
        });
      }

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ success: false, error: "Username sudah digunakan" });
      }

      updateData.username = username;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (!updatedUser) {
      return res.status(400).json({ success: false, error: "Gagal memperbarui pengguna" });
    }

    return res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Kesalahan saat memperbarui pengguna:", error);
    return res.status(500).json({
      success: false,
      error: "Terjadi kesalahan saat memperbarui pengguna",
    });
  }
});


router.put(
  "/change-password",
  authUser,
  [
    body("oldPassword", "Masukkan kata sandi lama Anda").exists(),
    body("newPassword", "Password baru setidaknya berisi 5 karakter").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, error: errors.array()[0].msg });
    }

    const { oldPassword, newPassword } = req.body;
    try {
      const user = await User.findById(req.user);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "Pengguna tidak ditemukan" });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, error: "Password lama tidak cocok" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({ success: true, message: "Password berhasil diubah" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
);

// delete user and user data
router.delete("/delete/user/:userId", authUser, deleteAllUserData);
module.exports = router;
