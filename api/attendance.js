import { get, put, BlobNotFoundError } from "@vercel/blob";
import { findAttendee } from "./roster.js";

const validStatuses = new Set(["attending", "not_attending"]);
const pathnameFor = (id) => `attendance/${id}.json`;

async function readRecord(id) {
  try {
    const result = await get(pathnameFor(id), { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    return await new Response(result.stream).json();
  } catch (error) {
    if (error instanceof BlobNotFoundError || error?.status === 404 || error?.statusCode === 404) return null;
    throw error;
  }
}

export default async function handler(request, response) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return response.status(503).json({ message: "저장소 연결을 확인 중입니다. 잠시 후 다시 시도해 주세요." });
  }

  if (request.method === "GET") {
    const id = String(request.query.id || "");
    if (!findAttendee(id)) return response.status(404).json({ message: "명단에서 찾을 수 없습니다." });
    const record = await readRecord(id);
    return response.status(200).json({ submitted: Boolean(record), record });
  }

  if (request.method === "POST") {
    const { attendeeId, status } = request.body || {};
    const attendee = findAttendee(String(attendeeId || ""));
    if (!attendee || !validStatuses.has(status)) {
      return response.status(400).json({ message: "선택 내용을 다시 확인해 주세요." });
    }

    const existing = await readRecord(attendee.id);
    if (existing) {
      return response.status(409).json({ message: "이미 제출된 기록이 있습니다.", record: existing });
    }

    const record = {
      attendeeId: attendee.id,
      status,
      submittedAt: new Date().toISOString(),
      region: attendee.region,
      headquarters: attendee.headquarters,
      name: attendee.name,
    };

    try {
      await put(pathnameFor(attendee.id), JSON.stringify(record), {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json; charset=utf-8",
        cacheControlMaxAge: 60,
      });
      return response.status(201).json({ message: "참석 여부가 기록되었습니다.", record });
    } catch (error) {
      const raced = await readRecord(attendee.id);
      if (raced) return response.status(409).json({ message: "이미 제출된 기록이 있습니다.", record: raced });
      console.error(error);
      return response.status(500).json({ message: "기록하지 못했습니다. 잠시 후 다시 시도해 주세요." });
    }
  }

  response.setHeader("Allow", "GET, POST");
  return response.status(405).json({ message: "허용되지 않은 요청입니다." });
}
