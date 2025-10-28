const Category = require('../models/Category');

// الحصول على جميع الفئات
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

// الحصول على فئة بواسطة المعرف
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'الفئة غير موجودة' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

// إنشاء فئة جديدة
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'اسم الفئة مطلوب' });
    }
    
    const category = new Category({ name });
    const savedCategory = await category.save();
    
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(400).json({ message: 'بيانات غير صالحة' });
  }
};

// تحديث الفئة
exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'اسم الفئة مطلوب' });
    }
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ message: 'الفئة غير موجودة' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: 'بيانات غير صالحة' });
  }
};

// حذف الفئة
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'الفئة غير موجودة' });
    }
    
    res.json({ message: 'تم حذف الفئة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};