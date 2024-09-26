const { nanoid } = require('nanoid');
const Transaction = require('../models/Transaction.js')
const Product = require ('../models/Product.js');
// import { PENDING_PAYMENT } from '../../utils/constant.js';

// Buat Transaksi
export const createTransaction = async (req, res) => {
    try {
        const { products, customer_name, customer_email } = req.body;

        // Validasi input
        if (!customer_name || !customer_email || !Array.isArray(products)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid input data'
            });
        }

        // Dapatkan produk dari MongoDB
        const productsFromDB = await Product.find({ _id: { $in: products.map(p => p.id) } });

        if (productsFromDB.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Products not found'
            });
        }

        // Set quantity pada produk dari request
        productsFromDB.forEach((product) => {
            const productFromRequest = products.find((p) => p.id === product._id.toString());
            product.quantity = productFromRequest.quantity;
        });

        // Generate transaction ID dan hitung total gross amount
        const transaction_id = `TRX-${nanoid(4)}-${nanoid(8)}`;
        const gross_amount = productsFromDB.reduce((acc, product) => acc + (product.quantity * product.price), 0);

        // Simpan transaksi ke MongoDB
        const transaction = new Transaction({
            id: transaction_id,
            gross_amount,
            customer_name,
            customer_email,
            status: 'PENDING_PAYMENT',
        });

        await transaction.save();

        res.json({
            status: 'success',
            data: {
                id: transaction_id,
                status: 'PENDING_PAYMENT',
                customer_name,
                customer_email,
                products: productsFromDB,
            }
        });
    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ status: 'error', message: 'Failed to create transaction' });
    }
};

// Dapatkan Semua Transaksi
export const getTransactions = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};

        // Dapatkan semua transaksi dari MongoDB
        const transactions = await Transaction.find(query);

        res.json({
            status: 'success',
            data: transactions
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch transactions' });
    }
};

// Dapatkan Transaksi Berdasarkan ID
export const getTransactionById = async (req, res) => {
    try {
        const { transaction_id } = req.params;

        // Cari transaksi berdasarkan ID di MongoDB
        const transaction = await Transaction.findOne({ id: transaction_id });

        if (!transaction) {
            return res.status(404).json({
                status: 'error',
                message: 'Transaction not found'
            });
        }

        res.json({
            status: 'success',
            data: transaction,
        });
    } catch (error) {
        console.error("Error fetching transaction:", error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch transaction' });
    }
};

// Perbarui Status Transaksi
export const updateTransactionStatus = async (req, res) => {
    try {
        const { transaction_id } = req.params;
        const { status } = req.body;

        // Validasi status jika diperlukan
        const validStatuses = ["PENDING_PAYMENT", "SUCCESS", "FAILED"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status' });
        }

        // Perbarui status transaksi di MongoDB
        const transaction = await Transaction.findOneAndUpdate(
            { id: transaction_id },
            { status },
            { new: true }
        );

        if (!transaction) {
            return res.status(404).json({
                status: 'error',
                message: 'Transaction not found'
            });
        }

        res.json({
            status: 'success',
            data: transaction
        });
    } catch (error) {
        console.error("Error updating transaction status:", error);
        res.status(500).json({ status: 'error', message: 'Failed to update transaction status' });
    }
};
