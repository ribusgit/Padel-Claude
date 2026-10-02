/** Modelos disponibles: Seedance 2 da tomas largas y continuas; Gen-4.5 es más barato. */
export const RUNWAY_MODELS = {
  seedance2: { label: "Seedance 2 · 15 s · más fluido", duration: 15, creditsPerSecond: 36 },
  "gen4.5": { label: "Gen-4.5 · 10 s · más económico", duration: 10, creditsPerSecond: 12 },
} as const;
export type RunwayModel = keyof typeof RUNWAY_MODELS;
