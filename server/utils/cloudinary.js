/**
 * Centralized Cloudinary configuration (PLAN-19: DUP-002 fix)
 * Import this instead of configuring cloudinary inline in each controller.
 * Usage: const cloudinary = require('../utils/cloudinary');
 */
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
