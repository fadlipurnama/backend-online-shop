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
      enum: ["PENDING_PAYMENT", "PAID", "CANCELED"], // Tambahkan status pengiriman
      default: "PENDING_PAYMENT",
    },
    token: {
      type: String,
      // required: true,
    },
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
    settlementTime: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("transaction", TransactionSchema);
