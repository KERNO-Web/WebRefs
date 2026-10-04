// 75% layout in key units (1u = one keycap pitch). Origin is the top-left
// corner of the key field; x grows right, z grows toward the typist.

export type KeyRole = 'alpha' | 'mod' | 'accent';

export interface KeyDef {
  id: string;
  label: string;
  sub?: string;
  code: string; // KeyboardEvent.code, for typing along on a real keyboard
  x: number;
  z: number;
  w: number;
  role: KeyRole;
  row: number;
}

type Spec = [label: string, code: string, w?: number, role?: KeyRole, sub?: string];

const ROWS: Spec[][] = [
  [
    ['esc', 'Escape', 1, 'accent'],
    ['F1', 'F1', 1, 'mod'], ['F2', 'F2', 1, 'mod'], ['F3', 'F3', 1, 'mod'], ['F4', 'F4', 1, 'mod'],
    ['F5', 'F5'], ['F6', 'F6'], ['F7', 'F7'], ['F8', 'F8'],
    ['F9', 'F9', 1, 'mod'], ['F10', 'F10', 1, 'mod'], ['F11', 'F11', 1, 'mod'], ['F12', 'F12', 1, 'mod'],
    ['ins', 'Insert', 1, 'mod'], ['del', 'Delete', 1, 'mod'],
  ],
  [
    ['`', 'Backquote', 1, 'alpha', '~'], ['1', 'Digit1', 1, 'alpha', '!'], ['2', 'Digit2', 1, 'alpha', '@'],
    ['3', 'Digit3', 1, 'alpha', '#'], ['4', 'Digit4', 1, 'alpha', '$'], ['5', 'Digit5', 1, 'alpha', '%'],
    ['6', 'Digit6', 1, 'alpha', '^'], ['7', 'Digit7', 1, 'alpha', '&'], ['8', 'Digit8', 1, 'alpha', '*'],
    ['9', 'Digit9', 1, 'alpha', '('], ['0', 'Digit0', 1, 'alpha', ')'], ['-', 'Minus', 1, 'alpha', '_'],
    ['=', 'Equal', 1, 'alpha', '+'], ['backspace', 'Backspace', 2, 'mod'], ['home', 'Home', 1, 'mod'],
  ],
  [
    ['tab', 'Tab', 1.5, 'mod'],
    ...'QWERTYUIOP'.split('').map((c): Spec => [c, `Key${c}`]),
    ['[', 'BracketLeft', 1, 'alpha', '{'], [']', 'BracketRight', 1, 'alpha', '}'],
    ['\\', 'Backslash', 1.5, 'alpha', '|'], ['pg up', 'PageUp', 1, 'mod'],
  ],
  [
    ['caps', 'CapsLock', 1.75, 'mod'],
    ...'ASDFGHJKL'.split('').map((c): Spec => [c, `Key${c}`]),
    [';', 'Semicolon', 1, 'alpha', ':'], ["'", 'Quote', 1, 'alpha', '"'],
    ['enter', 'Enter', 2.25, 'accent'], ['pg dn', 'PageDown', 1, 'mod'],
  ],
  [
    ['shift', 'ShiftLeft', 2.25, 'mod'],
    ...'ZXCVBNM'.split('').map((c): Spec => [c, `Key${c}`]),
    [',', 'Comma', 1, 'alpha', '<'], ['.', 'Period', 1, 'alpha', '>'], ['/', 'Slash', 1, 'alpha', '?'],
    ['shift', 'ShiftRight', 1.75, 'mod'], ['↑', 'ArrowUp', 1, 'mod'], ['end', 'End', 1, 'mod'],
  ],
  [
    ['ctrl', 'ControlLeft', 1.25, 'mod'], ['opt', 'AltLeft', 1.25, 'mod'], ['cmd', 'MetaLeft', 1.25, 'mod'],
    ['', 'Space', 6.25, 'alpha'],
    ['cmd', 'MetaRight', 1, 'mod'], ['fn', 'Fn', 1, 'mod'], ['ctrl', 'ControlRight', 1, 'mod'],
    ['←', 'ArrowLeft', 1, 'mod'], ['↓', 'ArrowDown', 1, 'mod'], ['→', 'ArrowRight', 1, 'mod'],
  ],
];

export const FIELD_W = 16;
export const ROW_GAP = 0.25; // the function row floats a little above the rest
export const FIELD_D = 6 + ROW_GAP;

export const KEYS: KeyDef[] = [];
ROWS.forEach((row, r) => {
  let x = 0;
  const z = r + (r > 0 ? ROW_GAP : 0);
  row.forEach(([label, code, w = 1, role = 'alpha', sub], i) => {
    KEYS.push({ id: `${r}-${i}`, label, sub, code, x, z, w, role, row: r });
    x += w;
  });
});

// the rotary knob takes the last 1u slot of the function row
export const KNOB = { x: 15.5, z: 0.5 };
