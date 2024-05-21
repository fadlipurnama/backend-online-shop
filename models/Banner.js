const mongoose = require("mongoose");
const { Schema } = mongoose;
const BannerSchema = new Schema(
  {
    name: String,
    description: String,
    imageUrl: String,
    author: String,
    isActive: {
      default: true,
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("banner", BannerSchema);
