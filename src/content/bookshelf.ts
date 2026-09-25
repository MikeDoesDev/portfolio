/**
 * The About bookshelf, left to right. Each entry is a series that stays
 * together on one shelf. h is book height and w spine thickness, in px;
 * color is the spine and cover, ink the lettering.
 */
export type Book = { title: string; color: string; ink: string; w: number };
export type BookSeries = { series?: string; author?: string; h: number; books: Book[] };

export const BOOKSHELF: BookSeries[] = [
  { h: 138, books: [
    { title: "The Bible", color: "#3a2c28", ink: "#d4b36a", w: 34 },
  ] },
  { author: "C.S. Lewis", h: 132, books: [
    { title: "The Abolition of Man", color: "#46566b", ink: "#efe7d6", w: 12 },
  ] },
  { author: "Frank Herbert", h: 150, books: [
    { title: "Dune", color: "#c9a46a", ink: "#3a2a18", w: 34 },
    { title: "Dune Messiah", color: "#9c6a3c", ink: "#f3e6cf", w: 22 },
  ] },
  { author: "Ray Bradbury", h: 132, books: [
    { title: "Fahrenheit 451", color: "#b8472c", ink: "#f8e9cf", w: 16 },
  ] },
  { author: "Yann Martel", h: 140, books: [
    { title: "Life of Pi", color: "#2d6f86", ink: "#f2a33a", w: 24 },
  ] },
  { author: "Deborah Ellis", h: 134, books: [
    { title: "The Breadwinner", color: "#8c6b4a", ink: "#f4e8d4", w: 14 },
  ] },
  { series: "Harry Potter", author: "J.K. Rowling", h: 146, books: [
    { title: "Sorcerer’s Stone", color: "#7b2d2b", ink: "#e9c46a", w: 20 },
    { title: "Chamber of Secrets", color: "#2f5b46", ink: "#e6dcc3", w: 22 },
    { title: "Prisoner of Azkaban", color: "#3d3a6b", ink: "#e9d9a8", w: 25 },
    { title: "Goblet of Fire", color: "#8a3b1e", ink: "#f2d49a", w: 36 },
    { title: "Order of the Phoenix", color: "#2b4a6b", ink: "#f0e3c0", w: 40 },
    { title: "Half-Blood Prince", color: "#4a5a3a", ink: "#efe6c8", w: 32 },
    { title: "Deathly Hallows", color: "#2e2a26", ink: "#d8b45a", w: 36 },
  ] },
  { series: "Percy Jackson and the Olympians", author: "Rick Riordan", h: 140, books: [
    { title: "The Lightning Thief", color: "#2f5f7f", ink: "#f3e9d2", w: 22 },
    { title: "The Sea of Monsters", color: "#2a6b6b", ink: "#f3e9d2", w: 22 },
    { title: "The Titan’s Curse", color: "#4b4f7a", ink: "#f3e9d2", w: 24 },
    { title: "The Battle of the Labyrinth", color: "#6b5a3a", ink: "#f3e9d2", w: 25 },
    { title: "The Last Olympian", color: "#7a3b3b", ink: "#f3e9d2", w: 26 },
  ] },
  { series: "Arc of a Scythe", author: "Neal Shusterman", h: 148, books: [
    { title: "Scythe", color: "#1f1d1c", ink: "#c8463d", w: 28 },
    { title: "Thunderhead", color: "#243a52", ink: "#a9c7de", w: 32 },
    { title: "The Toll", color: "#5a1e1e", ink: "#e8d2b0", w: 34 },
  ] },
  { series: "Unwind Dystology", author: "Neal Shusterman", h: 142, books: [
    { title: "Unwind", color: "#8d9296", ink: "#1f2124", w: 24 },
    { title: "UnWholly", color: "#6e7479", ink: "#f1efe9", w: 28 },
    { title: "UnSouled", color: "#4f555a", ink: "#f1efe9", w: 28 },
    { title: "UnDivided", color: "#a8adb1", ink: "#1f2124", w: 26 },
  ] },
  { author: "Robert Kirkman", h: 160, books: [
    { title: "Invincible Compendium 1", color: "#e8bd3f", ink: "#1d2a44", w: 44 },
    { title: "Invincible Compendium 2", color: "#2c4a8a", ink: "#f2c94c", w: 46 },
    { title: "Invincible Compendium 3", color: "#1c2233", ink: "#f2c94c", w: 46 },
  ] },
  { series: "Minecraft", author: "Mojang", h: 156, books: [
    { title: "Essential Handbook", color: "#5b8c3a", ink: "#fdf6e3", w: 12 },
    { title: "Redstone Handbook", color: "#a3322b", ink: "#fdf6e3", w: 12 },
    { title: "Combat Handbook", color: "#4b4f57", ink: "#f1f1f1", w: 12 },
    { title: "Construction Handbook", color: "#3d6ea8", ink: "#fdf6e3", w: 12 },
  ] },
  { series: "Magic Tree House", author: "Mary Pope Osborne", h: 122, books: [
    { title: "Dinosaurs Before Dark", color: "#5f8a4a", ink: "#fdf6e3", w: 11 },
    { title: "The Knight at Dawn", color: "#8a5a3c", ink: "#fdf6e3", w: 11 },
    { title: "Mummies in the Morning", color: "#c29a4a", ink: "#2b2116", w: 11 },
    { title: "Pirates Past Noon", color: "#3f6f93", ink: "#fdf6e3", w: 11 },
    { title: "Night of the Ninjas", color: "#8f3f3a", ink: "#fdf6e3", w: 11 },
  ] },
];
