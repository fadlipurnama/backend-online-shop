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
let success = false;
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
    res.c;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    const { firstName, lastName, email, phoneNumber, password, isAdmin } =
      req.body;

    try {
      let user = await User.findOne({
        $or: [{ email: email }, { phoneNumber: phoneNumber }],
      });
      if (user) {
        return res
          .status(400)
          .send({ error: "Maaf, alamat email atau password telah terdaftar" });
      }

      // password hashing
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(password, salt);

      // create a new user
      user = await User.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        password: secPass,
        isAdmin,
      });
      const data = {
        user: {
          id: user.id,
        },
      };
      success = true;
      message = "Registrasi berhasil";
      const authToken = jwt.sign(data, process.env.JWT_SECRET);
      res.send({ success, authToken, message });
    } catch (error) {
      console.error(
        "Kesalahan saat pembuatan atau penyimpanan pengguna:",
        error
      );
      res.status(500).send("Internal server error");
    }
  }
);

// login Route
router.post(
  "/login",
  [
    body("email", "Masukan nama depan yang valid").isEmail(),
    body("password", "Password tidak boleh kosong").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors.array();
      return res.status(400).json({ error: [...message] });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Pengguna tidak ditemukan" });
      }
      const passComp = await bcrypt.compare(password, user.password);
      if (!passComp) {
        return res.status(401).json({ error: "Kata sandi salah" });
      }

      const data = {
        user: {
          id: user._id,
        },
      };

      const authToken = jwt.sign(data, process.env.JWT_SECRET, {
        expiresIn: "30m",
      });
      res.json({ authToken });
    } catch (error) {
      res.status(500).send("Internal server error");
    }
  }
);

// logged in user details
router.get("/getUser", authUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    success = true;
    res.send(user);
    console.log(`${user.firstName} telah login, isAdmin: ${user.isAdmin}`);
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
});

// update user details
router.put("/updateUser", authUser, async (req, res) => {
  const { userDetails } = req.body;
  let convertData = JSON.parse(userDetails);
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      let updateDetails = await User.findByIdAndUpdate(req.user.id, {
        $set: convertData,
      });
      success = true;
      res.status(200).send({ success });
    } else {
      return res.status(400).send("Pengguna tidak ditemukan");
    }
  } catch (error) {
    res.send("Something went wrong");
  }
});

// delete user and user data
router.delete("/delete/user/:userId", authUser, deleteAllUserData);
module.exports = router;
