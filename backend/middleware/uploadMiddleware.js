const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const FileType = require('file-type');
const path = require('path');
const fs = require('fs');

// Allowed extensions and mime types
const ALLOWED = [
  { ext: '.jpg', mime: 'image/jpeg', maxSize: 2 * 1024 * 1024 },
  { ext: '.jpeg', mime: 'image/jpeg', maxSize: 2 * 1024 * 1024 },
  { ext: '.png', mime: 'image/png', maxSize: 2 * 1024 * 1024 },
  { ext: '.pdf', mime: 'application/pdf', maxSize: 5 * 1024 * 1024 },
  { ext: '.txt', mime: 'text/plain', maxSize: 5 * 1024 * 1024 },
];

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB (global upper bound)
});

async function fileFilter(req, res, next) {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const buffer = req.file.buffer;
  const fileType = await FileType.fromBuffer(buffer);
  if (!fileType) return res.status(400).json({ message: 'File type not allowed.' });
  const allowed = ALLOWED.find(
    a => a.mime === fileType.mime && path.extname(req.file.originalname).toLowerCase() === a.ext
  );
  if (!allowed) {
    return res.status(400).json({ message: 'File type or extension not allowed.' });
  }
  if (req.file.size > allowed.maxSize) {
    return res.status(400).json({ message: `File too large. Max allowed: ${allowed.maxSize / 1024 / 1024}MB` });
  }
  req.file.detectedMime = fileType.mime;
  req.file.allowedExt = allowed.ext;
  next();
}

async function saveFile(req, res, next) {
  try {
    const uuid = uuidv4();
    const ext = req.file.allowedExt;
    const filename = uuid + ext;
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, req.file.buffer);
    req.savedFile = { filename, path: filepath, mime: req.file.detectedMime };
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Failed to save file.', error: err.message });
  }
}

module.exports = { upload, fileFilter, saveFile };
