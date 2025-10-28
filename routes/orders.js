// routes/orders.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.createOrder);
router.get('/', orderController.getAllOrders);
router.get('/stats', orderController.getOrderStats);
router.get('/stats/advanced', orderController.getAdvancedStats);
router.get('/:id', orderController.getOrderById);
router.post('/by-ids', orderController.getOrdersByIds);
router.get('/number/:orderNumber', orderController.getOrderByNumber);
router.patch('/:id/status', orderController.updateOrderStatus);
router.patch('/:id/cancel', orderController.cancelOrder);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;