const mongoose = require("mongoose");
const Testimonial = require("./models/Testimonial"); // Adjust path to your testimonial model

// Enhanced Arabic testimonials with more realistic data
const enhancedArabicTestimonials = [
  {
    customerName: "سارة أحمد",
    comment: "البيجامات رائعة جداً! القماش ناعم ومريح للغاية، والجودة تتجاوز التوقعات. أنصح كل صديقاتي بتجربة منتجاتكم. الشحن كان سريعاً والتغليف أنيق.",
    gender: "female",
    rating: 5,
    createdAt: new Date('2024-01-15')
  },
  {
    customerName: "فاطمة محمد",
    comment: "شكراً لكم على المنتجات الرائعة! التصميمات جميلة والعملية الشراء كانت سلسة. بالتأكيد سأطلب مرة أخرى. خاصة مجموعة البيجامات القطنية.",
    gender: "female",
    rating: 5,
    createdAt: new Date('2024-01-20')
  },
  {
    customerName: "أحمد الخالد",
    comment: "اشتريت بيجامة لزوجتي وكانت سعيدة جداً بالهدية. الجودة ممتازة والسعر معقول. شكراً لخدمتكم المميزة وسرعة التوصيل.",
    gender: "male",
    rating: 4,
    createdAt: new Date('2024-02-01')
  },
  {
    customerName: "نورة عبدالله",
    comment: "تجربة تسوق رائعة! البيجامة مريحة للغاية وتناسب المقاس تماماً. التوصيل كان سريعاً والمنتج أفضل مما توقعت. أنصح الجميع.",
    gender: "female",
    rating: 5,
    createdAt: new Date('2024-02-10')
  },
  {
    customerName: "خالد الرشيد",
    comment: "منتجاتكم تستحق التجربة. اشتريت عدة بيجامات للعائلة والجميع كان سعيداً بالجودة والراحة. الأسعار مناسبة للجودة المقدمة.",
    gender: "male",
    rating: 4,
    createdAt: new Date('2024-02-15')
  },
  {
    customerName: "لمى السعد",
    comment: "أعشق تصميماتكم! كل بيجامة فريدة وجميلة. أصبحت ماركتكم المفضل لشراء ملابس النوم. التصميمات عصرية وتناسب جميع الأذواق.",
    gender: "female",
    rating: 5,
    createdAt: new Date('2024-02-20')
  },
  {
    customerName: "عبيد الغامدي",
    comment: "الجودة رائعة والسعر مناسب. الخدمة سريعة والمنتجات كما هي في الصور. أنصح بالتعامل معكم. خاصة في المناسبات والعروض.",
    gender: "male",
    rating: 4,
    createdAt: new Date('2024-03-01')
  },
  {
    customerName: "الجوهرة القحطاني",
    comment: "شكراً على الاهتمام بالتفاصيل! التطريز جميل والألوان زاهية. البيجامة أصبحت المفضلة لدي. القماش لا يتقلص بعد الغسيل.",
    gender: "female",
    rating: 5,
    createdAt: new Date('2024-03-05')
  },
  {
    customerName: "سلطان الفهد",
    comment: "تجربة ممتازة من البداية إلى النهاية. الموقع سهل الاستخدام والمنتجات ذات جودة عالية. خدمة العملاء محترفة ومتعاونة.",
    gender: "male",
    rating: 5,
    createdAt: new Date('2024-03-10')
  },
  {
    customerName: "ريم العتيبي",
    comment: "البيجامات مريحة جداً للنوم. القماش يتنفس ولا يسبب الحساسية. شكراً على المنتج الرائع! أنصح بالمجموعة الشتوية الدافئة.",
    gender: "female",
    rating: 5,
    createdAt: new Date('2024-03-15')
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://ishakbenfredjnosa:ishakbenfredjnosa@cluster0.hem0n5p.mongodb.net/chicSold?appName=Cluster0", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const addTestimonials = async () => {
  try {
    // Optional: Clear existing testimonials
    // await Testimonial.deleteMany({});
    // console.log("🗑️  Cleared existing testimonials");

    // Insert new testimonials
    const result = await Testimonial.insertMany(enhancedArabicTestimonials);
    console.log(`✅ Successfully added ${result.length} Arabic testimonials`);
    
    // Display summary
    const femaleCount = result.filter(t => t.gender === 'female').length;
    const maleCount = result.filter(t => t.gender === 'male').length;
    
    console.log(`\n📊 Summary:`);
    console.log(`   👩 ${femaleCount} female testimonials`);
    console.log(`   👨 ${maleCount} male testimonials`);
    console.log(`   ⭐ Average rating: ${(result.reduce((acc, t) => acc + (t.rating || 5), 0) / result.length).toFixed(1)}`);
    
  } catch (error) {
    console.error("❌ Error adding testimonials:", error);
  }
};

const main = async () => {
  await connectDB();
  await addTestimonials();
  
  mongoose.connection.close();
  console.log("\n🔌 Database connection closed");
  process.exit(0);
};

// Run the script
main();