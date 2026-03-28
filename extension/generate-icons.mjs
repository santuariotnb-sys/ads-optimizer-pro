// Run: node extension/generate-icons.mjs
// Generates PNG icons for Chrome extension from pure JS (no dependencies)

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

function createPNG(size, r, g, b) {
  // Raw pixel data: each row has a filter byte (0) + RGB pixels
  const raw = Buffer.alloc((1 + size * 3) * size);
  for (let y = 0; y < size; y++) {
    const rowOffset = y * (1 + size * 3);
    raw[rowOffset] = 0; // No filter
    for (let x = 0; x < size; x++) {
      const px = rowOffset + 1 + x * 3;
      const cx = size / 2, cy = size / 2, radius = size * 0.45;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < radius) {
        // Gradient from #6366f1 to #8b5cf6
        const t = x / size;
        raw[px] = Math.round(99 * (1 - t) + 139 * t);
        raw[px + 1] = Math.round(102 * (1 - t) + 92 * t);
        raw[px + 2] = Math.round(241 * (1 - t) + 246 * t);
      } else {
        // Transparent-ish dark background
        raw[px] = 12; raw[px + 1] = 12; raw[px + 2] = 20;
      }
    }
  }

  const compressed = deflateSync(raw);

  function crc32(buf) {
    let c = 0xffffffff;
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let v = n;
      for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
      table[n] = v;
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData));
    return Buffer.concat([len, typeAndData, crc]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type RGB

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const sizes = [16, 32, 48, 128];
for (const s of sizes) {
  const png = createPNG(s, 99, 102, 241);
  writeFileSync(new URL(`./icons/icon${s}.png`, import.meta.url), png);
  console.log(`Created icon${s}.png (${png.length} bytes)`);
}
