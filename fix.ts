import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

// I will extract everything before app.post('/api/upload/chunk'
const beforeIdx = content.indexOf(`app.post('/api/upload/chunk'`);
const before = content.slice(0, beforeIdx);

// And I'll extract everything after app.get('/api/media/:fileId'
const afterIdx = content.indexOf(`app.get('/api/media/:fileId'`);
const after = content.slice(afterIdx);

const newUpload = `app.post('/api/upload/chunk', upload.single('chunk'), async (req, res) => {
    try {
      const uploadId = req.body.uploadId;
      const chunkIndex = parseInt(req.body.chunkIndex, 10);
      const totalChunks = parseInt(req.body.totalChunks, 10);
      const originalName = req.body.originalName;
      if (!req.file) return res.status(400).json({ error: 'No chunk file provided' });
      if (!chunkedUploads.has(uploadId)) {
        chunkedUploads.set(uploadId, { chunks: new Array(totalChunks).fill(null), originalName, total: totalChunks });
      }
      const uploadData = chunkedUploads.get(uploadId)!;
      uploadData.chunks[chunkIndex] = req.file.buffer;
      const receivedCount = uploadData.chunks.filter(c => c !== null).length;
      if (receivedCount === uploadData.total) {
        const finalBuffer = Buffer.concat(uploadData.chunks as Buffer[]);
        chunkedUploads.delete(uploadId);
        const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const finalName = \`\${uploadId}-\${safeName}\`;
        
        const mimeType = (await import('mime-types')).default.lookup(originalName) || 'application/octet-stream';
        const firebaseUrl = await uploadToFirebase(finalBuffer, finalName, mimeType);
        
        if (firebaseUrl) {
            return res.json({ url: firebaseUrl, complete: true });
        } else {
            const path = await import('path');
            const uploadDir = path.join(process.cwd(), 'uploads');
            await fs.promises.mkdir(uploadDir, { recursive: true });
            await fs.promises.writeFile(path.join(uploadDir, finalName), finalBuffer);
            return res.json({ url: \`/uploads/\${finalName}\`, complete: true });
        }
      }
      res.json({ complete: false, received: receivedCount });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Chunk upload failed' });
    }
  });

  app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    try {
      const id = Date.now().toString();
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const finalName = \`\${id}-\${safeName}\`;
      
      const mimeType = req.file.mimetype || 'application/octet-stream';
      const firebaseUrl = await uploadToFirebase(req.file.buffer, finalName, mimeType);
      
      if (firebaseUrl) {
          res.json({ url: firebaseUrl });
      } else {
          const path = await import('path');
          const uploadDir = path.join(process.cwd(), 'uploads');
          await fs.promises.mkdir(uploadDir, { recursive: true });
          await fs.promises.writeFile(path.join(uploadDir, finalName), req.file.buffer);
          res.json({ url: \`/uploads/\${finalName}\` });
      }
    } catch(e: any) {
      console.error("Upload error:", e);
      res.status(500).json({ error: e.message || 'Error saving file to disk' });
    }
  });
  
  `;

fs.writeFileSync('server.ts', before + newUpload + after);
