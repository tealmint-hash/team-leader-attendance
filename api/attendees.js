import { CURRENT_EVENT_ID, getEvent, publicRoster } from "./roster.js";

export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ message: "허용되지 않은 요청입니다." });
  }
  const event = getEvent(CURRENT_EVENT_ID);
  return response.status(200).json({
    event: { id: event.id, label: event.label, shortLabel: event.shortLabel },
    attendees: publicRoster(CURRENT_EVENT_ID),
  });
}
