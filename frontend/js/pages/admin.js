export function renderAdmin(state) {
  if (!state.admin) {
    return `
      <section class="admin-screen admin-login-screen">
        <div class="admin-brand">
          <img src="/assets/design/logo.png" alt="">
          <b>拾光校园</b>
        </div>
        <form class="admin-login" id="login">
          <h1>进入管理空间</h1>
          <label>管理密码<input id="password" type="password" required placeholder="请输入管理密码"></label>
          <button class="primary wide">进入后台</button>
        </form>
      </section>
    `;
  }

  const stats = state.stats;
  const cards = {
    visit: "页面访问",
    share_click: "分享点击",
    share_copy: "复制成功",
    share_open: "分享打开",
  };

  return `
    <section class="admin-screen dashboard">
      <aside>
        <div class="admin-brand"><img src="/assets/design/logo.png" alt=""><b>拾光校园</b></div>
        <button class="active">后台主页</button>
        <button>访问统计</button><button>分享统计</button><button>任务状态</button><button>配置状态</button>
        <button id="logout">退出后台</button>
      </aside>
      <main>
        <header>
          <h1>后台主页</h1>
          <div class="admin-tools">
            <input id="start" type="date"><input id="end" type="date">
            <button class="secondary" id="statsRefresh">更新统计</button>
          </div>
        </header>
        <div class="stats">
          ${Object.entries(cards).map(([key, label]) => `
            <article><span>${label}</span><strong>${stats.total[key]}</strong><small>所选时段累计</small></article>
          `).join("")}
        </div>
        <div class="admin-grid">
          ${renderStatsTable(stats)}
          ${renderConfig(state)}
        </div>
      </main>
    </section>
  `;
}

function renderStatsTable(stats) {
  const rows = stats.daily.length
    ? stats.daily.map((day) => `
        <tr><td>${day.date}</td><td>${day.visit}</td><td>${day.share_click}</td><td>${day.share_copy}</td><td>${day.share_open}</td></tr>
      `).join("")
    : '<tr><td colspan="5">暂无事件</td></tr>';

  return `
    <section class="panel">
      <h2>访问统计</h2><p>记录用户作品分享数据</p>
      <div class="table-scroll">
        <table><tr><th>日期</th><th>访问</th><th>点击</th><th>复制</th><th>打开</th></tr>${rows}</table>
      </div>
    </section>
  `;
}

function renderConfig(state) {
  const stats = state.stats;
  return `
    <section class="panel">
      <h2>任务状态</h2><p>后台异步任务执行进度</p>
      <div class="config-row"><span>DeepSeek</span><b>${state.config.textReady ? "已配置" : "未配置"}</b></div>
      <div class="config-row"><span>Seedance 2.5</span><b>${state.config.videoReady ? "已配置" : "未配置"}</b></div>
      <div class="config-row"><span>费用预留 / 上限</span><b>¥${stats.reserved} / ¥300</b></div>
      <div class="config-row"><span>完成 / 失败</span><b>${stats.jobs.SUCCEEDED || 0} / ${stats.jobs.FAILED || 0}</b></div>
      <label class="secondary music-upload">上传背景音乐<input id="music" type="file" accept="audio/*"></label>
    </section>
  `;
}
