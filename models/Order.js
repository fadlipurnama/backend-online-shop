const mongoose = require("mongoose");
const { Schema } = mongoose;

// Skema Transaksi
const OrderSchema = new Schema(
  {
    transactionId: {
      type: String,
      required: true,
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
    },

    deliveryStatus: {
      type: String,
      enum: ["ON_PROCESS", "DELIVERED", "DELIVERY", "CANCELED"], // Tambahkan status pengiriman
      default: "ON_PROCESS",
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
    shippingNumber: {
      type: String,
      default: "",
    },
    products: {
      type: Array,
      required: true,
    },
   
  },
  { timestamps: true }
);

module.exports = mongoose.model("order", OrderSchema);
