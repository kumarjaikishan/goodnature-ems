const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        const uniquename = `${Date.now()}-${cleanName}`;
        cb(null, uniquename);
    },
});

const allowedMimes = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf', // Allowed for receipts, deposit slips, documents
]);

const fileFilter = (req, file, cb) => {
    if (allowedMimes.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}. Only images and PDFs are allowed.`));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

module.exports = upload;
