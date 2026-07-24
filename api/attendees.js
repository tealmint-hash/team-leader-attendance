import { publicRoster } from "./roster.js";

export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ message: "허용되지 않은 요청입니다." });
  }
  return response.status(200).json({ attendees: publicRoster() });
}
