"use client";

import { useEffect, useRef, useState } from "react";
import { AIS, Matchup, type Ai } from "@/lib/demo/games/crazy8s";
import LabChart from "./LabChart";

const GAMES = 10_000;
const BATCH = 250;
const PAIRS: [Ai, Ai][] = [["smart", "original"], ["original", "random"], ["smart", "random"]];
const name = (ai: Ai) => AIS.find(entry => entry.id === ai)!.name;

export default function CrazyEightsLab() {
  const [matchups, setMatchups] = useState<Matchup[] | null>(null);
  const [, redraw] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const run = () => {
    clearTimeout(timer.current);
    const seed = Date.now() >>> 0;
    const list = PAIRS.map(([a, b], i) => new Matchup(a, b, seed + i * 7919));
    setMatchups(list);
    const tick = () => {
      for (const matchup of list) matchup.run(BATCH);
      redraw(n => n + 1);
      if (list[0].games < GAMES) timer.current = setTimeout(tick, 0);
    };
    timer.current = setTimeout(tick, 0);
  };
  const done = matchups?.[0].games ?? 0;
  const running = !!matchups && done < GAMES;

  return <div className="lab">
    <div className="gs-controls">
      <button type="button" className="gs-button gs-primary" onClick={run} disabled={running}>{running ? "Running…" : matchups ? "Run again" : `Play ${GAMES.toLocaleString()} games per matchup`}</button>
      {matchups && <span className="lab-progress"><progress value={done} max={GAMES} /> {done.toLocaleString()} games each</span>}
    </div>
    <LabChart
      caption="Share of two-player games won by the first AI named"
      max={100}
      legend="50%, an even match"
      rows={PAIRS.map(([a, b], i) => {
        const matchup = matchups?.[i];
        const value = matchup && matchup.games ? matchup.aRate * 100 : null;
        const margin = matchup && matchup.games ? matchup.margin * 100 : 0;
        return {
          label: `${name(a)} vs ${name(b)}`, value, margin, reference: 50,
          text: value === null ? "" : `${value.toFixed(1)}% ± ${margin.toFixed(1)}`,
          note: matchup && matchup.draws ? `${matchup.draws} drawn` : "",
        };
      })}
    />
  </div>;
}
