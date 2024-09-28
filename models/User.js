const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    username: {
      type: String,
      sparse: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      default: false,
      type: Boolean,
    },
    address: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    city: {
      type: String,
    },
    country: {
      type: String,
    },
    province: {
      type: String,
    },
    // address: {
    //   street: { type: String },
    //   city: { type: String },
    //   province: { type: String },
    //   zipCode: { type: String },
    //   country: { type: String, default: "Indonesia" },
    // },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    verificationExpires: {
      type: Date,
    },
    // lastLogin: {
    //   type: Date,
    // },
  },
  { timestamps: true }
);
module.exports = mongoose.model("user", UserSchema);
