// Single source of truth for button styling so every button in the app gets the
// same hover/press/disabled feedback instead of each page redefining its own
// (slightly different, sometimes hover-less) variant.

export const BTN_PRIMARY =
  "cursor-pointer rounded-full bg-olive px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-olive/30 transition hover:bg-olive/80 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none";

// Higher-contrast variant for a "final/emphasized" action (e.g. continuing to the report).
export const BTN_PRIMARY_DARK =
  "cursor-pointer rounded-full bg-olive-dark px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-olive-dark/30 transition hover:bg-olive-darker active:scale-[0.98] disabled:opacity-40 disabled:shadow-none";

export const BTN_SECONDARY =
  "cursor-pointer rounded-full border-2 border-olive-light bg-white px-6 py-3 text-sm font-extrabold text-olive-dark transition hover:bg-cream active:scale-[0.98] disabled:opacity-40";

// Base for icon-only circular buttons (edit, delete, close, logout, stepper +/-).
// Combine with a size (h-*/w-*), a text color, and a hover:bg-* of your choice
// (don't bake one in here - a button that's already colored, like the +/- steppers
// on olive-light, needs a different hover shade than one that's plain/white).
export const BTN_ICON = "cursor-pointer flex items-center justify-center rounded-full transition";

// Text/underline link-style buttons (back links, "select all", inline upload prompts).
export const BTN_LINK =
  "cursor-pointer font-extrabold text-olive underline decoration-olive-light decoration-2 underline-offset-2 transition hover:text-olive-dark";
