const API_URL = `${window.location.origin}/sb-api/functions/v1/raffle-api`;

const elements = {
  phoneGate: document.querySelector("#phoneGate"),
  phoneForm: document.querySelector("#phoneForm"),
  phoneInput: document.querySelector("#phoneInput"),
  phoneError: document.querySelector("#phoneError"),
  gameArea: document.querySelector("#gameArea"),
  currentPhone: document.querySelector("#currentPhone"),
  cards: document.querySelector("#cards"),
  hint: document.querySelector("#hint"),
  prizeModal: document.querySelector("#prizeModal"),
  prizeCopy: document.querySelector("#prizeCopy"),
  passwordModal: document.querySelector("#passwordModal"),
  passwordForm: document.querySelector("#passwordForm"),
  passwordInput: document.querySelector("#passwordInput"),
  passwordError: document.querySelector("#passwordError"),
  passwordHelp: document.querySelector("#passwordHelp"),
  configModal: document.querySelector("#configModal"),
  configForm: document.querySelector("#configForm"),
  prizesInput: document.querySelector("#prizesInput"),
  redemptionInput: document.querySelector("#redemptionInput"),
  configError: document.querySelector("#configError"),
  historyModal: document.querySelector("#historyModal"),
  historyBody: document.querySelector("#historyBody"),
  historyEmpty: document.querySelector("#historyEmpty"),
  toast: document.querySelector("#toast"),
  confetti: document.querySelector("#confetti")
};

let config = { prizes: ["口红", "包", "花"], redemptionText: "请找百度最帅的人兑奖" };
let currentPhone = "";
let hasPlayed = false;
let adminMode = "config";
let adminPassword = "";
let lastFocusedElement = null;

async function requestApi(action, payload = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "服务暂时不可用，请稍后重试");
  return data;
}

function escapeHtml(value) {
  const node = document.createElement("span");
  node.textContent = value;
  return node.innerHTML;
}

function renderCards() {
  hasPlayed = false;
  elements.cards.innerHTML = config.prizes.map((_, index) => `
    <button class="card" type="button" aria-label="选择第${index + 1}张牌" data-index="${index}">
      <span class="card-inner">
        <span class="card-face card-front">
          <span class="front-star">✦</span>
          <span class="question">?</span>
          <span class="front-label">LUCKY</span>
        </span>
        <span class="card-face card-back">
          <span class="prize-mark">✦</span>
          <span class="prize-name"></span>
        </span>
      </span>
    </button>`).join("");
  elements.hint.innerHTML = `<span>✦</span> 请选择一张牌 · 每轮仅可翻开一次 <span>✦</span>`;
  elements.cards.querySelectorAll(".card").forEach((card) => card.addEventListener("click", () => draw(card)));
}

async function loadConfig() {
  try {
    const data = await requestApi("get-config");
    config = data.config;
    if (!elements.gameArea.hidden) renderCards();
  } catch (error) {
    showToast(error.message);
  }
}

async function draw(card) {
  if (hasPlayed || !currentPhone) return;
  hasPlayed = true;
  const cards = [...elements.cards.querySelectorAll(".card")];
  cards.forEach((item) => item.classList.add("locked"));
  elements.hint.textContent = "正在揭晓你的幸运好礼…";
  try {
    const data = await requestApi("draw", { phone: currentPhone });
    card.querySelector(".prize-name").textContent = data.prize;
    card.classList.add("flipped");
    card.setAttribute("aria-label", `已翻开：${data.prize}`);
    elements.hint.innerHTML = `<span>✦</span> 本轮已完成 · 管理员重置后可再次选择 <span>✦</span>`;
    window.setTimeout(() => {
      elements.prizeCopy.innerHTML = `恭喜你获得<strong>「${escapeHtml(data.prize)}」</strong><br>${escapeHtml(data.redemptionText)}`;
      openModal(elements.prizeModal, elements.prizeModal.querySelector(".modal-ok"));
      celebrate();
    }, 720);
  } catch (error) {
    hasPlayed = false;
    cards.forEach((item) => item.classList.remove("locked"));
    elements.hint.textContent = "抽奖失败，请重新选择";
    showToast(error.message);
  }
}

function openModal(modal, focusTarget) {
  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => focusTarget?.focus());
}

function closeModal(modal) {
  modal.hidden = true;
  document.body.style.overflow = "";
  lastFocusedElement?.focus();
}

function openPassword(mode) {
  adminMode = mode;
  adminPassword = "";
  elements.passwordInput.value = "";
  elements.passwordError.textContent = "";
  elements.passwordHelp.textContent = mode === "config" ? "验证后可修改卡片和兑奖提示语" : "验证后可查看手机号与中奖结果";
  openModal(elements.passwordModal, elements.passwordInput);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { elements.toast.hidden = true; }, 3000);
}

function celebrate() {
  const colors = ["#7d1026", "#d3a53f", "#fff1b6", "#d75b6f"];
  elements.confetti.innerHTML = "";
  for (let i = 0; i < 48; i += 1) {
    const piece = document.createElement("i");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--drift", `${Math.random() * 180 - 90}px`);
    piece.style.setProperty("--duration", `${2.1 + Math.random() * 1.8}s`);
    piece.style.animationDelay = `${Math.random() * .4}s`;
    elements.confetti.appendChild(piece);
  }
  window.setTimeout(() => { elements.confetti.innerHTML = ""; }, 4200);
}

function renderHistory(records) {
  elements.historyEmpty.hidden = records.length > 0;
  elements.historyBody.innerHTML = records.map((record) => `
    <tr>
      <td>${escapeHtml(record.phone)}</td>
      <td>${escapeHtml(record.prize)}</td>
      <td>${new Date(record.created_at).toLocaleString("zh-CN", { hour12: false })}</td>
    </tr>`).join("");
}

elements.phoneForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const phone = elements.phoneInput.value.trim();
  if (!phone) {
    elements.phoneError.textContent = "请输入手机号后再开始抽奖";
    return;
  }
  currentPhone = phone;
  elements.currentPhone.textContent = phone;
  elements.phoneError.textContent = "";
  elements.phoneGate.hidden = true;
  elements.gameArea.hidden = false;
  renderCards();
});

document.querySelector("#changePhone").addEventListener("click", () => {
  currentPhone = "";
  elements.gameArea.hidden = true;
  elements.phoneGate.hidden = false;
  elements.phoneInput.focus();
});

document.querySelector("#resetButton").addEventListener("click", () => openPassword("config"));
document.querySelector("#historyButton").addEventListener("click", () => openPassword("history"));

elements.passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = event.submitter;
  submit.disabled = true;
  elements.passwordError.textContent = "";
  try {
    adminPassword = elements.passwordInput.value;
    if (adminMode === "config") {
      const data = await requestApi("verify-admin", { password: adminPassword });
      config = data.config;
      elements.prizesInput.value = config.prizes.join("\n");
      elements.redemptionInput.value = config.redemptionText;
      closeModal(elements.passwordModal);
      openModal(elements.configModal, elements.prizesInput);
    } else {
      const data = await requestApi("history", { password: adminPassword });
      renderHistory(data.records);
      closeModal(elements.passwordModal);
      openModal(elements.historyModal, elements.historyModal.querySelector(".close-history"));
    }
  } catch (error) {
    elements.passwordError.textContent = error.message;
    elements.passwordInput.select();
  } finally {
    submit.disabled = false;
  }
});

elements.configForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prizes = elements.prizesInput.value.split("\n").map((item) => item.trim()).filter(Boolean);
  const redemptionText = elements.redemptionInput.value.trim();
  if (!prizes.length) {
    elements.configError.textContent = "请至少填写一张卡片内容";
    return;
  }
  const submit = event.submitter;
  submit.disabled = true;
  elements.configError.textContent = "";
  try {
    const data = await requestApi("save-config", { password: adminPassword, prizes, redemptionText });
    config = data.config;
    renderCards();
    closeModal(elements.configModal);
    showToast(`已保存 ${config.prizes.length} 张卡片并完成重置`);
  } catch (error) {
    elements.configError.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
});

document.querySelectorAll(".modal-close, .modal-ok, .cancel-modal, .close-history").forEach((button) => {
  button.addEventListener("click", () => closeModal(button.closest(".modal")));
});
document.querySelectorAll(".modal-backdrop").forEach((backdrop) => backdrop.addEventListener("click", () => closeModal(backdrop.closest(".modal"))));
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const openModalElement = [...document.querySelectorAll(".modal")].find((modal) => !modal.hidden);
  if (openModalElement) closeModal(openModalElement);
});

loadConfig();
