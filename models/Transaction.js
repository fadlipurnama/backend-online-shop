const mongoose = require("mongoose");
const { Schema } = mongoose;

// Skema Transaksi
const TransactionSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    grossAmount: {
      type: Number,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
      index: true, // Indeks untuk mempercepat pencarian
    },

    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "SUCCESS", "FAILED", "SHIPPED"], // Tambahkan status pengiriman
      default: "PENDING_PAYMENT",
    },
    snap_token: String,
    snap_redirect_url: String,

    shippingAddress: {
      type: String,
      required: true,
    },
    shippingCourier: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    shippingService: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: "",
    },
    products: {
      type: Array,
      required: true,
    },
    // deliveryStatus: {
    //   type: String,
    //   enum: ["PENDING", "ON_PROCESS", "DELIVERED"],
    //   default: "PENDING",
    // },
  },
  { timestamps: true }
);

module.exports = mongoose.model("transaction", TransactionSchema);
