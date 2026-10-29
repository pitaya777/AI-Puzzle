export function renderAdmin(state) {
  if (!state.admin) return renderLogin();

  const section = ["overview", "traffic"].includes(state.adminSection)
    ? state.adminSection
    : "overview";

  return `
    <section class="admin-screen dashboard">
      <aside class="admin-sidebar">
        <div class="admin-brand">
          <img src="/assets/design/logo.png" alt="">
          <span><b>拾光校园</b><small>管理中心</small></span>
        </div>
        <nav aria-label="后台导航">
          <button class="${section === "overview" ? "active" : ""}" data-admin-section="overview"><i>⌂</i>后台总览</button>
          <button class="${section === "traffic" ? "active" : ""}" data-admin-section="traffic"><i>⌁</i>访问数据</button>
        </nav>
        <div class="admin-sidebar-note">
          <img src="/assets/design/mascot-camera.jpg" alt="东小龙">
          <p>每一段校园时光，<br>都值得被认真守护。</p>
        </div>
        <button id="logout" class="admin-logout">退出管理中心</button>
      </aside>

      <main class="admin-content admin-section-${section}">${renderSection(state, section)}</main>
    </section>
  `;
}
function renderSection(state, section) {
  if (section === "traffic") return renderTrafficPage(state);
  return renderOverviewPage(state);
}

function renderOverviewPage(state) {
  const stats = state.stats;
  const latest = stats.daily[0] || { date: "暂无数据", visit: 0, share_success: 0, share_open: 0 };
  const running = (stats.jobs.QUEUED || 0) + (stats.jobs.RUNNING || 0);
  return `
    ${renderPageHead("ADMIN CONSOLE", "后台总览", "集中查看拾光校园当前的核心运行情况。")}
    ${renderStatsCards(stats)}
    <div class="overview-grid">
      <section class="panel overview-card">
        <div class="panel-heading">
          <div><span>LATEST ACTIVITY</span><h2>最近访问概况</h2></div>
        </div>
        <div class="overview-date">${latest.date}</div>
        <div class="overview-values">
          <p><strong>${latest.visit}</strong><span>页面访问</span></p>
          <p><strong>${latest.share_success}</strong><span>分享成功</span></p>
          <p><strong>${latest.share_open}</strong><span>视频播放</span></p>
        </div>
        <button data-admin-section="traffic" class="overview-link">查看完整访问数据 <span>→</span></button>
      </section>
      <section class="panel overview-card service-overview">
        <div class="panel-heading">
          <div><span>GENERATION SUMMARY</span><h2>生成服务概况</h2></div>
        </div>
        <div class="overview-values generation-values">
          <p><strong>${stats.jobs.SUCCEEDED || 0}</strong><span>已完成</span></p>
          <p><strong>${running}</strong><span>生成中</span></p>
          <p class="failed"><strong>${stats.jobs.FAILED || 0}</strong><span>失败任务</span></p>
        </div>
      </section>
    </div>
  `;
}
function renderTrafficPage(state) {
  return `
    ${renderPageHead("VISIT DATA", "访问数据", "查看每日首页访问、分享成功和分享视频播放情况。", true)}
    <div class="admin-page-body">${renderStatsTable(state)}</div>
  `;
}

function renderPageHead(eyebrow, title, description, showTools = false) {
  return `
    <header class="admin-page-head">
      <div><span>${eyebrow}</span><h1>${title}</h1><p>${description}</p></div>
      ${showTools ? `
        <div class="admin-tools">
          <label>开始日期<input id="start" type="date"></label>
          <label>结束日期<input id="end" type="date"></label>
          <button id="statsRefresh">更新统计</button>
        </div>
      ` : ""}
    </header>
  `;
}

function renderStatsCards(stats) {
  const cards = {
    visit: ["页面访问", "拾光校园首页访问次数"],
    share_success: ["分享成功", "成功复制分享链接次数"],
    share_open: ["视频播放", "分享视频实际播放次数"],
  };
  return `
    <div class="stats" aria-label="核心统计">
      ${Object.entries(cards).map(([key, value]) => `
        <article><span>${value[0]}</span><strong>${stats.total[key]}</strong><small>${value[1]}</small></article>
      `).join("")}
    </div>
  `;
}

function renderLogin() {
  return `
    <section class="admin-screen admin-login-screen">
      <div class="admin-login-shell">
        <div class="admin-login-visual">
          <div class="login-brand">
            <img src="/assets/design/logo.png" alt="">
            <b>拾光校园</b>
          </div>
          <img class="login-mascot" src="/assets/design/mascot-film.jpg" alt="拿着校园影片的东小龙">
          <h2>欢迎回到拾光校园</h2>
          <p>在这里守护每一段被拾起的校园时光。</p>
        </div>
        <form class="admin-login" id="login">
          <span class="admin-eyebrow">ADMIN CONSOLE</span>
          <h1>进入管理空间</h1>
          <p>请输入管理员账号信息</p>
          <label>
            <span>用户名</span>
            <input id="username" name="username" type="text" autocomplete="username" required maxlength="80" placeholder="请输入管理员用户名">
          </label>
          <label>
            <span>密码</span>
            <input id="password" name="password" type="password" autocomplete="current-password" required maxlength="200" placeholder="请输入管理员密码">
          </label>
          <button class="admin-login-button" type="submit">进入管理中心 <span>→</span></button>
          <button class="admin-home-link" type="button" data-go="home">返回拾光首页</button>
        </form>
      </div>
    </section>
  `;
}
function renderStatsTable(state) {
  const stats = state.stats;
  const pageSize = Number(state.adminTrafficPageSize) || 10;
  const pageCount = Math.max(1, Math.ceil(stats.daily.length / pageSize));
  const currentPage = Math.min(Math.max(1, Number(state.adminTrafficPage) || 1), pageCount);
  const firstRow = (currentPage - 1) * pageSize;
  const pageRows = stats.daily.slice(firstRow, firstRow + pageSize);
  const rows = pageRows.length
    ? pageRows.map((day) => `
        <tr><td>${day.date}</td><td>${day.visit}</td><td>${day.share_success}</td><td>${day.share_open}</td></tr>
      `).join("")
    : '<tr><td colspan="4" class="admin-empty-row">所选时间内暂无数据</td></tr>';

  return `
    <section class="panel traffic-panel" id="traffic">
      <div class="panel-heading">
        <div><span>DATA OVERVIEW</span><h2>访问与分享</h2></div>
        <p>按日期记录用户访问与作品分享情况</p>
      </div>
      <div class="table-scroll">
        <table>
          <thead><tr><th>日期</th><th>首页访问</th><th>分享成功</th><th>视频播放</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="table-pagination" aria-label="访问数据分页">
        <label>每页显示
          <select id="trafficPageSize">
            ${[5, 10, 20, 50].map((size) => `<option value="${size}" ${size === pageSize ? "selected" : ""}>${size} 条</option>`).join("")}
          </select>
        </label>
        <span>共 ${stats.daily.length} 条，第 ${currentPage} / ${pageCount} 页</span>
        <div>
          <button data-traffic-page="${currentPage - 1}" ${currentPage <= 1 ? "disabled" : ""}>上一页</button>
          <button data-traffic-page="${currentPage + 1}" ${currentPage >= pageCount ? "disabled" : ""}>下一页</button>
        </div>
      </div>
    </section>
  `;
}
