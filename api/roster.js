import attendees from "../data/attendees.json" with { type: "json" };

export function findAttendee(id) {
  return attendees.find((person) => person.id === id);
}

export function publicRoster() {
  return attendees.map(({ id, region, headquarters, name }) => ({ id, region, headquarters, name }));
}

export function allAttendees() {
  return attendees;
}
