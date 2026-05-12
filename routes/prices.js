const express = require('express');
const { getPrices } = require('../services/googleScript');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await getPrices();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
