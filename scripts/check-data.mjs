import attendees from "../data/attendees.json" with { type: "json" };
const required=["id","team","region","headquarters","name"];
if(attendees.length!==125)throw new Error(`Expected 125 attendees, found ${attendees.length}`);
if(new Set(attendees.map((person)=>person.id)).size!==attendees.length)throw new Error("Duplicate attendee IDs");
for(const person of attendees){for(const key of required){if(!String(person[key]||"").trim())throw new Error(`Missing ${key}`);if(String(person[key])!==String(person[key]).trim())throw new Error(`Untrimmed ${key}`)}}
console.log(`OK: ${attendees.length} attendees, ${new Set(attendees.map((p)=>p.region)).size} regions, ${new Set(attendees.map((p)=>p.region+'|'+p.headquarters)).size} headquarters`);
