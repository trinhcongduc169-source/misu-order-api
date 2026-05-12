const express = require('express');
const { submitOrder } = require('../services/googleScript');
const { validateOrder } = require('../utils/validateOrder');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const rawOrder = req.body && req.body.orderData ? req.body.orderData : req.body;
    console.log('POST /orders received');
    console.log('payload received:', JSON.stringify(rawOrder, null, 2));

    const orderData = validateOrder(rawOrder);
    const data = await submitOrder(orderData);
    console.log('generated order code:', data.orderCode);
    console.log('order sequence:', data.orderSequence);
    console.log('order date:', data.orderDate);
    console.log('Apps Script result:', JSON.stringify(data, null, 2));

    res.status(201).json({
      ...data,
      orderCode: data.orderCode || orderData.orderCode,
    });
  } catch (error) {
    console.log('Apps Script result:', JSON.stringify(error.details || {
      success: false,
      message: error.message,
    }, null, 2));

    if (!error.statusCode) {
      error.statusCode = 400;
    }
    next(error);
  }
});

module.exports = router;
