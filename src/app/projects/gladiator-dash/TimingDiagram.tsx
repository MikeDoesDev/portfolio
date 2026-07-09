"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Lightly animated system diagram for the RFID timing pod.
 *
 * Top: the course line with START and FINISH antenna read zones and a copper
 * runner dot looping along it. When the runner crosses a read zone, a pulse
 * ring fires at the antenna and a "read event" dot drops into the pipeline
 * strip below (reader → time-gating → SQLite → leaderboard).
 *
 * All animations share one 9s cycle. With prefers-reduced-motion the diagram
 * renders fully static.
 */

const CYCLE = 9;

// Course geometry
const COURSE_Y = 110;
const START_X = 170;
const FINISH_X = 550;
const RUN_FROM = 70;
const RUN_TO = 650;
const RUN_DURATION = 6;

// Pipeline geometry
const BOX_Y = 262;
const BOX_H = 44;
const BOX_W = 130;
const PIPE_Y = BOX_Y + BOX_H / 2;
const STAGES = [
  { x: 60, label: "RFID READER" },
  { x: 215, label: "TIME-GATING" },
  { x: 370, label: "SQLITE" },
  { x: 525, label: "LEADERBOARD" },
];
const READER_CX = STAGES[0].x + BOX_W / 2;

// The runner covers RUN_TO - RUN_FROM px in RUN_DURATION s; derive the moment
// it crosses each read zone so pulses and read events stay in sync with it.
const speed = (RUN_TO - RUN_FROM) / RUN_DURATION;
const T_START = (START_X - RUN_FROM) / speed; // ≈ 1.0s
const T_FINISH = (FINISH_X - RUN_FROM) / speed; // ≈ 5.0s

function Antenna({ x, label }: { x: number; label: string }) {
  return (
    <g>
      <text
        x={x}
        y={46}
        textAnchor="middle"
        className="fill-copper font-mono"
        fontSize={11}
        letterSpacing="0.14em"
      >
        {label}
      </text>
      {/* antenna panel + mast down to its read zone */}
      <rect x={x - 11} y={56} width={22} height={11} rx={2} className="fill-raised stroke-copper" strokeOpacity={0.6} />
      <line x1={x} y1={67} x2={x} y2={88} className="stroke-copper" strokeOpacity={0.4} />
      {/* circular-polarized read zone on the course */}
      <ellipse cx={x} cy={COURSE_Y} rx={46} ry={20} className="fill-copper stroke-copper" fillOpacity={0.07} strokeOpacity={0.35} strokeDasharray="3 4" />
    </g>
  );
}

function PulseRing({ x, delay }: { x: number; delay: number }) {
  return (
    <motion.circle
      cx={x}
      cy={COURSE_Y}
      className="stroke-copper-bright"
      fill="none"
      strokeWidth={1.5}
      initial={{ r: 6, opacity: 0 }}
      animate={{ r: [6, 30], opacity: [0.7, 0] }}
      transition={{ duration: 1, delay, ease: "easeOut", repeat: Infinity, repeatDelay: CYCLE - 1 }}
    />
  );
}

function ReadEvent({ fromX, delay }: { fromX: number; delay: number }) {
  return (
    <motion.circle
      r={3.5}
      className="fill-signal"
      initial={{ x: fromX, y: COURSE_Y + 10, opacity: 0 }}
      animate={{
        x: [fromX, READER_CX],
        y: [COURSE_Y + 10, BOX_Y - 6],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 1.1,
        delay,
        ease: "easeIn",
        repeat: Infinity,
        repeatDelay: CYCLE - 1.1,
        opacity: { times: [0, 0.15, 0.85, 1], duration: 1.1, delay, repeat: Infinity, repeatDelay: CYCLE - 1.1 },
      }}
    />
  );
}

function PipelinePulse({ delay }: { delay: number }) {
  return (
    <motion.circle
      cy={PIPE_Y}
      r={3.5}
      className="fill-signal"
      initial={{ x: READER_CX, opacity: 0 }}
      animate={{ x: [READER_CX, STAGES[3].x + BOX_W / 2], opacity: [0, 0.9, 0.9, 0] }}
      transition={{
        duration: 1.6,
        delay,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: CYCLE - 1.6,
        opacity: { times: [0, 0.1, 0.9, 1], duration: 1.6, delay, repeat: Infinity, repeatDelay: CYCLE - 1.6 },
      }}
    />
  );
}

export default function TimingDiagram() {
  const reduced = useReducedMotion();

  return (
    <svg
      viewBox="0 0 720 360"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="System diagram: a runner crosses start and finish RFID read zones; read events flow through reader, time-gating, SQLite, and leaderboard stages."
      className="block bg-ink"
    >
      {/* ---- course ---- */}
      <line x1={40} y1={COURSE_Y} x2={680} y2={COURSE_Y} className="stroke-line" strokeWidth={2} strokeLinecap="round" />
      <Antenna x={START_X} label="START" />
      <Antenna x={FINISH_X} label="FINISH" />

      {/* spacing dimension between the two read zones */}
      <line x1={START_X + 46} y1={146} x2={FINISH_X - 46} y2={146} className="stroke-line" />
      <line x1={START_X + 46} y1={141} x2={START_X + 46} y2={151} className="stroke-line" />
      <line x1={FINISH_X - 46} y1={141} x2={FINISH_X - 46} y2={151} className="stroke-line" />
      <text x={360} y={162} textAnchor="middle" className="fill-muted font-mono" fontSize={10} letterSpacing="0.14em">
        ≈25 FT
      </text>

      {/* ---- runner ---- */}
      {reduced ? (
        <circle cx={(START_X + FINISH_X) / 2} cy={COURSE_Y} r={6} className="fill-copper" />
      ) : (
        <motion.circle
          cy={COURSE_Y}
          r={6}
          className="fill-copper"
          initial={{ x: RUN_FROM, opacity: 0 }}
          animate={{ x: [RUN_FROM, RUN_TO], opacity: [0, 1, 1, 0] }}
          transition={{
            duration: RUN_DURATION,
            ease: "linear",
            repeat: Infinity,
            repeatDelay: CYCLE - RUN_DURATION,
            opacity: {
              times: [0, 0.06, 0.94, 1],
              duration: RUN_DURATION,
              repeat: Infinity,
              repeatDelay: CYCLE - RUN_DURATION,
            },
          }}
        />
      )}

      {/* ---- read pulses + events ---- */}
      {!reduced && (
        <>
          <PulseRing x={START_X} delay={T_START} />
          <PulseRing x={FINISH_X} delay={T_FINISH} />
          <ReadEvent fromX={START_X} delay={T_START + 0.15} />
          <ReadEvent fromX={FINISH_X} delay={T_FINISH + 0.15} />
          <PipelinePulse delay={T_START + 1.35} />
          <PipelinePulse delay={T_FINISH + 1.35} />
        </>
      )}

      {/* ---- pipeline strip ---- */}
      {STAGES.map((stage, i) => (
        <g key={stage.label}>
          <rect x={stage.x} y={BOX_Y} width={BOX_W} height={BOX_H} rx={8} className="fill-surface stroke-line" />
          <text
            x={stage.x + BOX_W / 2}
            y={PIPE_Y + 4}
            textAnchor="middle"
            className="fill-muted font-mono"
            fontSize={10.5}
            letterSpacing="0.1em"
          >
            {stage.label}
          </text>
          {i < STAGES.length - 1 && (
            <line x1={stage.x + BOX_W} y1={PIPE_Y} x2={STAGES[i + 1].x} y2={PIPE_Y} className="stroke-line" strokeWidth={2} />
          )}
        </g>
      ))}
      <text x={360} y={342} textAnchor="middle" className="fill-muted font-mono" fontSize={9.5} letterSpacing="0.14em" opacity={0.7}>
        RASPBERRY PI 4 · ON-SITE PIPELINE · STORE-AND-FORWARD CLOUD BACKUP
      </text>
    </svg>
  );
}
