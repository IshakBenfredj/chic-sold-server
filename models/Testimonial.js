const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "اسم العميل مطلوب"],
      trim: true,
    },
    comment: {
      type: String,
      required: [true, "التعليق مطلوب"],
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "جنس العميل مطلوب"],
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);