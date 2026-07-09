// Shared contract for the in-browser schedule-ranking demo.
// Shapes mirror "C:\Users\micha\MDD\schedule builder\CONTRACT.md" — the
// Python engine is ground truth; do not deviate from its behavior.

export interface Meeting {
  /** Day letters: M T W R F S U (R = Thursday), e.g. "MWF". */
  days: string;
  /** 24h "HH:MM". */
  start: string;
  end: string;
  location?: string;
  type?: string;
}

export interface Section {
  course: string; // "<DEPT> <NUMBER>"
  title: string;
  section: string;
  crn: string;
  instructor: string;
  instructor_key: string | null;
  /** Online/async sections have meetings: []. */
  meetings: Meeting[];
  seats_open: number | null;
  seats_total: number | null;
}

export interface RmpEntry {
  rating: number | null; // 0-5
  difficulty: number | null;
  would_take_again: number | null;
  num_ratings: number;
  match_confidence: number; // 0-1
}

export interface GradeEntry {
  gpa: number | null; // 0-4, enrollment-weighted
  pct_a: number | null;
  pct_drop: number | null;
  semesters: number;
  total_students: number;
}

export interface Prefs {
  /** Weights need not sum to 1; the engine normalizes. */
  weights: { prof_rating: number; gpa: number; time_fit: number };
  time: {
    earliest: string; // classes before this are penalized
    latest: string; // classes after this are penalized
    days_off: string[]; // bonus if kept free
    max_gap_minutes: number; // gaps beyond this are penalized
  };
}

export interface SectionScore {
  total: number; // 0-1
  /** Missing data contributes a neutral 0.5 at configured weight, but the
   *  component reports null so the UI can label it "no data". */
  components: { prof_rating: number | null; gpa: number | null; time_fit: number };
}

export interface ScheduleResult {
  total: number; // 0-1
  sections: Section[];
  sectionScores: SectionScore[];
  schedule_factors: Record<string, number>;
}

export interface DemoData {
  term: string;
  sectionsByCourse: Record<string, Section[]>;
  rmp: Record<string, RmpEntry>;
  grades: Record<string, Record<string, GradeEntry>>; // course -> instructor_key -> entry
}

export const DEFAULT_PREFS: Prefs = {
  weights: { prof_rating: 0.4, gpa: 0.4, time_fit: 0.2 },
  time: { earliest: "09:00", latest: "17:00", days_off: ["F"], max_gap_minutes: 120 },
};

/** Implemented in engine.ts (Agent E):
 *  conflicts(a: Section, b: Section): boolean
 *  generate(sectionsByCourse: Record<string, Section[]>, limit?: number): Section[][]
 *  sectionScore(section: Section, rmp: RmpEntry | null, grades: GradeEntry | null, prefs: Prefs): SectionScore
 *  scheduleScore(sections: Section[], rmp: DemoData["rmp"], grades: DemoData["grades"], prefs: Prefs): ScheduleResult
 *  rankSchedules(data: DemoData, prefs: Prefs, limit?: number): ScheduleResult[]  // sorted desc by total
 */
