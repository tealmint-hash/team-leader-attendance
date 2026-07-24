const $ = (selector) => document.querySelector(selector);
const regionSelect = $("#region");
const headquartersSelect = $("#headquarters");
const attendeeSelect = $("#attendee");
const fieldset = $("#status-fieldset");
const submitButton = $("#submit-button");
const existing = $("#existing");
const toast = $("#toast");
let attendees = [];

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

function statusText(status) { return status === "attending" ? "참석" : "불참"; }
function formatDate(value) { return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

async function checkExisting() {
  existing.classList.add("hidden");
  fieldset.disabled = !attendeeSelect.value;
  submitButton.disabled = true;
  document.querySelectorAll('input[name="status"]').forEach((input) => { input.checked = false; input.disabled = false; });
  if (!attendeeSelect.value) return;
  try {
    const response = await fetch(`/api/attendance?id=${encodeURIComponent(attendeeSelect.value)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    if (data.submitted) {
      existing.textContent = `이미 ${statusText(data.record.status)}으로 제출되었습니다. (${formatDate(data.record.submittedAt)})`;
      existing.classList.remove("hidden");
      fieldset.disabled = true;
    }
  } catch (error) { showToast(error.message || "기존 기록을 확인하지 못했습니다."); }
}

regionSelect.addEventListener("change", () => {
  const values = [...new Set(attendees.filter((person) => person.region === regionSelect.value).map((person) => person.headquarters))].sort((a,b)=>a.localeCompare(b,"ko"));
  setOptions(headquartersSelect, "본부를 선택해 주세요", values);
  headquartersSelect.disabled = !regionSelect.value;
  setOptions(attendeeSelect, "먼저 본부를 선택해 주세요", []);
  attendeeSelect.disabled = true; fieldset.disabled = true; submitButton.disabled = true; existing.classList.add("hidden");
});

headquartersSelect.addEventListener("change", () => {
  const values = attendees.filter((person) => person.region === regionSelect.value && person.headquarters === headquartersSelect.value).sort((a,b)=>a.name.localeCompare(b.name,"ko"));
  setOptions(attendeeSelect, "이름을 선택해 주세요", values, "id");
  attendeeSelect.disabled = !headquartersSelect.value; fieldset.disabled = true; submitButton.disabled = true; existing.classList.add("hidden");
});

attendeeSelect.addEventListener("change", checkExisting);
fieldset.addEventListener("change", () => { submitButton.disabled = !document.querySelector('input[name="status"]:checked') || fieldset.disabled; });

$("#attendance-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = document.querySelector('input[name="status"]:checked')?.value;
  if (!attendeeSelect.value || !status) return;
  submitButton.disabled = true; submitButton.textContent = "기록하는 중…";
  try {
    const response = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attendeeId: attendeeSelect.value, status }) });
    const data = await response.json();
    if (!response.ok && response.status !== 409) throw new Error(data.message);
    const person = attendees.find((item) => item.id === attendeeSelect.value);
    $("#done-message").textContent = `${person.name}님, ${statusText(data.record.status)}으로 기록되었습니다.`;
    $("#done-dialog").showModal();
    await checkExisting();
  } catch (error) { showToast(error.message || "제출하지 못했습니다."); }
  finally { submitButton.textContent = "참석 여부 제출"; }
});

$("#done-close").addEventListener("click", () => $("#done-dialog").close());

fetch("/api/attendees").then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  attendees = data.attendees;
  setOptions(regionSelect, "권역을 선택해 주세요", [...new Set(attendees.map((person) => person.region))].sort((a,b)=>a.localeCompare(b,"ko")));
}).catch(() => { regionSelect.disabled = true; showToast("명단을 불러오지 못했습니다. 잠시 후 새로고침해 주세요."); });
