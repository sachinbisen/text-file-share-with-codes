require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const { Readable } = require('stream');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const client = new MongoClient(process.env.MONGO_URI);
let db, bucket;

client.connect()
  .then(async () => {
    db = client.db('clipvault');
    bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    console.log(`✅ Worker ${process.pid} connected to MongoDB Atlas with GridFS`);

    // Fetch all existing indexes
    const indexes = await db.collection('metadata').indexes();
    const ttlIndex = indexes.find(index => index.name === "expiresAt_1");

    // Drop the index only if it exists and has a different expireAfterSeconds value
    if (ttlIndex && ttlIndex.expireAfterSeconds !== 600) {
      console.log("⚠️ TTL index exists but with incorrect expiry. Dropping...");
      await db.collection('metadata').dropIndex("expiresAt_1");
    }

    // Create the TTL index only if it doesn't exist
    if (!ttlIndex || ttlIndex.expireAfterSeconds !== 600) {
      await db.collection('metadata').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 600 });
      console.log("✅ TTL Index created with 10-minute expiration");
    }
  })
  .catch(err => {
    console.error('MongoDB connection failed', err);
    process.exit(1);
  });
  
  

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Multer memory storage (no disk files)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Generate unique 4-digit code
async function generateUniqueCode() {
  let code;
  let existing;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
    existing = await db.collection('metadata').findOne({ code });
  } while (existing);
  return code;
}

// Send API — upload files/text
app.post('/api/send', upload.array('file'), async (req, res) => {
  const { text, maxReceivers, expiryMinutes } = req.body;
  const code = await generateUniqueCode();

  // Ensure expiry doesn't exceed 30 minutes
  const expiryLimit = Math.min(expiryMinutes ? parseInt(expiryMinutes) : 10, 30);
  const expiresAt = new Date(Date.now() + expiryLimit * 60 * 1000);
  const receiverLimit = maxReceivers ? parseInt(maxReceivers) : 1;

  let fileIds = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const readableStream = Readable.from(file.buffer);
      const uploadStream = bucket.openUploadStream(file.originalname, { metadata: { code, uploadedAt: new Date() } });
      readableStream.pipe(uploadStream);

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', () => {
          fileIds.push(uploadStream.id);
          resolve();
        });
        uploadStream.on('error', reject);
      });
    }
  }

  await db.collection('metadata').insertOne({
    code,
    text: text || null,
    files: fileIds,
    createdAt: new Date(),
    expiresAt,
    maxReceivers: receiverLimit,
    receiverCount: 0
  });
  


  res.json({ success: true, message: 'Sent successfully!', code });
});

app.get('/api/receive/:code', async (req, res) => {
  const { code } = req.params;
  const data = await db.collection('metadata').findOne({ code });

  if (!data) return res.status(404).json({ error: 'Code expired or invalid' });

  // Check if max receivers limit is reached
  if (data.receiverCount >= data.maxReceivers) {
    return res.status(403).json({ error: 'Code expired' });
  }

  // Increment receiver count
  await db.collection('metadata').updateOne({ code }, { $inc: { receiverCount: 1 } });

  // Get updated record
  const updatedData = await db.collection('metadata').findOne({ code });

  res.json({
    text: updatedData.text || null,
    files: updatedData.files?.map(id => ({ filename: `file-${id}`, url: `/api/file/${id}` })) || []
  });
});

// Receive API — retrieve files/text by code
// Receive API — retrieve files/text by code
app.get('/api/receive/:code', async (req, res) => {
  const { code } = req.params;
  const data = await db.collection('metadata').findOne({ code });

  if (!data) {
    return res.status(404).json({ error: 'Invalid Code' });
  }

  if (data.receiverCount >= data.maxReceivers) {
    return res.status(403).json({ error: 'Code expired' });
  }

  // Increment receiver count
  await db.collection('metadata').updateOne({ code }, { $inc: { receiverCount: 1 } });

  const updatedData = await db.collection('metadata').findOne({ code });

  res.json({
    text: updatedData.text || null,
    files: updatedData.files?.map(id => ({ filename: `file-${id}`, url: `/api/file/${id}` })) || []
  });
});

// Serve file download by fileId
app.get('/api/file/:id', async (req, res) => {
  try {
    const fileId = new ObjectId(req.params.id);
    
    const files = await bucket.find({ _id: fileId }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${files[0].filename}"`
    });

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));