const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "عنوان المنتج مطلوب"], 
      trim: true,
    },
    description: {
      type: String,
      required: [true, "وصف المنتج مطلوب"], 
    },
    images: [
      {
        type: String,
        required: [true, "صور المنتج مطلوبة"], 
      },
    ],
    // سعر البيع للعميل
    price: {
      type: Number,
      required: [true, "سعر المنتج مطلوب"], 
      min: [0, "السعر يجب أن يكون أكبر من أو يساوي الصفر"],
    },
    costPrice: {
      type: Number,
      required: [true, "سعر شراء المنتج مطلوب"],
      min: [0, "سعر الشراء يجب أن يكون أكبر من أو يساوي الصفر"],
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, "نسبة الخصم يجب أن تكون أكبر من أو تساوي الصفر"],
      max: [100, "نسبة الخصم يجب أن تكون أقل من أو تساوي 100"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "فئة المنتج مطلوبة"], 
    },
    availableSizes: [
      {
        type: String,
        required: [true, "المقاسات المتاحة مطلوبة"], 
      },
    ],
    colors: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isBundle: {
      type: Boolean,
      default: false,
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, "الكمية يجب أن تكون أكبر من أو تساوي الصفر"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // ✅ Include virtuals when converting to JSON
    toObject: { virtuals: true }, // ✅ Include virtuals when converting to objects
  }
);

productSchema.virtual("finalPrice").get(function () {
  return !!this.discountPercentage && this.discountPercentage > 0 ? this.price * (1 - this.discountPercentage / 100) : this.price;
});

productSchema.virtual("inStock").get(function () {
  return this.quantity > 0;
});

productSchema.virtual("profit").get(function () {
  const sellingPrice = this.finalPrice;
  return sellingPrice - this.costPrice;
});

productSchema.virtual("profitPercentage").get(function () {
  if (this.costPrice === 0) return 0;
  const profit = this.finalPrice - this.costPrice;
  return (profit / this.costPrice) * 100;
});

productSchema.virtual("profitBeforeDiscount").get(function () {
  return this.price - this.costPrice;
});

productSchema.virtual("profitPercentageBeforeDiscount").get(function () {
  if (this.costPrice === 0) return 0;
  const profit = this.price - this.costPrice;
  return (profit / this.costPrice) * 100;
});

module.exports = mongoose.model("Product", productSchema);