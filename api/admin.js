import { get, list } from "@vercel/blob";
import { allAttendees, getEvent } from "./roster.js";

async function readAllRecords(eventId) {
  const { blobs } = await list({ prefix: `attendance/${eventId}/`, limit: 1000 });
  const records = await Promise.all(blobs.map(async (blob) => {
    const result = await get(blob.url, { access: "private" });
    return result?.statusCode === 200 ? new Response(result.stream).json() : null;
  }));
  return records.filter(Boolean);
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ message: "허용되지 않은 요청입니다." });
  }
  if (!process.env.ADMIN_KEY || request.headers["x-admin-key"] !== process.env.ADMIN_KEY) {
    return response.status(401).json({ message: "관리자 암호를 확인해 주세요." });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return response.status(503).json({ message: "저장소가 연결되지 않았습니다." });

  const eventId = String(request.query.eventId || "");
  const event = getEvent(eventId);
  const attendees = allAttendees(eventId);
  if (!event || !attendees) return response.status(400).json({ message: "교육 회차를 확인해 주세요." });

  const records = await readAllRecords(eventId);
  const byId = new Map(records.map((record) => [record.attendeeId, record]));
  const listedRows = attendees.map((person) => ({ ...person, isManual: false, record: byId.get(person.id) || null }));
  const manualRows = records.filter((record) => record.isManual).map((record) => ({
    id: record.attendeeId,
    region: record.region,
    headquarters: record.headquarters,
    name: record.name,
    isManual: true,
    record,
  }));
  const listedRecords = records.filter((record) => !record.isManual);
  const summary = {
    total: attendees.length,
    submitted: records.length,
    attending: records.length,
    manual: manualRows.length,
    pending: attendees.length - listedRecords.length,
  };
  return response.status(200).json({
    event: { id: event.id, label: event.label, shortLabel: event.shortLabel },
    summary,
    rows: [...listedRows, ...manualRows],
    generatedAt: new Date().toISOString(),
  });
}
