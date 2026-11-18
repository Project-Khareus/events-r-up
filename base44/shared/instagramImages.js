// Instagram's publishing API only accepts pictures between 4:5 (portrait) and
// 1.91:1 (landscape). Ordinary 3:4 phone portraits, screenshots and panoramas
// fall outside that, so they are centre-cropped to the nearest allowed shape
// for Instagram only. Facebook keeps the originals.
import { Image } from 'npm:imagescript@1.3.0';

export const IG_MIN_RATIO = 4 / 5;
export const IG_MAX_RATIO = 1.91;

// Reads width/height from the first bytes of a JPEG, PNG, GIF or WebP file.
export function readImageSize(bytes) {
  const b = bytes;
  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    const view = new DataView(b.buffer, b.byteOffset);
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (b.length >= 10 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) {
    return { width: b[6] | (b[7] << 8), height: b[8] | (b[9] << 8) };
  }
  if (b.length >= 30 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    const chunk = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (chunk === 'VP8X') return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    if (chunk === 'VP8 ') return { width: (b[26] | (b[27] << 8)) & 0x3fff, height: (b[28] | (b[29] << 8)) & 0x3fff };
    if (chunk === 'VP8L') {
      const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i += 1; continue; }
      const marker = b[i + 1];
      if (marker === 0xff) { i += 1; continue; }
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      i += 2 + ((b[i + 2] << 8) | b[i + 3]);
    }
  }
  return null;
}

export function fitsInstagram(size) {
  if (!size || !size.width || !size.height) return true; // unknown: let Instagram decide
  const ratio = size.width / size.height;
  return ratio >= IG_MIN_RATIO - 0.005 && ratio <= IG_MAX_RATIO + 0.005;
}

// Centre crop box that brings an image inside Instagram's allowed range.
export function instagramCropBox(width, height) {
  const ratio = width / height;
  if (ratio < IG_MIN_RATIO) {
    const h = Math.floor(width / IG_MIN_RATIO);
    return { x: 0, y: Math.floor((height - h) / 2), width, height: h };
  }
  if (ratio > IG_MAX_RATIO) {
    const w = Math.floor(height * IG_MAX_RATIO);
    return { x: Math.floor((width - w) / 2), y: 0, width: w, height };
  }
  return null;
}

async function fetchBytes(url, range) {
  const response = await fetch(url, { headers: range ? { Range: range } : {}, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Could not download picture (${response.status})`);
  return new Uint8Array(await response.arrayBuffer());
}

// Which picture URLs will be cropped for Instagram. Only reads the start of each file.
export async function findInstagramCrops(urls) {
  const checks = await Promise.all(urls.map(async (url) => {
    try {
      return fitsInstagram(readImageSize(await fetchBytes(url, 'bytes=0-131071'))) ? null : url;
    } catch {
      return null;
    }
  }));
  return checks.filter(Boolean);
}

// Returns URLs Instagram will accept: pictures already in range are kept as they
// are; the rest are cropped, uploaded, and replaced with the cropped copy.
// Pictures are processed one at a time to keep memory low.
export async function prepareInstagramImages(base44, urls) {
  const ready = [];
  for (const url of urls) {
    let bytes;
    try {
      bytes = await fetchBytes(url);
    } catch {
      ready.push(url);
      continue;
    }
    const size = readImageSize(bytes);
    if (fitsInstagram(size)) { ready.push(url); continue; }
    try {
      const image = await Image.decode(bytes);
      const box = instagramCropBox(image.width, image.height);
      if (box) image.crop(box.x, box.y, box.width, box.height);
      const jpeg = await image.encodeJPEG(90);
      const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file: new File([jpeg], 'instagram.jpg', { type: 'image/jpeg' }) });
      ready.push(file_url);
    } catch (error) {
      console.error('Instagram crop failed, skipping picture:', url, error?.message);
    }
  }
  return ready;
}
