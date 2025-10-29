const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');

// GET /api/testimonials - Get all testimonials
router.get('/', testimonialController.getAllTestimonials);

// POST /api/testimonials - Create new testimonial
router.post('/', testimonialController.createTestimonial);

// PUT /api/testimonials/:id - Update testimonial
router.get('/:id', testimonialController.getTestimonialById);

router.put('/:id', testimonialController.updateTestimonial);

// DELETE /api/testimonials/:id - Delete testimonial
router.delete('/:id', testimonialController.deleteTestimonial);

module.exports = router;