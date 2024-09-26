const mongoose = require("mongoose");
const { Schema } = mongoose;

// Skema Item Transaksi
const TransactionItemSchema = new Schema({
  transaction_id: {
    type: String,
    required: true,
  },
  product: {
    type: Schema.Types.ObjectId, // Menggunakan ObjectId untuk referensi
    required: true,
    ref: 'Product', // Referensi ke model Product
  },
  product_name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
}, { timestamps: true });


module.exports = mongoose.model("transactionItem", TransactionItemSchema);
