// Demo dataset converted verbatim from the Python engine's test fixtures at
// "C:\Users\micha\MDD\schedule builder\tests\fixtures\{sections.json,rmp.json,grades.json}".
// Values are preserved exactly; sections are grouped by course code in file
// order (which the parity test relies on for generate()'s combination order).

import type { DemoData } from "./types";

export const DEMO_DATA: DemoData = {
  term: "Test Term",
  sectionsByCourse: {
    "ECEN 350": [
      {
        course: "ECEN 350",
        title: "Computer Architecture",
        section: "501",
        crn: "10001",
        instructor: "Smith, John A.",
        instructor_key: "smith_j",
        meetings: [
          { days: "MWF", start: "09:10", end: "10:00", location: "ZACH 350", type: "Lecture" },
          { days: "T", start: "14:20", end: "17:10", location: "ZACH 105", type: "Lab" },
        ],
        seats_open: 12,
        seats_total: 90,
      },
      {
        course: "ECEN 350",
        title: "Computer Architecture",
        section: "502",
        crn: "10002",
        instructor: "GARCIA M",
        instructor_key: "garcia_m",
        meetings: [
          { days: "TR", start: "11:10", end: "12:25", location: "ZACH 350", type: "Lecture" },
          { days: "W", start: "15:00", end: "17:50", location: "ZACH 105", type: "Lab" },
        ],
        seats_open: 0,
        seats_total: 90,
      },
    ],
    "MATH 308": [
      {
        course: "MATH 308",
        title: "Differential Equations",
        section: "510",
        crn: "20001",
        instructor: "Lee, Anna",
        instructor_key: "lee_a",
        meetings: [
          { days: "MWF", start: "09:10", end: "10:00", location: "BLOC 166", type: "Lecture" },
        ],
        seats_open: 5,
        seats_total: 60,
      },
      {
        course: "MATH 308",
        title: "Differential Equations",
        section: "511",
        crn: "20002",
        instructor: "Lee, Anna",
        instructor_key: "lee_a",
        meetings: [
          { days: "MWF", start: "10:20", end: "11:10", location: "BLOC 166", type: "Lecture" },
        ],
        seats_open: 30,
        seats_total: 60,
      },
      {
        course: "MATH 308",
        title: "Differential Equations",
        section: "512",
        crn: "20003",
        instructor: "NOVAK P",
        instructor_key: "novak_p",
        meetings: [
          { days: "TR", start: "08:00", end: "09:15", location: "BLOC 149", type: "Lecture" },
        ],
        seats_open: 44,
        seats_total: 60,
      },
    ],
    "PHIL 111": [
      {
        course: "PHIL 111",
        title: "Contemporary Moral Issues",
        section: "901",
        crn: "30001",
        instructor: "Brown, Kelly",
        instructor_key: "brown_k",
        meetings: [],
        seats_open: 100,
        seats_total: 200,
      },
      {
        course: "PHIL 111",
        title: "Contemporary Moral Issues",
        section: "502",
        crn: "30002",
        instructor: "Brown, Kelly",
        instructor_key: "brown_k",
        meetings: [
          { days: "TR", start: "11:10", end: "12:25", location: "YMCA 113", type: "Lecture" },
        ],
        seats_open: 8,
        seats_total: 120,
      },
    ],
  },
  rmp: {
    smith_j: {
      rating: 4.2,
      difficulty: 3.1,
      would_take_again: 87.0,
      num_ratings: 45,
      match_confidence: 0.95,
    },
    garcia_m: {
      rating: 2.4,
      difficulty: 4.5,
      would_take_again: 31.0,
      num_ratings: 62,
      match_confidence: 0.9,
    },
    lee_a: {
      rating: 4.8,
      difficulty: 2.2,
      would_take_again: 96.0,
      num_ratings: 120,
      match_confidence: 0.98,
    },
    brown_k: {
      rating: 3.5,
      difficulty: 2.0,
      would_take_again: null,
      num_ratings: 8,
      match_confidence: 0.7,
    },
  },
  grades: {
    "ECEN 350": {
      smith_j: { gpa: 3.12, pct_a: 42.5, pct_drop: 4.1, semesters: 6, total_students: 540 },
      garcia_m: { gpa: 2.41, pct_a: 18.0, pct_drop: 12.3, semesters: 4, total_students: 310 },
    },
    "MATH 308": {
      lee_a: { gpa: 3.45, pct_a: 55.0, pct_drop: 2.0, semesters: 8, total_students: 900 },
      novak_p: { gpa: 2.88, pct_a: 30.0, pct_drop: 6.5, semesters: 3, total_students: 200 },
    },
    "PHIL 111": {
      brown_k: { gpa: 3.71, pct_a: 70.0, pct_drop: 1.2, semesters: 5, total_students: 800 },
    },
  },
};
