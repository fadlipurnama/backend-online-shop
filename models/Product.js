const mongoose = require("mongoose");
const { Schema } = mongoose;
const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    brand: {
      required: true,
      type: String,
    },
    price: {
      required: true,
      type: Number,
    },
    best: {
      default: false,
      type: Boolean,
    },
    category: {
      required: true,
      type: String,
    },
    imageUrl: {
      required: true,
      type: String,
    },
    author: {
      required: true,
      type: String,
    },
    description: {
      required: true,
      type: String,
    },
    stock: {
      required: true,
      type: Number,
    },
    rating: {
      default: 0,
      type: Number,
    },
    discount: {
      default: 0,
      type: Number,
    },
    labelPromo: {
      type: String,
    },
    isActive: {
      default: true,
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("product", ProductSchema);
