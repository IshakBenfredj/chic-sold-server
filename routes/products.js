const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Get all products with filters
router.get('/', productController.getAllProducts);

// Get product by ID
router.get('/:id', productController.getProductById);

// Create new product
router.post('/', productController.createProduct);

// Update product
router.put('/:id', productController.updateProduct);

// Delete product
router.delete('/:id', productController.hardDeleteProduct);

// Update product quantity
router.patch('/:id/quantity', productController.updateQuantity);

// Get products by category
router.get('/category/:categoryId', productController.getProductsByCategory);

router.get('/stats/product-stats', productController.getProductStats);

router.post('/by-ids', productController.getProductsByIds);

module.exports = router;