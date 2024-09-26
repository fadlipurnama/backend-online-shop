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
      default: '',
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
  },
  { timestamps: true }
);
module.exports = mongoose.model("user", UserSchema);
