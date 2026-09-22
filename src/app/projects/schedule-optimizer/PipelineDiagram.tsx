/** Inline SVG pipeline diagram for the TAMU Schedule Optimizer case study. Server-safe, token-colored. */

const MONO = "var(--font-mono)";
const INK = "var(--color-ink)";
const SURFACE = "var(--color-surface)";
const RAISED = "var(--color-raised)";
const LINE = "var(--color-line)";
const FG = "var(--color-fg)";
const MUTED = "var(--color-muted)";
const COPPER = "var(--color-copper)";

const STAGES = ["CONFLICT DETECTION", "COMBO GENERATION", "WEIGHTED SCORING"];

export default function PipelineDiagram() {
  return (
    <svg
      viewBox="0 0 840 560"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Pipeline: the public TAMU catalog feed and Aggie Schedule Builder seat counts merge into local JSON, get enriched with RateMyProfessors and anex.us data, flow through a pure scoring engine, and produce ranked schedules whose CRNs go back to registration."
    >
      <defs>
        <marker id="pipe-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 z" fill={COPPER} />
        </marker>
      </defs>

      {/* backdrop + blueprint grid */}
      <rect width="840" height="560" fill={INK} />
      {[112, 224, 336, 448].map((y) => (
        <line key={y} x1="0" y1={y} x2="840" y2={y} stroke="rgba(51,41,31,0.05)" strokeWidth="1" />
      ))}
      {[168, 336, 504, 672].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="560" stroke="rgba(51,41,31,0.05)" strokeWidth="1" />
      ))}

      {/* ── Sources ── */}
      <rect x="60" y="28" width="300" height="62" rx="10" fill={SURFACE} stroke={LINE} />
      <text x="76" y="53" fontFamily={MONO} fontSize="11" letterSpacing="1.5" fill={FG}>
        TAMU PUBLIC CATALOG FEED
      </text>
      <text x="76" y="72" fontFamily={MONO} fontSize="9" fill={MUTED}>
        ~21.7k sections · all majors · no seat counts
      </text>

      <rect x="480" y="28" width="300" height="62" rx="10" fill={SURFACE} stroke={LINE} />
      <text x="496" y="53" fontFamily={MONO} fontSize="11" letterSpacing="1.5" fill={FG}>
        AGGIE SCHEDULE BUILDER
      </text>
      <text x="496" y="72" fontFamily={MONO} fontSize="9" fill={MUTED}>
        my candidate sections · real seat counts
      </text>

      {/* sources → merged json */}
      <line x1="210" y1="90" x2="330" y2="136" stroke={COPPER} strokeWidth="1.5" markerEnd="url(#pipe-arrow)" />
      <line x1="630" y1="90" x2="510" y2="136" stroke={COPPER} strokeWidth="1.5" markerEnd="url(#pipe-arrow)" />
      <text x="420" y="122" fontFamily={MONO} fontSize="9" fill={MUTED} textAnchor="middle">
        overlay by CRN
      </text>

      {/* ── Merged data ── */}
      <rect x="220" y="140" width="400" height="52" rx="10" fill={SURFACE} stroke={LINE} />
      <text x="420" y="163" fontFamily={MONO} fontSize="11" letterSpacing="1.5" fill={COPPER} textAnchor="middle">
        catalog.json + sections.json
      </text>
      <text x="420" y="181" fontFamily={MONO} fontSize="9" fill={MUTED} textAnchor="middle">
        merged section pool
      </text>

      {/* merged → enrichment */}
      <line x1="330" y1="192" x2="230" y2="236" stroke={COPPER} strokeWidth="1.5" markerEnd="url(#pipe-arrow)" />
      <line x1="510" y1="192" x2="610" y2="236" stroke={COPPER} strokeWidth="1.5" markerEnd="url(#pipe-arrow)" />

      {/* ── Enrichment fetchers ── */}
      <rect x="60" y="240" width="300" height="62" rx="10" fill={SURFACE} stroke={LINE} />
      <text x="76" y="265" fontFamily={MONO} fontSize="11" letterSpacing="1.5" fill={FG}>
        RATEMYPROFESSORS
      </text>
      <text x="76" y="284" fontFamily={MONO} fontSize="9" fill={MUTED}>
        GraphQL · ratings · fuzzy name match
      </text>

      <rect x="480" y="240" width="300" height="62" rx="10" fill={SURFACE} stroke={LINE} />
      <text x="496" y="265" fontFamily={MONO} fontSize="11" letterSpacing="1.5" fill={FG}>
        ANEX.US GRADES
      </text>
      <text x="496" y="284" fontFamily={MONO} fontSize="9" fill={MUTED}>
        grade distributions · GPA per prof
      </text>

      {/* enrichment → engine */}
      <line x1="210" y1="302" x2="290" y2="346" stroke={COPPER} strokeWidth="1.5" markerEnd="url(#pipe-arrow)" />
      <line x1="630" y1="302" x2="550" y2="346" stroke={COPPER} strokeWidth="1.5" markerEnd="url(#pipe-arrow)" />
      <text x="420" y="332" fontFamily={MONO} fontSize="9" fill={MUTED} textAnchor="middle">
        rmp.json · grades.json · cached forever
      </text>

      {/* ── Scoring engine ── */}
      <rect x="110" y="350" width="620" height="86" rx="10" fill={SURFACE} stroke={COPPER} />
      <text x="126" y="374" fontFamily={MONO} fontSize="12" letterSpacing="2" fill={COPPER}>
        PURE SCORING ENGINE
      </text>
      <text x="714" y="374" fontFamily={MONO} fontSize="9" fill={MUTED} textAnchor="end">
        offline · fixture-tested
      </text>
      {STAGES.map((stage, i) => (
        <g key={stage}>
          <rect x={126 + i * 202} y="388" width="184" height="32" rx="5" fill={RAISED} stroke={LINE} />
          <text x={218 + i * 202} y="408" fontFamily={MONO} fontSize="10" fill={FG} textAnchor="middle">
            {stage}
          </text>
          {i < 2 && (
            <line
              x1={310 + i * 202}
              y1="404"
              x2={324 + i * 202}
              y2="404"
              stroke={COPPER}
              strokeWidth="1.5"
              markerEnd="url(#pipe-arrow)"
            />
          )}
        </g>
      ))}

      {/* engine → UI */}
      <line x1="420" y1="436" x2="420" y2="476" stroke={COPPER} strokeWidth="1.5" markerEnd="url(#pipe-arrow)" />

      {/* ── Ranked UI ── */}
      <rect x="220" y="480" width="400" height="56" rx="10" fill={SURFACE} stroke={LINE} />
      <text x="420" y="503" fontFamily={MONO} fontSize="11" letterSpacing="1.5" fill={FG} textAnchor="middle">
        RANKED SCHEDULES UI
      </text>
      <text x="420" y="522" fontFamily={MONO} fontSize="9" fill={MUTED} textAnchor="middle">
        Flask :5350 · calendar grid · weight sliders
      </text>

      {/* CRNs back to registration */}
      <path
        d="M 624 508 L 800 508 L 800 100 L 784 100"
        fill="none"
        stroke={COPPER}
        strokeWidth="1.5"
        strokeDasharray="5 4"
        markerEnd="url(#pipe-arrow)"
      />
      <text x="795" y="300" fontFamily={MONO} fontSize="9" fill={COPPER} textAnchor="middle" transform="rotate(-90 795 300)">
        winning CRNs → back to registration
      </text>
    </svg>
  );
}
