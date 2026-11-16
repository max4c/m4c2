import sharp from "sharp";

const canvas = { width: 1120, height: 1400 };
const white = "#ffffff";

export async function catalogPhoto(input: Buffer) {
  const { data, info } = await sharp(input, {
    limitInputPixels: 40_000_000,
    failOn: "error",
  })
    .rotate()
    .resize({ ...canvas, fit: "inside", withoutEnlargement: true })
    .flatten({ background: white })
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const border: number[] = [];
  for (let i = 0; i < 64; i++) {
    const x = Math.round(((width - 1) * i) / 63);
    const y = Math.round(((height - 1) * i) / 63);
    border.push(x, (height - 1) * width + x, y * width, y * width + width - 1);
  }
  const background = [0, 1, 2].map((channel) => {
    const samples = border
      .map((p) => data[p * 3 + channel])
      .sort((a, b) => a - b);
    return samples[Math.floor(samples.length / 2)];
  });
  function distance(pixel: number) {
    const offset = pixel * 3;
    return Math.max(
      Math.abs(data[offset] - background[0]),
      Math.abs(data[offset + 1] - background[1]),
      Math.abs(data[offset + 2] - background[2]),
    );
  }

  // Correct only a clearly identifiable studio backdrop. Preserve the scene
  // in an ordinary uploaded photo and fit it on the same white catalog canvas.
  const uniform =
    border.filter((p) => distance(p) <= 10).length / border.length;
  if (
    uniform >= 0.94 &&
    Math.min(...background) >= 208 &&
    Math.min(...background) < 253 &&
    Math.max(...background) - Math.min(...background) <= 36
  ) {
    // Follow the studio backdrop inward from the frame. Do not recolor
    // similar patches inside the garment, e.g. a cream pocket on a tan jacket.
    const count = width * height;
    const visited = new Uint8Array(count);
    const queue = new Int32Array(count);
    let tail = 0;
    function visit(pixel: number) {
      if (visited[pixel]) return;
      visited[pixel] = 1;
      if (distance(pixel) < 44) queue[tail++] = pixel;
    }
    for (let x = 0; x < width; x++) {
      visit(x);
      visit(count - width + x);
    }
    for (let y = 0; y < height; y++) {
      visit(y * width);
      visit(y * width + width - 1);
    }
    for (let head = 0; head < tail; head++) {
      const p = queue[head];
      const delta = distance(p);
      // Taper the correction into contact shadows and antialiased edges.
      const strength = Math.min(1, (44 - delta) / 32);
      for (let c = 0; c < 3; c++) {
        const offset = p * 3 + c;
        data[offset] = Math.min(
          255,
          Math.round(data[offset] + (255 - background[c] + 5) * strength),
        );
      }
      if (p >= width) visit(p - width);
      if (p + width < count) visit(p + width);
      if (p % width > 0) visit(p - 1);
      if (p % width < width - 1) visit(p + 1);
    }
  }

  return sharp(data, { raw: { width, height, channels: 3 } })
    .resize({ ...canvas, fit: "contain", background: white })
    .webp({ quality: 94 })
    .toBuffer();
}

// Remove empty studio margins before fitting garments of different shapes
// into the same square. Coloured scenes retain their complete frame.
export async function catalogTile(input: Buffer) {
  const preview = await sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize(720, 720, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: white })
    .removeAlpha()
    .png()
    .toBuffer();
  return sharp(preview)
    .trim({ background: white, threshold: 8 })
    .resize(512, 512, { fit: "contain", background: white })
    .extend({ top: 44, bottom: 44, left: 44, right: 44, background: white })
    .webp({ quality: 88 })
    .toBuffer();
}
