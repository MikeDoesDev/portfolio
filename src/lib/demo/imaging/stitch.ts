import { bicubicAt, blank, pixel, setPixel, type Pixel, type Rgb } from "./scale";

/**
 * Panorama stitching, ported from Michael's C++ (error_calculation,
 * match_corners, the homography map_coordinates and merge_images) plus the
 * pieces the course provided, reimplemented: Harris corners and a RANSAC
 * homography. Every step mirrors the private C++ build so both produce the
 * same panorama.
 */
export interface Corner { x: number; y: number }
export interface Match { a: Corner; b: Corner; error: number }
export type Matrix = number[][];

// Constants from the assignment's functions.h.
const NEIGHBORHOOD = 17;
const SENSITIVITY = 0.05;
const THRESHOLD_RATIO = 0.02;
const NMS_RADIUS = 20;

export function harrisCorners(img: Rgb): Corner[] {
  const { width: w, height: h } = img;
  const gray = new Float64Array(w * h), ix = new Float64Array(w * h), iy = new Float64Array(w * h), response = new Float64Array(w * h);
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    const [r, g, b] = pixel(img, x, y);
    gray[y * w + x] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  const at = (x: number, y: number) => y * w + x;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    ix[at(x, y)] = (gray[at(x + 1, y - 1)] + 2 * gray[at(x + 1, y)] + gray[at(x + 1, y + 1)]) - (gray[at(x - 1, y - 1)] + 2 * gray[at(x - 1, y)] + gray[at(x - 1, y + 1)]);
    iy[at(x, y)] = (gray[at(x - 1, y + 1)] + 2 * gray[at(x, y + 1)] + gray[at(x + 1, y + 1)]) - (gray[at(x - 1, y - 1)] + 2 * gray[at(x, y - 1)] + gray[at(x + 1, y - 1)]);
  }
  let peak = 0;
  for (let y = 3; y < h - 3; y++) for (let x = 3; x < w - 3; x++) {
    let sxx = 0, syy = 0, sxy = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const gx = ix[at(x + dx, y + dy)], gy = iy[at(x + dx, y + dy)];
      sxx += gx * gx;
      syy += gy * gy;
      sxy += gx * gy;
    }
    const r = sxx * syy - sxy * sxy - SENSITIVITY * (sxx + syy) * (sxx + syy);
    response[at(x, y)] = r;
    peak = Math.max(peak, r);
  }
  const margin = Math.floor(NEIGHBORHOOD / 2) + 1;
  const corners: Corner[] = [];
  for (let x = margin; x < w - margin; x++) for (let y = margin; y < h - margin; y++) {
    const r = response[at(x, y)];
    if (r <= THRESHOLD_RATIO * peak) continue;
    let best = true;
    for (let dy = -NMS_RADIUS; dy <= NMS_RADIUS && best; dy++) for (let dx = -NMS_RADIUS; dx <= NMS_RADIUS; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || (dx === 0 && dy === 0)) continue;
      const other = response[at(nx, ny)];
      if (other > r || (other === r && (dx < 0 || (dx === 0 && dy < 0)))) { best = false; break; }
    }
    if (best) corners.push({ x, y });
  }
  return corners;
}

/** Sum of squared RGB differences over the 17x17 neighborhoods (error_calculation). */
export function neighborhoodError(a: Rgb, ca: Corner, b: Rgb, cb: Corner) {
  const radius = (NEIGHBORHOOD - 1) / 2;
  const outside = (img: Rgb, c: Corner) => c.x < radius || c.x >= img.width - radius || c.y < radius || c.y >= img.height - radius;
  if (outside(a, ca) || outside(b, cb)) return Infinity;
  let error = 0;
  for (let dx = -radius; dx <= radius; dx++) for (let dy = -radius; dy <= radius; dy++) {
    const p = pixel(a, ca.x + dx, ca.y + dy), q = pixel(b, cb.x + dx, cb.y + dy);
    error += (p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]) + (p[2] - q[2]) * (p[2] - q[2]);
  }
  return error;
}

/**
 * match_corners: only right-half corners of the left image pair with
 * left-half corners of the right image, within 100 px vertically; then take
 * the lowest-error pair, remove its row and column, and repeat.
 */
export function matchCorners(a: Rgb, cornersA: Corner[], b: Rgb, cornersB: Corner[]): Match[] {
  const limitA = Math.floor(a.width / 2), limitB = Math.floor(b.width / 2);
  const errors = cornersA.map(ca => cornersB.map(cb =>
    ca.x < limitA || cb.x > limitB || Math.abs(ca.y - cb.y) > 100 ? Infinity : neighborhoodError(a, ca, b, cb)));
  const matches: Match[] = [];
  for (;;) {
    let min = Infinity, row = -1, column = -1;
    errors.forEach((line, i) => line.forEach((error, j) => { if (error < min) [min, row, column] = [error, i, j]; }));
    if (min === Infinity) return matches;
    matches.push({ a: cornersA[row], b: cornersB[column], error: min });
    errors.forEach(line => { line[column] = Infinity; });
    errors[row].fill(Infinity);
  }
}

// Gaussian elimination with partial pivoting, as in the C++ stand-in.
function solve(M: number[][], r: number[]): boolean {
  const n = r.length;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    if (Math.abs(M[pivot][col]) < 1e-12) return false;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    [r[col], r[pivot]] = [r[pivot], r[col]];
    for (let row = col + 1; row < n; row++) {
      const f = M[row][col] / M[col][col];
      for (let k = col; k < n; k++) M[row][k] -= f * M[col][k];
      r[row] -= f * r[col];
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    let s = r[i];
    for (let k = i + 1; k < n; k++) s -= M[i][k] * r[k];
    r[i] = s / M[i][i];
  }
  return true;
}

/** Least-squares homography (h33 = 1) through the chosen matches. */
function fit(matches: Match[], use: number[]): Matrix | null {
  const AtA = Array.from({ length: 8 }, () => new Array<number>(8).fill(0));
  const Atb = new Array<number>(8).fill(0);
  for (const i of use) {
    const { x, y } = matches[i].a, { x: u, y: v } = matches[i].b;
    const rows = [[x, y, 1, 0, 0, 0, -x * u, -y * u], [0, 0, 0, x, y, 1, -x * v, -y * v]];
    const rhs = [u, v];
    for (let e = 0; e < 2; e++) for (let k = 0; k < 8; k++) {
      Atb[k] += rows[e][k] * rhs[e];
      for (let j = 0; j < 8; j++) AtA[k][j] += rows[e][k] * rows[e][j];
    }
  }
  if (!solve(AtA, Atb)) return null;
  return [[Atb[0], Atb[1], Atb[2]], [Atb[3], Atb[4], Atb[5]], [Atb[6], Atb[7], 1]];
}

/** Projects (x, y) through H (the homography map_coordinates). */
export function project(H: Matrix, x: number, y: number): [number, number] {
  const d = H[2][0] * x + H[2][1] * y + H[2][2];
  return [(H[0][0] * x + H[0][1] * y + H[0][2]) / d, (H[1][0] * x + H[1][1] * y + H[1][2]) / d];
}

/** RANSAC over 4-match samples, then a refit on the largest consistent set. */
export function estimateHomography(matches: Match[]): { H: Matrix; inliers: number[] } {
  if (matches.length < 4) throw new Error("At least four matched pairs are needed");
  let seed = 12345;
  const next = (n: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed >>> 8) % n; };
  let best: number[] = [];
  for (let iteration = 0; iteration < 1000; iteration++) {
    const sample: number[] = [];
    while (sample.length < 4) {
      const pick = next(matches.length);
      if (!sample.includes(pick)) sample.push(pick);
    }
    const H = fit(matches, sample);
    if (!H) continue;
    const inliers = matches.flatMap((m, i) => {
      const [u, v] = project(H, m.a.x, m.a.y);
      return Math.hypot(u - m.b.x, v - m.b.y) < 3 ? [i] : [];
    });
    if (inliers.length > best.length) best = inliers;
  }
  if (best.length < 4) best = matches.map((_, i) => i);
  const H = fit(matches, best);
  if (!H) throw new Error("Matched points are degenerate");
  return { H, inliers: best };
}

/** merge_images: a 1.75x by 1.5x canvas, image 2 sampled bicubically through H, averaged where both cover. */
export function merge(a: Rgb, b: Rgb, H: Matrix): Rgb {
  const width = Math.trunc(a.width * 1.75), height = Math.trunc(a.height * 1.5);
  const out = blank(width, height);
  for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) {
    const [bx, by] = project(H, x, y);
    const fromB = bx >= 0 && bx < b.width && by >= 0 && by < b.height ? bicubicAt(b, bx, by) : null;
    const fromA = x < a.width && y < a.height ? pixel(a, x, y) : null;
    const value: Pixel = fromA && fromB ? [0, 1, 2].map(k => Math.trunc((fromA[k] + fromB[k]) / 2)) as Pixel : fromA ?? fromB ?? [0, 0, 0];
    setPixel(out, x, y, value);
  }
  return out;
}
