"use client";

import { useEffect, useRef, useState } from "react";
import { Simulation, STRATEGIES } from "@/lib/demo/games/blackjack";
import LabChart from "./LabChart";

const HANDS = 1_000_000;
const BATCH = 10_000;

export default function BlackjackLab() {
  const [sims, setSims] = useState<Simulation[] | null>(null);
  const [, redraw] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Play in batches so the page stays responsive and the bars fill in as it runs.
  const run = () => {
    clearTimeout(timer.current);
    const seed = Date.now() >>> 0;
    const list = STRATEGIES.map((strategy, i) => new Simulation(strategy.play, seed + i * 7919));
    setSims(list);
    const tick = () => {
      for (const sim of list) sim.run(BATCH);
      redraw(n => n + 1);
      if (list[0].rounds < HANDS) timer.current = setTimeout(tick, 0);
    };
    timer.current = setTimeout(tick, 0);
  };
  const done = sims?.[0].rounds ?? 0;
  const running = !!sims && done < HANDS;

  return <div className="lab">
    <div className="gs-controls">
      <button type="button" className="gs-button gs-primary" onClick={run} disabled={running}>{running ? "Running…" : sims ? "Run again" : `Play ${HANDS.toLocaleString()} hands per strategy`}</button>
      {sims && <span className="lab-progress"><progress value={done} max={HANDS} /> {done.toLocaleString()} hands each</span>}
    </div>
    <LabChart
      caption="Average loss per hand, as a share of the bet"
      max={7}
      legend="published house edge"
      rows={STRATEGIES.map((strategy, i) => {
        const sim = sims?.[i];
        const value = sim && sim.rounds ? -sim.mean * 100 : null;
        const margin = sim && sim.rounds ? 1.96 * sim.standardError * 100 : 0;
        return {
          label: strategy.name, value, margin, reference: -strategy.published * 100,
          text: value === null ? "" : `${value.toFixed(2)}% ± ${margin.toFixed(2)}`,
          note: `published ${(-strategy.published * 100).toFixed(2)}%`,
        };
      })}
    />
  </div>;
}
