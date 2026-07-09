// TypeScript port of the Python scoring engine at
// "C:\Users\micha\MDD\schedule builder\engine\{combos.py,scoring.py}".
// The Python engine is ground truth; behavior (including arithmetic order)
// is replicated exactly. Verified by parity.test.ts against outputs dumped
// from the real Python engine.

import type {
  DemoData,
  GradeEntry,
  Prefs,
  RmpEntry,
  ScheduleResult,
  Section,
  SectionScore,
} from "./types";

const DAY_SET = new Set(["M", "T", "W", "R", "F", "S", "U"]);

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

/** Intersection of a day-letter string with the valid day set. */
function dayLetters(days: string | undefined): Set<string> {
  const out = new Set<string>();
  for (const ch of days ?? "") {
    if (DAY_SET.has(ch)) out.add(ch);
  }
  return out;
}

function setsIntersect(a: Set<string>, b: Set<string>): boolean {
  for (const x of a) if (b.has(x)) return true;
  return false;
}

/**
 * True if sections a and b share a day with overlapping times.
 * Online/async sections (meetings: []) never conflict. Overlap is a strict
 * interval intersection: back-to-back meetings are NOT a conflict.
 * (Port of combos.conflicts.)
 */
export function conflicts(a: Section, b: Section): boolean {
  const meetingsA = a.meetings ?? [];
  const meetingsB = b.meetings ?? [];
  if (meetingsA.length === 0 || meetingsB.length === 0) return false;

  for (const ma of meetingsA) {
    const daysA = dayLetters(ma.days);
    if (daysA.size === 0) continue;
    const startA = toMinutes(ma.start);
    const endA = toMinutes(ma.end);
    for (const mb of meetingsB) {
      const daysB = dayLetters(mb.days);
      if (!setsIntersect(daysA, daysB)) continue;
      const startB = toMinutes(mb.start);
      const endB = toMinutes(mb.end);
      // Strict overlap only; touching endpoints (back-to-back) is fine.
      if (startA < endB && startB < endA) return true;
    }
  }
  return false;
}

/**
 * Generate conflict-free combinations, one section per course, in the same
 * backtracking order as the Python engine (course key order, then section
 * list order). Returns at most `limit` combos. (Port of combos.generate.)
 */
export function generate(
  sectionsByCourse: Record<string, Section[]>,
  limit: number = 200,
): Section[][] {
  const courses = Object.keys(sectionsByCourse);
  if (courses.length === 0 || limit <= 0) return [];

  const results: Section[][] = [];

  function backtrack(idx: number, chosen: Section[]): boolean {
    // Returns true if the caller should stop (limit reached).
    if (results.length >= limit) return true;
    if (idx === courses.length) {
      results.push([...chosen]);
      return results.length >= limit;
    }
    const course = courses[idx];
    for (const section of sectionsByCourse[course]) {
      if (chosen.some((picked) => conflicts(section, picked))) continue;
      chosen.push(section);
      const stop = backtrack(idx + 1, chosen);
      chosen.pop();
      if (stop) return true;
    }
    return false;
  }

  backtrack(0, []);
  return results;
}

/**
 * Fraction (0-1) of a section's meeting minutes inside the preferred
 * [earliest, latest) window, halved on days the user wants off, averaged
 * per meeting (each meeting weighted equally). Online sections score 1.0.
 * (Port of scoring._time_fit.)
 */
function timeFit(section: Section, prefs: Prefs): number {
  const meetings = section.meetings ?? [];
  if (meetings.length === 0) return 1.0;

  const timeCfg = prefs.time ?? ({} as Prefs["time"]);
  const earliest = toMinutes(timeCfg.earliest ?? "00:00");
  const latest = toMinutes(timeCfg.latest ?? "24:00");
  const daysOff = new Set(
    (timeCfg.days_off ?? []).filter((d) => DAY_SET.has(d)),
  );

  const contributions: number[] = [];
  for (const m of meetings) {
    const start = toMinutes(m.start);
    const end = toMinutes(m.end);
    const duration = end - start;
    if (duration <= 0) {
      contributions.push(1.0);
      continue;
    }
    const overlapStart = Math.max(start, earliest);
    const overlapEnd = Math.min(end, latest);
    const overlap = Math.max(0, overlapEnd - overlapStart);
    let fraction = overlap / duration;

    const meetingDays = dayLetters(m.days);
    if (setsIntersect(meetingDays, daysOff)) fraction *= 0.5;

    contributions.push(fraction);
  }

  if (contributions.length === 0) return 1.0;
  return contributions.reduce((a, b) => a + b, 0) / contributions.length;
}

/**
 * Score a single section 0-1. Missing rmp/gpa data contributes a neutral
 * 0.5 at its configured weight inside the total (NOT excluded, weights NOT
 * renormalized), while `components` still reports null for missing data.
 * (Port of scoring.section_score.)
 */
export function sectionScore(
  section: Section,
  rmp: RmpEntry | null,
  grades: GradeEntry | null,
  prefs: Prefs,
): SectionScore {
  const weights = prefs.weights ?? ({} as Prefs["weights"]);

  let profRating: number | null = null;
  if (rmp != null && rmp.rating != null) {
    profRating = Math.max(0.0, Math.min(1.0, rmp.rating / 5.0));
  }

  let gpa: number | null = null;
  if (grades != null && grades.gpa != null) {
    gpa = Math.max(0.0, Math.min(1.0, grades.gpa / 4.0));
  }

  const fit = timeFit(section, prefs);

  const NEUTRAL = 0.5;
  // Order matches the Python dict insertion order: prof_rating, gpa, time_fit
  // (sum order matters for bit-exact float parity).
  const componentsForTotal: Array<[number, number]> = [
    [profRating ?? NEUTRAL, weights.prof_rating ?? 0.0],
    [gpa ?? NEUTRAL, weights.gpa ?? 0.0],
    [fit, weights.time_fit ?? 0.0],
  ];

  let weightSum = 0;
  for (const [, w] of componentsForTotal) weightSum += w;

  let total: number;
  if (weightSum > 0) {
    let acc = 0;
    for (const [v, w] of componentsForTotal) acc += v * w;
    total = acc / weightSum;
  } else {
    // Degenerate case: all weights 0 -- plain mean of the components with
    // real (non-missing) values, or 0.0 if none. time_fit is always real.
    const realVals = [profRating, gpa, fit].filter(
      (v): v is number => v !== null,
    );
    total =
      realVals.length > 0
        ? realVals.reduce((a, b) => a + b, 0) / realVals.length
        : 0.0;
  }

  total = Math.max(0.0, Math.min(1.0, total));

  return {
    total,
    components: { prof_rating: profRating, gpa, time_fit: fit },
  };
}

/** {day: [(start, end), ...]} for a section's meetings. */
function meetingIntervalsByDay(section: Section): Map<string, Array<[number, number]>> {
  const result = new Map<string, Array<[number, number]>>();
  for (const m of section.meetings ?? []) {
    const start = toMinutes(m.start);
    const end = toMinutes(m.end);
    for (const day of dayLetters(m.days)) {
      let list = result.get(day);
      if (!list) {
        list = [];
        result.set(day, list);
      }
      list.push([start, end]);
    }
  }
  return result;
}

/**
 * Score a full schedule 0-1: mean of per-section totals, minus a gap
 * penalty (0.02 per same-day gap exceeding max_gap_minutes, capped at 0.2),
 * plus a days-off bonus (+0.05 iff every configured day off is completely
 * free), clamped to [0, 1]. (Port of scoring.schedule_score, adapted to the
 * TS contract: rmp/grades are the flat maps from DemoData, and per-section
 * scores are returned in `sectionScores` alongside the input `sections`.)
 */
export function scheduleScore(
  sections: Section[],
  rmp: DemoData["rmp"],
  grades: DemoData["grades"],
  prefs: Prefs,
): ScheduleResult {
  const professors = rmp ?? {};
  const courses = grades ?? {};

  const sectionScores: SectionScore[] = [];
  for (const section of sections) {
    const key = section.instructor_key;
    const rmpEntry = key != null ? professors[key] ?? null : null;
    const gradeEntry =
      key != null ? (courses[section.course] ?? {})[key] ?? null : null;
    sectionScores.push(sectionScore(section, rmpEntry, gradeEntry, prefs));
  }

  let meanTotal = 0.0;
  if (sectionScores.length > 0) {
    let acc = 0;
    for (const s of sectionScores) acc += s.total;
    meanTotal = acc / sectionScores.length;
  }

  // Gap penalty: gaps between consecutive same-day meetings across the
  // whole schedule.
  const byDay = new Map<string, Array<[number, number]>>();
  for (const section of sections) {
    for (const [day, intervals] of meetingIntervalsByDay(section)) {
      let list = byDay.get(day);
      if (!list) {
        list = [];
        byDay.set(day, list);
      }
      list.push(...intervals);
    }
  }

  const timeCfg = prefs.time ?? ({} as Prefs["time"]);
  const maxGap = timeCfg.max_gap_minutes;
  let gapViolations = 0;
  if (maxGap != null) {
    for (const intervals of byDay.values()) {
      // Python sorts (start, end) tuples lexicographically.
      intervals.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      for (let i = 0; i + 1 < intervals.length; i++) {
        const gap = intervals[i + 1][0] - intervals[i][1];
        if (gap > maxGap) gapViolations += 1;
      }
    }
  }

  const gapPenalty = Math.min(0.2, gapViolations * 0.02);

  // Days-off bonus: every configured day-off must be completely free.
  const daysOff = (timeCfg.days_off ?? []).filter((d) => DAY_SET.has(d));
  const daysOffHonored =
    daysOff.length > 0 && daysOff.every((d) => (byDay.get(d) ?? []).length === 0);
  const daysOffBonus = daysOffHonored ? 0.05 : 0.0;

  let total = meanTotal - gapPenalty + daysOffBonus;
  total = Math.max(0.0, Math.min(1.0, total));

  return {
    total,
    sections,
    sectionScores,
    schedule_factors: {
      mean_section_total: meanTotal,
      gap_violations: gapViolations,
      gap_penalty: gapPenalty,
      days_off_honored: daysOffHonored ? 1 : 0,
      days_off_bonus: daysOffBonus,
    },
  };
}

/**
 * Generate conflict-free schedules from the demo data, score each, and
 * return them sorted descending by total (stable: ties keep generation
 * order, matching Python's stable sorted(..., reverse=True)).
 */
export function rankSchedules(
  data: DemoData,
  prefs: Prefs,
  limit: number = 200,
): ScheduleResult[] {
  const combos = generate(data.sectionsByCourse, limit);
  const scored = combos.map((sections) =>
    scheduleScore(sections, data.rmp, data.grades, prefs),
  );
  // Array.prototype.sort is stable; descending by total preserves
  // generation order among equal totals, same as Python's stable
  // sorted(..., key=total, reverse=True).
  return scored.slice().sort((a, b) => b.total - a.total);
}
