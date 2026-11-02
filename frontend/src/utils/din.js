// Frontend DIN kalkulátor - ISO 11088 (azonos a backenddel)

const weightCodes = [
  {max:10,code:1},{max:13,code:2},{max:17,code:3},{max:21,code:4},
  {max:25,code:5},{max:30,code:6},{max:35,code:7},{max:41,code:8},
  {max:48,code:9},{max:57,code:10},{max:66,code:11},{max:78,code:12},
  {max:94,code:13},{max:999,code:14},
];
const heightAdjust = [
  {max:148,adj:-1},{max:157,adj:0},{max:166,adj:0},{max:175,adj:0},
  {max:183,adj:0},{max:191,adj:+1},{max:999,adj:+1},
];
const dinLookup = {
  1: [0.75,0.75,0.75,0.75,0.75,0.75],
  2: [0.75,0.75,0.75,0.75,1.00,1.00],
  3: [0.75,0.75,1.00,1.00,1.25,1.25],
  4: [1.00,1.00,1.25,1.25,1.50,1.50],
  5: [1.25,1.25,1.50,1.50,1.75,1.75],
  6: [1.50,1.50,1.75,1.75,2.00,2.00],
  7: [1.75,1.75,2.00,2.00,2.50,2.50],
  8: [2.00,2.00,2.50,2.50,3.00,3.00],
  9: [2.50,2.50,3.00,3.00,3.50,3.50],
  10:[3.00,3.00,3.50,3.50,4.00,4.00],
  11:[3.50,3.50,4.00,4.50,5.00,5.50],
  12:[4.00,4.50,5.00,5.50,6.00,6.50],
  13:[4.50,5.00,5.50,6.00,6.50,7.00],
  14:[5.50,6.00,6.50,7.00,7.50,8.00],
};

export function estimateBSL(shoeSize) {
  return Math.round(265 + (shoeSize - 40) * 6.5);
}

export function calculateDIN(weightKg, heightCm, age, skillLevel, shoeSize) {
  let code = 14;
  for (const r of weightCodes) { if (weightKg <= r.max) { code = r.code; break; } }
  for (const r of heightAdjust) { if (heightCm <= r.max) { code += r.adj; break; } }
  code = Math.max(1, Math.min(14, code));
  if (age < 10 || age > 50) code = Math.max(1, code - 1);
  const sm = { elso_sielo:1, kezdo:1, kozephalado:2, halado:3, profi:3 };
  const st = sm[skillLevel] || 2;
  if (st === 1) code = Math.max(1, code - 1);
  if (st === 3) code = Math.min(14, code + 1);
  const bsl = estimateBSL(shoeSize);
  const col = bsl<=230?0:bsl<=250?1:bsl<=270?2:bsl<=290?3:bsl<=310?4:5;
  const raw = dinLookup[code]?.[col] ?? 1.0;

  // Sávos biztonsági levonás:
  // 0–2.00: nincs levonás
  // 2.01–4.00: -0.5 levonás
  // 4.01 felett: -1.0 levonás
  let adjustment = 0;
  if (raw > 4.0)      adjustment = 1.0;
  else if (raw > 2.0) adjustment = 0.5;

  return Math.round(Math.max(0.75, raw - adjustment) * 100) / 100;
}
