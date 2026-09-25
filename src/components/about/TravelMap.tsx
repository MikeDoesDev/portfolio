import { createMap } from "svg-dotted-map";
import TravelMapView from "./TravelMapView";

type Place = { name: string; note?: string; kind: string; now?: boolean; lat: number; lng: number };
type Group = { kind: string; title: string };

// Magic UI's DottedMap defaults, with the height taken from svg-dotted-map's
// Web Mercator world (lat -56..71, lng -179..179) so the map isn't stretched.
const mercator = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const WIDTH = 150;
const HEIGHT = +(WIDTH / (((358 * Math.PI) / 180) / (mercator(71) - mercator(-56)))).toFixed(2);
const DOT_RADIUS = 0.2;

// A server component, so svg-dotted-map and its outlines never ship to the
// browser: only one prebuilt dot path and the pin positions do.
export default function TravelMap({ places, groups }: { places: Place[]; groups: Group[] }) {
  const { points, addMarkers } = createMap({ width: WIDTH, height: HEIGHT, mapSamples: 5000 });
  // Read the grid spacing off the points, as DottedMap does, then nudge every
  // other row half a step for its staggered look.
  const sorted = [...points].sort((a, b) => a.y - b.y || a.x - b.x);
  let xStep = Infinity;
  let yStep = Infinity;
  for (let i = 1; i < sorted.length; i++) {
    const [a, b] = [sorted[i - 1], sorted[i]];
    if (b.y === a.y) xStep = Math.min(xStep, b.x - a.x);
    else yStep = Math.min(yStep, b.y - a.y);
  }
  const shift = (y: number) => (Math.round((y - sorted[0].y) / yStep) % 2 ? xStep / 2 : 0);
  const dots = sorted.map(p => `M${(p.x + shift(p.y)).toFixed(1)} ${p.y.toFixed(1)}h0`).join("");
  // Places that land on the same dot share one pin, drawn as the highest
  // ranked kind among them, and in maroon if any of them is home now.
  const rank = (kind: string) => groups.findIndex(group => group.kind === kind);
  const pins: { x: number; y: number; kind: string; now: boolean; places: number[] }[] = [];
  addMarkers(places).forEach(({ x, y }, i) => {
    const [px, py] = [+(x + shift(y)).toFixed(2), +y.toFixed(2)];
    let pin = pins.find(p => p.x === px && p.y === py);
    if (!pin) pins.push(pin = { x: px, y: py, kind: places[i].kind, now: false, places: [] });
    pin.places.push(i);
    if (rank(places[i].kind) < rank(pin.kind)) pin.kind = places[i].kind;
    if (places[i].now) pin.now = true;
  });
  return <TravelMapView dots={dots} width={WIDTH} height={HEIGHT} dotRadius={DOT_RADIUS} pins={pins} groups={groups}
    places={places.map(({ name, note, kind, now }) => ({ name, note, kind, now }))} />;
}
