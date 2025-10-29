// controllers/testimonialController.js
const Testimonial = require('../models/Testimonial');

// Get all testimonials
exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find()
      .sort({ createdAt: -1 });

    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في الخادم: ' + error.message });
  }
};

// Get testimonial by ID
exports.getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: 'التقييم غير موجود' });
    }

    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في الخادم: ' + error.message });
  }
};

// Create new testimonial
exports.createTestimonial = async (req, res) => {
  try {
    const { customerName, comment, gender } = req.body;

    // Validation
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ message: 'اسم العميل مطلوب' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'التعليق مطلوب' });
    }

    if (!gender || !['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'جنس العميل مطلوب ويجب أن يكون male أو female' });
    }

    const testimonial = new Testimonial({
      customerName: customerName.trim(),
      comment: comment.trim(),
      gender
    });

    const savedTestimonial = await testimonial.save();
    res.status(201).json(savedTestimonial);
  } catch (error) {
    res.status(400).json({ message: 'خطأ في إنشاء التقييم: ' + error.message });
  }
};

// Update testimonial
exports.updateTestimonial = async (req, res) => {
  try {
    const { customerName, comment, gender } = req.body;

    // Validation
    if (customerName && !customerName.trim()) {
      return res.status(400).json({ message: 'اسم العميل لا يمكن أن يكون فارغاً' });
    }

    if (comment && !comment.trim()) {
      return res.status(400).json({ message: 'التعليق لا يمكن أن يكون فارغاً' });
    }

    if (gender && !['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: 'جنس العميل يجب أن يكون male أو female' });
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      {
        ...(customerName && { customerName: customerName.trim() }),
        ...(comment && { comment: comment.trim() }),
        ...(gender && { gender })
      },
      { new: true, runValidators: true }
    );

    if (!testimonial) {
      return res.status(404).json({ message: 'التقييم غير موجود' });
    }

    res.json(testimonial);
  } catch (error) {
    res.status(400).json({ message: 'خطأ في تحديث التقييم: ' + error.message });
  }
};

// Delete testimonial
exports.deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: 'التقييم غير موجود' });
    }

    res.json({ message: 'تم حذف التقييم بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في حذف التقييم: ' + error.message });
  }
};

// Get testimonials statistics
exports.getTestimonialStats = async (req, res) => {
  try {
    const totalTestimonials = await Testimonial.countDocuments();
    
    const genderStats = await Testimonial.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    const latestTestimonial = await Testimonial.findOne()
      .sort({ createdAt: -1 });

    res.json({
      totalTestimonials,
      genderStats: {
        male: genderStats.find(stat => stat._id === 'male')?.count || 0,
        female: genderStats.find(stat => stat._id === 'female')?.count || 0
      },
      latestTestimonial: latestTestimonial ? {
        customerName: latestTestimonial.customerName,
        createdAt: latestTestimonial.createdAt
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في الحصول على إحصاءات التقييمات: ' + error.message });
  }
};