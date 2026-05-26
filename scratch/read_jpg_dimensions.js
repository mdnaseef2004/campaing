const fs = require('fs');

function getJpgSize(filepath) {
  const buffer = fs.readFileSync(filepath);
  let i = 2; // skip SOI (0xFFD8)
  while (i < buffer.length) {
    // Markers start with 0xFF
    if (buffer[i] !== 0xff) {
      throw new Error('Invalid JPEG marker');
    }
    const marker = buffer[i + 1];
    // SOF0 (0xC0) to SOF15 (0xCF) except SOF4, SOF8, SOF12
    if ((marker >= 0xc0 && marker <= 0xcf) && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      // SOF header: marker (2 bytes) + length (2 bytes) + precision (1 byte) + height (2 bytes) + width (2 bytes)
      const height = buffer.readUInt16BE(i + 5);
      const width = buffer.readUInt16BE(i + 7);
      return { width, height };
    }
    // Skip this segment
    const length = buffer.readUInt16BE(i + 2);
    i += 2 + length;
  }
  throw new Error('SOF marker not found');
}

try {
  const size = getJpgSize('public/finally-made-it.jpg');
  console.log(`Dimensions: ${size.width}x${size.height}`);
} catch (e) {
  console.error(e);
}
