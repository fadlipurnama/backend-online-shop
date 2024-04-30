const mongoose = require("mongoose");
const { Schema } = mongoose;
const ProductSchema = new Schema(
  {
    name: String,
    brand: String,
    price: Number,
    category: String,
    imageUrl: String,
    rating: Number,
    author: String,
    description: String,
    stock: Number,
    promo: {
      default: false,
      type: Boolean,
    },
    isActive: {
      default: true,
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("product", ProductSchema);
