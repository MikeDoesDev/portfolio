"use client";

import { useEffect, useRef, useState } from "react";
import { blank, scale, setPixel, type Method, type Pixel, type Rgb } from "@/lib/demo/imaging/scale";
import { estimateHomography, harrisCorners, matchCorners, merge, project, type Corner, type Match } from "@/lib/demo/imaging/stitch";

const METHODS: { id: Method; name: string; note: string }[] = [
  { id: "nearest", name: "Nearest neighbor", note: "Copies the closest pixel. Fast, blocky." },
  { id: "bilinear", name: "Bilinear", note: "Blends the 2x2 neighbors. Smooth, soft edges." },
  { id: "bicubic", name: "Bicubic (the C++)", note: "Fits cubics through a 4x4 neighborhood. Sharper curves." },
];

/** Draws an RGB image onto a canvas at its native size; CSS decides the display size. */
function Picture({ img, label, marks, className }: { img: Rgb | null; label: string; marks?: (ctx: CanvasRenderingContext2D) => void; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !img) return;
    canvas.width = img.width;
    canvas.height = img.height;
    const rgba = new ImageData(img.width, img.height);
    for (let i = 0, j = 0; i < img.data.length; i += 3, j += 4) {
      rgba.data[j] = img.data[i];
      rgba.data[j + 1] = img.data[i + 1];
      rgba.data[j + 2] = img.data[i + 2];
      rgba.data[j + 3] = 255;
    }
    ctx.putImageData(rgba, 0, 0);
    marks?.(ctx);
  }, [img, marks]);
  return <canvas ref={ref} className={className ?? "im-canvas"} role="img" aria-label={label} />;
}

/** Reads an image file into RGB, shrunk to fit within maxWidth x maxHeight. */
async function readImage(source: ImageBitmapSource | string, maxWidth: number, maxHeight: number, crop?: [number, number, number, number]): Promise<Rgb> {
  const bitmap = typeof source === "string"
    ? await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = source; })
    : await createImageBitmap(source);
  const [sx, sy, sw, sh] = crop ?? [0, 0, bitmap.width, bitmap.height];
  const k = Math.min(1, maxWidth / sw, maxHeight / sh);
  const width = Math.max(2, Math.round(sw * k)), height = Math.max(2, Math.round(sh * k));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const img = blank(width, height);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) [img.data[j], img.data[j + 1], img.data[j + 2]] = [rgba[i], rgba[i + 1], rgba[i + 2]];
  return img;
}

/** The 24x18 test card the parity test scales. */
function testCard(): Rgb {
  const img = blank(24, 18);
  for (let y = 0; y < 18; y++) for (let x = 0; x < 24; x++) {
    let p: Pixel = [Math.round(x * 10), Math.round(80 + y * 8), 150];
    if ((x - 16) ** 2 + (y - 7) ** 2 < 20) p = [196, 72, 58];
    else if (Math.abs(x - y) < 1) p = [30, 34, 28];
    else if (x < 8 && y > 9) p = (x + y) % 2 ? [240, 236, 220] : [70, 90, 60];
    setPixel(img, x, y, p);
  }
  return img;
}

/** The synthetic pair the parity test stitches: two crops of one scene, offset by (150, -10). */
function testPair(): [Rgb, Rgb] {
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
  const crop = (cx: number, cy: number) => { const img = blank(260, 240); for (let y = 0; y < 240; y++) for (let x = 0; x < 260; x++) setPixel(img, x, y, scene[(y + cy) * W + (x + cx)]); return img; };
  return [crop(0, 10), crop(150, 0)];
}

function Scaling() {
  const [source, setSource] = useState<Rgb | null>(testCard);
  const [which, setWhich] = useState("card");
  const [factor, setFactor] = useState(6);
  const [results, setResults] = useState<{ method: Method; img: Rgb; ms: number }[]>([]);
  const [error, setError] = useState("");

  const load = async (kind: string, file?: File) => {
    setWhich(kind);
    setError("");
    try {
      if (kind === "card") setSource(testCard());
      else if (kind === "board") setSource(await readImage("/media/projects/pi-visualizer.webp", 64, 40, [300, 180, 480, 300]));
      else if (file) setSource(await readImage(file, 96, 96));
    } catch { setError("That file couldn't be read as an image."); }
  };
  useEffect(() => {
    if (!source) return;
    const width = source.width * factor, height = source.height * factor;
    const timer = setTimeout(() => setResults(METHODS.map(({ id }) => {
      const start = performance.now();
      const img = scale(source, width, height, id);
      return { method: id, img, ms: performance.now() - start };
    })), 0);
    return () => clearTimeout(timer);
  }, [source, factor]);

  return <div className="im-panel">
    <div className="gs-controls gs-setup">
      <label>Start from <select value={which} onChange={e => e.target.value !== "upload" && load(e.target.value)}>
        <option value="card">The 24x18 test card</option>
        <option value="board">A close-up of the Pi board</option>
        {which === "upload" && <option value="upload">Your image</option>}
      </select></label>
      <label className="gs-button im-upload">Use your own image<input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) load("upload", file); }} /></label>
      <label>Enlarge <input type="range" min={2} max={8} value={factor} onChange={e => setFactor(Number(e.target.value))} aria-label="Scale factor" /> {factor}x</label>
    </div>
    {error && <p className="demo-notice">{error}</p>}
    {source && <p className="gs-note">Source: {source.width} x {source.height} pixels, enlarged to {source.width * factor} x {source.height * factor}. Uploads are shrunk to fit 96 pixels first, so the difference shows.</p>}
    <div className="im-compare">
      {METHODS.map(({ id, name, note }) => {
        const result = results.find(r => r.method === id);
        return <figure key={id}>
          <Picture img={result?.img ?? null} label={`${name} result`} className="im-canvas im-pixelated" />
          <figcaption><strong>{name}</strong>{result && <span>{result.ms.toFixed(0)} ms</span>}<small>{note}</small></figcaption>
        </figure>;
      })}
    </div>
  </div>;
}

interface StitchResult { a: Rgb; b: Rgb; cornersA: Corner[]; cornersB: Corner[]; matches: Match[]; inliers: Set<number>; panorama: Rgb; shift: [number, number]; ms: number }

function Stitching() {
  const [files, setFiles] = useState<[File | null, File | null]>([null, null]);
  const [result, setResult] = useState<StitchResult | null>(null);
  const [status, setStatus] = useState("");

  const run = (pair: [Rgb, Rgb], label: string) => {
    setStatus(`Stitching ${label}…`);
    setTimeout(() => {
      try {
        const start = performance.now();
        const [a, b] = pair;
        const cornersA = harrisCorners(a), cornersB = harrisCorners(b);
        const matches = matchCorners(a, cornersA, b, cornersB);
        const { H, inliers } = estimateHomography(matches);
        const panorama = merge(a, b, H);
        // A homography isn't a pure shift, so report the offset where the photos overlap.
        const [x, y] = [a.width * 0.75, a.height / 2];
        const [u, v] = project(H, x, y);
        setResult({ a, b, cornersA, cornersB, matches, inliers: new Set(inliers), panorama, shift: [x - u, y - v], ms: performance.now() - start });
        setStatus("");
      } catch {
        setResult(null);
        setStatus("Not enough corners matched. The stitcher expects the right part of the first photo to overlap the left part of the second, within 100 pixels vertically.");
      }
    }, 30);
  };
  const runFiles = async (next: [File | null, File | null]) => {
    setFiles(next);
    if (!next[0] || !next[1]) return;
    run([await readImage(next[0], 480, 400), await readImage(next[1], 480, 400)], "your photos");
  };

  const dots = (corners: Corner[], used: Set<string>) => (ctx: CanvasRenderingContext2D) => {
    for (const c of corners) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = used.has(`${c.x},${c.y}`) ? "#e8c547" : "#ffffffcc";
      ctx.strokeStyle = "#1b1710";
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
    }
  };
  const usedA = new Set(result ? [...result.inliers].map(i => `${result.matches[i].a.x},${result.matches[i].a.y}`) : []);
  const usedB = new Set(result ? [...result.inliers].map(i => `${result.matches[i].b.x},${result.matches[i].b.y}`) : []);

  return <div className="im-panel">
    <p className="gs-note">A photo pair of mine is coming. Until then, stitch two overlapping photos of your own, or run the synthetic test pair the parity test uses.</p>
    <div className="gs-controls gs-setup">
      <label className="gs-button im-upload">Left photo{files[0] ? " ✓" : ""}<input type="file" accept="image/*" onChange={e => runFiles([e.target.files?.[0] ?? null, files[1]])} /></label>
      <label className="gs-button im-upload">Right photo{files[1] ? " ✓" : ""}<input type="file" accept="image/*" onChange={e => runFiles([files[0], e.target.files?.[0] ?? null])} /></label>
      <button type="button" className="gs-button" onClick={() => run(testPair(), "the test pair")}>Run the synthetic test pair</button>
    </div>
    {status && <p className="gs-status" aria-live="polite">{status}</p>}
    {result && <>
      <ol className="im-steps">
        <li><strong>{result.cornersA.length} and {result.cornersB.length}</strong> Harris corners found</li>
        <li><strong>{result.matches.length}</strong> pairs matched by comparing 17x17 neighborhoods</li>
        <li><strong>{result.inliers.size}</strong> kept by RANSAC; {result.matches.length - result.inliers.size} rejected as wrong</li>
        <li>Second photo offset by <strong>{result.shift[0].toFixed(1)}, {result.shift[1].toFixed(1)}</strong> px where they overlap; stitched in {result.ms.toFixed(0)} ms</li>
      </ol>
      <div className="im-pair">
        <figure><Picture img={result.a} label="Left photo with its corners" marks={dots(result.cornersA, usedA)} /><figcaption>Left: corners, with the ones RANSAC kept in yellow</figcaption></figure>
        <figure><Picture img={result.b} label="Right photo with its corners" marks={dots(result.cornersB, usedB)} /><figcaption>Right: the matching corners</figcaption></figure>
      </div>
      <figure className="im-panorama"><Picture img={result.panorama} label="Stitched panorama" /><figcaption>The merge: the second photo warped onto the first, averaged where they overlap</figcaption></figure>
    </>}
  </div>;
}

export default function ImagingDemo() {
  const [tab, setTab] = useState<"scale" | "stitch">("scale");
  return <div className="games-suite">
    <div className="gs-tabs" role="tablist" aria-label="Demos">
      <button type="button" role="tab" aria-selected={tab === "scale"} onClick={() => setTab("scale")}>Scaling</button>
      <button type="button" role="tab" aria-selected={tab === "stitch"} onClick={() => setTab("stitch")}>Stitching</button>
    </div>
    <div role="tabpanel">{tab === "scale" ? <Scaling /> : <Stitching />}</div>
  </div>;
}
