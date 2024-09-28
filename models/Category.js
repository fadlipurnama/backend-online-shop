const mongoose = require("mongoose");
const { Schema } = mongoose;
const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    isActive: {
      default: true,
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("category", CategorySchema);
