const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const authUser = require("../middleware/authUser");
const dotenv = require("dotenv");
const { deleteAllUserData } = require("../controller/deleteUser");
const { images, processImage } = require("../middleware/images");
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
        expiresIn: "24h",
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

router.put(
  "/updateUser",
  authUser,
  images.single("imageUrl"),
  processImage("userProfile"),
  async (req, res) => {
    const { username, ...updateData } = req.body;
    const userId = req.user;

    try {
      const user = await User.findById(userId);
      if (!user) {
        console.error("User tidak ditemukan:", userId);
        return res
          .status(400)
          .json({ success: false, error: "Pengguna tidak ditemukan" });
      }

      // Validasi dan update username
      if (username) {
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
          return res.status(400).json({
            success: false,
            error:
              "Username hanya boleh berisi huruf, angka, dan underscore (_) ",
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
          return res
            .status(400)
            .json({ success: false, error: "Username sudah digunakan" });
        }

        updateData.username = username;
      }

      // Mengambil URL gambar yang diunggah
      const protocol = req.protocol;
      const host = req.get('host');
      const imageUrl = req.file
        ? `${protocol}://${host}/api/assets/images/userProfile/${req.file.filename}`
        : user.imageUrl; // Jika tidak ada file yang diunggah, gunakan gambar lama

      // Menambahkan URL gambar ke updateData
      updateData.imageUrl = imageUrl;

      // Update data user
      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
      });

      if (!updatedUser) {
        return res
          .status(400)
          .json({ success: false, error: "Gagal memperbarui pengguna" });
      }

      return res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
      console.error("Kesalahan saat memperbarui pengguna:", error);
      return res.status(500).json({
        success: false,
        error: "Terjadi kesalahan saat memperbarui pengguna",
      });
    }
  }
);

// Route untuk memperbarui profil pengguna
router.put(
  "/updateProfile",
  authUser,
  [
    body("password", "Password harus diisi").exists(),
    body("firstName", "Nama depan tidak boleh kosong").optional().isLength({ min: 1 }),
    body("lastName", "Nama belakang tidak boleh kosong").optional().isLength({ min: 1 }),
    body("phoneNumber", "Nomor telepon tidak valid").optional().isLength({ min: 10, max: 12 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array()[0].msg });
    }

    const { password, firstName, lastName, phoneNumber } = req.body;
    const userId = req.user;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: "Pengguna tidak ditemukan" });
      }

      // Validasi password
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ success: false, error: "Password salah" });
      }

      // Siapkan data untuk diperbarui
      const updateData = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (phoneNumber) updateData.phoneNumber = String(phoneNumber);

      // Perbarui data pengguna
      const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

      if (!updatedUser) {
        return res.status(400).json({ success: false, error: "Gagal memperbarui profil" });
      }

      return res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
      console.error("Kesalahan saat memperbarui profil:", error);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
);


router.post('/reset-password/:token', [
  body('newPassword', 'Password baru setidaknya berisi 5 karakter').isLength({ min: 5 }),
], async (req, res) => {
  const { newPassword } = req.body;
  const token = req.params.token;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }, // Cek apakah token masih berlaku
  });

  if (!user) {
    return res.status(400).json({ success: false, error: "Token tidak valid atau sudah kadaluarsa" });
  }

  // Hash password baru
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.resetPasswordToken = undefined; // Hapus token
  user.resetPasswordExpires = undefined; // Hapus waktu kadaluarsa
  await user.save();

  res.json({ success: true, message: "Password berhasil diubah" });
});

router.post('/forgot-password', [
  body('email', 'Masukkan alamat email yang valid').isEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: "Email tidak terdaftar" });
    }

    // Buat token untuk reset password
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Token berlaku selama 1 jam
    await user.save();

    // Konfigurasi Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail', // atau provider email lainnya
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: email,
      subject: 'Reset Password',
      text: `Anda menerima email ini karena kami menerima permintaan reset password untuk akun Anda.
      
      Silakan klik tautan berikut untuk mengatur ulang password Anda: 
      http://${req.headers.host}/auth/reset-password/${token}

      Token ini akan kadaluarsa dalam 1 jam.`
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "Email reset password telah dikirim!" });
  } catch (error) {
    console.error("Kesalahan saat mengirim email:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
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

router.post('/send-otp', [
  body('email', 'Masukkan alamat email yang valid').isEmail(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }

  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: "Email tidak terdaftar" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    user.otp = otp;
    user.otpExpires = Date.now() + 300000; // OTP berlaku selama 5 menit
    await user.save();

    // Konfigurasi Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail', // atau provider email lainnya
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: email,
      subject: 'Verifikasi OTP',
      text: `Anda menerima email ini karena kami menerima permintaan verifikasi OTP untuk akun Anda.
      
      Kode OTP Anda adalah: ${otp}

      Kode ini akan kadaluarsa dalam 5 menit.`
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "Email OTP telah dikirim!" });
  } catch (error) {
    console.error("Kesalahan saat mengirim email:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post('/verify-otp', [
  body('email', 'Masukkan alamat email yang valid').isEmail(),
  body('otp', 'Masukkan OTP yang valid').isLength({ min: 6, max: 6 }),
], async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: "Email tidak terdaftar" });
    }

    // Cek apakah OTP valid
    if (user.otp !== otp || Date.now() > user.otpExpires) {
      return res.status(400).json({ success: false, error: "OTP tidak valid atau sudah kadaluarsa" });
    }

    // OTP valid, lakukan aksi yang diperlukan, misalnya aktifkan akun
    user.otp = undefined; // Hapus OTP setelah verifikasi
    user.otpExpires = undefined; // Hapus waktu kadaluarsa
    await user.save();

    res.json({ success: true, message: "OTP berhasil diverifikasi" });
  } catch (error) {
    console.error("Kesalahan saat memverifikasi OTP:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// delete user and user data
router.delete("/delete/user/:userId", authUser, deleteAllUserData);

module.exports = router;
