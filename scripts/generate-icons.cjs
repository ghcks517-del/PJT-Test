const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// CRC32 implementation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const typeAndData = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([lenBuf, typeAndData, crcBuf]);
}

function createPng(width, height, getPixelRgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = getPixelRgba(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Distance to line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Check if (x,y) inside shield polygon
function isInsideShield(nx, ny) {
  // nx in [-1, 1], ny in [-1, 1]
  if (ny < -0.8 || ny > 0.95) return false;
  const absX = Math.abs(nx);
  if (ny < 0.1) {
    // Upper part
    return absX <= 0.8;
  } else {
    // Lower curving to point at (0, 0.95)
    const factor = 1 - (ny - 0.1) / 0.85;
    return absX <= 0.8 * Math.sqrt(Math.max(0, factor));
  }
}

function getStandardIconPixel(x, y, width, height) {
  const nx = (x / width) * 2 - 1;
  const ny = (y / height) * 2 - 1;

  // Background rounded squircle
  const cornerR = 0.35;
  const qx = Math.max(0, Math.abs(nx) - (1 - cornerR));
  const qy = Math.max(0, Math.abs(ny) - (1 - cornerR));
  const cornerDist = Math.hypot(qx, qy);
  if (cornerDist > cornerR) {
    return [0, 0, 0, 0]; // Transparent outside squircle
  }

  // Base background: clean gradient or crisp white
  let r = 255, g = 255, b = 255, a = 255;

  // Shield
  if (isInsideShield(nx, ny)) {
    // Orange brand gradient (#f97316 to #ea580c)
    const t = (ny + 0.8) / 1.75;
    r = Math.round(249 * (1 - t) + 234 * t);
    g = Math.round(115 * (1 - t) + 88 * t);
    b = Math.round(22 * (1 - t) + 12 * t);

    // Inner checkmark: segment 1 from (-0.35, 0.05) to (-0.05, 0.42), segment 2 to (0.42, -0.22)
    const d1 = distToSegment(nx, ny, -0.32, 0.08, -0.06, 0.38);
    const d2 = distToSegment(nx, ny, -0.06, 0.38, 0.38, -0.16);
    const strokeWidth = 0.09;
    if (Math.min(d1, d2) <= strokeWidth) {
      r = 255; g = 255; b = 255; // White checkmark
    }
  }

  return [r, g, b, a];
}

function getMaskableIconPixel(x, y, width, height) {
  const nx = (x / width) * 2 - 1;
  const ny = (y / height) * 2 - 1;

  // Full bleed background: Orange gradient (#f97316 to #c2410c)
  const tBg = (ny + 1) / 2;
  let r = Math.round(249 * (1 - tBg) + 194 * tBg);
  let g = Math.round(115 * (1 - tBg) + 65 * tBg);
  let b = Math.round(22 * (1 - tBg) + 12 * tBg);
  let a = 255;

  // Scaled down shield in safe zone (scale by 0.65)
  const snx = nx / 0.65;
  const sny = ny / 0.65;

  if (isInsideShield(snx, sny)) {
    // White shield
    r = 255; g = 255; b = 255;

    // Orange checkmark inside
    const d1 = distToSegment(snx, sny, -0.32, 0.08, -0.06, 0.38);
    const d2 = distToSegment(snx, sny, -0.06, 0.38, 0.38, -0.16);
    const strokeWidth = 0.10;
    if (Math.min(d1, d2) <= strokeWidth) {
      r = 234; g = 88; b = 12; // #ea580c
    }
  }

  return [r, g, b, a];
}

const outDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating PNG icons...');
const icon192 = createPng(192, 192, getStandardIconPixel);
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), icon192);

const icon512 = createPng(512, 512, getStandardIconPixel);
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), icon512);

const iconApple = createPng(180, 180, getStandardIconPixel);
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), iconApple);

const iconMaskable = createPng(512, 512, getMaskableIconPixel);
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), iconMaskable);

// Simple favicon
const favicon32 = createPng(32, 32, getStandardIconPixel);
fs.writeFileSync(path.join(outDir, 'favicon.ico'), favicon32);

console.log('Successfully generated all PWA icons in /public!');
