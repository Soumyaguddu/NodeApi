const express = require('express');
const router = new express.Router();
router.use(express.json({}));
const epensesController=require('../controller/expense');


router.post('/',epensesController.addExpenses);
router.get('/',epensesController.viewExpenses);
router.get('/:id',epensesController.viewExpensesById);
router.put('/:id',epensesController.updateExpenses);
router.delete('/:id',epensesController.deleteExpenses);
router.get('/download/report',epensesController.downloadExpenses);

module.exports = router;
