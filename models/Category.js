const mongoose = require("mongoose");
const { Schema } = mongoose;
const CategorySchema = new Schema(
  {
    name: String,
    imageUrl: String,
    author: String,
    isActive: {
      default: true,
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("category", CategorySchema);
