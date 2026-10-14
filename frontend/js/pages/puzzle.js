import { memoryLabels } from "../state.js";

export function tileStyle(index, creation) {
  const x = (index % creation.columns) / (creation.columns - 1) * 100;
  const y = Math.floor(index / creation.columns) / (creation.rows - 1) * 100;
  return `background-size:${creation.columns * 100}% ${creation.rows * 100}%;background-position:${x}% ${y}%`;
}

export function shuffledPieces(state, creation) {
  if (!state.pieceOrders[creation.id]) {
    const pieces = [...Array(9).keys()];
    for (let index = pieces.length - 1; index > 0; index -= 1) {
      const random = Math.floor(Math.random() * (index + 1));
      [pieces[index], pieces[random]] = [pieces[random], pieces[index]];
    }
    if (pieces.every((value, index) => value === index)) {
      pieces.push(pieces.shift());
    }
    state.pieceOrders[creation.id] = pieces;
  }

  return state.pieceOrders[creation.id].filter(
    (index) => !creation.placed.includes(index),
  );
}

function renderBoard(creation) {
  return [...Array(9).keys()]
    .map((index) => {
      const placed = creation.placed.includes(index);
      return `
        <button
          class="slot ${placed ? "done" : ""}"
          data-slot="${index}"
          style="${placed ? tileStyle(index, creation) : ""}"
        >
          ${placed ? "" : `<span>${index + 1}</span>`}
        </button>
      `;
    })
    .join("");
}

function renderPieces(state, creation, remaining) {
  if (!remaining.length) {
    return `
      <div class="complete">
        <div class="complete-icon">✓</div>
        <h3>九块时光，已经完整</h3>
      </div>
    `;
  }

  return `
    <div class="pieces" style="--photo:url('/api/creations/${creation.id}/photo')">
      ${remaining
        .map(
          (index) => `
            <button
              aria-label="碎片${index + 1}"
              data-tile="${index}"
              class="tile piece-${index + 1} ${state.selected === index ? "selected" : ""}"
              style="${tileStyle(index, creation)}"
            ></button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderMemories(creation, progress) {
  const firstUnanswered = creation.answers.findIndex((answer) => !answer);
  const index = firstUnanswered === -1 ? 3 : firstUnanswered;
  const answered = Boolean(creation.answers[index]);
  const unlocked = progress >= (index + 1) / 4;
  const status = answered ? "已保存 · 点击修改" : unlocked ? "现在可以回答" : "待你填写";

  return `
    <div class="milestone ${answered ? "done" : ""} ${unlocked ? "open" : ""}" data-memory-review>
      <i>${(index + 1) * 25}%</i>
      <button type="button">
        ${memoryLabels[index]}<small>${status}</small>
      </button>
      <span aria-hidden="true">›</span>
    </div>
  `;
}

export function renderPuzzle(state) {
  const creation = state.active;
  const progress = creation.placed.length / 9;
  const remaining = shuffledPieces(state, creation);
  const complete = progress === 1;
  const ready = complete && creation.answers.every(Boolean);
  const progressPercent = complete ? 100 : Math.floor(progress * 100);

  return `
    <section class="flow-screen puzzle-screen">
      <div class="puzzle-heading">
        <div><span>02&nbsp;&nbsp;</span><h1>拼一拼，那些年</h1></div>
        <img src="/assets/design/mascot-puzzle.png" alt="东小龙">
      </div>

      <div class="board-wrap">
        <div
          class="board"
          style="grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);--photo:url('/api/creations/${creation.id}/photo')"
        >${renderBoard(creation)}</div>
      </div>

      <section class="scattered-panel">
        ${renderPieces(state, creation, remaining)}
      </section>

      <div class="puzzle-summary">
        <div class="progress-card">
          <strong>${progressPercent}<span>%</span></strong>
          <small>散落的时光</small>
        </div>
        <button class="generate-button" id="generate" ${ready ? "" : "disabled"}>生成视频 <span>→</span></button>
      </div>

      <div class="memory-list">
        ${renderMemories(creation, progress)}
      </div>
    </section>
  `;
}
