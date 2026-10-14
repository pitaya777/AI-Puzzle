import { escapeHtml } from "../core.js";

export function renderHome() {
  return `
    <section class="design-page home-page">
      <div class="intro-card">
        <h1>珍藏校园里的每一段细碎美好</h1>
        <p>
          把课堂、晚风、好友与青春瞬间，<br>
          化作独属于你的校园纪念。<br>
          简单几步，开启你的校园时光创作✨
        </p>
      </div>

      <div class="photo-stack" aria-label="校园照片">
        <figure class="photo-back">
          <img src="/assets/design/campus-cherry.jpg" alt="校园樱花">
        </figure>
        <figure class="photo-front">
          <img src="/assets/design/campus-building.jpg" alt="校园建筑">
          <figcaption>记录、整理、分享你的青春回忆~</figcaption>
        </figure>
      </div>

      <button class="primary design-cta" id="begin">开始创作</button>
    </section>
  `;
}

export function renderUpload(state) {
  const preview = state.previewUrl
    ? `<img class="selected-photo" src="${state.previewUrl}" alt="已选择的校园照片">`
    : `<div class="image-placeholder" aria-hidden="true"><i></i></div>`;
  const label = state.uploadFile ? "重新选择" : "选择照片";
  const note = state.uploadFile
    ? escapeHtml(state.uploadFile.name)
    : "支持jpg/png格式，图片大小不超过5M";

  return `
    <section class="design-page upload-page">
      <button class="text-back" data-go="home">‹ 返回首页</button>
      <div class="stage-title">
        <!--<span>01 </span> -->
        <h1>01&nbsp;&nbsp;&nbsp;&nbsp;选一张，旧时光</h1>
        <img src="/assets/design/mascot-photo.jpg" alt="东小龙">
      </div>

      <div class="photo-picker" id="photoPicker" role="button" tabindex="0" aria-label="选择照片">
        ${preview}
        <button type="button" class="primary upload-trigger" id="choosePhoto">${label}</button>
        <input id="photo" type="file" accept="image/jpeg,image/png">
      </div>

      <p class="file-note">${note}</p>
      <button class="primary design-next" id="toCrop" ${state.uploadFile ? "" : "disabled"}>去裁剪</button>
    </section>
  `;
}

export function renderCrop(state) {
  const focusX = Number.isFinite(state.cropFocusX) ? state.cropFocusX : 0.5;
  const focusY = Number.isFinite(state.cropFocusY) ? state.cropFocusY : 0.5;

  return `
    <section class="design-page crop-page">
      <div class="stage-title">
        <!--<span>01 /</span>-->
        <h1>01&nbsp;&nbsp;&nbsp;&nbsp;选一张，旧时光</h1>
        <img src="/assets/design/mascot-photo.jpg" alt="东小龙">
      </div>

      <div class="crop-card">
        <div
          class="crop-frame"
          id="cropFrame"
          tabindex="0"
          role="application"
          aria-label="拖动照片调整裁剪位置"
        >
          <img
            id="previewImage"
            src="${state.previewUrl || ""}"
            alt="待裁剪照片"
            draggable="false"
          >
          <span class="crop-grid" aria-hidden="true"></span>
        </div>
        <button class="primary crop-reselect" id="reselect" type="button">重新选择</button>
        <input class="hidden" id="cropPhoto" type="file" accept="image/jpeg,image/png">
      </div>

      <input id="fx" type="hidden" value="${focusX}">
      <input id="fy" type="hidden" value="${focusY}">
      <p class="crop-tip">拖动图片调整画面焦点，裁剪比例固定9：16</p>
      <div class="crop-actions">
        <button class="crop-cancel" data-go="upload" type="button">取消</button>
        <button class="primary" id="upload">确认裁剪</button>
      </div>
    </section>
  `;
}
