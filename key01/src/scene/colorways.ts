export interface Colorway {
  name: string;
  note: string;
  caseColor: string;
  caseMetal: number;
  alpha: string;
  mod: string;
  accent: string;
  legendAlpha: string;
  legendMod: string;
  legendAccent: string;
  plate: string;
  pcb: string;
  foam: string;
  stem: string;
  /** page tint while this colorway is on stage */
  bg: string;
  /** strong swatch used for type and chips */
  ink: string;
}

export const COLORWAYS: Colorway[] = [
  {
    name: 'Cobalt',
    note: 'Milk aluminium, cobalt modifiers, one tomato escape.',
    caseColor: '#ebe8e2', caseMetal: 0.25,
    alpha: '#f8f7f3', mod: '#2747ff', accent: '#ff4a2b',
    legendAlpha: '#2747ff', legendMod: '#ffffff', legendAccent: '#ffffff',
    plate: '#2747ff', pcb: '#f5f3ee', foam: '#cbd4ff', stem: '#ff4a2b',
    bg: '#eef0fb', ink: '#2747ff',
  },
  {
    name: 'Coral',
    note: 'Anodised coral, cream alphas, an ultramarine accent.',
    caseColor: '#ff8a70', caseMetal: 0.55,
    alpha: '#fff3ec', mod: '#ff6450', accent: '#3a2fd8',
    legendAlpha: '#ee5a42', legendMod: '#ffffff', legendAccent: '#ffffff',
    plate: '#ff6450', pcb: '#f5f3ee', foam: '#ffd2c6', stem: '#3a2fd8',
    bg: '#ffece5', ink: '#f2543b',
  },
  {
    name: 'Lime',
    note: 'Fog grey with an electric lime row and deep teal ink.',
    caseColor: '#e4e7df', caseMetal: 0.35,
    alpha: '#fbfcf6', mod: '#c4f22e', accent: '#0f5c4e',
    legendAlpha: '#0f5c4e', legendMod: '#17330f', legendAccent: '#c4f22e',
    plate: '#c4f22e', pcb: '#f5f3ee', foam: '#e6f7a8', stem: '#c4f22e',
    bg: '#f2f8dd', ink: '#3f8f1b',
  },
  {
    name: 'Lavender',
    note: 'Soft violet aluminium with a single tangerine spark.',
    caseColor: '#b6a4f6', caseMetal: 0.55,
    alpha: '#f6f2ff', mod: '#8b69f3', accent: '#ff8a1c',
    legendAlpha: '#7350ea', legendMod: '#ffffff', legendAccent: '#ffffff',
    plate: '#8b69f3', pcb: '#f5f3ee', foam: '#ddd2ff', stem: '#ff8a1c',
    bg: '#f0ebff', ink: '#7350ea',
  },
  {
    name: 'Ice',
    note: 'Frosted silver, glacier cyan, cobalt to finish.',
    caseColor: '#d7e3e8', caseMetal: 0.75,
    alpha: '#f6fbfc', mod: '#86def3', accent: '#2747ff',
    legendAlpha: '#2b7489', legendMod: '#0e4b5c', legendAccent: '#ffffff',
    plate: '#86def3', pcb: '#f5f3ee', foam: '#cdf1fa', stem: '#2747ff',
    bg: '#e7f6fa', ink: '#1d8aa6',
  },
  {
    name: 'Tangerine',
    note: 'Warm citrus aluminium and a deep teal counterpoint.',
    caseColor: '#ff9a3b', caseMetal: 0.55,
    alpha: '#fff6ea', mod: '#ff7a16', accent: '#0f736c',
    legendAlpha: '#e8650d', legendMod: '#ffffff', legendAccent: '#ffffff',
    plate: '#ff7a16', pcb: '#f5f3ee', foam: '#ffd9b0', stem: '#0f736c',
    bg: '#fff0de', ink: '#ee6a0c',
  },
];
