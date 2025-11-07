const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Validate Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  throw new Error("CLOUDINARY_CLOUD_NAME environment variable is required");
}
if (!process.env.CLOUDINARY_API_KEY) {
  throw new Error("CLOUDINARY_API_KEY environment variable is required");
}
if (!process.env.CLOUDINARY_API_SECRET) {
  throw new Error("CLOUDINARY_API_SECRET environment variable is required");
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "ai-studio/uploads",
      public_id: `${Date.now()}_${file.originalname.split(".")[0]}`,
      resource_type: "auto",
    };
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Middleware to attach Cloudinary URL to request
const attachCloudinaryFile = (req, res, next) => {
  console.log("📦 attachCloudinaryFile - req.file:", req.file);
  
  if (!req.file) {
    console.warn("⚠️ No file in request");
    return next();
  }

  // multer-storage-cloudinary returns data in req.file
  console.log("📄 Full req.file object:", JSON.stringify(req.file, null, 2));
  
  // multer-storage-cloudinary uses 'path' for URL and 'filename' for public_id
  const url = req.file.path || req.file.secure_url || req.file.url;
  const publicId = req.file.filename || req.file.public_id || req.file.publicId;
  const originalName = req.file.originalname || req.file.original_filename;
  
  console.log("🔗 Extracted from req.file:", { url, publicId, originalName });
  
  req.cloudinaryFile = {
    url: url,
    publicId: publicId,
    originalName: originalName,
  };
  
  console.log("✅ Cloudinary file attached:", req.cloudinaryFile);
  next();
};

module.exports = { upload, attachCloudinaryFile, cloudinary };
