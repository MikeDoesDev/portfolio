"use client";

import { useState, type ComponentType } from "react";
import BlackjackTable from "./BlackjackTable";
import BlackjackLab from "./BlackjackLab";
import CrazyEightsTable from "./CrazyEightsTable";
import CrazyEightsLab from "./CrazyEightsLab";

interface SuiteGame { id: string; name: string; origin: string; Table: ComponentType; lab: { title: string; intro: string; Lab: ComponentType } }

/** Every game in the suite. Adding a game means adding an entry here. */
const GAMES: SuiteGame[] = [
  {
    id: "blackjack", name: "Blackjack", origin: "First written in Python for ENGR 102, fall 2024.", Table: BlackjackTable,
    lab: {
      title: "How much does strategy matter?",
      intro: "Each run plays a million hands per strategy from freshly shuffled shoes and compares the average loss with the house edge published for the same rules.",
      Lab: BlackjackLab,
    },
  },
  {
    id: "crazy-8s", name: "Crazy 8s", origin: "First written in C++ for CSCE 120, fall 2025.", Table: CrazyEightsTable,
    lab: {
      title: "Does the smarter AI play better?",
      intro: "Each run plays 10,000 two-player games per matchup, alternating who goes first, and reports how often the first AI named wins.",
      Lab: CrazyEightsLab,
    },
  },
];

export default function GamesSuite() {
  const [active, setActive] = useState(GAMES[0].id);
  const game = GAMES.find(entry => entry.id === active)!;
  return <div className="games-suite">
    <div className="gs-tabs" role="tablist" aria-label="Games">
      {GAMES.map(entry => <button key={entry.id} type="button" role="tab" id={`tab-${entry.id}`} aria-selected={entry.id === active} aria-controls={`panel-${entry.id}`} onClick={() => setActive(entry.id)}>{entry.name}</button>)}
    </div>
    <div role="tabpanel" id={`panel-${game.id}`} aria-labelledby={`tab-${game.id}`} key={game.id}>
      <p className="gs-origin">{game.origin}</p>
      <game.Table />
      <div className="gs-lab">
        <h3>{game.lab.title}</h3>
        <p>{game.lab.intro}</p>
        <game.lab.Lab />
      </div>
    </div>
  </div>;
}
