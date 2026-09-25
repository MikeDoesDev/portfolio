/** Editable site prose. Project copy lives in projects.ts and case-studies.ts. */
export const HOME = {
  greeting: 'Hi I’m Andrew “Michael” Coggins',
  school: "Electrical & Computer Engineering at Texas A&M, Class of 2028",
  introduction: "I build things that make life easier and faster. Lately, that’s meant a class-scheduling tool and an interactive model of a Raspberry Pi. I like figuring out how things work, then making something useful with what I learn.",
  availability: "Looking for a summer 2027 internship",
  workTitle: "Selected work", workNote: "A few things you can explore.",
  ongoingTitle: "On my workbench", ongoingNote: "Working prototypes and a design I’ve set aside.",
  aboutTitle: "A little about me",
  about: "I’m studying Electrical and Computer Engineering with minors in Mathematics and AI in Business. I’m interested in the connection between the software I write and the hardware it runs on.",
  contactTitle: "Have an opportunity in mind?",
  contact: "I’m looking for a summer 2027 internship in software, embedded systems, or hardware. I’d like to hear what you’re working on.",
};
// Newest first. Roles held in one organization share an entry.
export const EXPERIENCE = [
  { role: "Head Business Lead", organization: "Texas A&M Baja SAE", date: "Aug 2026–present", description: "I run the business side of the team: recruitment and operations across accounting, sponsor relations, social media, financing, and operations. I’m the main contact for our project managers and university sponsors, and I pitch companies for the funding and donated materials the team needs." },
  { role: "AI Trainer", organization: "Handshake", date: "Jul 2026–present", description: "A part-time, remote role." },
  { role: "Computer Architecture Study Abroad", organization: "Queen’s University Belfast", date: "Summer 2026", description: "I studied computer architecture and visited AMD in Dublin, where I met with R&D leaders to learn about their compute stack and FPGA-accelerated neural networks." },
  { role: "Class Candidate Advisor", organization: "One Army", date: "May 2026–present", description: "I’m one of eight advisors. I lead a group of seven or eight new members through a semester-long class project: a fundraiser, a service project in Bryan–College Station, and rebuilding one of last year’s Gladiator Dash obstacles. I joined as a general member in September 2025, building obstacles and bringing in local sponsors. Together, we raised a record $185,000 in 2026." },
  { role: "Second Year Counselor", organization: "TAMU Fish Camp", date: "Feb 2026–present", description: "Fish Camp welcomes incoming freshmen to Texas A&M before their first semester. I was a first-year counselor in 2025 and came back as a second-year counselor for 2026." },
  { role: "Member", organization: "IEEE", date: "Aug 2025–present", description: "I go to IEEE seminars, workshops, and industry events, take on small hands-on projects, and meet other electrical engineering students." },
  { role: "Website Developer & Fundraising Manager", organization: "TAMU FORME", date: "May 2025–present", description: "FORME is a freshman leadership organization at Texas A&M. I built and run its website on its own domain, and I plan its fundraising: events, corporate sponsorships, and an online campaign. Reaching out to companies led to several sponsorships." },
  { role: "Private Tennis Instructor", organization: "Self-employed", date: "Summer 2024–present", description: "I built an independent coaching practice from zero to more than 20 active students. Teaching has given me practice breaking a difficult skill into something someone can try." },
  { role: "Tennis Professional", organization: "John Newcombe Tennis Ranch", date: "May–Aug 2024", description: "A summer at a tennis camp in New Braunfels, Texas. As a co-court leader, I worked alongside Division I and semi-pro players to teach campers the fundamentals. As a counselor, I looked after three cabin groups of 25 campers each week and led a group of 60 in tennis and teamwork." },
];
export const ABOUT = {
  title: "A little more about me",
  introduction: "I like seeing things work. That started with LEGO robotics, and it’s still what draws me to engineering.",
  origin: [
    "In intermediate school and junior high, I built LEGO mechanisms that moved when the code ran. At home, I worked alongside my dad on electronics, car batteries, and jetskis.",
    "Then I built my own PC. Installing RAM was the easy part. Working out why it wouldn’t boot after I’d changed something was where I learned the most.",
    "I’m now studying Electrical and Computer Engineering at Texas A&M, with minors in Mathematics and AI in Business. In summer 2026, I studied computer architecture at Queen’s University Belfast and visited AMD in Dublin.",
  ],
  serviceTitle: "One Army and Still Creek Ranch",
  service: [
    "I joined One Army, a service and leadership organization at Texas A&M, in September 2025. Since May 2026, I’ve been one of its eight Class Candidate Advisors. I lead a group of seven or eight new members through their first semester, from a fundraiser and a community service project to rebuilding one of last year’s Gladiator Dash obstacles.",
    "We support Still Creek Ranch, which provides family-style homes for children in crisis. I go on Fridays to spend time with the boys there: basketball, football, cards, and conversation.",
    "Gladiator Dash helps fund that work. In 2026, we raised a record $185,000. It’s also what got me interested in designing an RFID race-timing system, a project I’ve currently set aside.",
  ],
  outsideTitle: ["When I touch", "grass"], // the last word is drawn overgrown with grass
  outside: "I coach tennis, read, and travel when I can. I’ve built my coaching practice to more than 20 active students. At A&M, I also lead the business team for Baja SAE and counsel incoming freshmen at Fish Camp.",
  booksTitle: "On my bookshelf", // the books themselves live in bookshelf.ts
  placesTitle: "Where I’ve lived and traveled",
  // Pins on the About map, in list order. kind is one of placeGroups; `now`
  // marks where I live today, drawn in Aggie maroon. lat/lng in degrees.
  places: [
    { name: "College Station, Texas", note: "Texas A&M, where I study now", kind: "lived", now: true, lat: 30.628, lng: -96.3344 },
    { name: "Columbia, South Carolina", note: "Where I was born", kind: "lived", lat: 34.0007, lng: -81.0348 },
    { name: "Orange County, California", kind: "lived", lat: 33.72, lng: -117.83 },
    { name: "Longview, Texas", kind: "lived", lat: 32.5007, lng: -94.7405 },
    { name: "Sugar Land, Texas", note: "Houston area", kind: "lived", lat: 29.6197, lng: -95.6349 },
    { name: "Kingsport, Tennessee", kind: "lived", lat: 36.5484, lng: -82.5618 },
    { name: "Pisa, Italy", kind: "visited", lat: 43.7228, lng: 10.4017 },
    { name: "Rome, Italy", kind: "visited", lat: 41.9028, lng: 12.4964 },
    { name: "Amalfi Coast, Italy", kind: "visited", lat: 40.634, lng: 14.6027 },
    { name: "Marseille, France", kind: "visited", lat: 43.2965, lng: 5.3698 },
    { name: "Barcelona, Spain", kind: "visited", lat: 41.3874, lng: 2.1686 },
    { name: "Dublin, Ireland", kind: "visited", lat: 53.3498, lng: -6.2603 },
    { name: "Belfast, Northern Ireland", note: "Studied here, summer 2026", kind: "visited", lat: 54.5973, lng: -5.9301 },
    { name: "Edinburgh, Scotland", kind: "visited", lat: 55.9533, lng: -3.1883 },
    { name: "Niagara Falls area, Canada", kind: "visited", lat: 43.0896, lng: -79.0849 },
    { name: "Cancún, Mexico", kind: "visited", lat: 21.1619, lng: -86.8515 },
    { name: "Peru", kind: "wishlist", lat: -9.19, lng: -75.02 },
    { name: "Japan", kind: "wishlist", lat: 36.2, lng: 138.25 },
    { name: "Australia", kind: "wishlist", lat: -25.27, lng: 133.78 },
    { name: "New Zealand", kind: "wishlist", lat: -40.9, lng: 174.89 },
    { name: "Hawaii", kind: "wishlist", lat: 20.8, lng: -156.33 },
    { name: "Alaska", kind: "wishlist", lat: 64.2, lng: -149.49 },
    { name: "Greece", kind: "wishlist", lat: 39.07, lng: 21.82 },
    { name: "Lake Como, Italy", kind: "wishlist", lat: 46.016, lng: 9.257 },
  ],
  // List columns, in rank order: a shared pin takes the highest kind.
  placeGroups: [
    { kind: "lived", title: "Lived" },
    { kind: "visited", title: "Visited" },
    { kind: "wishlist", title: "Want to visit" },
  ],
};
export const UI = { work: "Work", experience: "Experience", about: "About", resume: "Resume", eeResume: "Engineering resume", sweResume: "Software resume", moreAbout: "More about me" };
