const Product = require("../models/Product");
const {
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} = require("../config/cloudinary");
const Order = require("../models/Order");
const { default: mongoose } = require("mongoose");

exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, inStock, size, limit, sort } =
      req.query;
    let filter = { isActive: true };

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (inStock === "true") filter.quantity = { $gt: 0 };
    if (size) filter.availableSizes = { $in: [size] };

    let query = Product.find(filter).populate("category");

    // Add sorting
    switch (sort) {
      case 'price-low':
        query = query.sort({ price: 1 });
        break;
      case 'price-high':
        query = query.sort({ price: -1 });
        break;
      case 'name':
        query = query.sort({ title: 1 });
        break;
      case 'newest':
      default:
        query = query.sort({ createdAt: -1 });
        break;
    }

    // Add limit if provided
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const products = await query;

    const productsWithStock = products.map((product) => ({
      ...product.toObject(),
      inStock: product.quantity > 0,
    }));

    res.json(productsWithStock);
  } catch (error) {
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
};

// الحصول على منتج بواسطة المعرف
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) {
      return res.status(404).json({ message: "المنتج غير موجود" });
    }

    const productWithStock = {
      ...product.toObject(),
      inStock: product.quantity > 0,
    };

    res.json(productWithStock);
  } catch (error) {
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
};

// إنشاء منتج جديد
exports.createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      images,
      price,
      discountPercentage,
      category,
      availableSizes,
      colors,
      quantity,
      isBundle,
      costPrice
    } = req.body;

    // التحقق من الحقول المطلوبة
    if (!title || !description || !price || !category || !availableSizes || !costPrice) {
      return res.status(400).json({ message: "الحقول المطلوبة مفقودة" });
    }

    // التحقق من الصور
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: "يجب إضافة صورة واحدة على الأقل" });
    }

    let uploadedImages = [];

    // رفع جميع الصور إلى Cloudinary
    try {
      const uploadResults = await uploadMultipleToCloudinary(
        images,
        "pajama-store/products"
      );
      uploadedImages = uploadResults.map((result) => result.url);
    } catch (uploadError) {
      return res
        .status(400)
        .json({ message: `فشل في رفع الصور: ${uploadError.message}` });
    }

    const product = new Product({
      title,
      description,
      images: uploadedImages,
      price: parseFloat(price),
      discountPercentage: discountPercentage
        ? parseFloat(discountPercentage)
        : 0,
      category,
      availableSizes: Array.isArray(availableSizes)
        ? availableSizes
        : [availableSizes],
      colors: colors || [],
      quantity: quantity ? parseInt(quantity) : 0,
      isBundle: isBundle || false,
      costPrice
    });

    const savedProduct = await product.save();
    await savedProduct.populate("category");

    const productWithStock = {
      ...savedProduct.toObject(),
      inStock: savedProduct.quantity > 0,
    };

    res.status(201).json(productWithStock);
  } catch (error) {
    res.status(400).json({ message: "بيانات غير صالحة" });
  }
};

// تحديث المنتج
exports.updateProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      images,
      price,
      discountPercentage,
      category,
      availableSizes,
      colors,
      quantity,
      isActive,
      isBundle,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "المنتج غير موجود" });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (discountPercentage !== undefined)
      updateData.discountPercentage = parseFloat(discountPercentage);
    if (category) updateData.category = category;
    if (availableSizes)
      updateData.availableSizes = Array.isArray(availableSizes)
        ? availableSizes
        : [availableSizes];
    if (colors) updateData.colors = colors;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isBundle !== undefined) updateData.isBundle = isBundle;

    // التعامل مع الصور
    if (images && Array.isArray(images)) {
      const finalImages = [];
      const imagesToUpload = [];

      // فصل الصور الموجودة عن الصور الجديدة
      for (const image of images) {
        if (isCloudinaryUrl(image)) {
          // صورة موجودة بالفعل في Cloudinary
          finalImages.push(image);
        } else if (isBase64Image(image)) {
          // صورة جديدة تحتاج رفع
          imagesToUpload.push(image);
        }
      }

      // رفع الصور الجديدة فقط
      if (imagesToUpload.length > 0) {
        try {
          const uploadResults = await uploadMultipleToCloudinary(
            imagesToUpload,
            "pajama-store/products"
          );
          finalImages.push(...uploadResults.map((result) => result.url));
        } catch (uploadError) {
          return res
            .status(400)
            .json({ message: `فشل في رفع الصور: ${uploadError.message}` });
        }
      }

      // حذف الصور القديمة التي لم تعد مستخدمة
      const imagesToDelete = product.images.filter(
        (oldImage) => !finalImages.includes(oldImage)
      );

      if (imagesToDelete.length > 0) {
        for (const oldImage of imagesToDelete) {
          const publicId = getPublicIdFromUrl(oldImage);
          if (publicId) {
            try {
              await deleteFromCloudinary(publicId);
            } catch (deleteError) {
              console.error("فشل في حذف الصورة القديمة:", deleteError.message);
            }
          }
        }
      }

      updateData.images = finalImages;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("category");

    const productWithStock = {
      ...updatedProduct.toObject(),
      inStock: updatedProduct.quantity > 0,
    };

    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(400).json({ message: "بيانات غير صالحة" });
  }
};

// دالة للتحقق مما إذا كان الرابط من Cloudinary
function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.includes('cloudinary.com');
}

// دالة للتحقق مما إذا كانت الصورة base64
function isBase64Image(str) {
  if (typeof str !== 'string') return false;
  return str.startsWith('data:image/') && str.includes('base64,');
}

// حذف المنتج نهائياً من قاعدة البيانات و Cloudinary
exports.hardDeleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "المنتج غير موجود" });
    }

    // حذف الصور من Cloudinary
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        const publicId = getPublicIdFromUrl(image);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
            console.log(`✅ تم حذف الصورة من Cloudinary: ${publicId}`);
          } catch (deleteError) {
            console.error(
              "❌ فشل في حذف الصورة من Cloudinary:",
              deleteError.message
            );
          }
        }
      }
    }

    // حذف المنتج نهائياً من قاعدة البيانات
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: "تم حذف المنتج بنجاح وإزالة الصور من Cloudinary",
    });
  } catch (error) {
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
};

// تحديث كمية المنتج
exports.updateQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ message: "الكمية المطلوبة غير صالحة" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { quantity: parseInt(quantity) },
      { new: true, runValidators: true }
    ).populate("category");

    if (!product) {
      return res.status(404).json({ message: "المنتج غير موجود" });
    }

    const productWithStock = {
      ...product.toObject(),
      inStock: product.quantity > 0,
    };

    res.json(productWithStock);
  } catch (error) {
    res.status(400).json({ message: "بيانات غير صالحة" });
  }
};

// الحصول على البيجامات حسب الفئة
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.categoryId,
      isActive: true,
      quantity: { $gt: 0 },
    })
      .populate("category")
      .sort({ createdAt: -1 });

    const productsWithStock = products.map((product) => ({
      ...product.toObject(),
      inStock: product.quantity > 0,
    }));

    res.json(productsWithStock);
  } catch (error) {
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
};

// إحصائيات البيجامات
exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const outOfStockProducts = await Product.countDocuments({ 
      isActive: true, 
      quantity: 0 
    });
    const lowStockProducts = await Product.countDocuments({ 
      isActive: true, 
      quantity: { $gt: 0, $lte: 5 } 
    });
    const inStockProducts = await Product.countDocuments({ 
      isActive: true, 
      quantity: { $gt: 5 } 
    });

    // البيجامات الأكثر مبيعاً (بناءً على الطلبات)
    const topSellingProducts = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.title',
          totalSold: 1,
          totalRevenue: 1,
          image: { $arrayElemAt: ['$product.images', 0] }
        }
      }
    ]);

    res.json({
      totalProducts,
      outOfStockProducts,
      lowStockProducts,
      inStockProducts,
      topSellingProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

// الحصول على منتجات بمصفوفة من المعرفات
exports.getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "مصفوفة المعرفات مطلوبة" });
    }

    // التحقق من صحة المعرفات
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({ message: "لا توجد معرفات صالحة" });
    }

    const products = await Product.find({
      _id: { $in: validIds },
      isActive: true
    }).populate("category");

    const productsWithStock = products.map((product) => ({
      ...product.toObject(),
      inStock: product.quantity > 0,
    }));

    res.json(productsWithStock);
  } catch (error) {
    console.error("Error fetching products by IDs:", error);
    res.status(500).json({ message: "حدث خطأ في الخادم" });
  }
};