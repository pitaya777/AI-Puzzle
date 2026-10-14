export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => [
  ...parent.querySelectorAll(selector),
];

export function createId() {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers:
      options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json", ...(options.headers || {}) },
  });

  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch {
      error = { detail: "请求失败" };
    }
    throw new Error(error.detail || "请求失败");
  }

  return response.json();
}

export function showError(error) {
  $("#alert").innerHTML = `
    <div class="error">
      <span>${escapeHtml(error.message)}</span>
      <button type="button" aria-label="关闭错误提示">×</button>
    </div>
  `;
  $("#alert button").onclick = () => {
    $("#alert").innerHTML = "";
  };
}

export function showToast(text) {
  $("#toast").innerHTML = `<div class="toast">✓ ${escapeHtml(text)}</div>`;
  window.setTimeout(() => {
    $("#toast").innerHTML = "";
  }, 3000);
}
