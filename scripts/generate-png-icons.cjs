const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buf) {
  let table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([len, crcData, crcBuf]);
}

function renderIaLogoRgba(size) {
  const buf = Buffer.alloc(size * size * 4);

  // Colors:
  // Navy backdrop: #030817 -> (3, 8, 23)
  // Deep Blue core: (10, 42, 102)
  // Cyan: #00F5FF -> (0, 245, 255)
  // Electric Blue: #386BFF -> (56, 107, 255)
  // Violet-Purple: #A855F7 -> (168, 85, 247)

  const radius = size * 0.44;
  const cx = size * 0.5;
  const cy = size * 0.5;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = x / size; // 0..1
      const ny = y / size; // 0..1

      // Rounded rectangle background (#030817 with ambient glow)
      const distFromCenter = Math.hypot(x - cx, y - cy);
      let r = 3, g = 8, b = 23, a = 255;

      // Ambient radial bloom in center
      if (distFromCenter < size * 0.48) {
        const factor = 1 - (distFromCenter / (size * 0.48));
        r += Math.round(15 * factor);
        g += Math.round(35 * factor);
        b += Math.round(85 * factor);
      }

      // Pillar I: nx between 0.14 and 0.28, ny between 0.23 and 0.77
      if (nx >= 0.14 && nx <= 0.28 && ny >= 0.23 && ny <= 0.77) {
        const grad = (ny - 0.23) / (0.77 - 0.23);
        r = Math.round(0 * (1 - grad) + 56 * grad);
        g = Math.round(245 * (1 - grad) + 107 * grad);
        b = 255;
      }

      // Letter A: left leg nx 0.36 to 0.56, right leg nx 0.56 to 0.76
      const leftLegDist = Math.abs((ny - 0.23) / 0.54 - (0.56 - nx) / 0.20);
      const rightLegDist = Math.abs((ny - 0.23) / 0.54 - (nx - 0.56) / 0.20);

      if (ny >= 0.23 && ny <= 0.77) {
        if (leftLegDist < 0.12 && nx <= 0.58 && nx >= 0.34) {
          const grad = (ny - 0.23) / 0.54;
          r = Math.round(0 * (1 - grad) + 56 * grad);
          g = Math.round(245 * (1 - grad) + 107 * grad);
          b = 255;
        } else if (rightLegDist < 0.12 && nx >= 0.54 && nx <= 0.78) {
          const grad = (ny - 0.23) / 0.54;
          r = Math.round(56 * (1 - grad) + 168 * grad);
          g = Math.round(107 * (1 - grad) + 85 * grad);
          b = Math.round(255 * (1 - grad) + 247 * grad);
        }
      }

      // Globe sphere at (0.56, 0.51), radius ~ 0.15
      const gx = 0.56 * size;
      const gy = 0.51 * size;
      const gDist = Math.hypot(x - gx, y - gy);
      const gRadius = size * 0.15;

      if (gDist <= gRadius) {
        const gFactor = gDist / gRadius;
        // Globe interior
        r = Math.round(10 * (1 - gFactor) + 2 * gFactor);
        g = Math.round(42 * (1 - gFactor) + 10 * gFactor);
        b = Math.round(102 * (1 - gFactor) + 28 * gFactor);

        // Latitude / Longitude glow lines
        const dy = (y - gy) / gRadius;
        const dx = (x - gx) / gRadius;
        if (Math.abs(dy) < 0.08 || Math.abs(Math.abs(dy) - 0.5) < 0.08 || Math.abs(dx) < 0.08) {
          r = 0; g = 245; b = 255;
        }

        // Glowing center core
        if (gDist < gRadius * 0.35) {
          r = 200; g = 250; b = 255;
        }
      }

      // Orbital Ring: tilted ellipse around (0.56, 0.51)
      const rad = -28 * Math.PI / 180;
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);
      const rx = (x - gx) * cosR - (y - gy) * sinR;
      const ry = (x - gx) * sinR + (y - gy) * cosR;

      const aR = size * 0.38;
      const bR = size * 0.14;
      const ellipseVal = Math.hypot(rx / aR, ry / bR);

      if (Math.abs(ellipseVal - 1.0) < 0.08) {
        const ringProgress = (rx / aR + 1) * 0.5;
        r = Math.round(0 * (1 - ringProgress) + 192 * ringProgress);
        g = Math.round(245 * (1 - ringProgress) + 132 * ringProgress);
        b = Math.round(255 * (1 - ringProgress) + 252 * ringProgress);
      }

      // Corner rounding for square icon
      const cornerRadius = size * 0.22;
      const inCornerX = (x < cornerRadius) ? (cornerRadius - x) : (x > size - cornerRadius ? (x - (size - cornerRadius)) : 0);
      const inCornerY = (y < cornerRadius) ? (cornerRadius - y) : (y > size - cornerRadius ? (y - (size - cornerRadius)) : 0);
      if (inCornerX > 0 && inCornerY > 0) {
        if (Math.hypot(inCornerX, inCornerY) > cornerRadius) {
          a = 0; // Transparent outside corner
        }
      }

      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = a;
    }
  }

  return buf;
}

function writePngFile(filePath, size) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk("IHDR", ihdrData);

  const rgba = renderIaLogoRgba(size);
  const stride = size * 4;
  const raw = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) {
    const rowOffset = y * (stride + 1);
    raw[rowOffset] = 0;
    rgba.copy(raw, rowOffset + 1, y * stride, (y + 1) * stride);
  }

  const idat = makeChunk("IDAT", zlib.deflateSync(raw, { level: 9 }));
  const iend = makeChunk("IEND", Buffer.alloc(0));
  const fullPng = Buffer.concat([sig, ihdr, idat, iend]);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, fullPng);
  console.log(`Generated: ${filePath} (${size}x${size}, ${fullPng.length} bytes)`);
}

const pubDir = path.join(__dirname, "../public");
writePngFile(path.join(pubDir, "favicon-16x16.png"), 16);
writePngFile(path.join(pubDir, "favicon-32x32.png"), 32);
writePngFile(path.join(pubDir, "favicon-48x48.png"), 48);
writePngFile(path.join(pubDir, "icon-192x192.png"), 192);
writePngFile(path.join(pubDir, "icon-512x512.png"), 512);
// Also write favicon.ico (can be a 32x32 PNG as supported by all modern browsers)
fs.copyFileSync(path.join(pubDir, "favicon-32x32.png"), path.join(pubDir, "favicon.ico"));
console.log("All icons generated successfully!");
