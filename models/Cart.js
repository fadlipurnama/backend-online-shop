const mongoose = require('mongoose');
const { Schema } = mongoose;

const CartSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    }
}, { timestamps: true });

module.exports = mongoose.model("cart", CartSchema);
