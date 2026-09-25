// Parity checks: the browser port must reproduce the private C++ build's
// output byte for byte. The expected hashes come from running the C++
// (Michael's scaler and stitcher, plus reimplemented course stand-ins) on
// the same synthetic images, which are rebuilt here with identical code.
// Run with: npm run test:imaging
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { blank, scale, setPixel, type Pixel, type Rgb } from "./scale";
import { estimateHomography, harrisCorners, matchCorners, merge, project } from "./stitch";

const sha1 = (img: Rgb) => createHash("sha1").update(img.data).digest("hex");
const image = (width: number, height: number, at: (x: number, y: number) => Pixel) => {
  const img = blank(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) setPixel(img, x, y, at(x, y));
  return img;
};
let passed = 0;
const check = (name: string, fn: () => void) => { fn(); passed++; console.log(`ok  ${name}`); };

// ── Scaling: 24x18 test card up to 61x43, a non-integer factor.
const card = image(24, 18, (x, y) => {
  if ((x - 16) ** 2 + (y - 7) ** 2 < 20) return [196, 72, 58];
  if (Math.abs(x - y) < 1) return [30, 34, 28];
  if (x < 8 && y > 9) return (x + y) % 2 ? [240, 236, 220] : [70, 90, 60];
  return [Math.round(x * 10), Math.round(80 + y * 8), 150];
});
check("bicubic scaling matches the C++ output byte for byte", () => {
  const out = scale(card, 61, 43);
  assert.equal(sha1(out), "dac1217805bf65586408d04ff275d5c600bbee63");
});
check("scaling to the same size returns the original pixels", () => {
  assert.deepEqual(scale(card, 24, 18).data, card.data);
});

// ── Stitching: two overlapping crops of one textured scene.
let seed = 2024;
const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const W = 420, H = 260;
const scene: Pixel[] = Array.from({ length: W * H }, (_, i) => { const x = i % W, y = (i / W) | 0; return [120 + ((x * 7 + y * 3) % 23), 130 + ((x * 3 + y * 5) % 19), 125 + ((x + y * 7) % 29)]; });
for (let r = 0; r < 70; r++) {
  const w = 8 + Math.floor(rand() * 40), h = 8 + Math.floor(rand() * 40);
  const x0 = Math.floor(rand() * (W - w)), y0 = Math.floor(rand() * (H - h));
  const color: Pixel = [Math.floor(rand() * 256), Math.floor(rand() * 256), Math.floor(rand() * 256)];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) scene[y * W + x] = color;
}
const crop = (cx: number, cy: number) => image(260, 240, (x, y) => scene[(y + cy) * W + (x + cx)]);
const left = crop(0, 10), right = crop(150, 0);

check("stitching finds the same corners, matches and panorama as the C++", () => {
  const cornersA = harrisCorners(left), cornersB = harrisCorners(right);
  assert.deepEqual([cornersA.length, cornersB.length], [20, 23]);
  const matches = matchCorners(left, cornersA, right, cornersB);
  assert.equal(matches.length, 12);
  assert.deepEqual([matches[0].a, matches[0].b, matches[0].error], [{ x: 179, y: 78 }, { x: 29, y: 88 }, 0]);
  const { H: h, inliers } = estimateHomography(matches);
  // The crops differ by exactly (-150, +10), so every point should land on it.
  for (const [x, y] of [[0, 0], [259, 239], [130, 120]]) {
    const [u, v] = project(h, x, y);
    assert.ok(Math.abs(u - (x - 150)) < 1e-6 && Math.abs(v - (y + 10)) < 1e-6);
  }
  // The greedy matcher also pairs three wrong corners; RANSAC leaves them out.
  assert.equal(inliers.length, 9);
  const panorama = merge(left, right, h);
  assert.deepEqual([panorama.width, panorama.height], [455, 360]);
  assert.equal(sha1(panorama), "114f0b447190d766ece77d4d08521d7e089b7681");
});

console.log(`\n${passed} checks passed`);
