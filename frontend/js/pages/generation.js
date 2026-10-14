import { escapeHtml } from "../core.js";

export function renderCreating(state) {
  const previewUrl = escapeHtml(
    state?.previewUrl || "/assets/design/comic-waking.png",
  );
  const focusX = Number.isFinite(state?.cropFocusX) ? state.cropFocusX * 100 : 50;
  const focusY = Number.isFinite(state?.cropFocusY) ? state.cropFocusY * 100 : 50;

  return `
    <section class="design-page waking-page">
      <h1>旧照片正在以一种新的方式醒来~</h1>

      <div class="waking-card">
        <img
          class="waking-image"
          src="${previewUrl}"
          alt="正在转换为漫画角色的上传照片"
          style="object-position:${focusX}% ${focusY}%"
        >
        <div class="waking-progress" aria-label="生成进度50%">
          <div class="waking-bar"><i style="width:50%"></i></div>
          <img class="waking-mascot" src="/assets/design/mascot-waking.png" alt="">
          <strong>50%</strong>
        </div>
      </div>

      <p class="waking-tip">提示：生成需要数秒，请不要关闭页面</p>
      <button class="waking-cancel" data-go="home" type="button">取消生成</button>
    </section>
  `;
}

export function renderCelebration(state) {
  const creationId = encodeURIComponent(state.active.id);
  return `
    <section class="design-page success-page">
      <div class="success-visual">
        <img src="/api/creations/${creationId}/photo" alt="完成拼图的校园漫画照片">
        <strong>拼图完成！</strong>
      </div>
      <h1>一部有开头，有回响的30秒纪念片正在生成~</h1>
      <p>正在准备视频生成任务...</p>
      <div class="loading-line"><i></i></div>
    </section>
  `;
}

export function renderWork(job) {
  const shareUrl = job.share ? `${location.origin}/?share=${job.share}` : "";
  const succeeded = job.status === "SUCCEEDED";
  const failed = job.status === "FAILED";
  const story = job.result?.story || "";
  const progress = generationProgress(job);

  const media = succeeded
    ? `
      <div class="video result-video">
        <video src="/api/jobs/${job.id}/video" controls playsinline></video>
      </div>
    `
    : `
      <div class="result-status-card ${failed ? "failed" : "loading"}">
        <div class="result-status">
          <img src="${failed ? "/assets/design/mascot-sad.png" : "/assets/design/mascot-waking.png"}" alt="东小龙">
          <h2>${failed ? "回忆成片失败" : "回忆正在成片"}</h2>
          <p>${failed ? "可尝试再次整理" : escapeHtml(job.stage || "整理回忆")}</p>
          ${failed
            ? (job.attempts < 3
              ? '<button class="primary" id="retry">重新加载</button>'
              : '<small class="retry-limit">已达到本次作品的重试上限</small>')
            : '<small>可以离开页面，任务会继续</small>'}
        </div>
        ${failed ? "" : `
          <div class="video-generation-progress" style="--progress:${progress}%" aria-label="视频生成进行中">
            <div><i style="width:${progress}%"></i></div>
            <img src="/assets/design/mascot-waking.png" alt="">
          </div>
        `}
      </div>
    `;

  return `
    <section class="design-page result-page">
      <div class="stage-title result-title">
        <h1>04&nbsp;&nbsp;留一部，纪念品</h1>
        <img src="/assets/design/mascot-film.jpg" alt="东小龙">
      </div>
      ${media}
      <article class="story-panel">
        <h2>画面之外，都是心里话</h2>
        <small>${story ? "以下文本内容由东小龙生成" : "故事整理完成后会显示如下"}</small>
        ${story ? `
          <div class="story-card">
            <div class="story">${escapeHtml(story)}</div>
            <img src="/assets/design/mascot-result.png" alt="东小龙">
          </div>
        ` : ""}
        ${succeeded ? renderResultActions(job, shareUrl) : ""}
      </article>
    </section>
  `;
}

function generationProgress(job) {
  if (job.status === "QUEUED") return 12;
  const stage = job.stage || "";
  if (stage.includes("整理回忆")) return 28;
  if (stage.includes("漫画")) return 52;
  if (stage.includes("即梦") || stage.includes("Seedance")) return 78;
  return 36;
}

function renderResultActions(job, shareUrl) {
  return `
    <div class="result-actions">
      <a class="primary" href="/api/jobs/${job.id}/video?download=true">下载视频</a>
      <button class="primary" id="share">分享链接</button>
    </div>
    ${job.share ? `
      <div class="share">
        <label>链接：</label>
        <input value="${escapeHtml(shareUrl)}" readonly>
        <div>
          <button class="secondary" id="copy">复制链接</button>
          <button class="secondary" id="revoke">撤销分享</button>
        </div>
        <p>注：撤销后此链接立即失效</p>
      </div>
    ` : ""}
  `;
}
