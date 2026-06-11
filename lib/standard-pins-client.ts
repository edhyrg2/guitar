/**
 * Client-safe static map of standard pins per component type.
 * Mirrors the DB seed in scripts/seed-standard-components.mjs.
 * Used by the Component Studio editor (browser-side) to show
 * quick-fill dropdowns when adding / editing connection points.
 */

export type StandardPinTemplate = {
  pointKey: string;
  label: string;
  pointType: string;
  color: string;
  description: string;
};

export const STANDARD_PINS_BY_TYPE: Record<string, StandardPinTemplate[]> = {
  Pickup: [
    { pointKey: "hot",    label: "Hot",    pointType: "Hot",    color: "#ef4444", description: "Hot signal output from the pickup coil." },
    { pointKey: "ground", label: "Ground", pointType: "Ground", color: "#6b7280", description: "Ground / shield connection." },
    { pointKey: "north-start", label: "North Start", pointType: "Coil", color: "#a855f7", description: "Start of the north coil (4-conductor)." },
    { pointKey: "north-finish", label: "North Finish", pointType: "Coil", color: "#ec4899", description: "Finish of the north coil (4-conductor)." },
    { pointKey: "south-start", label: "South Start", pointType: "Coil", color: "#3b82f6", description: "Start of the south coil (4-conductor)." },
    { pointKey: "south-finish", label: "South Finish", pointType: "Coil", color: "#06b6d4", description: "Finish of the south coil (4-conductor)." },
  ],
  Switch: [
    { pointKey: "lug1",    label: "Lug 1",    pointType: "Lug",    color: "#f59e0b", description: "Input lug 1." },
    { pointKey: "lug2",    label: "Lug 2",    pointType: "Lug",    color: "#f59e0b", description: "Input lug 2." },
    { pointKey: "lug3",    label: "Lug 3",    pointType: "Lug",    color: "#f59e0b", description: "Input lug 3." },
    { pointKey: "lug4",    label: "Lug 4",    pointType: "Lug",    color: "#f59e0b", description: "Input lug 4." },
    { pointKey: "lug5",    label: "Lug 5",    pointType: "Lug",    color: "#f59e0b", description: "Input lug 5." },
    { pointKey: "common",  label: "Common",   pointType: "Common", color: "#10b981", description: "Common / output terminal." },
    { pointKey: "common-a", label: "Common A", pointType: "Common", color: "#10b981", description: "Common A — first pole." },
    { pointKey: "common-b", label: "Common B", pointType: "Common", color: "#34d399", description: "Common B — second pole." },
    { pointKey: "ground",  label: "Ground",   pointType: "Ground", color: "#6b7280", description: "Ground terminal." },
  ],
  Potentiometer: [
    { pointKey: "lug1",        label: "Lug 1 (CCW)",  pointType: "Lug",    color: "#f59e0b", description: "Counter-clockwise outer terminal." },
    { pointKey: "lug2",        label: "Lug 2 (Wiper)", pointType: "Wiper", color: "#ef4444", description: "Wiper / center tap." },
    { pointKey: "lug3",        label: "Lug 3 (CW)",   pointType: "Lug",    color: "#f59e0b", description: "Clockwise outer terminal." },
    { pointKey: "case-ground", label: "Case Ground",  pointType: "Ground", color: "#6b7280", description: "Metal casing ground." },
    // Push-pull DPDT poles
    { pointKey: "a1", label: "A1", pointType: "DPDT", color: "#a855f7", description: "DPDT pole A, position 1." },
    { pointKey: "a2", label: "A2", pointType: "DPDT", color: "#a855f7", description: "DPDT pole A, common." },
    { pointKey: "a3", label: "A3", pointType: "DPDT", color: "#a855f7", description: "DPDT pole A, position 2." },
    { pointKey: "b1", label: "B1", pointType: "DPDT", color: "#ec4899", description: "DPDT pole B, position 1." },
    { pointKey: "b2", label: "B2", pointType: "DPDT", color: "#ec4899", description: "DPDT pole B, common." },
    { pointKey: "b3", label: "B3", pointType: "DPDT", color: "#ec4899", description: "DPDT pole B, position 2." },
  ],
  Capacitor: [
    { pointKey: "lead1", label: "Lead 1 (+)", pointType: "Lead", color: "#ef4444", description: "Positive lead (electrolytic)." },
    { pointKey: "lead2", label: "Lead 2 (−)", pointType: "Lead", color: "#6b7280", description: "Negative lead / ground side." },
  ],
  Resistor: [
    { pointKey: "lead1", label: "Lead 1", pointType: "Lead", color: "#f59e0b", description: "First resistor terminal." },
    { pointKey: "lead2", label: "Lead 2", pointType: "Lead", color: "#f59e0b", description: "Second resistor terminal." },
  ],
  "Output Jack": [
    { pointKey: "tip",    label: "Tip",    pointType: "Output", color: "#ef4444", description: "Hot signal — tip terminal." },
    { pointKey: "sleeve", label: "Sleeve", pointType: "Ground", color: "#6b7280", description: "Ground — sleeve terminal." },
    { pointKey: "ring",   label: "Ring",   pointType: "Output", color: "#3b82f6", description: "Ring terminal (stereo / TRS)." },
  ],
  "Ground Bus": [
    { pointKey: "ground", label: "Ground", pointType: "Ground", color: "#6b7280", description: "Common ground bus node." },
  ],
  Mod: [
    { pointKey: "in",     label: "In",     pointType: "Input",  color: "#3b82f6", description: "Signal input." },
    { pointKey: "out",    label: "Out",    pointType: "Output", color: "#ef4444", description: "Signal output." },
    { pointKey: "ground", label: "Ground", pointType: "Ground", color: "#6b7280", description: "Ground reference." },
  ],
};
