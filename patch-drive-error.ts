import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const target = `  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id',
  });
  
  return file.data.id;
}`;

const replacement = `  try {
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });
    
    return file.data.id;
  } catch (e: any) {
    console.error("Google Drive upload error:", e.message || e);
    // Fallback to local storage if Drive fails
    return null;
  }
}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('server.ts', content);
  console.log("Patched uploadToDrive error handling");
} else {
  console.log("Target not found!");
}
