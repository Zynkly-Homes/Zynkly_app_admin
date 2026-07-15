const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Vercel's serverless filesystem is read-only except os.tmpdir(), and
// that storage is ephemeral (wiped between invocations/containers) —
// fine for local dev, but uploaded files won't persist in production.
// Swap this for a cloud storage provider (S3, Cloudinary, Vercel Blob)
// if uploaded images need to survive across requests.
const uploadsDir = path.join(os.tmpdir(), 'zynkly-uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter — only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

module.exports = upload;
