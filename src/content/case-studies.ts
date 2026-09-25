import type { Project } from "./projects";
export interface CaseStudy { role: string; sections: { heading: string; paragraphs: string[] }[] }
export const CASE_STUDIES: Record<Project["slug"], CaseStudy> = {
  "single-cycle-processor": {
    role: "For ECEN 350, I completed the control logic and datapath integration of a course-provided processor scaffold, then extended it with MOVZ.",
    sections: [
      { heading: "From instruction to result", paragraphs: ["The Verilog design implements a subset of the educational LEGv8 instruction set: LDUR, STUR, ADD, SUB, AND, ORR, ADDI, SUBI, CBZ, B, and MOVZ. The control unit selects the register, ALU, memory, and program-counter paths for each instruction.", "The instruction memory, data memory, and original processor testbench came from the course scaffold. My work combined the lab modules, completed the control and top-level wiring, and extended the instruction handling."] },
      { heading: "Adding MOVZ", paragraphs: ["MOVZ places a 16-bit immediate into one of four positions in a 64-bit value. I widened SignOp from two to three bits and added a zero-extension mode with a shift selected by the instruction’s hw field.", "The extension reuses the ALU’s pass-B operation and the existing ALUSrc path. The test program combines four MOVZ results with ORR, stores 0x123456789abcdef0, and loads it back."] },
      { heading: "What the simulation verifies", paragraphs: ["A fresh Icarus Verilog run on September 23, 2026 passed both test programs, and the control unit's own testbench passed all 64 of its checks. The explorer above replays that run: 79 clock cycles, from the counting loop to the MOVZ program's final load of 0x123456789abcdef0 at PC 0x54.", "A separate TypeScript model recomputes every recorded immediate, ALU result, memory read, writeback and next PC from the decoded instructions. All 1,104 comparisons agree with the simulation.", "These are directed tests, not exhaustive verification. The design includes simulation-only timing, including a delayed data-memory clock, and it has not been synthesized or run on an FPGA."] },
    ],
  },
  "image-processing": {
    role: "For a C++ course, I wrote image scaling with bicubic interpolation, and the matching and merging half of a panorama stitcher. The demos above run a TypeScript port that reproduces the C++ output byte for byte.",
    sections: [
      { heading: "Scaling", paragraphs: ["My scaler maps every output pixel back into the source image and blends the surrounding 4x4 neighborhood with bicubic interpolation: four horizontal passes, then one vertical. The comparison shows why that matters. Nearest neighbor copies blocks, bilinear softens edges, and bicubic keeps curves smoother."] },
      { heading: "Stitching", paragraphs: ["The stitcher finds Harris corners in two overlapping photos, matches them by comparing 17x17 pixel neighborhoods, estimates a homography, and warps the second photo onto the first. I wrote the neighborhood matching, the coordinate mapping, and the merge; corner detection and the homography came with the course.", "For this showcase, those two course pieces were reimplemented so the project builds on its own, and the homography gained RANSAC. On the test pair, the greedy matcher still pairs three wrong corners, and RANSAC rejects all three."] },
      { heading: "How it's checked", paragraphs: ["The C++ builds and runs on synthetic test images. The browser port is tested against it: the enlarged test card and the stitched test panorama match the C++ output byte for byte. The original course code stays private.", "A pair of my own photos will replace the test pair here."] },
    ],
  },
  games: {
    role: "I wrote Blackjack in Python for ENGR 102 and Crazy 8s in C++ for CSCE 120. This suite rebuilds both for the browser and adds simulations that measure how well different strategies play.",
    sections: [
      { heading: "Then and now", paragraphs: ["My first Blackjack, from fall 2024, was a terminal program with real bugs. The dealer drew before I had acted, the face-down card showed once the dealer held three cards, and one hand could report two different results. The rebuild follows casino rules: the dealer plays after you, doubling and splitting work, and each hand settles once.", "The Crazy 8s AI from CSCE 120 played the first legal card in its hand, and an 8 kept its own suit. That AI is still here as an opponent. The suite adds a smarter one that saves 8s and steers play toward the suit it holds most of, plus a random baseline."] },
      { heading: "Checking the numbers", paragraphs: ["The Blackjack simulator uses Atlantic City style rules: eight decks, the dealer stands on soft 17, and doubling after a split is allowed. A million hands per strategy lands close to the house edges the Wizard of Odds publishes for those rules: about 0.43% for basic strategy, 3.91% for never busting, and 5.48% for mimicking the dealer.", "An automated test suite covers hand totals, the soft-17 rule, naturals, doubling, split aces, the basic-strategy chart, the Crazy 8s rules, and card conservation. It fails if a strategy drifts from its published figure."] },
      { heading: "Scope", paragraphs: ["The class versions stay private as course work. The browser versions are separate rebuilds, and the suite is set up so more games can be added."] },
    ],
  },
  "schedule-optimizer": {
    role: "I built the data pipeline, scoring engine, and interface to compare my options before registering for classes.",
    sections: [
      { heading: "Why I made it", paragraphs: ["Picking classes meant checking professor ratings, grade distributions, open seats, and time conflicts in different places. I wanted to compare the combinations together.", "The Python and Flask application combines Texas A&M course sections with RateMyProfessors ratings and anex.us grade history. My September 2026 resume records a catalog of more than 21,600 sections. The browser demo above uses a small sample dataset, not current registration data."] },
      { heading: "The decisions behind the ranking", paragraphs: ["The engine generates conflict-free combinations and scores them against weighted preferences. Professor quality, grade history, and time fit can matter differently to each student.", "Instructor names are not consistent across sources. Matching carries a confidence score, with low-confidence matches surfaced for review. Missing ratings use an explicit fallback rather than pretending a missing value is a real measurement."] },
      { heading: "What I checked", paragraphs: ["The browser scoring engine is checked against recorded outputs from the Python implementation. The parity test covers different weights, time windows, and a zero-weight case.", "This demo does not sign into Howdy, fetch live seats, or register anyone. Its purpose is to let you explore how changing preferences changes the ranking."] },
    ],
  },
  "raspberry-pi-3d": {
    role: "I built an interactive board model to study what each component does and how it fits into a single-board computer.",
    sections: [
      { heading: "Learning by modeling", paragraphs: ["The board is constructed from procedural Three.js geometry. Components have inspectable panels describing their functions and specifications. There are 23 selectable components, including the processor, memory, connectors, and power circuitry.", "Dragging rotates the board. Clicking a component opens its explanation. Blueprint mode switches the materials to a wireframe presentation."] },
      { heading: "Scope of the model", paragraphs: ["This is an educational visualization, not a manufacturing model or an electrical simulation. The geometry helps explain placement and scale; it should not be used to design a PCB or validate a circuit.", "Rendering depends on the device and browser. The demo loads Three.js from a CDN and needs WebGL and a network connection."] },
      { heading: "What I’d explore next", paragraphs: ["An exploded view could make the component layout easier to study. I’d also like to show selected signal paths, with references for each connection rather than implying that decorative traces are electrically accurate."] },
    ],
  },
  alfred: {
    role: "I’m building a personal dashboard for the calendar, email, habits, and chat I use during the day. It currently runs locally.",
    sections: [
      { heading: "What I’m bringing together", paragraphs: ["The dashboard has views for my schedule, inbox, habits, Claude chat, and notes. The goal is to make those things available together without switching between several applications.", "The implementation uses Next.js API routes for Claude, Google Calendar, and Gmail. Calendar access supports reading and writing events; inbox access is read-only. Habits currently use local storage."] },
      { heading: "Chat with context", paragraphs: ["The chat streams responses from the Claude API and includes personal context with each request. That context helps it answer questions about my plans.", "Chat-driven actions are separate from answering questions. Tool use that lets the assistant create an event from a conversation remains planned work; I don’t present it as an existing capability."] },
      { heading: "Still in progress", paragraphs: ["I’m working toward more durable habit storage and clearer connections between chat and the other tools. The architecture diagram describes the intended integration boundaries. There is no public, signed-in demo on this portfolio."] },
    ],
  },
  wit: {
    role: "I designed and built a browser prototype to explore scheduled habits, streaks, and progress through a small game system.",
    sections: [
      { heading: "A rest day should count differently", paragraphs: ["A habit scheduled three times a week shouldn’t break a streak on an unscheduled day. WIT evaluates daily habits, weekly quotas, and weekday patterns separately.", "Completing habits earns XP. Streak protection can absorb some misses, and progress is grouped into Physical, Mental, Spiritual, and Rest. The prototype makes these rules visible so I can try them and adjust them."] },
      { heading: "Keeping the prototype simple", paragraphs: ["The interface uses HTML, CSS, and JavaScript, with data stored in the current browser. The scoring rules live in a separate logic module.", "The demo starts with seeded example history. Its activity charts show sample data, not measured product adoption or my personal record. Clearing browser storage clears local changes."] },
      { heading: "What remains", paragraphs: ["This is a working prototype, not a released mobile app. Sync, account storage, and a mobile implementation are future work. I want to learn more from using the habit rules before expanding the infrastructure."] },
    ],
  },
  "gladiator-dash": {
    role: "I explored the requirements and architecture for an RFID timing system for One Army’s charity race. The project is paused; the hardware has not been validated at a race.",
    sections: [
      { heading: "Why race timing", paragraphs: ["Gladiator Dash helps fund One Army’s support for Still Creek Ranch. I wanted to explore whether owning the timing could give runners more useful results and give the organization more control over the event.", "This page describes proposed engineering work. It does not claim a completed system, achieved savings, or a proven runner capacity."] },
      { heading: "The proposed system", paragraphs: ["The design considers an industrial RFID reader, antenna read zones, and a Raspberry Pi. Read events would be filtered and stored locally before being used to calculate times and display a leaderboard.", "Local storage would allow collection to continue without an internet connection. Cloud backup would be secondary to recording the reads at the event."] },
      { heading: "What needs to be tested", paragraphs: ["Read reliability with wet tags, runners close together, duplicate reads, antenna placement, and reliable power all need physical tests. Event attendance is not the same as tested system capacity.", "The next useful step would be a small pilot with hardware and measured read accuracy. A pilot would give me a basis for comparing reliability and cost with existing timing services."] },
    ],
  },
};
