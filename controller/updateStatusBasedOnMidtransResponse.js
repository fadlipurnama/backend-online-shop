const crypto = require('crypto');
const Transaction = require('../models/Transaction'); // Import model transaksi
const transactionService = require('./transactionService'); // Import transaction service

const MIDTRANS_SERVER_KEY = 'your_midtrans_server_key'; // Ganti dengan kunci server Anda
const PAID = 'PAID';
const CANCELED = 'CANCELED';
const PENDING_PAYMENT = 'PENDING_PAYMENT';




// Service untuk mendapatkan transaksi berdasarkan ID
const getTransactionById = async ({ transaction_id }) => {
    return await Transaction.findOne({ id: transaction_id });
};

// Service untuk memperbarui status transaksi
const updateTransactionStatus = async ({ transaction_id, status, payment_method }) => {
    return await Transaction.findOneAndUpdate(
        { id: transaction_id },
        { status, payment_method },
        { new: true }
    );
};

module.exports = {
    getTransactionById,
    updateTransactionStatus,
};


const updateStatusBasedOnMidtransResponse = async (transaction_id, data) => {
    const hash = crypto.createHash('sha512').update(`${transaction_id}${data.status_code}${data.gross_amount}${MIDTRANS_SERVER_KEY}`).digest('hex');
    if (data.signature_key !== hash) {
        return {
            status: 'error',
            message: 'Invalid Signature key',
        };
    }

    let responseData = null;
    let transactionStatus = data.transaction_status;
    let fraudStatus = data.fraud_status;

    if (transactionStatus === 'capture') {
        if (fraudStatus === 'accept') {
            const transaction = await transactionService.updateTransactionStatus({
                transaction_id,
                status: PAID,
                payment_method: data.payment_type
            });
            responseData = transaction;
        }
    } else if (transactionStatus === 'settlement') {
        const transaction = await transactionService.updateTransactionStatus({
            transaction_id,
            status: PAID,
            payment_method: data.payment_type
        });
        responseData = transaction;
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
        const transaction = await transactionService.updateTransactionStatus({
            transaction_id,
            status: CANCELED
        });
        responseData = transaction;
    } else if (transactionStatus === 'pending') {
        const transaction = await transactionService.updateTransactionStatus({
            transaction_id,
            status: PENDING_PAYMENT
        });
        responseData = transaction;
    }

    return {
        status: 'success',
        data: responseData
    };
};



module.exports = {
    updateStatusBasedOnMidtransResponse
};
