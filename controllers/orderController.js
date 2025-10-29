// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');

// Get all orders with optional filters
exports.getAllOrders = async (req, res) => {
    try {
        const { status, startDate, endDate, search } = req.query;
        let filter = {};

        if (status) filter.status = status;

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'customerInfo.fullName': { $regex: search, $options: 'i' } },
                { 'customerInfo.phone': { $regex: search, $options: 'i' } },
                { 'customerInfo.email': { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(filter)
            .populate('items.product')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'حدث خطأ في الخادم: ' + error.message });
    }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product');

        if (!order) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'حدث خطأ في الخادم: ' + error.message });
    }
};

// Get order by order number
exports.getOrderByNumber = async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderNumber })
            .populate('items.product');

        if (!order) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'حدث خطأ في الخادم: ' + error.message });
    }
};

// Create new order
// exports.createOrder = async (req, res) => {
//     try {
//         const {
//             customerInfo,
//             items,
//             deliveryPrice
//         } = req.body;

//         console.log('body',req.body)

//         if (!customerInfo || !items.length || !deliveryPrice) {
//             return res.json({ message: 'مطلوب معلومات العميل والعناصر' });
//         }

//         const { fullName, phone, state, city, deliveryType } = customerInfo;
//         if (!fullName || !phone || !state || !deliveryType) {
//             return res.json({ message: 'جميع حقول معلومات العميل مطلوبة' });
//         }

//         let totalAmount = 0;
//         for (const item of items) {
//             const product = await Product.findById(item.product);
            
//             if (!product) {
//                 return res.json({ message: `المنتج غير موجود: ${item.product}` });
//             }

//             if (!product.isActive) {
//                 return res.json({ message: `المنتج غير متاح: ${product.title}` });
//             }

//             if (product.quantity < item.quantity) {
//                 return res.json({ 
//                     message: `الكمية غير كافية للمنتج: ${product.title}. المتاح: ${product.quantity}, المطلوب: ${item.quantity}` 
//                 });
//             }

//             if (!product.availableSizes.includes(item.size)) {
//                 return res.json({ 
//                     message: `المقاس غير صالح للمنتج: ${product.title}. المقاسات المتاحة: ${product.availableSizes.join(', ')}` 
//                 });
//             }

//             const itemPrice = product.price * (1 - product.discountPercentage / 100);
//             totalAmount += itemPrice * item.quantity;
//         }

//         const order = new Order({
//             customerInfo,
//             items,
//             amount: totalAmount,
//             deliveryPrice
//         });

//         const savedOrder = await order.save();

//         // Update product quantities
//         for (const item of items) {
//             await Product.findByIdAndUpdate(
//                 item.product,
//                 { $inc: { quantity: -item.quantity } }
//             );
//         }
//         await savedOrder.populate('items.product');

//         res.status(201).json(savedOrder);
//     } catch (error) {
//         console.error(error)
//         res.status(400).json({ message: 'خطأ في إنشاء الطلب: ' + error.message });
//     }
// };

// controllers/orderController.js - Update createOrder function
exports.createOrder = async (req, res) => {
    try {
        const {
            customerInfo,
            items,
            deliveryPrice = 0,
            status = "pending",
            notes = "",
            isAdminOrder = false
        } = req.body;

        console.log('Admin creating order:', req.body)

        if (!items || !items.length) {
            return res.status(400).json({ message: 'العناصر مطلوبة' });
        }

        // For admin orders, customer info is optional
        let customerData = {};
        if (customerInfo) {
            const { fullName = "", phone = "", state = "", city = "", deliveryType = "" } = customerInfo;
            customerData = { fullName, phone, state, city, deliveryType };
        }

        let totalAmount = 0;
        for (const item of items) {
            const product = await Product.findById(item.product);
            
            if (!product) {
                return res.status(400).json({ message: `المنتج غير موجود: ${item.product}` });
            }

            if (!product.isActive) {
                return res.status(400).json({ message: `المنتج غير متاح: ${product.title}` });
            }

            if (product.quantity < item.quantity) {
                return res.status(400).json({ 
                    message: `الكمية غير كافية للمنتج: ${product.title}. المتاح: ${product.quantity}, المطلوب: ${item.quantity}` 
                });
            }

            if (!product.availableSizes.includes(item.size)) {
                return res.status(400).json({ 
                    message: `المقاس غير صالح للمنتج: ${product.title}. المقاسات المتاحة: ${product.availableSizes.join(', ')}` 
                });
            }

            const itemPrice = product.price * (1 - product.discountPercentage / 100);
            totalAmount += itemPrice * item.quantity;
        }

        const order = new Order({
            customerInfo: customerData,
            items,
            amount: totalAmount,
            deliveryPrice,
            status,
            notes,
            isAdminOrder
        });

        const savedOrder = await order.save();

        // Update product quantities
        for (const item of items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { quantity: -item.quantity } }
            );
        }

        await savedOrder.populate('items.product');

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error('Error creating admin order:', error)
        res.status(400).json({ message: 'خطأ في إنشاء الطلب: ' + error.message });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'حالة الطلب مطلوبة' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate('items.product');

        if (!order) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }

        res.json(order);
    } catch (error) {
        res.status(400).json({ message: 'خطأ في تحديث حالة الطلب: ' + error.message });
    }
};

// Cancel order and restore product quantities
exports.cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({ message: 'الطلب ملغي بالفعل' });
        }

        // Restore product quantities
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { quantity: item.quantity } }
            );
        }

        // Update order status to cancelled
        const cancelledOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status: 'cancelled' },
            { new: true }
        ).populate('items.product');

        res.json(cancelledOrder);
    } catch (error) {
        res.status(400).json({ message: 'خطأ في إلغاء الطلب: ' + error.message });
    }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });
        const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
        const totalRevenue = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

        res.json({
            totalOrders,
            pendingOrders,
            deliveredOrders,
            totalRevenue: revenue,
            averageOrderValue: totalOrders > 0 ? revenue / totalOrders : 0
        });
    } catch (error) {
        res.status(500).json({ message: 'حدث خطأ في الحصول على إحصاءات الطلبات: ' + error.message });
    }
};

// Delete order permanently
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'الطلب غير موجود' });
        }

        res.json({ message: 'تم حذف الطلب بنجاح' });
    } catch (error) {
        res.status(500).json({ message: 'حدث خطأ في حذف الطلب: ' + error.message });
    }
};

// إحصائيات المبيعات المتقدمة
// exports.getAdvancedStats = async (req, res) => {
//   try {
//     const { period = 'today' } = req.query; // today, week, month, year
    
//     const now = new Date();
//     let startDate, endDate;

//     // تحديد الفترة الزمنية
//     switch (period) {
//       case 'today':
//         startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//         endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
//         break;
//       case 'week':
//         startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
//         endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
//         break;
//       case 'month':
//         startDate = new Date(now.getFullYear(), now.getMonth(), 1);
//         endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
//         break;
//       case 'year':
//         startDate = new Date(now.getFullYear(), 0, 1);
//         endDate = new Date(now.getFullYear() + 1, 0, 1);
//         break;
//       default:
//         startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//         endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
//     }

//     // إحصائيات المبيعات للفترة
//     const salesStats = await Order.aggregate([
//       {
//         $match: {
//           status: { $ne: 'cancelled' },
//           createdAt: { $gte: startDate, $lt: endDate }
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           totalRevenue: { $sum: '$amount' },
//           totalOrders: { $sum: 1 },
//           averageOrderValue: { $avg: '$amount' }
//         }
//       }
//     ]);

//     // المبيعات اليومية للأسبوع الحالي
//     const dailySales = await Order.aggregate([
//       {
//         $match: {
//           status: { $ne: 'cancelled' },
//           createdAt: { 
//             $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
//             $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
//           }
//         }
//       },
//       {
//         $group: {
//           _id: {
//             $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
//           },
//           revenue: { $sum: '$amount' },
//           orders: { $sum: 1 }
//         }
//       },
//       { $sort: { _id: 1 } }
//     ]);

//     // حالة الطلبات للفترة
//     const orderStatusStats = await Order.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: startDate, $lt: endDate }
//         }
//       },
//       {
//         $group: {
//           _id: '$status',
//           count: { $sum: 1 }
//         }
//       }
//     ]);

//     const result = {
//       period,
//       revenue: salesStats.length > 0 ? salesStats[0].totalRevenue : 0,
//       totalOrders: salesStats.length > 0 ? salesStats[0].totalOrders : 0,
//       averageOrderValue: salesStats.length > 0 ? salesStats[0].averageOrderValue : 0,
//       dailySales,
//       orderStatusStats
//     };

//     res.json(result);
//   } catch (error) {
//     res.status(500).json({ message: 'حدث خطأ في الخادم' });
//   }
// };

exports.getAdvancedStats = async (req, res) => {
  try {
    const { period = 'today' } = req.query; // today, week, month, year
    
    const now = new Date();
    let startDate, endDate;

    // تحديد الفترة الزمنية
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    // إحصائيات المبيعات للفترة
    const salesStats = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$amount' }
        }
      }
    ]);

    // حساب صافي الربح للفترة
    const profitStats = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetail'
        }
      },
      {
        $unwind: '$productDetail'
      },
      {
        $group: {
          _id: '$_id',
          totalCost: {
            $sum: {
              $multiply: ['$items.quantity', '$productDetail.costPrice']
            }
          },
          deliveryPrice: { $first: '$deliveryPrice' }
        }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$totalCost' },
          totalDeliveryCost: { $sum: '$deliveryPrice' }
        }
      }
    ]);

    // المبيعات اليومية للأسبوع الحالي
    const dailySales = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: { 
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          revenue: { $sum: '$amount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // حالة الطلبات للفترة
    const orderStatusStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // حساب صافي الربح
    const totalRevenue = salesStats.length > 0 ? salesStats[0].totalRevenue : 0;
    const totalCost = profitStats.length > 0 ? profitStats[0].totalCost : 0;
    const totalDeliveryCost = profitStats.length > 0 ? profitStats[0].totalDeliveryCost : 0;
    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const result = {
      period,
      revenue: totalRevenue,
      totalOrders: salesStats.length > 0 ? salesStats[0].totalOrders : 0,
      averageOrderValue: salesStats.length > 0 ? salesStats[0].averageOrderValue : 0,
      netProfit,
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      totalCost,
      totalDeliveryCost,
      dailySales,
      orderStatusStats
    };

    res.json(result);
  } catch (error) {
    console.error('Error in getAdvancedStats:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
};

// Get multiple orders by array of IDs
exports.getOrdersByIds = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'يجب إرسال مصفوفة تحتوي على معرّفات الطلبات' });
    }

    // ✅ Find all existing orders that match these IDs
    const existingOrders = await Order.find({ _id: { $in: ids } })
      .populate('items.product')
      .sort({ createdAt: -1 });

    res.json(existingOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الطلبات' });
  }
};
