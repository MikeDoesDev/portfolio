/**
 * Image scaling, ported from Michael's C++ (the private course code) so the
 * browser demo produces the same pixels. Images are row-major RGB, 3 bytes
 * per pixel.
 */
export interface Rgb { width: number; height: number; data: Uint8Array }
export type Pixel = [number, number, number];

export const blank = (width: number, height: number): Rgb => ({ width, height, data: new Uint8Array(width * height * 3) });
export const pixel = (img: Rgb, x: number, y: number): Pixel => {
  const i = (y * img.width + x) * 3;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};
export const setPixel = (img: Rgb, x: number, y: number, [r, g, b]: Pixel) => {
  const i = (y * img.width + x) * 3;
  img.data[i] = r;
  img.data[i + 1] = g;
  img.data[i + 2] = b;
};

/** Where target pixel `coordinate` lands in the source, as in map_coordinates. */
export function mapCoordinates(source: number, target: number, coordinate: number) {
  if (source === 0 || target <= 1) throw new Error("Invalid dimension");
  if (coordinate >= target) throw new Error("Invalid coordinate");
  return ((source - 1) / (target - 1)) * coordinate;
}

// Catmull-Rom cubic through four samples, the kernel behind bicubic_pixel.
const catmullRom = (t: number, a: number, b: number, c: number, d: number) =>
  0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
const toByte = (v: number) => Math.round(Math.min(255, Math.max(0, v)));

export const bicubicPixel = (t: number, p1: Pixel, p2: Pixel, p3: Pixel, p4: Pixel): Pixel =>
  [0, 1, 2].map(c => toByte(catmullRom(t, p1[c], p2[c], p3[c], p4[c]))) as Pixel;

/**
 * Bicubic sample at (x, y): four horizontal passes over a clamped 4x4
 * neighborhood, then one vertical pass. Each pass rounds to bytes, as the
 * C++ Pixel struct does.
 */
export function bicubicAt(img: Rgb, x: number, y: number): Pixel {
  if (x < 0 || x >= img.width || y < 0 || y >= img.height) throw new Error("Invalid coordinate");
  const rx = Math.floor(x), ry = Math.floor(y);
  const clamp = (v: number, max: number) => Math.max(0, Math.min(v, max));
  const rows: Pixel[] = [];
  for (let i = 0; i < 4; i++) {
    const row = clamp(ry - 1 + i, img.height - 1);
    const at = (column: number) => pixel(img, clamp(column, img.width - 1), row);
    rows.push(bicubicPixel(x - rx, at(rx - 1), at(rx), at(rx + 1), at(rx + 2)));
  }
  return bicubicPixel(y - ry, rows[0], rows[1], rows[2], rows[3]);
}

export type Method = "nearest" | "bilinear" | "bicubic";

/** Scales to width x height. Bicubic is the C++ algorithm; the other two are for comparison. */
export function scale(img: Rgb, width: number, height: number, method: Method = "bicubic"): Rgb {
  const out = blank(width, height);
  for (let y = 0; y < height; y++) {
    const sy = mapCoordinates(img.height, height, y);
    for (let x = 0; x < width; x++) {
      const sx = mapCoordinates(img.width, width, x);
      if (method === "bicubic") setPixel(out, x, y, bicubicAt(img, sx, sy));
      else if (method === "nearest") setPixel(out, x, y, pixel(img, Math.round(sx), Math.round(sy)));
      else {
        const x0 = Math.floor(sx), y0 = Math.floor(sy), x1 = Math.min(x0 + 1, img.width - 1), y1 = Math.min(y0 + 1, img.height - 1);
        const fx = sx - x0, fy = sy - y0;
        const [a, b, c, d] = [pixel(img, x0, y0), pixel(img, x1, y0), pixel(img, x0, y1), pixel(img, x1, y1)];
        setPixel(out, x, y, [0, 1, 2].map(k => Math.round((a[k] * (1 - fx) + b[k] * fx) * (1 - fy) + (c[k] * (1 - fx) + d[k] * fx) * fy)) as Pixel);
      }
    }
  }
  return out;
}
