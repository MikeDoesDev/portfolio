"use client";

import { useState } from "react";

type Place = { name: string; note?: string; kind: string; now?: boolean };
type Pin = { x: number; y: number; kind: string; now: boolean; places: number[] };
type Group = { kind: string; title: string };

// Magic UI's DottedMap look: a staggered dot world with round markers that
// pulse. Pins and the place lists share one hover state, so pointing at
// either lights up both. Pin x/y are in viewBox units.
export default function TravelMapView({ dots, width, height, dotRadius, pins, places, groups }: {
  dots: string; width: number; height: number; dotRadius: number; pins: Pin[]; places: Place[]; groups: Group[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const hover = (pin: number) => ({
    onMouseEnter: () => setActive(pin),
    onMouseLeave: () => setActive(current => (current === pin ? null : current)),
  });
  const pinOf = (place: number) => pins.findIndex(pin => pin.places.includes(place));
  const tip = active === null ? undefined : pins[active];
  const tipX = tip ? (tip.x / width) * 100 : 0;
  const list = (kind: string) => places.map((place, i) => place.kind === kind &&
    <li key={place.name} data-active={(active !== null && active === pinOf(i)) || undefined} {...hover(pinOf(i))}>
      {place.now && <Key kind={place.kind} now />}{place.name}{place.note && <small>{place.note}</small>}
    </li>);

  return <figure className="travel-map">
    <div className="travel-map-field" style={{ aspectRatio: width / height }}>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <path d={dots} strokeWidth={dotRadius * 2} />
        {pins.map((pin, i) => <g key={`${pin.x},${pin.y}`} className="travel-pin" data-kind={pin.kind} data-now={pin.now || undefined}
          data-active={active === i || undefined} {...hover(i)}>
          {active === i && <Pulse x={pin.x} y={pin.y} />}
          <circle className="travel-pin-hit" cx={pin.x} cy={pin.y} r={1.1} />
          <circle className="travel-pin-dot" cx={pin.x} cy={pin.y} r={radius(pin.kind)} />
        </g>)}
      </svg>
      {tip && <div className="travel-tip" data-align={tipX < 20 ? "start" : tipX > 80 ? "end" : undefined}
        style={{ left: `${tipX}%`, top: `${(tip.y / height) * 100}%` }}>
        {tip.places.map(i => <span key={i}>{places[i].name}{places[i].note && <small>{places[i].note}</small>}</span>)}
      </div>}
    </div>
    <figcaption className="travel-lists">
      {groups.map(({ kind, title }) => <div key={kind} data-group={kind}>
        <h3><Key kind={kind} />{title}</h3><ul>{list(kind)}</ul>
      </div>)}
    </figcaption>
  </figure>;
}

const radius = (kind: string) => (kind === "lived" ? 0.8 : 0.6);

// Legend swatch, drawn with the pins' own classes so the two always match.
function Key({ kind, now }: { kind: string; now?: boolean }) {
  return <svg className="travel-key" viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true">
    <g className="travel-pin" data-kind={kind} data-now={now || undefined}><circle className="travel-pin-dot" r={radius(kind)} /></g>
  </svg>;
}

// DottedMap's pulse: two rings swelling out of the marker, half a beat apart.
function Pulse({ x, y }: { x: number; y: number }) {
  return <g className="travel-pulse">{["0s", "0.7s"].map(begin => <circle key={begin} cx={x} cy={y} r={0.8} fill="none" strokeWidth={0.3}>
    <animate attributeName="r" values="0.8;2.4" dur="1.4s" begin={begin} repeatCount="indefinite" />
    <animate attributeName="opacity" values="1;0" dur="1.4s" begin={begin} repeatCount="indefinite" />
  </circle>)}</g>;
}
