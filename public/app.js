const $ = (selector) => document.querySelector(selector);
const regionSelect = $("#region");
const headquartersSelect = $("#headquarters");
const attendeeSelect = $("#attendee");
const manualWrap = $("#manual-wrap");
const manualName = $("#manual-name");
const submitButton = $("#submit-button");
const existing = $("#existing");
const toast = $("#toast");
let attendees = [];
let eventInfo = { id: "2026-08", shortLabel: "8월 교육" };

function setOptions(select, placeholder, items, valueKey = null) {
  select.innerHTML = `<option value="">${placeholder}</option>`;
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = valueKey ? item[valueKey] : item;
    option.textContent = valueKey ? item.name : item;
    select.append(option);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 3600);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function identityParams() {
  return attendeeSelect.value === "__manual__"
    ? { region: regionSelect.value, headquarters: headquartersSelect.value, manualName: manualName.value.trim() }
    : { id: attendeeSelect.value };
}

function updateButton() {
  const manualInvalid = attendeeSelect.value === "__manual__" && manualName.value.trim().length < 2;
  submitButton.disabled = !attendeeSelect.value || manualInvalid || !existing.classList.contains("hidden");
}

async function checkExisting() {
  existing.classList.add("hidden");
  updateButton();
  const params = identityParams();
  if (!attendeeSelect.value || (attendeeSelect.value === "__manual__" && params.manualName.length < 2)) return;
  try {
    const response = await fetch(`/api/attendance?${new URLSearchParams(params)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    if (data.submitted) {
      existing.textContent = `이미 ${eventInfo.shortLabel} 참석 확인이 완료되었습니다. (${formatDate(data.record.submittedAt)})`;
      existing.classList.remove("hidden");
      updateButton();
    }
  } catch (error) {
    showToast(error.message || "기존 기록을 확인하지 못했습니다.");
  }
}

regionSelect.addEventListener("change", () => {
  const headquarters = [...new Set(attendees.filter((person) => person.region === regionSelect.value).map((person) => person.headquarters))]
    .sort((a, b) => a.localeCompare(b, "ko"));
  setOptions(headquartersSelect, "본부를 선택해 주세요", headquarters);
  headquartersSelect.disabled = !regionSelect.value;
  setOptions(attendeeSelect, "먼저 본부를 선택해 주세요", []);
  attendeeSelect.disabled = true;
  manualWrap.classList.add("hidden");
  manualName.value = "";
  submitButton.disabled = true;
  existing.classList.add("hidden");
});

headquartersSelect.addEventListener("change", () => {
  const people = attendees
    .filter((person) => person.region === regionSelect.value && person.headquarters === headquartersSelect.value)
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  setOptions(attendeeSelect, "이름을 선택해 주세요", people, "id");
  const manual = document.createElement("option");
  manual.value = "__manual__";
  manual.textContent = "명단에 없음 — 이름 직접 입력";
  attendeeSelect.append(manual);
  attendeeSelect.disabled = !headquartersSelect.value;
  manualWrap.classList.add("hidden");
  manualName.value = "";
  submitButton.disabled = true;
  existing.classList.add("hidden");
});

attendeeSelect.addEventListener("change", () => {
  const manual = attendeeSelect.value === "__manual__";
  manualWrap.classList.toggle("hidden", !manual);
  manualName.required = manual;
  if (manual) manualName.focus();
  checkExisting();
});
manualName.addEventListener("input", () => { existing.classList.add("hidden"); updateButton(); });
manualName.addEventListener("blur", checkExisting);

$("#attendance-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitButton.disabled) return;
  submitButton.disabled = true;
  submitButton.textContent = "기록하는 중…";
  const body = attendeeSelect.value === "__manual__"
    ? { region: regionSelect.value, headquarters: headquartersSelect.value, manualName: manualName.value.trim() }
    : { attendeeId: attendeeSelect.value };
  try {
    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok && response.status !== 409) throw new Error(data.message);
    $("#done-message").textContent = `${data.record.name}님, ${eventInfo.shortLabel} 참석 확인이 기록되었습니다.`;
    $("#done-dialog").showModal();
    await checkExisting();
  } catch (error) {
    showToast(error.message || "제출하지 못했습니다.");
  } finally {
    submitButton.textContent = `${eventInfo.shortLabel} 참석 확인`;
  }
});

$("#done-close").addEventListener("click", () => $("#done-dialog").close());

fetch("/api/attendees").then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  eventInfo = data.event;
  attendees = data.attendees;
  $("#event-badge").textContent = eventInfo.label;
  submitButton.textContent = `${eventInfo.shortLabel} 참석 확인`;
  setOptions(regionSelect, "권역을 선택해 주세요", [...new Set(attendees.map((person) => person.region))].sort((a, b) => a.localeCompare(b, "ko")));
}).catch(() => {
  regionSelect.disabled = true;
  showToast("명단을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.");
});
