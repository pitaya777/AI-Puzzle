import { $, $$, api, createId, escapeHtml, showError, showToast } from "./js/core.js";
import { state, questions, memoryLabels } from "./js/state.js";
import { renderHome, renderUpload, renderCrop } from "./js/pages/home.js";
import { renderPuzzle } from "./js/pages/puzzle.js?v=modules9";
import { renderCreating, renderCelebration, renderWork } from "./js/pages/generation.js?v=modules12";
import { renderLibrary, renderShared } from "./js/pages/library.js?v=modules15";
import { renderAdmin } from "./js/pages/admin.js";

async function refreshData() {
  [state.creations, state.jobs, state.config] = await Promise.all([
    api("/creations"), api("/jobs"), api("/config"),
  ]);
}

function findJob(creationId) {
  return state.jobs.find((job) => job.creation === creationId);
}

function track(kind) {
  api("/events", {
    method: "POST",
    body: JSON.stringify({ id: createId(), kind }),
  }).catch(() => {});
}

function navigate(page) {
  state.page = page;
  state.selected = null;
  history.replaceState(null, "", `#${page}`);
  render();
  scrollTo(0, 0);
  if (page === "library") refreshData().then(render).catch(showError);
  if (page === "admin") loadStats();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-go]");
  if (button) navigate(button.dataset.go);
});

function currentPage() {
  const pages = {
    home: () => renderHome(),
    upload: () => renderUpload(state),
    crop: () => renderCrop(state),
    creating: () => renderCreating(state),
    celebrate: () => renderCelebration(state),
    puzzle: () => renderPuzzle(state),
    library: () => renderLibrary(state, findJob),
    work: () => renderWork(state.job),
    shared: () => renderShared(state),
    admin: () => renderAdmin(state),
  };
  return (pages[state.page] || pages.home)();
}

function render() {
  $("#app").innerHTML = currentPage();
  bindCurrentPage();
}

function bindCurrentPage() {
  if ($("#begin")) $("#begin").onclick = () => navigate("upload");
  if ($("#new")) $("#new").onclick = () => navigate("upload");
  const binders = {
    upload: bindUpload,
    crop: bindCrop,
    puzzle: bindPuzzle,
    library: bindLibrary,
    work: bindWork,
    admin: bindAdmin,
  };
  if (binders[state.page]) binders[state.page]();
}

function bindUpload() {
  const picker = $("#photoPicker");
  const input = $("#photo");
  const acceptFile = (file) => setUploadFile(file, render);

  input.onchange = (event) => acceptFile(event.target.files[0]);
  $("#choosePhoto").onclick = (event) => {
    event.stopPropagation();
    input.click();
  };
  picker.onclick = (event) => {
    if (event.target !== input && event.target.id !== "choosePhoto") input.click();
  };
  picker.onkeydown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      input.click();
    }
  };
  picker.ondragover = (event) => {
    event.preventDefault();
    picker.classList.add("dragging");
  };
  picker.ondragleave = () => picker.classList.remove("dragging");
  picker.ondrop = (event) => {
    event.preventDefault();
    picker.classList.remove("dragging");
    acceptFile(event.dataTransfer.files[0]);
  };
  $("#toCrop").onclick = () => navigate("crop");
}

function bindCrop() {
  const frame = $("#cropFrame");
  const image = $("#previewImage");
  const fileInput = $("#cropPhoto");
  const cropGrid = frame.querySelector(".crop-grid");
  let drag = null;

  const previewGeometry = () => {
    if (!image.naturalWidth || !image.naturalHeight) return null;
    const cropWidth = cropGrid.clientWidth;
    const cropHeight = cropGrid.clientHeight;
    const scale = Math.max(
      cropWidth / image.naturalWidth,
      cropHeight / image.naturalHeight,
    );
    const imageWidth = image.naturalWidth * scale;
    const imageHeight = image.naturalHeight * scale;
    return {
      imageWidth,
      imageHeight,
      overflowX: Math.max(0, imageWidth - cropWidth),
      overflowY: Math.max(0, imageHeight - cropHeight),
    };
  };

  const updateFocus = (x, y) => {
    state.cropFocusX = Math.max(0, Math.min(1, x));
    state.cropFocusY = Math.max(0, Math.min(1, y));
    $("#fx").value = String(state.cropFocusX);
    $("#fy").value = String(state.cropFocusY);
    const geometry = previewGeometry();
    if (!geometry) return;
    const left = (frame.clientWidth - geometry.imageWidth) / 2
      + (0.5 - state.cropFocusX) * geometry.overflowX;
    const top = (frame.clientHeight - geometry.imageHeight) / 2
      + (0.5 - state.cropFocusY) * geometry.overflowY;
    image.style.width = `${geometry.imageWidth}px`;
    image.style.height = `${geometry.imageHeight}px`;
    image.style.left = `${left}px`;
    image.style.top = `${top}px`;
  };

  const overflow = () => {
    const geometry = previewGeometry();
    if (!geometry) return { x: 0, y: 0 };
    return {
      x: geometry.overflowX,
      y: geometry.overflowY,
    };
  };

  frame.onpointerdown = (event) => {
    event.preventDefault();
    frame.setPointerCapture(event.pointerId);
    drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      focusX: state.cropFocusX,
      focusY: state.cropFocusY,
    };
    frame.classList.add("dragging");
  };
  frame.onpointermove = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const available = overflow();
    const nextX = available.x
      ? drag.focusX - (event.clientX - drag.x) / available.x
      : 0.5;
    const nextY = available.y
      ? drag.focusY - (event.clientY - drag.y) / available.y
      : 0.5;
    updateFocus(nextX, nextY);
  };
  const stopDragging = (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag = null;
    frame.classList.remove("dragging");
  };
  frame.onpointerup = stopDragging;
  frame.onpointercancel = stopDragging;
  frame.onkeydown = (event) => {
    const step = event.shiftKey ? 0.05 : 0.015;
    const keys = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (!keys[event.key]) return;
    event.preventDefault();
    updateFocus(
      state.cropFocusX + keys[event.key][0],
      state.cropFocusY + keys[event.key][1],
    );
  };

  image.onload = () => updateFocus(state.cropFocusX, state.cropFocusY);
  if (image.complete) updateFocus(state.cropFocusX, state.cropFocusY);
  $("#reselect").onclick = () => fileInput.click();
  fileInput.onchange = (event) => {
    setUploadFile(event.target.files[0], () => {
      state.page = "crop";
      render();
    });
  };
  $("#upload").onclick = createFromUpload;
}

function setUploadFile(file, onAccepted) {
  if (!file) return;
  const validType = ["image/jpeg", "image/png"].includes(file.type);
  if (!validType || file.size > 5e6) {
    showError(new Error("请选择5MB以内的JPG或PNG照片"));
    return;
  }
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.uploadFile = file;
  state.previewUrl = URL.createObjectURL(file);
  state.cropFocusX = 0.5;
  state.cropFocusY = 0.5;
  onAccepted();
}

async function createFromUpload() {
  const form = new FormData();
  form.append("photo", state.uploadFile);
  form.append("focus_x", $("#fx").value);
  form.append("focus_y", $("#fy").value);
  state.page = "creating";
  render();
  try {
    state.active = await api("/creations", { method: "POST", body: form });
    state.page = "puzzle";
    render();
  } catch (error) {
    state.page = "crop";
    render();
    showError(error);
  }
}

function bindPuzzle() {
  $$('[data-tile]').forEach((button) => {
    button.onclick = () => {
      state.selected = Number(button.dataset.tile);
      render();
    };
  });
  $$('[data-slot]').forEach((button) => {
    button.onclick = () => placeSelectedPiece(Number(button.dataset.slot));
  });
  $$('[data-answer]').forEach((button) => {
    button.onclick = () => openQuestion(Number(button.dataset.answer));
  });
  $$('[data-memory-review]').forEach((button) => {
    button.onclick = openMemoryReview;
  });
  if ($("#generate")) $("#generate").onclick = startGeneration;
}

function openMemoryReview() {
  const creation = state.active;
  const progress = creation.placed.length / (creation.rows * creation.columns);
  $("#modal").innerHTML = `
    <div class="modal-bg memory-review-bg">
      <section class="memory-review" aria-label="回忆问题列表">
        ${memoryLabels.map((label, index) => {
          const answered = Boolean(creation.answers[index]);
          const unlocked = progress >= (index + 1) / 4;
          const status = answered ? "点击查看" : unlocked ? "待你填写" : "尚未解锁";
          return `
            <button
              class="memory-review-item ${answered ? "answered" : ""}"
              data-review-answer="${index}"
              ${unlocked ? "" : "disabled"}
            >
              <i>${(index + 1) * 25}%</i>
              <span><b>${label}</b><small>${status}</small></span>
              <em aria-hidden="true">›</em>
            </button>
          `;
        }).join("")}
      </section>
    </div>
  `;
  $(".memory-review-bg").onclick = (event) => {
    if (event.target === event.currentTarget) closeModal();
  };
  $$('[data-review-answer]').forEach((button) => {
    button.onclick = () => openQuestion(Number(button.dataset.reviewAnswer));
  });
}

function closeModal() {
  $("#modal").innerHTML = "";
}

async function placeSelectedPiece(target) {
  if (state.selected === null) return;
  try {
    state.active = await api(`/creations/${state.active.id}/place`, {
      method: "POST",
      body: JSON.stringify({ piece: state.selected, target }),
    });
    state.selected = null;
    render();
    openNextQuestion();
  } catch (error) {
    showError(error);
  }
}

function openNextQuestion() {
  const creation = state.active;
  const progress = creation.placed.length / (creation.rows * creation.columns);
  const index = creation.answers.findIndex(
    (answer, questionIndex) => !answer && progress >= (questionIndex + 1) / 4,
  );
  if (index >= 0) openQuestion(index);
}

function openQuestion(index) {
  state.question = index;
  $("#modal").innerHTML = `
    <div class="modal-bg">
      <section class="modal memory-question">
        <div class="memory-meta" aria-label="第 ${index + 1} 个回忆问题，共 4 个">
          <span>MEMORY</span>
          <span>${String(index + 1).padStart(2, "0")} / 04</span>
          <span>· ${(index + 1) * 25}%</span>
        </div>
        <h2>${questions[index]}</h2>
        <p>真实的心情就很好，感言不超过100字</p>
        <textarea id="answer" maxlength="100" rows="5" aria-label="写下这段校园回忆">${escapeHtml(state.active.answers[index])}</textarea>
        <div class="memory-question-footer">
          <button class="primary" id="saveAnswer">保存这段回忆 <span aria-hidden="true">→</span></button>
          <div class="memory-section-title"><span>03&nbsp;&nbsp;聊一聊，心里话</span></div>
        </div>
        <img class="memory-question-mascot" src="/assets/design/memory-mascot.png" alt="东小龙">
      </section>
    </div>
  `;
  $("#saveAnswer").onclick = () => saveAnswer(index);
}

async function saveAnswer(index) {
  try {
    state.active = await api(`/creations/${state.active.id}/answer`, {
      method: "PUT",
      body: JSON.stringify({ index, text: $("#answer").value }),
    });
    closeModal();
    render();
  } catch (error) {
    showError(error);
  }
}

async function startGeneration() {
  state.page = "celebrate";
  render();
  await new Promise((resolve) => window.setTimeout(resolve, 1800));
  try {
    state.job = await api(`/creations/${state.active.id}/generate`, {
      method: "POST",
      body: JSON.stringify({ mode: "real" }),
    });
    state.page = "work";
    render();
    pollJob();
  } catch (error) {
    state.page = "puzzle";
    render();
    showError(error);
  }
}

function bindLibrary() {
  $$('[data-open]').forEach((button) => {
    button.onclick = () => openCreation(button.dataset.open);
  });
  $$('[data-delete]').forEach((button) => {
    button.onclick = () => confirmDelete(button.dataset.delete);
  });
}

async function openCreation(creationId) {
  const job = findJob(creationId);
  try {
    if (job) {
      state.job = job;
      state.page = "work";
      render();
      pollJob();
    } else {
      state.active = await api(`/creations/${creationId}`);
      state.page = "puzzle";
      render();
      openNextQuestion();
    }
  } catch (error) {
    showError(error);
  }
}

function confirmDelete(creationId) {
  $("#modal").innerHTML = `
    <div class="modal-bg">
      <section class="modal">
        <h2>删除这段回忆？</h2>
        <p>原图、答案、视频和分享链接会一起永久删除。</p>
        <div class="actions">
          <button class="secondary" id="cancel">取消</button>
          <button class="danger" id="confirm">确认删除</button>
        </div>
      </section>
    </div>
  `;
  $("#cancel").onclick = () => { $("#modal").innerHTML = ""; };
  $("#confirm").onclick = () => deleteCreation(creationId);
}

async function deleteCreation(creationId) {
  try {
    await api(`/creations/${creationId}`, { method: "DELETE" });
    $("#modal").innerHTML = "";
    await refreshData();
    render();
    showToast("作品已删除");
  } catch (error) {
    showError(error);
  }
}

function pollJob() {
  if (!state.job || !["QUEUED", "RUNNING"].includes(state.job.status)) return;
  window.setTimeout(async () => {
    try {
      state.job = await api(`/jobs/${state.job.id}`);
      render();
      pollJob();
    } catch (error) {
      showError(error);
    }
  }, 1800);
}

function bindWork() {
  if ($("#retry")) $("#retry").onclick = retryJob;
  if ($("#share")) $("#share").onclick = createShare;
  if ($("#copy")) $("#copy").onclick = copyShare;
  if ($("#revoke")) $("#revoke").onclick = revokeShare;
}

async function retryJob() {
  try {
    state.job = await api(`/jobs/${state.job.id}/retry`, { method: "POST" });
    render();
    pollJob();
  } catch (error) { showError(error); }
}

async function createShare() {
  try {
    track("share_click");
    const result = await api(`/jobs/${state.job.id}/share`, { method: "POST" });
    state.job.share = result.token;
    render();
  } catch (error) { showError(error); }
}

async function copyShare() {
  await navigator.clipboard.writeText(`${location.origin}/?share=${state.job.share}`);
  track("share_copy");
  showToast("链接已复制");
}

async function revokeShare() {
  try {
    await api(`/jobs/${state.job.id}/share`, { method: "DELETE" });
    state.job.share = null;
    render();
    showToast("分享已撤销");
  } catch (error) { showError(error); }
}

async function loadStats() {
  try {
    state.stats = await api("/admin/stats");
    state.admin = true;
  } catch {
    state.admin = false;
  }
  render();
}

function bindAdmin() {
  if ($("#login")) $("#login").onsubmit = loginAdmin;
  if ($("#statsRefresh")) $("#statsRefresh").onclick = refreshStats;
  if ($("#logout")) $("#logout").onclick = logoutAdmin;
  if ($("#music")) $("#music").onchange = uploadMusic;
}

async function loginAdmin(event) {
  event.preventDefault();
  try {
    await api("/admin/login", {
      method: "POST",
      body: JSON.stringify({ password: $("#password").value }),
    });
    await loadStats();
  } catch (error) { showError(error); }
}

async function refreshStats() {
  try {
    const start = $("#start").value;
    const end = $("#end").value;
    state.stats = await api(`/admin/stats?start=${start}&end=${end}`);
    render();
  } catch (error) { showError(error); }
}

async function logoutAdmin() {
  await api("/admin/logout", { method: "POST" });
  state.admin = false;
  render();
}

async function uploadMusic(event) {
  try {
    const form = new FormData();
    form.append("file", event.target.files[0]);
    await api("/admin/music", { method: "POST", body: form });
    await refreshData();
    await loadStats();
    showToast("音乐已配置");
  } catch (error) { showError(error); }
}

async function initialize() {
  try {
    await api("/session", { method: "POST" });
    track("visit");
    const token = new URLSearchParams(location.search).get("share");
    if (token) {
      state.page = "shared";
      state.share = await api(`/shared/${token}`);
      track("share_open");
    } else {
      await refreshData();
      const route = location.hash.slice(1);
      if (["library", "admin"].includes(route)) state.page = route;
    }
    render();
  } catch (error) {
    showError(error);
    render();
  }
}

initialize();
