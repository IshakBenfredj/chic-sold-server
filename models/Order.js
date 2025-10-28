const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    customerInfo: {
      fullName: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      deliveryType: {
        type: String,
        enum: ["home", "office"],
      },
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        size: {
          type: String,
          required: true,
        },
        color: String,
      },
    ],
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `ORD${(count + 1).toString().padStart(6, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
