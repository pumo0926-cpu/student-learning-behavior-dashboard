const state = { view: "overview", period: "week", segment: "all", userGroup: "all", selectedUser: null, selectedLessonSession: null, outcome: "refund", expandedLesson: 4 };

const icons = {
  open: '<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h6"/></svg>',
  learn: '<svg viewBox="0 0 24 24"><path d="m4 6 8-3 8 3-8 3-8-3Z"/><path d="M7 8v6c0 1 2.2 3 5 3s5-2 5-3V8M20 7v7"/></svg>',
  practice: '<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 9l2 2 4-4M8 15h8"/></svg>',
  revise: '<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 1-2.3-5.7L20 8"/><path d="M20 3v5h-5M9 12l2 2 4-5"/></svg>',
  bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M8.5 15.5a7 7 0 1 1 7 0c-.8.6-1.5 1.4-1.5 2.5h-4c0-1.1-.7-1.9-1.5-2.5Z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="m9 7 8 5-8 5V7Z"/><circle cx="12" cy="12" r="9"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  alert: '<svg viewBox="0 0 24 24"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17.5v.1"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>',
  chain: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></svg>',
  pulse: '<svg viewBox="0 0 24 24"><path d="M2 12h4l3-8 5 16 3-8h5"/></svg>',
  mood: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.5 15.5c1-.9 2.2-1.4 3.5-1.4s2.5.5 3.5 1.4M9 9.5v.1M15 9.5v.1"/></svg>',
  idle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5v5M14.5 9.5v5"/></svg>'
};

const periodFactors = { week: 1, lastWeek: .94, month: 3.82 };
const segmentFactors = { all: 1, new: .31, risk: .14 };
const formatNumber = (value) => Math.round(value).toLocaleString("zh-CN");
const scaled = (value) => formatNumber(value * periodFactors[state.period] * segmentFactors[state.segment]);
const pctShift = () => state.segment === "risk" ? -11.2 : state.segment === "new" ? 3.1 : 0;
// invert = true 用于「越低越好」的指标（断点率、异常命中率等），风险人群应当更高而不是更低。
const pct = (value, invert = false) => {
  const shifted = value + (invert ? -pctShift() : pctShift());
  return `${Math.min(100, Math.max(0, shifted)).toFixed(1)}%`;
};

const schemes = [
  { id: "chain", no: "01", title: "连续行为链路还原", color: "#1b8c72", pale: "#e8f4ef", desc: "把「跳出率 28%」还原成「断在动画 03:42、练习第 4 题」，并追踪断开后有没有回来。", footer: "回答：他在哪一步走的" },
  { id: "signal", no: "02", title: "断点前异常信号", color: "#5b7fc9", pale: "#edf2fb", desc: "对比脱离会话与完课会话，用提升度排出最能预测脱离的 12 类前置异常行为。", footer: "回答：走之前发生了什么" },
  { id: "emotion", no: "03", title: "厌烦情绪锚定与干预", color: "#f08068", pale: "#fff0ed", desc: "把异常信号加权成厌烦指数，区分受挫、无聊、涣散三型，并给出差异化干预。", footer: "回答：是不是烦了，怎么办" }
];

// 结果决策口径：先按家长最终动作分群，再回看学习过程与反馈原因。
// 数量与比例均为演示数据；原因标签来自用户反馈的主题归类。
const outcomeGroups = [
  { id: "refund", label: "退费用户", count: 186, rate: "7.8%", badge: "已发生", color: "#c65e49", pale: "#fff0ed", key: "先区分完课好与不好", question: "是没有学，还是学了却没感到效果？" },
  { id: "notRefund", label: "未退费用户", count: 2198, rate: "92.2%", badge: "留存中", color: "#1b8c72", pale: "#e8f4ef", key: "持续观察使用健康度", question: "哪些正向体验值得固化？" },
  { id: "renewed", label: "续费用户", count: 1086, rate: "45.6%", badge: "正向结果", color: "#397865", pale: "#e8f4ef", key: "孩子喜欢，且感到有效", question: "兴趣与效果如何共同出现？" },
  { id: "notRenewed", label: "未续费用户", count: 1298, rate: "54.4%", badge: "待转化", color: "#8772bb", pale: "#f2eff8", key: "成绩没有明显变化", question: "效果感知在哪一步断了？" }
];

const outcomeDetails = {
  refund: {
    eyebrow: "退费判断",
    title: "退费不是同一个问题：先看孩子有没有真正学进去",
    summary: "完课不好的人需要解决兴趣与时间冲突；完课好仍退费的人，需要解决效果感知与练习方式。两类人不能用同一套挽回动作。",
    stats: [["完课不好", "115 人", "61.8%"], ["完课较好", "71 人", "38.2%"], ["核心原因主题", "5 类", "反馈归类"]],
    action: "分别进入下方两条退费原因链，按“未学习”和“学了没效果”制定动作。"
  },
  notRefund: {
    eyebrow: "留存判断",
    title: "未退费不等于健康，需要继续识别沉默风险",
    summary: "把稳定学习者作为正向对照，同时关注低启动、低完课但尚未提出退费的用户，避免把“暂未行动”误判成满意。",
    stats: [["保持周活", "1,750 人", "79.6%"], ["连续完课", "1,426 人", "64.9%"], ["沉默风险", "208 人", "需跟进"]],
    action: "用续费用户的兴趣与效果信号做对照，提前触达沉默风险用户。"
  },
  renewed: {
    eyebrow: "续费判断",
    title: "续费用户的共同点：孩子愿意学，家长也看见了一定效果",
    summary: "续费不是单靠高完课，而是“孩子喜欢”与“家长感到有效”同时成立。应把兴趣体验和阶段性成果表达固化到产品中。",
    stats: [["稳定完课", "82.4%", "行为证据"], ["主动启动", "3.6 次/周", "兴趣信号"], ["正向反馈", "孩子喜欢", "有效果"]],
    action: "沉淀续费用户的正向路径，并用于校准退费与未续费人群的差异。"
  },
  notRenewed: {
    eyebrow: "未续费判断",
    title: "未续费的核心障碍：家长没有看到成绩的明显变化",
    summary: "即使孩子完成了一部分课程，如果产品只呈现答题过程、没有连接到校内成绩与能力变化，家长仍可能判断“没有效果”。",
    stats: [["核心反馈", "成绩无变化", "效果感知"], ["建议验证", "校内成绩", "前后测"], ["关键时点", "续费前 4 周", "主动呈现"]],
    action: "补齐阶段前后测、能力变化报告与校内题型映射，验证是否提升续费。"
  }
};

// 12 类断点前异常信号，与 anomaly_signal_dict 种子数据一一对应。
// brk = 断点会话中出现率；base = 完课会话基线；lift = brk / base。
const signals = [
  { name: "连续答错 ≥3 题", stage: "练", rule: "同会话内连续 answer 判错 3 次", brk: 61.3, base: 12.4, lift: 4.9, emo: "受挫" },
  { name: "秒答（疑似乱选）", stage: "练", rule: "连续 3 题作答耗时低于该题 P5", brk: 39.6, base: 8.3, lift: 4.8, emo: "无聊" },
  { name: "同题反复提交 ≥3 次", stage: "练", rule: "同一 question_id 提交答案 3 次以上", brk: 43.1, base: 9.8, lift: 4.4, emo: "受挫" },
  { name: "单题停留 >3× 中位", stage: "练", rule: "作答耗时超过该题历史中位耗时 3 倍", brk: 57.8, base: 15.1, lift: 3.8, emo: "受挫" },
  { name: "答案反复修改 ≥3 次", stage: "练", rule: "提交前 answer_change 达到 3 次", brk: 28.5, base: 7.6, lift: 3.8, emo: "受挫" },
  { name: "动画连续快进 ≥3 次", stage: "学", rule: "连续 seek_forward 达到 3 次", brk: 48.7, base: 13.2, lift: 3.7, emo: "无聊" },
  { name: "跳过讲解直奔练", stage: "学", rule: "动画进度 <20% 即切到练习", brk: 22.3, base: 6.1, lift: 3.7, emo: "无聊" },
  { name: "环节来回横跳 ≥4 次", stage: "全", rule: "单会话内学练改往返切换 4 次", brk: 36.4, base: 11.7, lift: 3.1, emo: "涣散" },
  { name: "静默无操作 ≥90 秒", stage: "全", rule: "相邻事件间隔 ≥90 秒且未退出", brk: 54.2, base: 18.6, lift: 2.9, emo: "涣散" },
  { name: "单次时长 >45 分钟", stage: "全", rule: "会话时长超过 45 分钟后的行为衰减", brk: 24.7, base: 10.2, lift: 2.4, emo: "疲劳" },
  { name: "同片段重复回看 ≥2 次", stage: "学", rule: "同一动画区间 replay 达到 2 次", brk: 33.8, base: 14.9, lift: 2.3, emo: "受挫" },
  { name: "频繁切后台 ≥2 次", stage: "全", rule: "单会话 app_background 达到 2 次", brk: 31.2, base: 16.4, lift: 1.9, emo: "涣散" }
];

const emoColor = { 受挫: "#f08068", 无聊: "#5b7fc9", 涣散: "#8772bb", 疲劳: "#e9b951" };

function kpiCard(label, value, trend, note, icon = "↗", down = false) {
  return `<article class="kpi-card"><div class="kpi-head"><span>${label}</span><i>${icon}</i></div><div class="kpi-value"><strong>${value}</strong><span class="trend ${down ? "down" : ""}">${trend}</span></div><small>${note}</small></article>`;
}

function insight(html) {
  return `<div class="insight-box"><span class="bulb">${icons.bulb}</span><span>${html}</span></div>`;
}

function detailHeader(title, desc, goal) {
  return `<button class="back-button" data-open="overview"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>返回总览</button><div class="section-head"><div><h2>${title}</h2><p>${desc}</p></div><span class="goal-pill">${goal}</span></div>`;
}

function rankList(rows, color) {
  const max = Math.max(...rows.map(r => r.v));
  return `<div class="rank-list">${rows.map(r => `<div class="rank-row"><span class="rank-label">${r.n}</span><div class="bar-track"><div class="bar-fill" style="width:${r.v / max * 100}%;--bar-color:${color}"></div></div><span class="rank-value">${r.s || r.v + "%"}</span></div>`).join("")}</div>`;
}

/* ===================== 总览 ===================== */

function overviewTemplate() {
  const focus = outcomeDetails[state.outcome];
  return `<section class="fade-in decision-page">
    <div class="intro-row decision-intro"><div><p class="decision-kicker">OUTCOME FIRST · 从结果倒推原因</p><h2>先看用户做了什么决定，再解释为什么</h2><p>以退费、未退费、续费、未续费四类结果为入口。退费用户进一步按完课表现拆分，避免把“没学”和“学了没效果”混成同一个问题；再用行为数据验证反馈原因。</p></div><span class="data-note"><i></i> 数量与占比为演示数据</span></div>

    <div class="outcome-grid" role="tablist" aria-label="用户结果分群">
      ${outcomeGroups.map(o => `<button class="outcome-card ${state.outcome === o.id ? "active" : ""}" data-outcome="${o.id}" role="tab" aria-selected="${state.outcome === o.id}" style="--outcome-color:${o.color};--outcome-pale:${o.pale}"><span class="outcome-top"><i></i>${o.badge}</span><span class="outcome-main"><strong>${formatNumber(o.count)}</strong><em>${o.rate}</em></span><b>${o.label}</b><small>${o.key}</small><span class="outcome-question">${o.question}${icons.arrow}</span></button>`).join("")}
    </div>

    <article class="outcome-focus" style="--focus-color:${outcomeGroups.find(o => o.id === state.outcome).color};--focus-pale:${outcomeGroups.find(o => o.id === state.outcome).pale}">
      <div class="focus-copy"><span>${focus.eyebrow}</span><h3>${focus.title}</h3><p>${focus.summary}</p></div>
      <div class="focus-stats">${focus.stats.map(s => `<div><small>${s[0]}</small><b>${s[1]}</b><em>${s[2]}</em></div>`).join("")}</div>
      <div class="focus-action"><span>下一步</span><p>${focus.action}</p></div>
    </article>

    <div class="decision-section-head"><div><span>01 / 退费用户</span><h3>先按完课表现拆成两条原因链</h3><p>同样是退费，行为证据和产品动作完全不同。</p></div><button data-open="users">查看退费用户明细 ${icons.arrow}</button></div>
    <div class="refund-split">
      <article class="refund-branch low-completion">
        <header><span class="branch-index">A</span><div><small>115 人 · 退费用户的 61.8%</small><h3>完课不好的退费用户</h3><p>核心判断：不是学了无效，而是学习没有真正发生。</p></div><strong>先解决<br>“学不进去”</strong></header>
        <div class="reason-list">
          ${decisionReason("孩子不喜欢学", "兴趣不足", "启动次数少、首段早退", "重做首课体验，增加兴趣化入口与自主选题")}
          ${decisionReason("孩子作业多，顾不上来", "时间冲突", "工作日晚间短会话、频繁中断", "拆成 10–15 分钟小节，支持灵活完成")}
          ${decisionReason("孩子没时间，基本不怎么学", "低使用", "连续多日未启动、解锁后未参课", "提供低负担学习计划，先验证真实可用时间")}
        </div>
      </article>
      <article class="refund-branch high-completion">
        <header><span class="branch-index">B</span><div><small>71 人 · 退费用户的 38.2%</small><h3>完课较好的退费用户</h3><p>核心判断：学习发生了，但家长没有认同效果或方式。</p></div><strong>优先解决<br>“学了没用”</strong></header>
        <div class="reason-list">
          ${decisionReason("孩子觉得学了没有什么效果", "效果感知", "有完课，但前后测与校内表现未呈现", "补阶段前后测、能力变化与校内知识点映射")}
          ${decisionReason("点点选选的方式没效果", "练习方式", "选择题占比高，缺少主观表达证据", "加入主观题、过程作答与老师可见的思路反馈")}
        </div>
      </article>
    </div>

    <div class="decision-section-head"><div><span>02 / 续费结果对照</span><h3>用续费用户校准正向信号，用未续费用户定位效果断点</h3><p>不仅看谁留下，还要看家长最终认可了什么。</p></div></div>
    <div class="renewal-compare">
      <article class="renewal-card renewed-card"><div class="renewal-label"><i></i>续费用户</div><h3>孩子喜欢，且有一定效果</h3><p>孩子愿意主动学是前提，家长能观察到阶段进步才会形成续费决策。</p><div class="evidence-chips"><span>主动启动</span><span>稳定完课</span><span>正向反馈</span><span>效果可见</span></div><footer><b>应固化</b><span>兴趣体验 + 阶段成果表达</span></footer></article>
      <div class="versus-mark"><span>VS</span><small>结果对照</small></div>
      <article class="renewal-card not-renewed-card"><div class="renewal-label"><i></i>未续费用户</div><h3>孩子成绩没有什么明显变化</h3><p>完成课程不自动等于家长感知有效，续费前需要把产品内学习连接到校内成绩与能力变化。</p><div class="evidence-chips"><span>成绩无变化</span><span>能力不可见</span><span>价值感不足</span></div><footer><b>应验证</b><span>前后测 + 校内题型 + 成果报告</span></footer></article>
    </div>

    <article class="panel panel-full priority-panel">
      <div class="panel-header"><div><h3>本期决策优先级</h3><p>依据结果人群、反馈原因与行为证据安排产品动作</p></div><span class="panel-tag">从结果到行动</span></div>
      <div class="priority-list">
        ${decisionPriority("P0", "完课好仍退费", "效果与题型", "加入主观题/过程作答；上线阶段效果报告", "退费率 · 方式认可度", "#c65e49")}
        ${decisionPriority("P1", "完课不好且退费", "兴趣与时间", "短课化、首课兴趣实验、灵活学习计划", "首周启动率 · 4 周完课率", "#e9b951")}
        ${decisionPriority("P1", "未续费", "成绩无变化", "续费前 4 周呈现前后测和校内能力变化", "报告查看率 · 续费率", "#8772bb")}
        ${decisionPriority("对照", "续费用户", "喜欢且有效", "沉淀正向路径，作为其他三组的基线", "主动启动 · 稳定完课", "#1b8c72")}
      </div>
    </article>

    <div class="decision-section-head behavior-entry"><div><span>03 / 行为证据下钻</span><h3>结果告诉我们先看谁，行为数据负责验证为什么</h3><p>保留现有三套连续行为分析能力，供每个结果人群继续下钻。</p></div></div>
    <div class="scheme-grid compact-schemes">${schemes.map(s => `<article class="scheme-card" data-open="${s.id}" style="--scheme-color:${s.color};--scheme-pale:${s.pale}"><div class="scheme-top"><span class="scheme-number">${s.no}</span><span class="scheme-arrow">${icons.arrow}</span></div><h3>${s.title}</h3><p>${s.desc}</p><footer><i></i>${s.footer}</footer></article>`).join("")}</div>
  </section>`;
}

function decisionReason(title, tag, evidence, action) {
  return `<div class="decision-reason"><span class="reason-dot"></span><div><h4>${title}<em>${tag}</em></h4><p><span>行为验证</span>${evidence}</p><p><span>建议动作</span>${action}</p></div></div>`;
}

function decisionPriority(level, group, reason, action, metric, color) {
  return `<div class="priority-row" style="--priority-color:${color}"><span class="priority-level">${level}</span><div><small>目标人群</small><b>${group}</b></div><div><small>核心原因</small><b>${reason}</b></div><div class="priority-action"><small>产品动作</small><b>${action}</b></div><div><small>验证指标</small><b>${metric}</b></div></div>`;
}

const breakStages = [
  { name: "练 · 知识训练", total: 45.7, color: "#5b7fc9", buckets: [["第 1–2 题", 8.2], ["第 3–4 题", 21.4], ["第 5–6 题", 12.1], ["第 7 题以后", 4.0]], hot: 1, note: "热区：第 3–4 题，占全部断点的 21.4%" },
  { name: "学 · 动画讲解", total: 31.2, color: "#1b8c72", buckets: [["0–25%", 9.4], ["25–50%", 6.1], ["50–75%", 11.8], ["75–100%", 3.9]], hot: 2, note: "热区：动画 50–75%，多为知识点反例段落" },
  { name: "改 · 错题订正", total: 23.1, color: "#8772bb", buckets: [["进入即走", 13.6], ["订正过程中", 7.2], ["延展题", 2.3], ["其他", 0]], hot: 0, note: "热区：进入订正页 30 秒内离开，占 13.6%" }
];

function breakDistribution() {
  return `<div class="break-groups">${breakStages.map(s => {
    const sum = s.buckets.reduce((a, b) => a + b[1], 0);
    return `<div class="break-group" style="--bg-color:${s.color}">
      <header><b>${s.name}</b><span>${s.total}%</span></header>
      <div class="break-track">${s.buckets.map((b, i) => b[1] ? `<i class="${i === s.hot ? "hot" : ""}" style="width:${b[1] / sum * 100}%" title="${b[0]} · ${b[1]}%"></i>` : "").join("")}</div>
      <div class="break-ticks">${s.buckets.filter(b => b[1]).map((b, i) => `<span class="${i === s.hot ? "hot" : ""}">${b[0]} ${b[1]}%</span>`).join("")}</div>
      <small>${s.note}</small>
    </div>`;
  }).join("")}</div>`;
}

const emotions = [
  { name: "投入型", key: "engaged", share: 61.2, color: "#1b8c72" },
  { name: "受挫型（太难）", key: "frustrated", share: 18.4, color: "#f08068" },
  { name: "无聊型（太简单）", key: "bored", share: 12.7, color: "#5b7fc9" },
  { name: "涣散型（分心）", key: "distracted", share: 7.7, color: "#8772bb" }
];

function emotionDonut() {
  let acc = 0;
  const stops = emotions.map(e => { const from = acc; acc += e.share; return `${e.color} ${from}% ${acc}%`; }).join(",");
  return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${stops})"><div class="donut-center"><strong>38.8%</strong><span>存在厌烦倾向</span></div></div><div class="legend-list">${emotions.map(e => `<div class="legend-row"><i style="background:${e.color}"></i><span>${e.name}</span><b>${e.share}%</b></div>`).join("")}</div></div>${insight("<b>可干预的部分：</b>受挫型与无聊型合计 <b>31.1%</b>，均由内容难度错配引起，是最直接的迭代对象；涣散型 7.7% 多与外部环境相关，只做体验减负、不做内容归因。")}`;
}

/* ===================== 方案一 · 连续行为链路还原 ===================== */

function chainTemplate() {
  return `<section class="fade-in">${detailHeader("方案一 · 连续行为链路还原", "以「会话」而非「课时」为观测单位，把每一次打开到离开还原成带时间戳的事件序列，精确定位断点位置。", "核心目标：让每一次脱离可定位")}
    <div class="kpi-grid">${kpiCard("本周会话数", scaled(5180), "+8.4%", "人均 2.2 次 / 周", "次")}${kpiCard("断点会话率", pct(28.4, true), "-2.1%", `${scaled(1472)} 次未完成即离开`, "!", true)}${kpiCard("断点后 24h 回归", pct(51.2), "+4.6%", "72 小时内回归 61.8%", "↻")}${kpiCard("回归后从头重来", pct(34.2, true), "+1.8%", "断点续学定位缺失", "↺", true)}</div>
    <div class="dashboard-grid">
      <article class="panel panel-wide"><div class="panel-header"><div><h3>单次会话回放 · SES-8842</h3><p>初二 L*（已脱敏）· 8 月 6 日 20:14–20:41 · 27 分钟 · 断点脱离</p></div><span class="panel-tag alert-tag">厌烦指数 78 · 受挫型</span></div>${sessionTimeline()}</article>
      <article class="panel"><div class="panel-header"><div><h3>断点位置分布</h3><p>本周 ${scaled(1472)} 次断点会话</p></div></div>${breakDistribution()}</article>
      <article class="panel"><div class="panel-header"><div><h3>断开之后去哪了</h3><p>断点会话的后续追踪</p></div><span class="panel-tag">连续性</span></div>${continuityMarkup()}</article>
      <article class="panel panel-wide"><div class="panel-header"><div><h3>断点热区 TOP 5</h3><p>精确到动画时间段与题号，可直接派给内容团队</p></div><div class="panel-actions"><button class="mini-tab active">本周</button><button class="mini-tab">近 4 周</button></div></div>${rankList([
        { n: "L05 · 相交线与平行线 — 动画 03:00–04:30", v: 214, s: scaled(214) + " 次" },
        { n: "L05 · 相交线与平行线 — 练习第 4 题", v: 188, s: scaled(188) + " 次" },
        { n: "L07 · 平面直角坐标系 — 练习第 3 题", v: 156, s: scaled(156) + " 次" },
        { n: "L03 · 一元一次方程 — 动画 02:05–02:40", v: 132, s: scaled(132) + " 次" },
        { n: "L06 · 实数 — 订正页进入 30 秒内", v: 118, s: scaled(118) + " 次" }
      ], "#1b8c72")}${insight("<b>同一节课出现两个热区：</b>L05「相交线与平行线」在动画 03:00–04:30（同位角/内错角辨析段）和练习第 4 题各断一次，说明不是题目单独偏难，而是<b>讲解没讲透 → 练习接不住</b>，应优先改动画而非换题。")}</article>
    </div></section>`;
}

// 一次真实会话的事件序列。flag 非空即为命中的异常信号。
const sessionSteps = [
  ["00:00", "打开产品", "session_start · 来源：桌面图标", "", ""],
  ["00:12", "进入课节「L05 · 相交线与平行线」", "unlock · 本周第 1 节", "", ""],
  ["00:20", "动画开始播放", "play · 时长 09:40", "", ""],
  ["03:42", "暂停", "pause · 停在「同位角与内错角怎么区分」", "", ""],
  ["03:50", "回看 02:50 → 03:42", "replay · 第 1 次", "", ""],
  ["04:35", "再次回看同一片段", "replay · 第 2 次", "同片段重复回看 ×2", "warn"],
  ["05:30", "连续快进 3 次", "seek_forward ×3 · 跳过 04:35 → 08:10", "动画连续快进 ≥3 次", "warn"],
  ["06:10", "切到练习", "stage_switch · 动画完成度 61%", "", ""],
  ["07:05", "第 1 题 · 答对", "answer · 用时 41 秒", "", ""],
  ["08:30", "第 2 题 · 答对", "answer · 用时 52 秒", "", ""],
  ["11:02", "第 3 题 · 答错", "answer · 用时 138 秒（该题中位 43 秒）", "单题停留 3.2× 中位", "warn"],
  ["13:40", "第 3 题 · 再次提交 · 仍错", "answer · 第 3 次尝试", "同题反复提交 ≥3 次", "warn"],
  ["16:20", "第 4 题 · 答错", "answer · 本会话连续第 3 次答错", "连续答错 ≥3 题", "danger"],
  ["17:50", "第 4 题 · 反复改答案", "answer_change ×4 · 未提交", "答案反复修改 ≥3 次", "warn"],
  ["19:20", "无任何操作", "idle · 持续 142 秒", "静默无操作 ≥90 秒", "danger"],
  ["22:10", "切到后台", "app_background · 5 分 12 秒未回", "频繁切后台", "warn"],
  ["26:42", "退出 · 停在练习第 4 题", "exit · 未完成，此后 3 天未再打开", "断点", "break"]
];

function sessionTimeline() {
  return `<div class="timeline">${sessionSteps.map(s => `<div class="tl-row ${s[4] ? "is-" + s[4] : ""}"><span class="tl-time">${s[0]}</span><span class="tl-dot"></span><div class="tl-body"><b>${s[1]}</b><small>${s[2]}</small></div>${s[3] ? `<span class="tl-flag ${s[4]}">${s[4] === "break" ? "●" : "⚠"} ${s[3]}</span>` : ""}</div>`).join("")}</div>
  ${insight("<b>这条链路说明的事：</b>课时维度只会记录「这节课未完成、正确率 50%」；连续链路能看出他<b>在讲解难点处反复回看 2 次仍没懂 → 索性快进 → 练习第 3 题起接连受挫 → 发呆 142 秒 → 离开</b>。真正该改的是动画 03:42 处的讲法，而不是第 4 题。")}`;
}

function continuityMarkup() {
  const rows = [["24 小时内回归", 51.2, "#1b8c72"], ["24–72 小时回归", 10.6, "#5b7fc9"], ["72 小时后仍未回归", 38.2, "#f08068"]];
  const modes = [["续学原位", 41.3, "#1b8c72"], ["从头重来", 34.2, "#e9b951"], ["改学别的课节", 24.5, "#8772bb"]];
  return `<div class="split-block"><p class="split-title">断点后是否回来</p><div class="stack-bar">${rows.map(r => `<i style="width:${r[1]}%;background:${r[2]}" title="${r[0]} ${r[1]}%"></i>`).join("")}</div><div class="legend-list">${rows.map(r => `<div class="legend-row"><i style="background:${r[2]}"></i><span>${r[0]}</span><b>${r[1]}%</b></div>`).join("")}</div></div>
  <div class="split-block"><p class="split-title">回来之后从哪继续</p><div class="stack-bar">${modes.map(r => `<i style="width:${r[1]}%;background:${r[2]}" title="${r[0]} ${r[1]}%"></i>`).join("")}</div><div class="legend-list">${modes.map(r => `<div class="legend-row"><i style="background:${r[2]}"></i><span>${r[0]}</span><b>${r[1]}%</b></div>`).join("")}</div></div>
  ${insight("<b>二次流失源：</b>回来的人里 34.2% 被迫从头重来，重复观看已看过的动画。补齐「断点续学」定位，预计可挽回约 ${scaled(205)} 次/周的重复消耗。".replace("${scaled(205)}", scaled(205)))}`;
}

/* ===================== 方案二 · 断点前异常信号 ===================== */

function signalTemplate() {
  return `<section class="fade-in">${detailHeader("方案二 · 断点前异常信号", "以完课会话为基线，统计脱离前 5 分钟窗口内各类异常行为的出现率与提升度，找出最能预测脱离的前置动作。", "核心目标：在孩子走之前预测到")}
    <div class="kpi-grid">${kpiCard("信号库规模", "12 项", "+3 项", "可配置阈值，改配置不改代码", "⚡")}${kpiCard("断点前命中率", pct(87.6), "+3.5%", "脱离前 5 分钟命中 ≥1 个信号", "✓")}${kpiCard("最强信号提升度", "4.9×", "—", "连续答错 ≥3 题", "↑")}${kpiCard("平均提前量", "6.4 分钟", "+0.8", "首个信号到真实退出的间隔", "时")}</div>
    <div class="dashboard-grid">
      <article class="panel panel-full"><div class="panel-header"><div><h3>断点前异常信号提升度排行</h3><p>深色 = 脱离会话出现率　浅色 = 完课会话基线　提升度 = 两者之比</p></div><div class="panel-actions"><button class="mini-tab active">按提升度</button><button class="mini-tab">按覆盖率</button></div></div>${liftTable()}</article>
      <article class="panel"><div class="panel-header"><div><h3>脱离前最后 10 步</h3><p>会话 SES-8842 · 逆序回放</p></div><span class="panel-tag alert-tag">6 步命中</span></div>${replayStrip()}</article>
      <article class="panel"><div class="panel-header"><div><h3>断点时段分布</h3><p>颜色越深代表断点会话越集中</p></div><span class="panel-tag">高峰 21–22 点</span></div>${heatmap()}${insight("21 点后断点率比 19–20 点高 <b>9.7 个百分点</b>，且以「静默 / 切后台」为主——更像<b>疲劳</b>而非内容问题，建议做时长提醒而不是改内容。")}</article>
      <article class="panel panel-full"><div class="panel-header"><div><h3>高危信号组合链</h3><p>按顺序出现的信号组合，比单一信号预测力更强</p></div><span class="panel-tag">4 条已验证</span></div>${comboChains()}</article>
    </div></section>`;
}

function liftTable() {
  const maxLift = Math.max(...signals.map(s => s.lift));
  return `<div class="lift-list">${signals.map(s => `
    <div class="lift-row" style="--emo:${emoColor[s.emo]}">
      <div class="lift-name"><b>${s.name}</b><small><em>${s.stage}</em>${s.rule}</small></div>
      <div class="lift-bars">
        <div class="lift-bar"><i style="width:${s.brk}%"></i><span>${s.brk}%</span></div>
        <div class="lift-bar base"><i style="width:${s.base}%"></i><span>${s.base}%</span></div>
      </div>
      <span class="lift-badge" style="--fill:${s.lift / maxLift * 100}%">${s.lift}×</span>
      <span class="emo-tag">${s.emo}</span>
    </div>`).join("")}</div>
    ${insight("<b>怎么读这张表：</b>提升度 4.9× 意味着「连续答错 ≥3 题」在脱离会话中出现的概率是完课会话的 4.9 倍，是最值得做实时干预的触发点。<b>注意：</b>提升度只说明相关，不等于因果——上线干预时务必留对照组验证。")}`;
}

function replayStrip() {
  const steps = sessionSteps.slice(-10);
  return `<div class="replay-strip">${steps.map((s, i) => {
    const idx = i - steps.length + 1;
    return `<div class="rp-step ${s[4] ? "is-" + s[4] : ""}"><b>${idx === 0 ? "退出" : idx}</b><span>${s[1].split(" · ")[0]}</span><small>${s[0]}</small></div>`;
  }).join("")}</div>
  <div class="rp-note"><span>倒数第 7 步起连续命中信号，此时距真实退出还有 <b>15 分 40 秒</b>，完全来得及干预。</span></div>`;
}

function heatmap() {
  const rows = ["06–09", "09–12", "12–15", "15–18", "18–21", "21–24"], days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const vals = [[.08, .06, .08, .07, .08, .12, .14], [.08, .07, .06, .08, .08, .26, .31], [.12, .11, .12, .1, .13, .35, .38], [.2, .18, .19, .22, .24, .57, .52], [.55, .58, .56, .62, .64, .68, .6], [.78, .82, .8, .86, .88, .74, .7]];
  return `<div class="heatmap-wrap"><div class="heatmap"><span></span>${days.map(d => `<span>${d}</span>`).join("")}${rows.map((r, i) => `<span>${r}</span>${vals[i].map((v, j) => `<span class="heat-cell" style="--intensity:${v};--intensity-text:${v < .3 ? '#70808a' : 'white'}" title="${days[j]} ${r}"></span>`).join("")}`).join("")}</div></div><div class="heat-legend"><span>低</span>${[.1, .25, .45, .65, .85].map(i => `<i style="--i:${i}"></i>`).join("")}<span>高</span></div>`;
}

const chains = [
  { flow: ["单题超时", "同题反复提交", "答案反复修改"], hit: 254, prob: 81.2, emo: "受挫", note: "同一题上耗尽耐心" },
  { flow: ["连续答错 ≥3", "静默 ≥90 秒"], hit: 428, prob: 78.4, emo: "受挫", note: "受挫后放空再离开" },
  { flow: ["动画快进 ≥3", "跳过讲解", "秒答 ≥3"], hit: 316, prob: 74.1, emo: "无聊", note: "内容太浅，走完流程就走" },
  { flow: ["切后台 ×2", "环节来回横跳"], hit: 197, prob: 63.5, emo: "涣散", note: "被外部打断，注意力散了" }
];

function comboChains() {
  return `<div class="chain-list">${chains.map(c => `
    <div class="chain-item" style="--emo:${emoColor[c.emo]}">
      <div class="chain-flow">${c.flow.map(f => `<span>${f}</span>`).join('<i>→</i>')}<i>→</i><b>退出</b></div>
      <div class="chain-meta">
        <div><strong>${scaled(c.hit)}</strong><small>命中会话</small></div>
        <div><strong class="chain-prob">${c.prob}%</strong><small>15 分钟内不再回来</small></div>
        <span class="emo-tag">${c.emo}</span>
      </div>
      <p class="chain-note">${c.note}</p>
    </div>`).join("")}</div>
  ${insight("<b>组合优于单点：</b>单看「静默 ≥90 秒」提升度只有 2.9×，但接在「连续答错」之后，脱离概率升到 78.4%。实时干预建议按组合链触发，可把误报率从 31% 降到 <b>14.2%</b>。")}`;
}

/* ===================== 方案三 · 厌烦情绪锚定与干预 ===================== */

function emotionTemplate() {
  return `<section class="fade-in">${detailHeader("方案三 · 厌烦情绪锚定与干预", "把断点前信号按情绪归属加权成 0–100 的厌烦指数，区分受挫、无聊、涣散三型，并配套差异化干预与效果验证。", "核心目标：把情绪推测变成可验证的动作")}
    <div class="kpi-grid">${kpiCard("平均厌烦指数", "34.6", "-2.4", "0–100，越低越投入", "指")}${kpiCard("受挫型占比", pct(18.4, true), "-1.2%", "内容偏难，可直接迭代", "难", true)}${kpiCard("无聊型占比", pct(12.7, true), "+0.6%", "内容偏浅或节奏拖沓", "浅", true)}${kpiCard("高危学生", scaled(186), "-12 人", "指数 ≥ 60，需本周干预", "!", true)}</div>
    <div class="dashboard-grid">
      <article class="panel panel-wide"><div class="panel-header"><div><h3>厌烦指数怎么算</h3><p>信号权重来自 anomaly_signal_dict，可随验证结果调参</p></div><span class="panel-tag">口径定义</span></div>${formulaBlock()}</article>
      <article class="panel"><div class="panel-header"><div><h3>情绪分型分布</h3><p>本周 ${scaled(2384)} 名学习学生</p></div></div>${emotionDonut()}</article>
      <article class="panel"><div class="panel-header"><div><h3>需本周干预</h3><p>指数最高的学生 · 已脱敏</p></div><span class="panel-tag alert-tag">查看全部</span></div>${alertList()}</article>
      <article class="panel panel-full"><div class="panel-header"><div><h3>三种厌烦的行为特征不一样，干预也必须不一样</h3><p>把「孩子是不是烦了」拆成可区分、可动作的三类</p></div></div>${emotionCompare()}</article>
      <article class="panel panel-full"><div class="panel-header"><div><h3>干预动作矩阵</h3><p>每条干预都绑定触发条件与验证指标</p></div><span class="panel-tag">可直接排期</span></div>${interventionTable()}</article>
      <article class="panel panel-full"><div class="panel-header"><div><h3>这个指数可信吗 · 三重验证</h3><p>不做验证的情绪推测等于占卜</p></div><span class="panel-tag">已验证</span></div>${validationBlock()}</article>
    </div></section>`;
}

function formulaBlock() {
  return `<div class="formula-box">
    <div class="formula-line"><span class="f-label">会话级</span><code>厌烦指数 = 100 × ( 0.45·F<sub>受挫</sub> + 0.35·B<sub>无聊</sub> + 0.20·D<sub>涣散</sub> )</code></div>
    <div class="formula-line"><span class="f-label">分项</span><code>F / B / D = Σ( w<sub>i</sub> × 命中<sub>i</sub> × e<sup>−Δt<sub>i</sub>/300</sup> ) ÷ Σ( w<sub>i</sub> )</code></div>
    <div class="formula-line"><span class="f-label">周级</span><code>周指数 = 会话均值 × ( 1 + 0.15 × 周内断点次数 ) × ( 1 − 0.10 × 24h 回归率 )</code></div>
    <p class="formula-note">Δt = 信号距断点秒数，以 300 秒为半衰期做时间衰减——越贴近脱离的异常越能代表离开时的情绪，5 分钟以前的波动几乎不计入。w<sub>i</sub> 为信号权重（0.5–1.0），按情绪归属分组求和。</p>
  </div>
  <div class="grade-scale">
    ${[["0–39", "投入", "#1b8c72", 40], ["40–59", "观察", "#e9b951", 20], ["60–79", "预警", "#f08068", 20], ["80–100", "高危", "#c65e49", 20]].map(g => `<div class="gs-seg" style="width:${g[3]}%;--c:${g[2]}"><b>${g[1]}</b><span>${g[0]}</span></div>`).join("")}
  </div>`;
}

const emotionDetail = [
  ["受挫型（太难）", "#f08068", "#fff0ed", [["主导信号", "连续答错 / 单题超时 / 反复提交"], ["断点位置", "练习第 3–5 题"], ["首答正确率", "58.3% · 明显偏低"], ["单课耗时", "38.4 分钟 · 偏长"], ["次周流失倍数", "3.4×"], ["误判风险", "可能只是这一题偏难，需看是否跨课复现"]]],
  ["无聊型（太简单）", "#5b7fc9", "#edf2fb", [["主导信号", "快进 / 秒答 / 跳过讲解"], ["断点位置", "动画 0–30% 或直接跳过"], ["首答正确率", "84.6% · 明显偏高"], ["单课耗时", "11.2 分钟 · 偏短"], ["次周流失倍数", "2.1×"], ["误判风险", "可能真的已掌握，需结合正确率排除"]]],
  ["涣散型（分心）", "#8772bb", "#f2eff8", [["主导信号", "静默 / 切后台 / 来回横跳"], ["断点位置", "无规律，任意位置"], ["首答正确率", "71.2% · 接近均值"], ["单课耗时", "31.6 分钟 · 含大量空转"], ["次周流失倍数", "1.6×"], ["误判风险", "多为外部打扰，不应归因到内容"]]]
];

function emotionCompare() {
  return `<div class="emo-grid">${emotionDetail.map(e => `<div class="emo-card" style="--stage-color:${e[1]};--stage-pale:${e[2]}">
    <div class="stage-title"><i>${e[0].slice(0, 1)}</i><div><b>${e[0]}</b><small>行为特征</small></div></div>
    ${e[3].map((m, i) => `<div class="stage-metric ${i === 5 ? "is-caveat" : ""}"><span>${m[0]}</span><strong>${m[1]}</strong></div>`).join("")}
  </div>`).join("")}</div>`;
}

function interventionTable() {
  const rows = [
    ["受挫型", "连续答错 ≥3 且 单题超时", "第 3 次答错自动降梯度 + 分步提示", "拆解该知识点讲解、补 2 道台阶题", "学生端鼓励文案，<b>不推送给家长</b>", "次周该课断点率"],
    ["无聊型", "快进 ≥3 且 秒答 ≥3", "提供「我会了」跳测入口，直给挑战题", "上线动画提速版 / 进阶题包", "解锁挑战徽章", "延展题完成率"],
    ["涣散型", "静默 ≥90 秒 或 切后台 ≥2", "25 分钟分段 + 断点续学定位", "切分短版片段（≤5 分钟）", "温和提醒；家长周报只给建议不给行为明细", "断后 24h 回归率"],
    ["疲劳型", "单次时长 >45 分钟", "强制休息提示，本次学习记为已完成", "—", "不触达", "单次时长 P90"]
  ];
  return `<div class="table-wrap"><table class="event-table"><thead><tr><th>情绪型</th><th>触发条件</th><th>产品干预</th><th>内容干预</th><th>触达策略</th><th>验证指标</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td></tr>`).join("")}</tbody></table></div>
  ${insight("<b>触达红线：</b>厌烦指数是给产品和内容团队的迭代依据，不是给家长的监控工具。家长端只输出「建议本周陪学一次」这类动作建议，不展示孩子的快进、发呆、答错等行为明细——否则监测本身会变成新的厌烦来源。")}`;
}

function alertList() {
  return `<div class="alert-list">${[["林*", "受挫型 · 连续 3 节卡在练习", "88", "#fff0ed", "#c65e49"], ["赵*宇", "无聊型 · 快进率 76%，正确率 91%", "74", "#edf2fb", "#5b7fc9"], ["陈*", "受挫型 · 订正页进入即走 ×4", "71", "#fff0ed", "#c65e49"], ["王*宁", "涣散型 · 单会话静默累计 8 分钟", "66", "#f2eff8", "#8772bb"]].map(x => `<div class="alert-row"><span class="student-avatar" style="--avatar-bg:${x[3]};--avatar-color:${x[4]}">${x[0].slice(0, 1)}</span><div><b>${x[0]}</b><small>${x[1]}</small></div><div class="risk-score"><strong>${x[2]}</strong><span>厌烦指数</span></div></div>`).join("")}</div>`;
}

function validationBlock() {
  const cards = [
    ["预测性验证", "3.2×", "厌烦指数 ≥60 组的次周「不再启动」概率，是 <40 组的 3.2 倍（n=2,384）", "#1b8c72"],
    ["主观回访验证", "r = 0.63", "抽样 412 名学生自评「最近学得烦不烦」，与指数中度正相关", "#5b7fc9"],
    ["干预实验验证", "−11.4pp", "受挫型学生 A/B 下发降梯度题包，实验组次周断点率下降 11.4 个百分点", "#f08068"]
  ];
  return `<div class="valid-grid">${cards.map(c => `<div class="valid-card" style="--vc:${c[3]}"><span>${c[0]}</span><strong>${c[1]}</strong><p>${c[2]}</p></div>`).join("")}</div>
  ${insight("<b>诚实的边界：</b>r = 0.63 说明指数能解释约四成的主观厌烦波动，剩下的来自作业量、考试周、家庭情绪等产品外因素。因此该指数只用于<b>排序和定位</b>（哪些内容、哪些学生最该先看），不用于给单个孩子下情绪结论。")}`;
}

/* ============ 课时归因 / 用户追踪的连续行为补充面板 ============
   课时表与用户矩阵回答的仍是「课时维度」的问题；下面几个面板把同一节课、
   同一个人的断点还原到「动画第几秒、第几题、第几次会话」，供两个视图直接引用。 */

// 动画时长 10:00，按 30 秒分桶统计断点次数。热区 = 03:00–04:30。
const densityBuckets = [19, 12, 9, 14, 22, 17, 58, 82, 74, 28, 19, 14, 11, 17, 12, 9, 8, 6, 5, 3];
const densityHot = [6, 7, 8];

const questionRows = [
  ["第 1 题", "88.4%", "38 秒", 21, "—", "保持"],
  ["第 2 题", "81.2%", "45 秒", 34, "—", "保持"],
  ["第 3 题", "52.6%", "96 秒", 142, "单题超时 / 同题反复提交", "难度跳变，补 1–2 道台阶题"],
  ["第 4 题", "41.3%", "128 秒", 188, "连续答错 / 答案反复修改", "拆成两问，或前置分步提示"],
  ["第 5 题", "63.8%", "71 秒", 76, "秒答", "受前两题挫败传导，非题目本身问题"],
  ["第 6 题", "69.1%", "58 秒", 41, "—", "保持"]
];

// 断点密度：把某节课「学」环节的跳出还原到动画的某一段。
function breakDensityPanel() {
  const maxDensity = Math.max(...densityBuckets);
  const label = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return `<article class="panel panel-full" style="margin-top:18px"><div class="panel-header"><div><h3>动画断点密度 · 精确到 30 秒</h3><p>以 L05「相交线与平行线」为例：横轴是动画播放位置，柱高是该时段离开的会话数</p></div><span class="panel-tag alert-tag">热区 03:00–04:30</span></div>
    <div class="density-chart"><div class="dc-plot">${densityBuckets.map((v, i) => `<i class="${densityHot.includes(i) ? "hot" : ""}" style="--h:${v / maxDensity * 100}%" title="${label(i * 30)}–${label(i * 30 + 30)} · ${v} 次断点"></i>`).join("")}</div><div class="dc-axis">${["00:00", "02:30", "05:00", "07:30", "10:00"].map(t => `<span>${t}</span>`).join("")}</div></div>
    ${insight("<b>这一条是课时表给不出的：</b>课时表只能说 L05 跳出率 18.7%；密度条能指到 03:00–04:30 这一段共 <b>214 次</b>断点、占该课学环节断点的 48.7%。这段正是「同位角与内错角辨析」的讲解，且有 <b>33.8%</b> 的学生在此重复回看 ≥2 次仍然离开——不是没在听，是<b>讲了但没讲懂</b>。工单可以直接写成「重录 03:00–04:30」。")}
  </article>`;
}

// 逐题诊断：把「练」环节的跳出还原到具体题号，并挂上断点前的主导信号。
function questionDiagnosisPanel() {
  return `<article class="panel panel-full" style="margin-top:18px"><div class="panel-header"><div><h3>逐题诊断 · L05</h3><p>正确率、耗时、断点次数与断点前主导信号对齐看</p></div><span class="panel-tag">6 道训练题</span></div>
    <div class="table-wrap"><table class="event-table"><thead><tr><th>题号</th><th>首答正确率</th><th>中位耗时</th><th>断点次数</th><th>断点前主导信号</th><th>建议动作</th></tr></thead><tbody>${questionRows.map(r => `<tr class="${r[3] > 100 ? "row-alert" : ""}"><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${scaled(r[3])}</td><td>${r[4]}</td><td>${r[5]}</td></tr>`).join("")}</tbody></table></div>
    ${insight("<b>梯度断层：</b>第 2 题到第 3 题，首答正确率从 81.2% 掉到 52.6%（<b>−28.6 个百分点</b>），中位耗时翻倍——典型的难度跳变。第 5 题正确率回升却出现秒答，是<b>前两题受挫后的放弃性作答</b>，属于传导而非题目本身的问题；改掉第 3、4 题，它会自动好转。")}
  </article>`;
}

// 改版效果验证：证明「按断点位置改内容」这件事本身有效。
function versionComparePanel() {
  return `<article class="panel panel-full" style="margin-top:18px"><div class="panel-header"><div><h3>上次改版效果验证</h3><p>L05 内容版本 v1.2 → v1.3 · 第 15 周上线</p></div><span class="panel-tag">已验证有效</span></div>
    ${versionCompare()}</article>`;
}

function versionCompare() {
  const rows = [["断点会话率", "34.2%", "28.4%", "-5.8pp", true], ["03:00–04:30 断点占比", "66.2%", "48.7%", "-17.5pp", true], ["第 4 题首答正确率", "41.3%", "52.7%", "+11.4pp", true], ["第 3 题首答正确率", "52.6%", "52.6%", "持平", false]];
  return `<div class="table-wrap"><table class="event-table"><thead><tr><th>指标</th><th>v1.2</th><th>v1.3</th><th>变化</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><span class="delta ${r[4] ? "good" : "flat"}">${r[3]}</span></td></tr>`).join("")}</tbody></table></div>
  ${insight("v1.3 给反例段加了分步演示，断点率下降 5.8pp，<b>方法有效</b>。第 3 题这次没动，指标纹丝不动——反过来印证了改动与效果的对应关系。下一步按同样方式改第 3 题梯度。")}`;
}

const drilldownSessions = [
  ["SES-8842", "8/6 20:14", "27 分钟", "练", "断点 · 练习第 4 题", 6, 78, "break"],
  ["SES-8701", "8/4 20:32", "19 分钟", "练", "断点 · 练习第 3 题", 4, 71, "break"],
  ["SES-8566", "8/1 21:05", "12 分钟", "学", "断点 · 动画 03:50", 3, 64, "break"],
  ["SES-8402", "7/30 20:11", "34 分钟", "改", "完成闭环", 1, 38, ""],
  ["SES-8255", "7/28 19:48", "31 分钟", "改", "完成闭环", 0, 26, ""]
];

const renewalBands = [
  ["0–39 · 投入", 1459, "12.4%", "71.3%", "4.2%", "#1b8c72"],
  ["40–59 · 观察", 739, "31.6%", "52.8%", "11.7%", "#e9b951"],
  ["60–79 · 预警", 118, "58.2%", "28.4%", "26.5%", "#f08068"],
  ["80–100 · 高危", 68, "76.9%", "14.6%", "43.1%", "#c65e49"]
];

// 跨会话退化：同一个人连续几次会话的断点越来越早，是「厌烦」最直接的证据链。
function sessionDegradationPanel() {
  return `<article class="panel panel-full" style="margin-top:18px"><div class="panel-header"><div><h3>跨会话退化曲线 · 王*宁（已流失）</h3><p>最近 5 次会话逆序排列——从完整闭环一路退化到 12 分钟就断</p></div><span class="panel-tag alert-tag">厌烦指数 26 → 78</span></div>
    <div class="table-wrap"><table class="event-table"><thead><tr><th>会话</th><th>时间</th><th>时长</th><th>到达环节</th><th>结果</th><th>命中信号</th><th>厌烦指数</th></tr></thead><tbody>${drilldownSessions.map(s => `<tr class="${s[7] ? "row-alert" : ""}"><td>${s[0]}</td><td>${s[1]}</td><td>${s[2]}</td><td>${s[3]}</td><td>${s[4]}</td><td>${s[5]} 个</td><td><span class="score-pill" style="--sc:${s[6] >= 60 ? "#c65e49" : s[6] >= 40 ? "#e9b951" : "#1b8c72"}">${s[6]}</span></td></tr>`).join("")}</tbody></table></div>
    ${insight("<b>这就是「锚定」要的证据链：</b>7/28 还能完整走完学练改（指数 26），7/30 起断点位置一次比一次早——改 → 练第 4 题 → 练第 3 题 → 动画 03:50，会话时长从 31 分钟压到 12 分钟，指数从 26 爬到 78。<b>上面的状态矩阵只会显示「最近几节未参课」，看不到这条退化曲线。</b>")}
  </article>`;
}

// 厌烦指数 × 续费：把过程情绪接到半年包的商业结果上。
function boredomRenewalPanel() {
  return `<article class="panel panel-full" style="margin-top:18px"><div class="panel-header"><div><h3>厌烦指数 × 半年包续费</h3><p>把过程情绪和最终商业结果对上，是给这套监测排期的依据</p></div><span class="panel-tag">${scaled(2384)} 人</span></div>
    <div class="table-wrap"><table class="event-table"><thead><tr><th>厌烦指数区间</th><th>学生数</th><th>周均断点率</th><th>半年包续费率</th><th>到期前停用率</th></tr></thead><tbody>${renewalBands.map(b => `<tr><td><span class="band-dot" style="--sc:${b[5]}"></span>${b[0]}</td><td>${scaled(b[1])}</td><td>${b[2]}</td><td><b>${b[3]}</b></td><td>${b[4]}</td></tr>`).join("")}</tbody></table></div>
    ${insight(`<b>投入组续费率是高危组的 4.9 倍（71.3% vs 14.6%）。</b>按当前分布，把「预警 + 高危」共 ${scaled(186)} 人拉回观察区间，预计可多留住约 ${scaled(60)} 个半年包。<b>提醒：</b>这是相关性不是因果，续费还受价格、升学季等因素影响，实际增量需以干预实验的对照组为准。`)}
  </article>`;
}

/* ===================== 数据模型 ===================== */

const lessonRows = [
  {name:"L01 · 有理数与数轴",time:"解锁后 0.8 天",duration:"24.6 min",jump:6.8,attend:92.4,finish:86.1,accuracy:84.2,answer:"54s",cause:"表现良好",tone:"good"},
  {name:"L02 · 整式的加减",time:"解锁后 1.1 天",duration:"27.3 min",jump:8.2,attend:89.7,finish:81.6,accuracy:79.8,answer:"61s",cause:"练习偏长",tone:"watch"},
  {name:"L03 · 一元一次方程",time:"解锁后 1.4 天",duration:"31.8 min",jump:12.6,attend:86.2,finish:74.3,accuracy:72.1,answer:"78s",cause:"题目梯度",tone:"risk"},
  {name:"L04 · 几何图形初步",time:"解锁后 1.2 天",duration:"28.9 min",jump:9.4,attend:84.8,finish:77.9,accuracy:76.5,answer:"69s",cause:"动画跳看",tone:"watch"},
  {name:"L05 · 相交线与平行线",time:"解锁后 1.7 天",duration:"34.2 min",jump:18.7,attend:80.3,finish:66.8,accuracy:68.4,answer:"93s",cause:"优先迭代",tone:"risk"},
  {name:"L06 · 实数",time:"解锁后 1.5 天",duration:"29.5 min",jump:11.3,attend:78.9,finish:71.2,accuracy:74.7,answer:"72s",cause:"订正流失",tone:"watch"},
  {name:"L07 · 平面直角坐标系",time:"解锁后 1.9 天",duration:"35.7 min",jump:20.1,attend:75.1,finish:61.5,accuracy:65.9,answer:"101s",cause:"优先迭代",tone:"risk"},
  {name:"L08 · 二元一次方程组",time:"解锁后 1.6 天",duration:"32.1 min",jump:14.5,attend:73.6,finish:68.3,accuracy:70.2,answer:"88s",cause:"题目耗时",tone:"risk"},
  {name:"L09 · 月度综合挑战",time:"解锁后 1.3 天",duration:"36.4 min",jump:16.2,attend:71.8,finish:64.7,accuracy:67.6,answer:"96s",cause:"综合难度",tone:"risk"}
];

const questionTypeCycle = ["选择题", "填空题", "选择题", "解答题", "选择题", "解答题"];
const questionTimeOffsets = [-22, -9, 11, 34, 18, -3];
const questionAccuracyOffsets = [9.2, 4.6, -7.8, -15.4, 1.8, 6.1];
const questionJumpOffsets = [-2.1, -.8, 2.6, 6.9, 3.2, 1.1];

function lessonQuestionMetrics(lessonIndex) {
  const lesson = lessonRows[lessonIndex];
  const baseTime = Number.parseInt(lesson.answer, 10);
  return questionTypeCycle.map((type, questionIndex) => {
    const time = Math.max(18, baseTime + questionTimeOffsets[questionIndex] + (lessonIndex % 3) * 2);
    const accuracy = Math.min(96, Math.max(31, lesson.accuracy + questionAccuracyOffsets[questionIndex] - (lessonIndex % 2) * .7));
    const jump = Math.min(29, Math.max(1.2, lesson.jump * .55 + questionJumpOffsets[questionIndex] + (lessonIndex % 3) * .35));
    const students = Math.round(2384 * lesson.attend / 100 * (1 - questionIndex * .035));
    let diagnosis = "表现正常", tone = "good";
    if (accuracy < 58 || jump >= 15) { diagnosis = accuracy < 58 ? "难度过高" : "高跳出"; tone = "risk"; }
    else if (time >= 95 || jump >= 10) { diagnosis = time >= 95 ? "耗时偏长" : "跳出偏高"; tone = "watch"; }
    return { no: `第 ${questionIndex + 1} 题`, type, students, time, accuracy: accuracy.toFixed(1), jump: jump.toFixed(1), diagnosis, tone };
  });
}

function questionMetricTable(lessonIndex, compact = false) {
  const rows = lessonQuestionMetrics(lessonIndex);
  return `<div class="table-wrap"><table class="event-table question-metric-table ${compact ? "compact" : ""}"><thead><tr><th>题目</th><th>题型</th><th>答题人数</th><th>答题时长</th><th>答题正确率</th><th>答题跳出率 <span title="进入该题后未提交即离开本课时的人数 / 进入该题人数">?</span></th><th>题目诊断</th></tr></thead><tbody>${rows.map(q => `<tr class="${q.tone === "risk" ? "question-risk-row" : ""}"><td><b>${q.no}</b></td><td><span class="question-type">${q.type}</span></td><td>${formatNumber(q.students)}</td><td><span class="question-value ${q.time >= 95 ? "is-risk" : ""}">${q.time}s</span></td><td><span class="metric-inline"><i style="--value:${q.accuracy}%"></i><b class="${Number(q.accuracy) < 60 ? "is-risk" : ""}">${q.accuracy}%</b></span></td><td><span class="metric-inline jump"><i style="--value:${Math.min(100, Number(q.jump) * 4)}%"></i><b class="${Number(q.jump) >= 15 ? "is-risk" : ""}">${q.jump}%</b></span></td><td><span class="cause-pill ${q.tone}">${q.diagnosis}</span></td></tr>`).join("")}</tbody></table></div>`;
}

function lessonAttributionRows() {
  return lessonRows.map((r, i) => {
    const expanded = state.expandedLesson === i;
    return `<tr class="lesson-summary-row ${expanded ? "is-expanded" : ""}" data-toggle-lesson-questions="${i}" tabindex="0" aria-expanded="${expanded}"><td><span class="lesson-expand-icon">${expanded ? "−" : "+"}</span><b>${r.name}</b></td><td>${r.time}</td><td>${r.duration}</td><td class="${r.jump > 15 ? "metric-bad" : ""}">${r.jump}%</td><td>${r.attend}%</td><td>${r.finish}%</td><td>${r.accuracy}%</td><td>${r.answer}</td><td><span class="cause-pill ${r.tone}">${r.cause}</span></td></tr>${expanded ? `<tr class="question-breakdown-row"><td colspan="9"><div class="question-breakdown"><div class="question-breakdown-head"><div><span>题目明细</span><b>${r.name} · 6 道训练题</b><small>答题时长、正确率和跳出率均按题目统计</small></div><button data-lesson-detail="${i}">打开课时详情 →</button></div>${questionMetricTable(i)}</div></td></tr>` : ""}`;
  }).join("");
}

const trackingUsers = [
  {id:"STU-1024",name:"林*然",churn:false,renew:true,states:["done","done","done","done","done","done","done","done","done"]},
  {id:"STU-1087",name:"赵*宇",churn:false,renew:true,states:["done","done","done","done","done","done","learning","missed","learning"]},
  {id:"STU-1132",name:"陈*欣",churn:false,renew:false,states:["done","done","done","exit","done","learning","missed","missed","missed"]},
  {id:"STU-1196",name:"王*宁",churn:true,renew:false,states:["done","done","exit","missed","missed","missed","missed","missed","missed"]},
  {id:"STU-1251",name:"周*文",churn:false,renew:false,states:["done","done","done","done","exit","done","learning","missed","missed"]},
  {id:"STU-1308",name:"刘*浩",churn:true,renew:false,states:["done","exit","missed","missed","missed","missed","missed","missed","missed"]},
  {id:"STU-1364",name:"许*彤",churn:false,renew:true,states:["done","done","done","done","done","done","done","learning","done"]},
  {id:"STU-1419",name:"郑*一",churn:false,renew:false,states:["done","done","learning","done","done","exit","missed","missed","missed"]}
];

const userGroups = [
  ["all","全部用户","2,384"],["churn","退费用户","186"],["active","未退费用户","2,198"],["renewed","续费用户","1,086"],["notRenewed","未续费用户","1,298"]
];
const statusMeta = { done:["完课","done"], learning:["参课中","learning"], exit:["跳出","exit"], missed:["未参课","missed"] };

function drawerShell() {
  return `<div class="drawer-layer" id="detailDrawer"><button class="drawer-backdrop" data-close-drawer aria-label="关闭详情"></button><aside class="detail-drawer" aria-label="下钻详情"><button class="drawer-close" data-close-drawer aria-label="关闭">×</button><div id="drawerContent"></div></aside></div>`;
}

function lessonTemplate() {
  return `<section class="fade-in">${detailHeader("课时维度归因", "沿解锁顺序比较每节课的参与、完成与答题体验，识别最值得优先迭代的内容。", "目标：找到指标变化的产品原因")}
    <div class="analysis-toolbar"><div><span>当前班期</span><b>2026 暑期 · 初一数学 A 班</b></div><label>对比口径<select><option>同班期全部用户</option><option>未流失用户</option><option>续费用户</option></select></label><span class="data-note"><i></i> 演示数据</span></div>
    <div class="kpi-grid">
      ${kpiCard("本月解锁课时","9 / 9","已全部解锁","四周 8 节 + 月度挑战 1 节","课")}
      ${kpiCard("平均参课率","82.6%","-2.1%","随课时推进略有下降","人",true)}
      ${kpiCard("平均参完率","73.5%","-3.4%","完课人数 / 参课人数","✓",true)}
      ${kpiCard("高优迭代课时","3 节","+1 节","满足至少 2 项异常规则","!",true)}
    </div>
    <article class="panel attribution-panel"><div class="panel-header"><div><h3>课时表现与归因</h3><p>点击课时展开题目，逐题查看答题时长、答题正确率与答题跳出率</p></div><div class="legend-inline"><span><i class="legend-good"></i>健康</span><span><i class="legend-watch"></i>观察</span><span><i class="legend-risk"></i>迭代</span></div></div>
      <div class="metric-definition"><span><b>课时层</b>先定位异常课时</span><i>→</i><span><b>题目层</b>再定位具体题目</span><em>答题跳出率 = 进入该题后未提交即离开本课时 / 进入该题人数</em></div>
      <div class="table-wrap attribution-wrap"><table class="event-table attribution-table"><thead><tr><th>课时</th><th>完成时间</th><th>完成时长</th><th>课时跳出率</th><th>参课率</th><th>参完率</th><th>课时答题正确率</th><th>课时题均时长</th><th>归因结论</th></tr></thead><tbody>${lessonAttributionRows()}</tbody></table></div>
    </article>
    <div class="insight-box"><span class="bulb">${icons.bulb}</span><span><b>归因结论：</b>L05、L07 同时出现动画跳出高、题均耗时长和参完率低；优先拆短讲解、降低首组题目难度，再以同班期未流失用户作为对照组验证。</span></div>
    ${breakDensityPanel()}
    ${versionComparePanel()}
    ${drawerShell()}
  </section>`;
}

function userMatchesGroup(user) {
  return state.userGroup === "all" || (state.userGroup === "churn" && user.churn) || (state.userGroup === "active" && !user.churn) || (state.userGroup === "renewed" && user.renew) || (state.userGroup === "notRenewed" && !user.renew);
}

function userLessonRecord(user, lessonIndex) {
  const status = user.states[lessonIndex];
  if (status === "missed") return { attended: false, status: "未参" };
  const seed = Number(user.id.slice(-2)) + lessonIndex * 7;
  const duration = status === "done" ? 23 + lessonIndex + seed % 5 : status === "exit" ? 27 : 14 + seed % 6;
  const day = String(Math.min(30, 2 + lessonIndex * 3)).padStart(2, "0");
  const hour = 19 + lessonIndex % 2;
  const minute = (seed * 3) % 48;
  const endTotal = hour * 60 + minute + duration;
  const time = `08/${day} ${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}–${String(Math.floor(endTotal/60)).padStart(2,"0")}:${String(endTotal%60).padStart(2,"0")}`;
  const jumpNodes = ["学·动画 68%", "练·第 3 题", "改·订正入口"];
  const accuracy = Math.max(46, 91 - lessonIndex * 3 - (user.churn ? 13 : 0) - seed % 6);
  const baseTimes = [38, 56, 82, 11, 69, 104];
  const questions = baseTimes.map((base, q) => {
    const seconds = Math.max(7, base + (seed + q * 5) % 17 - 8);
    const correct = (seed + q + lessonIndex) % 4 !== 0;
    let anomaly = "";
    if (seconds <= 15) anomaly = "秒答";
    else if (q === 2 && (seed + lessonIndex) % 3 === 0) anomaly = "反复×3";
    else if (seconds >= 100) anomaly = "过长";
    return { seconds, correct, anomaly };
  });
  return {
    attended: true,
    status: status === "done" ? "完课" : "参未完",
    statusClass: status === "done" ? "done" : "unfinished",
    time,
    duration: `${duration} min`,
    jump: status === "done" ? "—" : status === "learning" ? "当前·练第 4 题" : jumpNodes[lessonIndex % jumpNodes.length],
    accuracy: `${accuracy}%`,
    questions
  };
}

function questionDetailCell(question, index) {
  return `<td><div class="question-detail ${question.anomaly ? "has-anomaly" : ""}"><b>Q${index + 1} · ${question.seconds}s</b><small class="${question.correct ? "correct" : "wrong"}">${question.correct ? "✓ 正确" : "× 错误"}</small>${question.anomaly ? `<em class="${question.anomaly.includes("秒答") ? "instant" : question.anomaly.includes("反复") ? "repeat" : "slow"}">${question.anomaly}</em>` : ""}</div></td>`;
}

// 单次会话的异常统计与情绪判定。会话回放和月度四步链共用这一个口径，
// 否则同一个学生在两处会给出互相矛盾的信号数与厌烦指数。
function sessionEmotion(record) {
  const isBreak = record.status === "参未完";
  const qs = record.questions.map((q, i) => ({ ...q, no: i + 1 }));
  const instant = qs.filter(q => q.anomaly === "秒答");
  const repeat = qs.filter(q => q.anomaly.includes("反复"));
  const slow = qs.filter(q => q.anomaly === "过长");
  let streak = 0, maxStreak = 0;
  qs.forEach(q => { streak = q.correct ? 0 : streak + 1; maxStreak = Math.max(maxStreak, streak); });
  const flagCount = instant.length + repeat.length + slow.length + (isBreak ? 3 : 0);
  const score = Math.min(96, (isBreak ? 46 : 12) + repeat.length * 9 + slow.length * 7 + maxStreak * 6 + instant.length * 4);
  const type = score < 40 ? "投入型" : (repeat.length + slow.length + maxStreak) >= instant.length ? "受挫型" : "无聊型";
  return { isBreak, qs, instant, repeat, slow, maxStreak, flagCount, score, type };
}

// 月度聚合：把该学生所有参课会话的判定汇总，四步链的每个数字都由此而来。
function userMonthlyProfile(user) {
  const records = lessonRows.map((_, i) => userLessonRecord(user, i)).filter(r => r.attended);
  const items = records.map(r => ({ record: r, em: sessionEmotion(r) }));
  const sum = (pick) => items.reduce((s, x) => s + pick(x.em), 0);
  const slow = sum(e => e.slow.length), repeat = sum(e => e.repeat.length), instant = sum(e => e.instant.length);
  const breaks = items.filter(x => x.em.isBreak).length;
  const index = items.length ? Math.round(sum(e => e.score) / items.length) : 0;
  const type = index < 40 ? "投入型" : (repeat + slow) >= instant ? "受挫型" : "无聊型";
  const worst = [...items].sort((a, b) => b.em.score - a.em.score)[0];
  return { records, items, slow, repeat, instant, breaks, index, type, worst };
}

function userMonitoringFlow(user = null) {
  const attended = user ? user.states.filter(s => s !== "missed").length : null;
  const completed = user ? user.states.filter(s => s === "done").length : null;
  const p = user ? userMonthlyProfile(user) : null;
  let signalText = null, moodText = null, fixText = null;
  if (p) {
    const parts = [];
    if (p.slow) parts.push(`单题过长 ×${p.slow}`);
    if (p.repeat) parts.push(`反复提交 ×${p.repeat}`);
    if (p.instant) parts.push(`秒答 ×${p.instant}`);
    signalText = parts.length ? `${parts.join(" · ")}${p.breaks ? ` · 断点 ${p.breaks} 次` : ""}` : "本月无异常信号";
    moodText = `${p.type} · 厌烦指数 ${p.index}`;
    const w = p.worst;
    fixText = !w ? "暂无可定位的优化点"
      : w.em.isBreak ? `优先：${w.record.jump} 前置台阶题`
        : p.type === "无聊型" ? "优先：开放跳测 + 进阶题包"
          : p.repeat || p.slow ? `优先：拆解第 ${[...w.em.qs].sort((a, b) => b.seconds - a.seconds)[0].no} 题` : "保持当前梯度，观察月度课";
  }
  const steps = [
    ["01", "连续学习表现", user ? `${attended}/9 参课 · ${completed}/9 完课` : "月度 9 节状态 + 会话回放", "先还原每次打开到离开的真实过程", "chain"],
    ["02", "异常信号", signalText || "断点前 5 分钟 · 12 类信号", "判断离开前发生了什么", "signal"],
    ["03", "用户情绪识别", moodText || "受挫 / 无聊 / 涣散三型", "把连续行为转成可验证的情绪判断", "emotion"],
    ["04", "断点优化点", fixText || "定位到动画秒段与具体题号", "将情绪原因落到可改的产品位置", "lesson"]
  ];
  return `<section class="user-monitoring-flow"><div class="monitor-flow-head"><div><span>用户追踪下的监测方案</span><h3>连续表现 → 异常信号 → 情绪识别 → 断点优化</h3><p>${user ? `当前聚焦 ${user.name}，所有结论均从其月度连续行为推导。` : "先选择用户或打开示例会话，再沿四步诊断链定位产品优化点。"}</p></div>${user ? "" : '<button data-example-session>打开会话样例 · SES-8842</button>'}</div><div class="monitor-flow-grid">${steps.map((s,i)=>`<button data-open="${s[4]}" class="monitor-flow-card"><i>${s[0]}</i><span><b>${s[1]}</b><strong>${s[2]}</strong><small>${s[3]}</small></span>${i<steps.length-1?'<em>→</em>':""}</button>`).join("")}</div></section>`;
}

// 会话回放全部由 record.questions 的真实逐题数据推导，不写死事件。
// 否则完课的会话也会显示「连续答错、静默 142 秒」，与统计框和页脚结论互相矛盾。
function lessonSessionReplay(user, lessonIndex, record) {
  const isBreak = record.status === "参未完";
  const sessionId = isBreak ? "SES-8842" : `SES-${8200 + lessonIndex * 37 + Number(user.id.slice(-2))}`;
  const totalSec = parseInt(record.duration, 10) * 60;
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  const { qs, instant, repeat, slow, maxStreak, flagCount, score, type } = sessionEmotion(record);

  const learnEnd = Math.round(totalSec * (isBreak ? .34 : .42));
  const events = [["00:00", "打开课时", "session_start", ""], ["00:12", "进入动画", "play · 从 00:00 开始", ""]];
  if (isBreak) {
    events.push([mmss(learnEnd * .55), "暂停难点", "pause · 停在讲解难点处", "warn"]);
    events.push([mmss(learnEnd * .78), "重复回看", "replay ×2 · 同一片段", "warn"]);
  }
  events.push([mmss(learnEnd), "切到练习", `stage_switch · 动画完成 ${isBreak ? 61 : 100}%`, ""]);
  const slot = (totalSec - learnEnd) / (qs.length + 1);
  qs.forEach((q, i) => {
    const tone = q.anomaly === "过长" || q.anomaly.includes("反复") ? "danger" : q.anomaly === "秒答" ? "warn" : "";
    events.push([
      mmss(learnEnd + slot * (i + 1)),
      q.anomaly ? `第 ${q.no} 题 · ${q.anomaly}` : `第 ${q.no} 题 · ${q.correct ? "答对" : "答错"}`,
      `用时 ${q.seconds}s · ${q.correct ? "正确" : "错误"}`, tone
    ]);
  });
  if (isBreak) events.push([mmss(totalSec - 90), "静默无操作", "idle · 90 秒未响应", "warn"]);
  events.push([mmss(totalSec), isBreak ? "退出课时" : "完成学练改",
    isBreak ? `exit · ${record.jump}` : "complete · 学练改闭环", isBreak ? "break" : "done"]);

  const chain = [];
  if (isBreak) chain.push("重复回看");
  if (slow.length) chain.push(`单题过长 ×${slow.length}`);
  if (repeat.length) chain.push(`反复提交 ×${repeat.length}`);
  if (maxStreak >= 2) chain.push(`连续答错 ×${maxStreak}`);
  if (instant.length) chain.push(`秒答 ×${instant.length}`);
  if (isBreak) chain.push("静默");

  const worst = [...qs].sort((a, b) => b.seconds - a.seconds)[0];
  const mood = type === "受挫型" ? `多次尝试仍未通过，判为受挫型（指数 ${score}）`
    : type === "无聊型" ? `作答过快且正确率不低，判为无聊型（指数 ${score}）`
      : chain.length ? `仅偶发单点异常，未形成连续受挫，判为投入型（指数 ${score}）`
        : `全程无异常信号，判为投入型（指数 ${score}）`;
  const optimize = isBreak ? `${record.jump} 前置台阶题 + 该处讲解重录`
    : type === "无聊型" ? "开放「我会了」跳测，直给挑战题"
      : repeat.length || slow.length ? `第 ${worst.no} 题（${worst.seconds}s）拆解为两问` : "保持当前内容梯度";

  return `<tr class="session-replay-row"><td colspan="12"><div class="inline-session-replay"><header><div><span>单次会话回放</span><h4>${sessionId} · 行为还原</h4><p>${user.name} · ${lessonRows[lessonIndex].name} · ${record.time}</p></div><div class="session-replay-stats"><span><b>${record.duration}</b>会话时长</span><span class="${flagCount >= 4 ? "risk" : ""}"><b>${flagCount} 个</b>异常信号</span><span class="${score >= 60 ? "risk" : ""}"><b>${score} · ${type}</b>情绪识别</span></div></header><div class="session-event-track">${events.map(e => `<div class="session-event ${e[3] ? "is-" + e[3] : ""}"><time>${e[0]}</time><i></i><b>${e[1]}</b><small>${e[2]}</small></div>`).join("")}</div><footer><div><span>异常信号</span><b>${chain.length ? chain.join(" → ") : "全程无异常信号"}</b></div><i>→</i><div><span>情绪判断</span><b>${mood}</b></div><i>→</i><div class="optimize"><span>产品优化点</span><b>${optimize}</b></div></footer></div></td></tr>`;
}

function userLessonDetailTable(user) {
  const records = lessonRows.map((_, index) => userLessonRecord(user, index));
  const attended = records.filter(r => r.attended).length;
  const completed = records.filter(r => r.status === "完课").length;
  const anomalies = records.reduce((sum, r) => sum + (r.questions || []).filter(q => q.anomaly).length, 0);
  return `<article class="panel user-detail-panel">
    <div class="user-detail-heading"><button data-back-users><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>返回用户矩阵</button><div class="selected-user-avatar">${user.name.slice(0,1)}</div><div><span>当前学生</span><h3>${user.name} <small>${user.id}</small></h3><p>${user.churn ? "已退费" : "未退费"} · ${user.renew ? "已续费" : "未续费"} · 2026 年 8 月</p></div><div class="user-detail-summary"><span><b>${attended}/9</b>参课</span><span><b>${completed}/9</b>完课</span><span><b>${anomalies}</b>异常题</span></div></div>
    <div class="detail-rule"><i></i><span>未参课仅保留状态，其余字段为空；参未完和完课均展示实际学习行为。</span></div>
    <div class="tracking-wrap"><table class="lesson-detail-table"><thead><tr><th>周次 / 课时</th><th>状态</th><th>学习时间</th><th>学习时长</th><th>跳出节点</th><th>正确率</th>${[1,2,3,4,5,6].map(i=>`<th>第 ${i} 题</th>`).join("")}</tr></thead><tbody>${records.map((r,i)=> {
      const week = i < 8 ? `第 ${Math.floor(i/2)+1} 周` : "月度加课";
      if (!r.attended) return `<tr class="unattended-row"><td><div class="lesson-row-title"><span class="session-toggle-placeholder"></span><div><span>${week}</span><b>${lessonRows[i].name}</b></div></div></td><td><span class="detail-status blank">未参</span></td>${Array(10).fill('<td class="blank-cell"></td>').join("")}</tr>`;
      const expanded = state.selectedLessonSession === i;
      return `<tr class="${expanded ? "is-session-open" : ""}"><td><div class="lesson-row-title"><button data-toggle-user-session="${i}" aria-label="${expanded ? "收起" : "展开"}课时会话回放">${expanded ? "−" : "+"}</button><div><span>${week}</span><b>${lessonRows[i].name}</b><em>单次会话回放</em></div></div></td><td><span class="detail-status ${r.statusClass}">${r.status}</span></td><td class="study-time">${r.time}</td><td>${r.duration}</td><td class="${r.jump!=="—" ? "jump-node" : ""}">${r.jump}</td><td><b>${r.accuracy}</b></td>${r.questions.map(questionDetailCell).join("")}</tr>${expanded ? lessonSessionReplay(user,i,r) : ""}`;
    }).join("")}</tbody></table></div>
  </article>`;
}

function usersTemplate() {
  const visibleUsers = trackingUsers.filter(userMatchesGroup);
  const selectedUser = trackingUsers.find(user => user.id === state.selectedUser);
  const matrix = `<article class="panel tracking-panel"><div class="panel-header"><div><h3>月度用户课时状态矩阵</h3><p>一个月 9 节：四周每周解锁 2 节，另加 1 节月度综合课；点击用户名查看完整课时明细</p></div><div class="status-legend"><span><i class="done"></i>完课</span><span><i class="learning"></i>参未完</span><span><i class="exit"></i>跳出</span><span><i class="missed"></i>未参</span></div></div>
      <div class="tracking-wrap"><table class="tracking-table month-tracking-table"><thead><tr class="week-band"><th rowspan="2">用户</th><th rowspan="2">结果状态</th><th colspan="2">第 1 周</th><th colspan="2">第 2 周</th><th colspan="2">第 3 周</th><th colspan="2">第 4 周</th><th>月度加课</th></tr><tr>${lessonRows.map((_,i)=>`<th>L${String(i+1).padStart(2,"0")}</th>`).join("")}</tr></thead><tbody>${visibleUsers.map(u=>`<tr><td><button class="student-name-button" data-select-user="${u.id}"><b>${u.name}</b><small>${u.id}</small><em>查看课时明细 →</em></button></td><td><span class="lifecycle ${u.churn?'churn':'active'}">${u.churn?'已退费':'未退费'}</span><span class="lifecycle ${u.renew?'renew':'no-renew'}">${u.renew?'已续费':'未续费'}</span></td>${u.states.map((s,i)=>`<td><button class="lesson-state ${statusMeta[s][1]}" data-user-detail="${u.id}" data-lesson="${i}" title="${u.name} · ${lessonRows[i].name} · ${statusMeta[s][0]}"><i></i><span>${s==="learning"||s==="exit"?"参未完":s==="missed"?"未参":"完课"}</span></button></td>`).join("")}</tr>`).join("")}</tbody></table></div>
    </article>`;
  return `<section class="fade-in">${detailHeader("同批用户月度追踪", "以自然月为单元，连续追踪同批用户四周 8 节常规课和 1 节月度加课。", "点击用户名：切换课时多维表")}
    <div class="analysis-toolbar"><div><span>当前月度班期</span><b>2026 年 8 月 · 初一数学 A 班</b></div><label>月份<select><option>2026 年 8 月</option><option>2026 年 7 月</option><option>2026 年 6 月</option></select></label><span class="cohort-range">同批购买 2,384 人 · 本月 9 节</span></div>
    <div class="month-plan"><span><b>第 1 周</b>L01–L02</span><i></i><span><b>第 2 周</b>L03–L04</span><i></i><span><b>第 3 周</b>L05–L06</span><i></i><span><b>第 4 周</b>L07–L08</span><i></i><span class="extra"><b>月度加课</b>L09 综合挑战</span></div>
    <div class="segment-tabs">${userGroups.map(g=>`<button class="${state.userGroup===g[0]?'active':''}" data-user-group="${g[0]}"><span>${g[1]}</span><b>${g[2]}</b></button>`).join("")}</div>
    ${selectedUser ? userLessonDetailTable(selectedUser) : matrix}
    ${userMonitoringFlow(selectedUser)}
    ${selectedUser ? insight(`<b>${selectedUser.name} 的月度行为：</b>异常标签已按题目阈值标记——≤15 秒为秒答，同题提交 ≥3 次为反复，≥100 秒为过长；可直接定位需要回放的题目。`) : `<div class="compare-grid"><article><span>退费用户典型路径</span><b>连续 2 节未参课 → 退费风险升高</b><p>首次跳出多集中于 L03、L05，且跳出前一节正确率均值低于 65%。</p></article><article><span>续费用户典型路径</span><b>前 6 节完成 ≥ 5 节 → 续费率 71%</b><p>稳定完课用户的错题订正率比未续费用户高 19.4 个百分点。</p></article></div>`}
    ${selectedUser ? "" : sessionDegradationPanel()}
    ${selectedUser ? "" : boredomRenewalPanel()}
    ${drawerShell()}
  </section>`;
}

function openDrawer(content) {
  const layer = document.getElementById("detailDrawer");
  if (!layer) return;
  document.getElementById("drawerContent").innerHTML = content;
  layer.classList.add("open");
  document.body.style.overflow = "hidden";
  layer.querySelectorAll("[data-close-drawer]").forEach(x=>x.addEventListener("click", closeDrawer));
}

function closeDrawer() {
  document.getElementById("detailDrawer")?.classList.remove("open");
  document.body.style.overflow = "";
}

function openLessonDetail(index) {
  const r = lessonRows[index];
  const questions = lessonQuestionMetrics(index);
  const riskiest = [...questions].sort((a, b) => (Number(b.jump) + (100 - Number(b.accuracy)) / 5) - (Number(a.jump) + (100 - Number(a.accuracy)) / 5))[0];
  openDrawer(`<div class="drawer-kicker">课时归因详情</div><h2>${r.name}</h2><p class="drawer-sub">2026 暑期 · 初一数学 A 班 · 已解锁 2,384 人</p>
    <div class="drawer-metrics"><div><span>参课率</span><b>${r.attend}%</b></div><div><span>参完率</span><b>${r.finish}%</b></div><div><span>课时跳出率</span><b class="danger">${r.jump}%</b></div><div><span>课时正确率</span><b>${r.accuracy}%</b></div></div>
    <div class="drawer-question-summary"><span>需优先检查</span><b>${riskiest.no} · ${riskiest.type}</b><p>答题 ${riskiest.time}s · 正确率 ${riskiest.accuracy}% · 跳出率 ${riskiest.jump}%</p></div>
    <h3 class="drawer-title">逐题答题表现</h3>${questionMetricTable(index, true)}
    <h3 class="drawer-title">产品归因</h3><div class="root-cause"><span class="${r.tone}">${r.cause}</span><p>${index===4||index===6?`${riskiest.no} 同时出现低正确率、高耗时和高跳出，说明讲解承接到练习的难度跃迁过大。`:'逐题指标处于班期正常区间，继续观察后续课时的衰减趋势。'}</p></div>
    <div class="action-box"><b>建议迭代</b><p>优先调整 ${riskiest.no}：增加脚手架步骤或降低首问难度；改版后逐题对比答题时长、正确率与跳出率。</p></div>`);
}

function openTrackingDetail(studentId, lessonIndex) {
  const u = trackingUsers.find(x=>x.id===studentId), s = u.states[lessonIndex], base = 49 + lessonIndex*5 + studentId.charCodeAt(4)%9;
  const duration = s==="done" ? 24 + lessonIndex : s==="learning" ? 13 : s==="exit" ? 8 : 0;
  const accuracy = s==="missed" ? "—" : `${Math.max(48,88-lessonIndex*3-(u.churn?14:0))}%`;
  const questions = [base,base+17,base+42,base+8,base+29];
  openDrawer(`<div class="drawer-kicker">用户 × 课时下钻</div><div class="student-drawer-head"><span>${u.name.slice(0,1)}</span><div><h2>${u.name}</h2><p>${u.id} · ${u.churn?'退费用户':'未退费用户'} · ${u.renew?'已续费':'未续费'}</p></div></div>
    <div class="lesson-focus"><small>当前课时</small><b>${lessonRows[lessonIndex].name}</b><span class="cause-pill ${s==='done'?'good':s==='exit'?'risk':'watch'}">${statusMeta[s][0]}</span></div>
    <div class="drawer-metrics six"><div><span>完成时间</span><b>${s==='done'?'07-18 20:46':'—'}</b></div><div><span>完成时长</span><b>${duration?duration+' min':'—'}</b></div><div><span>跳出</span><b class="${s==='exit'?'danger':''}">${s==='exit'?'是':'否'}</b></div><div><span>参课</span><b>${s==='missed'?'否':'是'}</b></div><div><span>完课</span><b>${s==='done'?'是':'否'}</b></div><div><span>正确率</span><b>${accuracy}</b></div></div>
    <h3 class="drawer-title">每道题答题时长</h3>${s==='missed'?'<div class="empty-state">该用户本节课未参课，暂无答题记录</div>':`<div class="question-bars">${questions.map((v,i)=>`<div><span>第 ${i+1} 题</span><i><em class="${v>90?'slow':''}" style="width:${Math.min(v/1.2,100)}%"></em></i><b>${v}s</b></div>`).join("")}</div>`}
    <div class="action-box"><b>行为归因</b><p>${s==='exit'?'用户在动画 68% 处退出，退出前发生 2 次快进；建议核查该片段信息密度。':s==='missed'?'前序课时未形成连续完课，建议在解锁后 24 小时进行学习提醒。':u.churn?'本节学习路径完整，但该用户最终仍然退费——说明流失并非发生在这一节，需回看其首次出现连续断点的课时。':'学习路径完整，可作为未流失/续费用户的正向对照样本。'}</p></div>`);
}

const eventRows = [
  ["session_start / session_end", "会话开始与结束", "session_id、设备、入口来源", "会话数 / 单次时长", "新增"],
  ["open / unlock", "打开产品、课程解锁", "课程ID、课节ID、解锁周", "活跃 / 解锁率", ""],
  ["play / pause", "动画播放与暂停", "动画ID、版本、播放位置", "观看时长 / 内容卡点", ""],
  ["seek_forward", "动画向前拖动", "起止位置、连续次数", "快进率 / 跳过区间", ""],
  ["replay", "回看已播片段", "区间起止、重复次数", "重复回看信号", "新增"],
  ["stage_switch", "学 / 练 / 改环节切换", "来源环节、目标环节、当前进度", "跳过讲解 / 来回横跳信号", "新增"],
  ["answer", "提交题目答案", "题目ID、题序、尝试次数、正误、耗时", "正确率 / 单题耗时 / 连错信号", ""],
  ["answer_change", "提交前修改答案", "题目ID、修改次数", "答案反复修改信号", "新增"],
  ["correction", "提交错题订正", "题目ID、二答正误、订正次数", "订正率 / 掌握率", ""],
  ["hint_view", "查看提示或解析", "题目ID、提示层级", "求助率 / 受挫佐证", "新增"],
  ["idle", "静默超时无操作", "静默时长、所在位置", "静默信号 / 空转时长", "新增"],
  ["app_background / app_foreground", "切后台与回前台", "离开时长、所在位置", "切后台信号 / 分心度", "新增"],
  ["exit", "退出当前课节", "所在环节、进度、题序、退出方式", "断点定位 / 断点会话率", ""],
  ["complete", "完成课节闭环", "学练改结果、延展题结果", "单课 / 双课完成率", ""]
];

function modelTemplate() {
  const models = [
    ["01", "用户基础表", "students", "同班期画像、购买与结果状态分群", ["student_id · 学生ID", "cohort_code · 班期", "refund_status · 退费状态", "renewal_status · 续费状态", "package_code · 套餐", "device_type · 设备"], "基础层", false],
    ["02", "学习会话表", "learning_sessions", "一次打开到离开为一行 · 断点定位主表", ["session_id · 会话ID", "is_break · 是否断点", "break_stage · 断点环节", "break_position_label · 断点位置", "resume_mode · 续接方式", "boredom_score · 厌烦指数"], "连续行为层", true],
    ["03", "学习事件明细表", "learning_events", "原始行为事实 · 按 event_sequence 还原序列", ["event_name · 18 类事件", "stage · 所属环节", "prev_event_gap_seconds · 距上一步", "question_index · 题序", "answer_attempt · 尝试次数", "properties_json · 扩展"], "连续行为层", true],
    ["04", "异常信号字典", "anomaly_signal_dict", "12 类信号的判定规则与权重 · 可配置", ["signal_code · 信号编码", "detect_rule · 判定规则", "threshold_json · 阈值", "emotion_type · 情绪归属", "weight · 权重", "reference_lift · 参考提升度"], "信号层", true],
    ["05", "会话异常明细表", "session_anomaly_signals", "一次会话命中一个信号一行", ["session_id · 会话ID", "signal_code · 信号编码", "seconds_before_break · 距断点秒数", "steps_before_break · 距断点步数", "position_label · 命中位置", "intensity · 强度"], "信号层", true],
    ["06", "学生情绪状态表", "student_emotion_states", "学生 × 自然周 · 厌烦指数与分型", ["boredom_index · 厌烦指数", "emotion_type · 情绪分型", "frustration / boredom / distraction", "top_signal_codes · 主导信号", "alert_level · 预警等级", "suggested_action · 建议动作"], "情绪层", true],
    ["07", "课程学习结果表", "course_learning_results", "每位学生 × 每节课", ["完成时间 / 完成时长", "参课 / 完课 / 跳出", "训练题数 / 首答正确", "错题数 / 订正正确", "lesson_sequence · 课序", "is_completed"], "结果层", false],
    ["08", "用户周度汇总表", "user_weekly_summaries", "每位学生 × 每自然周", ["解锁 / 学习 / 完成数", "session / break 计数", "resume_within_24h_count", "答题数 / 正确率", "health_score · 健康分", "risk_level · 风险等级"], "结果层", false],
    ["09", "内容质量表", "content_quality", "知识点 × 内容版本 × 日", ["动画ID / 版本", "题集ID / 版本", "break_session_rate · 断点率", "top_break_position · 断点热区", "难度 / 退出指标", "掌握指标"], "评估层", false],
    ["10", "用户结果决策表", "user_outcome_decisions", "一次退费/续费结果一行，冻结当时完课表现与反馈原因", ["outcome_type · 决策类型", "outcome_status · 结果状态", "completion_band · 完课分层", "completion_rate · 当时完课率", "primary_reason_code · 原因", "feedback_source · 反馈来源"], "结果决策层", true]
  ];
  return `<section class="fade-in">${detailHeader("底层数据模型", "十张表把用户结果、反馈原因、连续行为、异常信号、情绪状态与内容质量串起来。", "10 张表 · 18 类事件 · 12 个视图")}
    <div class="model-flow"><span>结果决策</span><i>定位人群</i><span>学生画像</span><i>1 : N</i><span class="is-new">学习会话</span><i>1 : N</i><span class="is-new">行为事件</span><i>规则判定</i><span class="is-new">异常信号</span><i>加权</i><span class="is-new">情绪状态</span><i>验证</i><span>课节结果</span></div>
    <div class="model-grid">${models.map(m => `<article class="model-card ${m[6] ? "is-new" : ""}"><header><span>${m[0]}</span><div><h3>${m[1]}</h3><code>${m[2]}</code></div></header><p>${m[3]}</p><div class="field-list">${m[4].map(f => `<span>${f}</span>`).join("")}</div><footer><i></i>${m[5]}${m[6] ? " · 本次新增" : ""}</footer></article>`).join("")}</div>
    <div class="panel panel-full" style="margin-top:18px"><div class="panel-header"><div><h3>埋点事件口径</h3><p>同一 session_id 内按 event_sequence 排序，即可完整还原一次连续使用行为</p></div><span class="panel-tag">18 类事件 · 7 类新增</span></div><div class="table-wrap"><table class="event-table"><thead><tr><th>事件名</th><th>触发时机</th><th>关键属性</th><th>支持指标</th><th>状态</th></tr></thead><tbody>${eventRows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4] ? '<span class="status-dot is-new">待埋点</span>' : '<span class="status-dot">已上报</span>'}</td></tr>`).join("")}</tbody></table></div></div>
    <div class="panel panel-full" style="margin-top:18px"><div class="panel-header"><div><h3>落地节奏建议</h3><p>不必等全部埋点齐了再开始</p></div><span class="panel-tag">3 期</span></div>
      <div class="phase-grid">
        <div class="phase-card"><span>第 1 期 · 2 周</span><b>把会话补上</b><p>先埋 session_start / session_end / exit / stage_switch 四个事件，建 learning_sessions 表。这一步做完就能回答「断在哪个环节、断后有没有回来」，价值最大、成本最低。</p></div>
        <div class="phase-card"><span>第 2 期 · 3 周</span><b>把异常信号跑起来</b><p>补 idle / replay / answer_change / app_background，上线信号字典与判定任务，产出提升度排行。此时可开始按断点热区排内容迭代。</p></div>
        <div class="phase-card"><span>第 3 期 · 4 周</span><b>做情绪分型与干预</b><p>上线厌烦指数与三型分类，配套 A/B 干预。务必先跑满 4 周积累基线，再开实验，否则无法判断改动是否有效。</p></div>
      </div>
    </div>
  </section>`;
}

/* ===================== 路由 ===================== */

const views = {
  overview: { title: "用户结果决策看板", eyebrow: "决策驾驶舱 / OUTCOME FIRST", render: overviewTemplate },
  chain: { title: "连续行为链路还原", eyebrow: "方案 01 / 断点定位", render: chainTemplate },
  signal: { title: "断点前异常信号", eyebrow: "方案 02 / 异常归因", render: signalTemplate },
  emotion: { title: "厌烦情绪锚定与干预", eyebrow: "方案 03 / 情绪与动作", render: emotionTemplate },
  lesson: { title: "课时维度归因", eyebrow: "迭代归因 / 课时", render: lessonTemplate },
  users: { title: "同批用户月度追踪", eyebrow: "迭代归因 / 用户", render: usersTemplate },
  model: { title: "底层数据模型", eyebrow: "数据管理", render: modelTemplate }
};

function render() {
  const view = views[state.view];
  document.getElementById("pageTitle").textContent = view.title;
  document.getElementById("pageEyebrow").textContent = view.eyebrow;
  // 上一视图移到 body 上的抽屉不会随 #content 重绘被清掉，先移除避免 id 重复。
  document.querySelectorAll("body > .drawer-layer").forEach(el => el.remove());
  document.body.style.overflow = "";
  document.getElementById("content").innerHTML = view.render();
  // 抽屉必须挂在 body 上：留在 .fade-in 内部时，动画期间的 transform 会让它
  // 成为 position: fixed 的包含块，抽屉会贴着 section 定位而不是视口。
  const drawer = document.getElementById("detailDrawer");
  if (drawer) document.body.appendChild(drawer);
  document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.view === state.view));
  document.querySelectorAll("[data-open]").forEach(el => el.addEventListener("click", () => navigate(el.dataset.open)));
  document.querySelectorAll(".mini-tab").forEach(el => el.addEventListener("click", () => { el.parentElement.querySelectorAll(".mini-tab").forEach(x => x.classList.remove("active")); el.classList.add("active"); }));
  document.querySelectorAll("[data-toggle-lesson-questions]").forEach(el => {
    const toggle = () => {
      const lessonIndex = Number(el.dataset.toggleLessonQuestions);
      state.expandedLesson = state.expandedLesson === lessonIndex ? null : lessonIndex;
      render();
    };
    el.addEventListener("click", toggle);
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  });
  document.querySelectorAll("[data-lesson-detail]").forEach(el => {
    const open = () => openLessonDetail(Number(el.dataset.lessonDetail));
    el.addEventListener("click", open);
    el.addEventListener("keydown", e => { if (e.key === "Enter") open(); });
  });
  document.querySelectorAll("[data-user-detail]").forEach(el => el.addEventListener("click", () => openTrackingDetail(el.dataset.userDetail, Number(el.dataset.lesson))));
  document.querySelectorAll("[data-toggle-user-session]").forEach(el => el.addEventListener("click", () => { const i = Number(el.dataset.toggleUserSession); state.selectedLessonSession = state.selectedLessonSession === i ? null : i; render(); }));
  document.querySelectorAll("[data-select-user]").forEach(el => el.addEventListener("click", () => {
    state.selectedUser = el.dataset.selectUser;
    const user = trackingUsers.find(u => u.id === state.selectedUser);
    const firstBreak = user.states.findIndex(s => s === "exit" || s === "learning");
    state.selectedLessonSession = firstBreak >= 0 ? firstBreak : 0;
    render();
  }));
  document.querySelectorAll("[data-example-session]").forEach(el => el.addEventListener("click", () => { state.selectedUser = "STU-1132"; state.selectedLessonSession = 3; render(); }));
  document.querySelectorAll("[data-back-users]").forEach(el => el.addEventListener("click", () => { state.selectedUser = null; state.selectedLessonSession = null; render(); }));
  document.querySelectorAll("[data-user-group]").forEach(el => el.addEventListener("click", () => { state.userGroup = el.dataset.userGroup; state.selectedUser = null; state.selectedLessonSession = null; render(); }));
  document.querySelectorAll("[data-outcome]").forEach(el => el.addEventListener("click", () => { state.outcome = el.dataset.outcome; render(); }));
  document.querySelectorAll("[data-close-drawer]").forEach(el => el.addEventListener("click", closeDrawer));
}

function navigate(view) {
  state.view = view;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  closeMenu();
}

document.querySelectorAll(".nav-item").forEach(el => el.addEventListener("click", () => navigate(el.dataset.view)));
document.getElementById("periodSelect").addEventListener("change", e => { state.period = e.target.value; render(); });
document.getElementById("segmentSelect").addEventListener("change", e => { state.segment = e.target.value; render(); });
document.getElementById("exportButton").addEventListener("click", () => {
  const headers = ["方案", "指标", "当前值", "周期", "人群"];
  const rows = [[views[state.view].title, "页面数据快照", new Date().toLocaleString("zh-CN"), state.period, state.segment]];
  const csv = "﻿" + [headers, ...rows].map(row => row.join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = `拾光学习_${views[state.view].title}.csv`; a.click(); URL.revokeObjectURL(url);
  const toast = document.getElementById("toast"); toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2200);
});

const sidebar = document.querySelector(".sidebar"), scrim = document.getElementById("scrim");
function closeMenu() { sidebar.classList.remove("open"); scrim.classList.remove("show"); }
document.getElementById("menuButton").addEventListener("click", () => { sidebar.classList.add("open"); scrim.classList.add("show"); });
scrim.addEventListener("click", closeMenu);
render();
