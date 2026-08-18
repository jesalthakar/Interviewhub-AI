const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount auth routes
router.use('/auth', require('./auth'));
router.use('/interviews', require('./interviews'));

module.exports = router;
