const mongoose = require('mongoose');
const {validCategories,
    validPaymentMethod,
    validPaymentBank,
    validType,
    validIncomeCategories
} = require('../interface/dbEnum');

const expensesSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
    },
    amount: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: validCategories.concat(validIncomeCategories)
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: validPaymentMethod
    },
    paymentBank: {
        type: String,
        enum: validPaymentBank
    },
    type: {
        type: String,
        enum: validType
    },
    description: {
        type: String,
    }
}, {
    timestamps: true,
});


// eslint-disable-next-line
const Expenses = new mongoose.model('Expenses', expensesSchema);
module.exports = Expenses;
