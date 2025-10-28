// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary utility functions
const uploadToCloudinary = async (base64Image, folder = 'pajama-store') => {
  try {
    if (!base64Image || !base64Image.startsWith('data:image')) {
      throw new Error('Invalid base64 image format');
    }

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto'
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

const uploadMultipleToCloudinary = async (base64Images, folder = 'pajama-store') => {
  try {
    if (!Array.isArray(base64Images)) {
      throw new Error('Images must be an array');
    }

    const uploadPromises = base64Images.map(image => 
      uploadToCloudinary(image, folder)
    );

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Cloudinary multiple upload error:', error);
    throw new Error(`Failed to upload images: ${error.message}`);
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required');
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('.')[0];
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};


module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl
};