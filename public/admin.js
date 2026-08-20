const $ = (selector) => document.querySelector(selector);
let payload = null;
let adminKey = "";
let events = [];

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.remove("hidden");
  setTimeout(() => element.classList.add("hidden"), 3500);
}

const statusOf = (row) => row.record ? "attending" : "pending";
const labelOf = (status) => ({ attending: "참석 확인", pending: "미확인" })[status];
const formatDate = (value) => value
  ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
  : "—";

function render() {
  const query = $("#search").value.trim().toLowerCase();
  const filter = $("#filter").value;
  const rows = payload.rows.filter((row) =>
    (filter === "all" || statusOf(row) === filter)
    && `${row.region} ${row.headquarters} ${row.name}`.toLowerCase().includes(query));
  $("#rows").innerHTML = rows.map((row) => `<tr>
    <td>${row.region}</td><td>${row.headquarters}</td><td>${row.name}</td>
    <td>${row.isManual ? "직접 입력" : "명단"}</td>
    <td><span class="badge ${statusOf(row)}">${labelOf(statusOf(row))}</span></td>
    <td>${formatDate(row.record?.submittedAt)}</td>
  </tr>`).join("") || '<tr><td colspan="6">조건에 맞는 기록이 없습니다.</td></tr>';
}

async function load() {
  const eventId = $("#event-select").value;
  const response = await fetch(`/api/admin?eventId=${encodeURIComponent(eventId)}`, {
    headers: { "x-admin-key": adminKey },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  payload = data;
  const labels = [["명단", data.summary.total], ["참석 확인", data.summary.attending], ["직접 입력", data.summary.manual], ["미확인", data.summary.pending]];
  $("#summary").innerHTML = labels.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join("");
  $("#event-note").textContent = `${data.event.label} · 명단 ${data.summary.total}명 · 기록 ${data.summary.submitted}건`;
  $("#login-card").classList.add("hidden");
  $("#dashboard").classList.remove("hidden");
  render();
}

async function loadEvents() {
  const response = await fetch("/api/events", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  events = data.events;
  $("#event-select").innerHTML = events.map((event) => `<option value="${event.id}"${event.id === data.currentEventId ? " selected" : ""}>${event.label}</option>`).join("");
}

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  adminKey = $("#admin-key").value;
  try { await load(); } catch (error) { toast(error.message); }
});
$("#event-select").addEventListener("change", () => load().catch((error) => toast(error.message)));
$("#search").addEventListener("input", render);
$("#filter").addEventListener("change", render);
$("#refresh").addEventListener("click", () => load().catch((error) => toast(error.message)));
$("#download").addEventListener("click", () => {
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = [["교육 회차", "권역", "본부", "이름", "구분", "상태", "제출시각"], ...payload.rows.map((row) => [
    payload.event.label, row.region, row.headquarters, row.name, row.isManual ? "직접 입력" : "명단", labelOf(statusOf(row)), row.record?.submittedAt || "",
  ])].map((row) => row.map(escape).join(","));
  const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `attendance-${payload.event.id}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});

loadEvents().catch((error) => toast(error.message));
