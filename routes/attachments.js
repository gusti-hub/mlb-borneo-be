const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');

// Setup multer untuk file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images, PDFs, and common document types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

// POST upload attachment for activity
router.post('/:activityId', upload.single('file'), async (req, res) => {
  try {
    const { activityId } = req.params;
    const { originalname, filename, mimetype, size } = req.file;
    const { uploaded_by } = req.body;
    
    const query = `
      INSERT INTO attachments (activity_id, file_name, file_path, file_type, file_size, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      activityId,
      originalname,
      `/uploads/${filename}`,
      mimetype,
      size,
      uploaded_by || 'system'
    ]);
    
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
});

// GET all attachments for an activity
router.get('/:activityId', async (req, res) => {
  try {
    const { activityId } = req.params;
    
    const query = 'SELECT * FROM attachments WHERE activity_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [activityId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attachments',
      error: error.message
    });
  }
});

// DELETE attachment
router.delete('/:attachmentId', async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    // Get file path first
    const fileQuery = 'SELECT file_path FROM attachments WHERE id = $1';
    const fileResult = await pool.query(fileQuery, [attachmentId]);
    
    if (fileResult.rows.length > 0) {
      const filePath = path.join(__dirname, '..', fileResult.rows[0].file_path);
      
      // Delete file from filesystem
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete from database
      await pool.query('DELETE FROM attachments WHERE id = $1', [attachmentId]);
      
      res.json({
        success: true,
        message: 'Attachment deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
      error: error.message
    });
  }
});

module.exports = router;
