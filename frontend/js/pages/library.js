import { escapeHtml } from "../core.js";

export function renderLibrary(state, findJob) {
  const content = state.creations.length
    ? `<div class="library-grid">${state.creations.map((creation) => renderCard(creation, findJob(creation.id))).join("")}</div>`
    : `
      <div class="library-empty">
        <img src="/assets/design/mascot-photo.jpg" alt="东小龙">
        <h2>第一段回忆，还在等你。</h2>
        <p>从一张校园照片开始，给时光一个归处。</p>
      </div>
    `;

  return `
    <section class="design-page library-page">
      <div class="library-heading">
        <h1>时光收藏夹</h1>
      </div>
      ${content}
      <button class="library-new" id="new" aria-label="新建回忆">
        <span aria-hidden="true"></span>
        <b>新建回忆</b>
      </button>
      <div class="library-scroll-accent" aria-hidden="true"><i></i></div>
    </section>
  `;
}

function renderCard(creation, job) {
  const title = job?.result?.title || "一段未完待续的校园时光";
  const date = formatDate(creation.created);
  const pieceCount = Number(creation.rows || 3) * Number(creation.columns || 3);
  const status = getWorkStatus(creation, job);
  return `
    <article class="library-card">
      <div class="library-cover-wrap">
        <img class="library-cover" src="/api/creations/${creation.id}/photo" alt="校园回忆照片">
        <span class="library-status ${status.className}">${status.label}</span>
      </div>
      <div class="library-card-body">
        <div class="library-meta">
          <time>${date}</time>
          <span>${pieceCount}块</span>
        </div>
        <h2>${escapeHtml(title)}</h2>
        <div class="library-actions">
          <button class="library-delete" data-delete="${creation.id}">删除作品</button>
          <button class="library-open" data-open="${creation.id}">${job ? "查看作品" : "继续作品"}</button>
        </div>
      </div>
    </article>
  `;
}

function getWorkStatus(creation, job) {
  if (!job) {
    const total = Number(creation.rows || 3) * Number(creation.columns || 3);
    const puzzleDone = Array.isArray(creation.placed) && creation.placed.length >= total;
    const answersDone = Array.isArray(creation.answers) && creation.answers.every(Boolean);
    return puzzleDone && answersDone
      ? { label: "待生成", className: "ready" }
      : { label: "待拼图", className: "draft" };
  }
  if (job.status === "SUCCEEDED") return { label: "已成片", className: "succeeded" };
  if (job.status === "FAILED") return { label: "待重试", className: "failed" };
  return { label: "生成中", className: "running" };
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未记录日期";
  return `${date.getFullYear()} / ${date.getMonth() + 1} / ${date.getDate()}`;
}

export function renderShared(state) {
  const token = new URLSearchParams(location.search).get("share");
  const title = state.share?.result?.title || "一段分享给你的校园时光";
  const content = state.share
    ? `
      <div class="result-grid">
        <div class="video"><video src="/api/shared/${token}/video" controls></video></div>
        <article><div class="story">${escapeHtml(state.share.result.story)}</div></article>
      </div>
    `
    : '<div class="empty">分享已撤销或作品不存在。</div>';

  return `
    <section class="wrap">
      <div class="heading">
        <span class="eyebrow">A MEMORY SHARED WITH YOU</span>
        <h1>${escapeHtml(title)}</h1>
      </div>
      ${content}
    </section>
  `;
}
