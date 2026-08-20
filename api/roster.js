import julyAttendees from "../data/rosters/2026-07.json" with { type: "json" };
import augustAttendees from "../data/rosters/2026-08.json" with { type: "json" };

export const CURRENT_EVENT_ID = "2026-08";

const events = [
  { id: "2026-07", label: "2026년 7월 교육", shortLabel: "7월 교육", roster: julyAttendees },
  { id: "2026-08", label: "2026년 8월 교육", shortLabel: "8월 교육", roster: augustAttendees },
];

export function eventList() {
  return events.map(({ roster, ...event }) => ({ ...event, attendeeCount: roster.length }));
}

export function getEvent(eventId = CURRENT_EVENT_ID) {
  return events.find((event) => event.id === eventId) || null;
}

export function findAttendee(eventId, id) {
  return getEvent(eventId)?.roster.find((person) => person.id === id) || null;
}

export function publicRoster(eventId = CURRENT_EVENT_ID) {
  const event = getEvent(eventId);
  if (!event) return null;
  return event.roster.map(({ id, region, headquarters, name }) => ({ id, region, headquarters, name }));
}

export function allAttendees(eventId) {
  return getEvent(eventId)?.roster || null;
}
