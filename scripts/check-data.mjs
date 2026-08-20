import july from "../data/rosters/2026-07.json" with { type: "json" };
import august from "../data/rosters/2026-08.json" with { type: "json" };

const checks = [
  { id: "2026-07", attendees: july, expected: 124, regions: 10, headquarters: 45 },
  { id: "2026-08", attendees: august, expected: 118, regions: 9, headquarters: 40 },
];

for (const check of checks) {
  const { id, attendees, expected, regions, headquarters } = check;
  if (attendees.length !== expected) throw new Error(`${id}: expected ${expected}, found ${attendees.length}`);
  if (new Set(attendees.map((person) => person.id)).size !== attendees.length) throw new Error(`${id}: duplicate IDs`);
  for (const person of attendees) {
    for (const key of ["id", "region", "headquarters", "name"]) {
      if (!String(person[key] || "").trim()) throw new Error(`${id}: missing ${key}`);
      if (String(person[key]) !== String(person[key]).trim()) throw new Error(`${id}: untrimmed ${key}`);
    }
  }
  const actualRegions = new Set(attendees.map((person) => person.region)).size;
  const actualHeadquarters = new Set(attendees.map((person) => `${person.region}|${person.headquarters}`)).size;
  if (actualRegions !== regions || actualHeadquarters !== headquarters) throw new Error(`${id}: hierarchy mismatch`);
  console.log(`OK ${id}: ${attendees.length} attendees, ${actualRegions} regions, ${actualHeadquarters} headquarters`);
}
