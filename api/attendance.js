import { get, put, BlobNotFoundError } from "@vercel/blob";
import crypto from "node:crypto";
import { findAttendee } from "./roster.js";

const pathnameFor = (id) => `attendance/${id}.json`;

function resolveIdentity(input = {}) {
  const listed = findAttendee(String(input.attendeeId || input.id || ""));
  if (listed) return { ...listed, isManual: false };
  const region = String(input.region || "").trim();
  const headquarters = String(input.headquarters || "").trim();
  const name = String(input.manualName || "").trim();
  if (!region || !headquarters || name.length < 2 || name.length > 20) return null;
  const id = `manual-${crypto.createHash("sha256").update(`${region}\u001f${headquarters}\u001f${name}`).digest("hex").slice(0, 16)}`;
  return { id, team: "예비 팀장", region, headquarters, name, isManual: true };
}

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
  if (!process.env.BLOB_READ_WRITE_TOKEN) return response.status(503).json({ message: "저장소 연결을 확인 중입니다. 잠시 후 다시 시도해 주세요." });
  if (request.method === "GET") {
    const identity = resolveIdentity(request.query);
    if (!identity) return response.status(404).json({ message: "입력 정보를 확인해 주세요." });
    const record = await readRecord(identity.id);
    return response.status(200).json({ submitted: Boolean(record), record });
  }
  if (request.method === "POST") {
    const attendee = resolveIdentity(request.body);
    if (!attendee) return response.status(400).json({ message: "선택 내용을 다시 확인해 주세요." });
    const existing = await readRecord(attendee.id);
    if (existing) return response.status(409).json({ message: "이미 제출된 기록이 있습니다.", record: existing });
    const record = { attendeeId: attendee.id, status: "attending", isManual: attendee.isManual, submittedAt: new Date().toISOString(), region: attendee.region, headquarters: attendee.headquarters, name: attendee.name };
    try {
      await put(pathnameFor(attendee.id), JSON.stringify(record), { access: "private", addRandomSuffix: false, contentType: "application/json; charset=utf-8", cacheControlMaxAge: 60 });
      return response.status(201).json({ message: "참석 확인이 기록되었습니다.", record });
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
