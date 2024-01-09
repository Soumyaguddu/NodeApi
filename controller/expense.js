const Expense = require("../model/expense");
const ExcelJS = require('exceljs');
const { validCategories } = require("../interface/dbEnum")
exports.addExpenses = async (req, res, next) => {
    try {
        const title = req.body.title;
        const date = req.body.date ? new Date(req.body.date).setHours(0, 0, 0, 0) : new Date().setHours(0, 0, 0, 0);
        const amount = req.body.amount;
        const category = req.body.category;
        const paymentMethod = req.body.paymentMethod;
        const paymentBank = req.body.paymentBank;
        // When money is deducted from your account, it is typically referred to as a "debit."
        const type = req.body.type || 'Debits';
        const description = req.body.description;

        const newExpense = new Expense({
            title,
            date,
            amount,
            category,
            paymentMethod,
            paymentBank,
            type,
            description,
        });
        await newExpense.save();
        res.status(201).json({ message: 'Expense created successfully' });
    } catch (error) {
        next(error)
    }
}

exports.viewExpenses = async (req, res, next) => {
    try {
        let query = {};
        let totalExpensesThisMonth = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        if (req.query.from && req.query.to) {
            query.date = {
                $gte: new Date(req.query.from).setHours(0, 0, 0, 0),
                $lte: new Date(req.query.to).setHours(0, 0, 0, 0)
            };
        } else {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            query.date = {
                $gte: today,
                $lt: tomorrow
            };
        }

        if (req.query.categoryFilter) {
            query = {
                $and: [
                    query,
                    {
                        category: {
                            $in: JSON.parse(req.query.categoryFilter)
                        }
                    }
                ]
            };
        }
        const expenses = await Expense.find(query).sort({ date: -1 }).lean();

        const categoryValues = [];

        for (const validCategory of validCategories) {
            const validCategorieExpensesMonthwise = await Expense.aggregate([
                {
                    $match: {
                        category: validCategory,
                        date: {
                            $gte: firstDayOfMonth,
                            $lte: today
                        },
                        $or: [
                            { type: "Debits" }, { type: undefined }
                        ]

                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$amount" }
                    }
                }
            ]);

            const totalValidCategorieExpensesMonthwise = validCategorieExpensesMonthwise.length > 0
                ? validCategorieExpensesMonthwise[0]?.totalAmount
                : 0;
            totalExpensesThisMonth = totalExpensesThisMonth + totalValidCategorieExpensesMonthwise;
            const response = {
                title: `total ${validCategory} expenses this month`,
                text: totalValidCategorieExpensesMonthwise
            };
            categoryValues.push(response);
        }

        const totalIncomes = await Expense.aggregate([
            {
                $match: {
                    date: {
                        $gte: firstDayOfMonth,
                        $lte: today
                    },
                    type: 'Credits'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        const incomeResponse = {
            title: `Income this month`,
            text: totalIncomes[0]?.totalAmount || 0
        };
        categoryValues.push(incomeResponse);

        const remainingResponse = {
            title: `Remaining this month`,
            text: (totalIncomes[0] === undefined) ? 0 : totalIncomes[0].totalAmount - totalExpensesThisMonth
        };
        categoryValues.push(remainingResponse);

        res.status(200).json({ response: expenses, cardResponse: categoryValues });
    } catch (error) {
        console.log(error);
        next(error);
    }
}


exports.deleteExpenses = async (req, res, next) => {
    try {
        const _id = req.params.id;
        const expenses = await Expense.findOne({ _id: _id });
        if (expenses) {
            await Expense.deleteOne({ _id: _id });
            return res.status(200).json({ message: "Expenses delete successfully." });
        } else {
            return res.status(404).json({ message: "Expenses not found" });
        }
    } catch (error) {
        next(error);
    }
}

exports.viewExpensesById = async (req, res, next) => {
    try {
        const _id = req.params.id;
        const expenses = await Expense.findOne({ _id: _id });
        if (expenses) {
            return res.status(200).json({ response: expenses });
        } else {
            return res.status(404).json({ message: "Expenses not found" });
        }
    } catch (error) {
        next(error);
    }
}

exports.updateExpenses = async (req, res, next) => {
    try {
        const _id = req.params.id;

        const title = req.body.title;
        const date = req.body.date ? new Date(req.body.date).setHours(0, 0, 0, 0) : new Date().setHours(0, 0, 0, 0);
        const amount = req.body.amount;
        const category = req.body.category;
        const paymentMethod = req.body.paymentMethod;
        const paymentBank = req.body.paymentBank;
        const type = req.body.type || 'Debits';
        const description = req.body.description;

        const expenses = await Expense.findOne({ _id: _id });

        if (!expenses) {
            return res.status(404).json({ message: "Expenses not found." });
        }

        const updateExpense = await Expense.updateOne(
            { _id: _id },
            {
                title,
                date,
                amount,
                category,
                paymentMethod,
                paymentBank,
                type,
                description,
            }
        );
        if (updateExpense.modifiedCount > 0) {
            return res.status(200).json({ message: "Expenses updated successfully." });
        } else {
            return res.status(404).json({ message: "No changes made to expenses." });
        }
    } catch (error) {
        next(error);
    }
};

exports.downloadExpenses = async (req, res, next) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet 1');

        // Add data to the worksheet
        worksheet.columns = [
            { header: 'Title', key: 'title', width: 20 },
            { header: 'Date', key: 'date', width: 10 },
            { header: 'Amount', key: 'amount', width: 20 },
            { header: 'Category', key: 'category', width: 20 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
            { header: 'Payment Bank', key: 'paymentBank', width: 20 },
            { header: 'Type', key: 'type', width: 20 },
            { header: 'Description', key: 'description', width: 20 },
        ];

        let query = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        if (req.query.from && req.query.to) {
            query.date = {
                $gte: new Date(req.query.from).setHours(0, 0, 0, 0),
                $lte: new Date(req.query.to).setHours(0, 0, 0, 0)
            };
        } else {
            query.date = {
                $gte: firstDayOfMonth,
                $lte: today
            };
        }

        if (req.query.categoryFilter) {
            query = {
                $and: [
                    query,
                    {
                        category: {
                            $in: JSON.parse(req.query.categoryFilter)
                        }
                    }
                ]
            };
        }

        const expenses = await Expense.find(query).sort({date: -1});

        worksheet.addRows(expenses);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error)
    }
}

