const state = { view: "framework", period: "m1", analysisCycle: "product", segment: "all", grade: "g7", subject: "math", packageType: "half", courseStartDate: "2026-08-01", userGroup: "all", selectedUser: null, selectedLessonSession: null, outcome: "refund", expandedLesson: 4, signalSort: "lift", chainRange: "current" };
let analysisStepObserver = null;
let drawerReturnFocus = null;

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

const lifecyclePeriods = [
  ["m1", "M1", "进入后第1个月", 1],
  ["m2", "M2", "进入后第2个月", .92],
  ["m3", "M3", "进入后第3个月", .84],
  ["m4", "M4", "进入后第4个月", .76],
  ["m5", "M5", "进入后第5个月", .69],
  ["m6", "M6", "进入后第6个月", .62],
  ["m7", "M7", "进入后第7个月", .57],
  ["m8", "M8", "进入后第8个月", .53],
  ["m9", "M9", "进入后第9个月", .49],
  ["m10", "M10", "进入后第10个月", .46],
  ["m11", "M11", "进入后第11个月", .43],
  ["m12", "M12", "进入后第12个月", .40]
];
const periodFactors = Object.fromEntries(lifecyclePeriods.map(p => [p[0], p[3]]));
const lifecyclePeriod = () => lifecyclePeriods.find(p => p[0] === state.period) || lifecyclePeriods[0];
const isHalfYearPackage = () => state.packageType === "half";
const availableLifecyclePeriods = () => lifecyclePeriods.slice(0, isHalfYearPackage() ? 6 : 12);
const lifecyclePeriodOptions = () => availableLifecyclePeriods().map(p => `<option value="${p[0]}" ${state.period === p[0] ? "selected" : ""}>${p[1]} · ${p[2]}</option>`).join("");
const packageLabels = {
  annual: "全年包",
  half: "半年包"
};
const packageFilterLabel = () => packageLabels[state.packageType] || packageLabels.half;
const gradeLabels = { g6: "六年级", g7: "初一", g8: "初二", g9: "初三" };
const subjectLabels = { chinese: "语文", math: "数学", english: "英语" };
const gradeFilterLabel = () => gradeLabels[state.grade] || gradeLabels.g7;
const subjectFilterLabel = () => subjectLabels[state.subject] || subjectLabels.math;
const courseFilterLabel = () => `${gradeFilterLabel()} · ${subjectFilterLabel()}`;
const courseStartLabel = () => {
  const [year, month, day] = state.courseStartDate.split("-").map(Number);
  return `${year} 年 ${month} 月 ${day} 日`;
};
const calendarMonthLabel = () => {
  const [year, month] = state.courseStartDate.split("-").map(Number);
  const date = new Date(year, month - 1 + Number(state.period.slice(1)) - 1, 1);
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
};
const analysisCycleLabel = () => state.analysisCycle === "month" ? "分月" : "分产品周期";
const analysisPeriodLabel = () => state.analysisCycle === "month" ? `${analysisCycleLabel()} · ${calendarMonthLabel()}` : `${analysisCycleLabel()} · ${lifecyclePeriod()[1]}`;
const segmentLabels = { all: "全部", refunded: "退费", notRefunded: "未退费", renewed: "续费", notRenewed: "未续费" };
const outcomeSegmentMap = { refund: "refunded", notRefund: "notRefunded", renewed: "renewed", notRenewed: "notRenewed" };
const segmentOutcomeMap = { refunded: "refund", notRefunded: "notRefund", renewed: "renewed", notRenewed: "notRenewed" };
const segmentFilterLabel = () => segmentLabels[state.segment] || segmentLabels.all;
const segmentFactors = { all: 1, refunded: .078, notRefunded: .922, renewed: .456, notRenewed: .544 };
const formatNumber = (value) => Math.round(value).toLocaleString("zh-CN");
// 因子取不到时回落到 1 而不是 undefined：否则一个越界的 state.period/segment
// 会让整个看板的每个数字都变成 NaN，而不是只错一处。
const scaled = (value) => formatNumber(value * (periodFactors[state.period] ?? 1) * (segmentFactors[state.segment] ?? 1));
const cumulativePeriodFactor = () => availableLifecyclePeriods()
  .slice(0, Math.max(1, availableLifecyclePeriods().findIndex(period => period[0] === state.period) + 1))
  .reduce((sum, period) => sum + period[3], 0);
const chainScaled = (value) => formatNumber(value * (state.chainRange === "cumulative" ? cumulativePeriodFactor() : (periodFactors[state.period] ?? 1)) * (segmentFactors[state.segment] ?? 1));
const lessonDateLabel = (lessonIndex) => {
  const [year, month, day] = state.courseStartDate.split("-").map(Number);
  const periodOffset = Math.max(0, Number(state.period.slice(1)) - 1);
  const date = new Date(year, month - 1 + periodOffset, day + lessonIndex * 3);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
};
// 演示数据只有人群规模因子，没有分人群的真实率值。
// 不用一个通用偏移量伪造不同指标的变化，否则 KPI 会与分布图、分母互相矛盾。
const pct = (value) => `${Math.min(100, Math.max(0, value)).toFixed(1)}%`;

const schemes = [
  { id: "chain", no: "01", title: "连续行为链路还原", color: "#1b8c72", pale: "#e8f4ef", desc: "把「跳出率 28%」还原成「断在动画 03:42、练习第 4 题」，并追踪断开后有没有回来。", footer: "回答：他在哪一步走的" },
  { id: "signal", no: "02", title: "断点前异常信号", color: "#5b7fc9", pale: "#edf2fb", desc: "按学、练、改三段对比脱离与完课会话，用提升度排出最能预测脱离的 20 类前置异常行为。", footer: "回答：走之前发生了什么" },
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

// 20 类断点前异常信号，与 anomaly_signal_dict 种子数据一一对应。
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
  { name: "频繁切后台 ≥2 次", stage: "全", rule: "单会话 app_background 达到 2 次", brk: 31.2, base: 16.4, lift: 1.9, emo: "涣散" },
  { name: "视频频繁暂停 ≥3 次", stage: "学", rule: "同一动画 pause 达到 3 次", brk: 35.4, base: 15.2, lift: 2.3, emo: "受挫" },
  { name: "视频频繁拖拽 ≥4 次", stage: "学", rule: "seek_forward + replay 合计达到 4 次", brk: 44.8, base: 18.7, lift: 2.4, emo: "受挫" },
  { name: "视频未看完即跳出", stage: "学", rule: "动画进度 <80% 且 exit 发生在学环节", brk: 31.2, base: 8.7, lift: 3.6, emo: "受挫" },
  { name: "临近倒计时提交", stage: "练", rule: "countdown_remaining_seconds ≤5", brk: 33.6, base: 12.0, lift: 2.8, emo: "受挫" },
  { name: "答题中途跳出", stage: "练", rule: "进入题目但未 answer 即 exit", brk: 46.9, base: 11.6, lift: 4.0, emo: "受挫" },
  { name: "错题订正耗时过长", stage: "改", rule: "correction 耗时 >该题订正中位数 3 倍", brk: 42.6, base: 12.5, lift: 3.4, emo: "受挫" },
  { name: "订正后仍答错", stage: "改", rule: "同一错题最终 correction.is_correct = 0", brk: 49.8, base: 10.7, lift: 4.7, emo: "受挫" },
  { name: "订正中途跳出", stage: "改", rule: "进入错题但未完成订正即 exit", brk: 37.9, base: 9.8, lift: 3.9, emo: "受挫" }
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

function frameworkTemplate() {
  const layers = [
    { no: "01", tone: "scope", title: "先确定分析范围和人群", question: "分析哪些范围，重点关注哪些人群？", items: [`年级：${gradeFilterLabel()}`, `学科：${subjectFilterLabel()}`, `课包：${packageFilterLabel()}`, `同批次开班班期：${courseStartLabel()}`, `分析周期：${analysisPeriodLabel()}`, `针对人群：${segmentFilterLabel()}`] },
    { no: "02", tone: "data", title: "还原学习事实", question: "孩子实际上做了什么？", items: ["学生与课包画像", "课时结果与周度汇总", "会话回放与事件序列", "动画 / 题目内容版本", "家长微信原声"] },
    { no: "03", tone: "diagnose", title: "连续诊断与下钻", question: "异常发生在哪里、之前发生了什么？", items: ["用户 → 课时 → 会话 → 事件", "学：暂停 / 拖拽 / 快进 / 跳出", "练：秒答 / 超时 / 反复 / 正确率", "改：错题1/2/3掌握", "异常信号 → 情绪识别"] },
    { no: "04", tone: "attribute", title: "形成可能性归因", question: "哪类原因最值得优先验证？", items: ["课时维度：扫除内容硬伤", "用户维度：连续断点归因", "客户决策：退费 / 续费主因", "行为证据 × 家长原声", "相关性结论，不冒充因果"] },
    { no: "05", tone: "action", title: "迭代并验证", question: "改什么，怎样证明改对了？", items: ["内容 / 题目 / 节奏改版", "提醒 / 续学 / 指导策略", "效果证明与家长沟通", "绑定成功指标与护栏指标", "A/B或版本前后对照"] }
  ];
  return `<section class="fade-in framework-page">${detailHeader("分析框架导图", "用同一套证据链把学习事实、异常信号、用户与课时归因、客户决策结果串成可验证的产品迭代闭环。", "读图：从左向右，再回到验证")}
    <div class="framework-principles"><article><span>原则 01</span><b>先结果，后过程</b><p>从退费、续费或体验异常出发，避免为了看指标而看指标。</p></article><article><span>原则 02</span><b>同批连续追踪</b><p>固定年级、学科、课包与开班时间，再按月或产品周期比较。</p></article><article><span>原则 03</span><b>逐层下钻</b><p>用户 → 课时 → 会话 → 事件 / 题目，直到能对应产品触点。</p></article><article><span>原则 04</span><b>归因必须验证</b><p>行为与原声形成“可能性主因”，最终用实验确认因果。</p></article></div>
    <article class="panel framework-canvas"><header class="framework-canvas-head"><div><span>ANALYSIS LOGIC</span><h3>从“发生了什么”到“应该改什么”</h3><p>每一层都有明确输入、分析动作和输出；没有证据的猜测不会进入迭代清单。</p></div><em>当前筛选：${courseFilterLabel()} · ${packageFilterLabel()} · ${analysisPeriodLabel()} · ${segmentFilterLabel()}</em></header>
      <div class="framework-map">${layers.map((layer, index) => `<section class="framework-layer is-${layer.tone}"><header><i>${layer.no}</i><div><b>${layer.title}</b><small>${layer.question}</small></div></header><div>${layer.items.map(item => `<span>${item}</span>`).join("")}</div>${index < layers.length - 1 ? '<em class="framework-arrow">→</em>' : ""}</section>`).join("")}</div>
      <div class="framework-loop"><span>验证结果回流</span><i></i><b>更新阈值、归因规则与内容版本，进入下一轮监测</b><i></i><span>持续迭代</span></div>
    </article>
    <div class="framework-use-head"><span>三种使用入口</span><h3>不同团队从自己的问题进入，但最终共享同一条证据链</h3></div>
    <div class="framework-use-grid"><button data-open="overview"><i>业务 / 经营</i><b>客户为什么退费或续费？</b><p>从结果人群进入，匹配家长原声与孩子行为，找到可能性主因。</p><span>进入客户决策归因 →</span></button><button data-open="lesson"><i>内容 / 教研</i><b>哪节课、哪个内容存在硬伤？</b><p>从异常课时下钻到动画秒点和具体题目，形成改版优先级。</p><span>进入课时维度归因 →</span></button><button data-open="users"><i>产品 / 服务</i><b>哪个用户在什么位置断了？</b><p>按同批生命周期连续追踪，并回放单次会话识别情绪与断点。</p><span>进入用户行为归因 →</span></button></div>
    <div class="framework-boundary"><b>解释边界</b><span>看板给出的是由行为证据与原声共同支持的“可能性主因”；只有经过对照实验或版本验证后，才能升级为因果结论。</span></div>
  </section>`;
}

function overviewTemplate() {
  const focus = outcomeDetails[state.outcome];
  const focusGroup = outcomeGroups.find(o => o.id === state.outcome);
  const focusIndex = outcomeGroups.findIndex(o => o.id === state.outcome);
  return `<section class="fade-in decision-page">
    <button class="framework-entry" data-open="framework"><span><i>分析框架</i><b>先了解这套分析逻辑如何建立和使用</b><small>比较口径 → 学习事实 → 连续诊断 → 可能性归因 → 迭代验证</small></span><em>打开导图 ${icons.arrow}</em></button>
    <div class="intro-row decision-intro"><div><p class="decision-kicker">OUTCOME FIRST · 从结果倒推原因</p><h2>先看用户做了什么决定，再解释为什么</h2><p>以退费、未退费、续费、未续费四类结果为入口。退费用户进一步按完课表现拆分，避免把“没学”和“学了没效果”混成同一个问题；再用行为数据验证反馈原因。</p></div><span class="data-note"><i></i> 数量与占比为演示数据</span></div>

    <div class="outcome-analysis-flow" style="--focus-color:${focusGroup.color};--focus-pale:${focusGroup.pale}">
      <div class="outcome-grid" role="tablist" aria-label="用户结果分群">
        ${outcomeGroups.map(o => `<button class="outcome-card ${state.outcome === o.id ? "active" : ""}" data-outcome="${o.id}" role="tab" aria-selected="${state.outcome === o.id}" style="--outcome-color:${o.color};--outcome-pale:${o.pale}"><span class="outcome-top"><i></i>${o.badge}</span><span class="outcome-main"><strong>${formatNumber(o.count)}</strong><em>${o.rate}</em></span><b>${o.label}</b><small>${o.key}</small><span class="outcome-question">${o.question}${icons.arrow}</span></button>`).join("")}
      </div>
      <div class="outcome-connector-grid" aria-hidden="true"><span style="--active-col:${focusIndex + 1}"><i></i><b>${focusGroup.label}已选中</b><small>下方同步展示对应判断</small><svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg></span></div>
      <article class="outcome-focus">
        <div class="focus-copy"><span>${focus.eyebrow}</span><h3>${focus.title}</h3><p>${focus.summary}</p></div>
        <div class="focus-stats">${focus.stats.map(s => `<div><small>${s[0]}</small><b>${s[1]}</b><em>${s[2]}</em></div>`).join("")}</div>
        <div class="focus-action"><span>下一步</span><p>${focus.action}</p></div>
      </article>
    </div>

    <div class="decision-section-head"><div><span>01 / 退费用户</span><h3>先按完课表现拆成两条原因链</h3><p>同样是退费，行为证据和产品动作完全不同。</p></div><button data-open="users">查看退费用户明细 ${icons.arrow}</button></div>
    <div class="refund-split">
      <article class="refund-branch low-completion">
        <header><span class="branch-index">A</span><div><small>115 人 · 退费用户的 61.8%</small><h3>完课不好的退费用户</h3><p>核心判断：不是学了无效，而是学习没有真正发生。</p></div><strong>先解决<br>“学不进去”</strong></header>
        <div class="reason-list">
          ${decisionReason("孩子不喜欢学", "兴趣不足", "启动次数少、首段早退", "重做首课体验，增加兴趣化入口与自主选题", attributionVoiceSamples.dislike)}
          ${decisionReason("孩子作业多，顾不上来", "时间冲突", "工作日晚间短会话、频繁中断", "拆成 10–15 分钟小节，支持灵活完成", attributionVoiceSamples.homeworkBusy)}
          ${decisionReason("孩子没时间，基本不怎么学", "低使用", "连续多日未启动、解锁后未参课", "提供低负担学习计划，先验证真实可用时间", attributionVoiceSamples.lowUsage)}
        </div>
      </article>
      <article class="refund-branch high-completion">
        <header><span class="branch-index">B</span><div><small>71 人 · 退费用户的 38.2%</small><h3>完课较好的退费用户</h3><p>核心判断：学习发生了，但家长没有认同效果或方式。</p></div><strong>优先解决<br>“学了没用”</strong></header>
        <div class="reason-list">
          ${decisionReason("孩子觉得学了没有什么效果", "效果感知", "有完课，但前后测与校内表现未呈现", "补阶段前后测、能力变化与校内知识点映射", attributionVoiceSamples.noEffect)}
          ${decisionReason("家长看到孩子学习过程感知比较轻，点点选选不是真学习", "过程感知轻", "完课率较高，但选择题占比高、缺少主观作答与思路过程证据", "加入主观题、过程作答与指导师可见的思路反馈", attributionVoiceSamples.lightLearning)}
        </div>
      </article>
    </div>
    <div class="decision-section-head"><div><span>02 / 续费结果对照</span><h3>用续费用户校准正向信号，用未续费用户定位效果断点</h3><p>不仅看谁留下，还要看家长最终认可了什么。</p></div></div>
    <div class="renewal-compare">
      <article class="renewal-card renewed-card"><div class="renewal-label"><i></i>续费用户</div><h3>孩子喜欢，且有一定效果</h3><p>孩子愿意主动学是前提，家长能观察到阶段进步才会形成续费决策。</p><div class="evidence-chips"><span>主动启动</span><span>稳定完课</span><span>正向反馈</span><span>效果可见</span></div><footer><b>应固化</b><span>兴趣体验 + 阶段成果表达</span></footer>${collapsibleVoiceEvidence(attributionVoiceSamples.renewed)}</article>
      <div class="versus-mark"><span>VS</span><small>结果对照</small></div>
      <article class="renewal-card not-renewed-card"><div class="renewal-label"><i></i>未续费用户</div><h3>孩子成绩没有什么明显变化</h3><p>完成课程不自动等于家长感知有效，续费前需要把产品内学习连接到校内成绩与能力变化。</p><div class="evidence-chips"><span>成绩无变化</span><span>能力不可见</span><span>价值感不足</span></div><footer><b>应验证</b><span>前后测 + 校内题型 + 成果报告</span></footer>${collapsibleVoiceEvidence(attributionVoiceSamples.notRenewed)}</article>
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
    <div class="scheme-grid compact-schemes">${schemes.map(s => `<button type="button" class="scheme-card" data-open="${s.id}" style="--scheme-color:${s.color};--scheme-pale:${s.pale}"><div class="scheme-top"><span class="scheme-number">${s.no}</span><span class="scheme-arrow">${icons.arrow}</span></div><h3>${s.title}</h3><p>${s.desc}</p><footer><i></i>${s.footer}</footer></button>`).join("")}</div>
  </section>`;
}

function decisionReason(title, tag, evidence, action, voice = null) {
  const voiceEvidence = voice ? collapsibleVoiceEvidence(voice) : "";
  return `<div class="decision-reason ${voice ? "has-voice" : ""}"><span class="reason-dot"></span><div><h4>${title}<em>${tag}</em></h4><p><span>行为验证</span>${evidence}</p><p><span>建议动作</span>${action}</p>${voiceEvidence}</div></div>`;
}

function collapsibleVoiceEvidence(voice) {
  return `<div class="reason-voice-evidence is-${voice.tone || "neutral"}"><button type="button" class="reason-voice-toggle" data-toggle-voice aria-expanded="false"><i>微</i><div><b>客户微信原声</b><small>${voice.advisor} · 已脱敏</small></div><em>${voice.sample}</em><span class="voice-toggle-label">展开原声</span><svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg></button><div class="reason-voice-content"><blockquote>${voice.quote}</blockquote><div class="reason-voice-tags"><small>分类抽取</small>${voice.tags.map(t => `<span>${t}</span>`).join("")}</div><div class="reason-voice-behavior"><small>匹配到孩子真实学习行为</small>${voice.behavior.map(b => `<span>${b}</span>`).join("")}</div><footer><small>匹配结论</small><b>${voice.conclusion}</b></footer></div></div>`;
}

function decisionPriority(level, group, reason, action, metric, color) {
  return `<div class="priority-row" style="--priority-color:${color}"><span class="priority-level">${level}</span><div><small>目标人群</small><b>${group}</b></div><div><small>核心原因</small><b>${reason}</b></div><div class="priority-action"><small>产品动作</small><b>${action}</b></div><div><small>验证指标</small><b>${metric}</b></div></div>`;
}

const attributionVoiceSamples = {
  dislike: { tone: "refund", quote: "孩子现在一看到要上这个课就说不想学，觉得动画有点慢，后面的题也没什么意思，基本都是我们催了才打开。", advisor: "指导师 WX-D09", sample: "同类原声 28 条", tags: ["孩子抵触", "内容没兴趣", "被动启动"], behavior: ["主动启动 0.6 次/周", "首 3 分钟早退 42%", "视频快进 3.8 次/课"], conclusion: "原声与低主动启动、首段早退和高快进行为一致，兴趣不足主要发生在首课节奏与内容入口。" },
  homeworkBusy: { tone: "refund", quote: "学校每天作业写完都九点多了，周中实在顾不上，打开一会儿又要去做别的，只能周末偶尔补。", advisor: "指导师 WX-D21", sample: "同类原声 19 条", tags: ["校内作业挤压", "晚间时间不足", "学习被中断"], behavior: ["20:30 后启动 82%", "会话中断 2.7 次/课", "单次学习 11 分钟"], conclusion: "原声与晚启动、短会话和频繁中断一致，属于真实时间冲突，应优先拆短课时并支持断点续学。" },
  lowUsage: { tone: "refund", quote: "这个课买回来基本没怎么用，提醒了孩子也不愿打开，我们家最近确实排不出固定学习时间。", advisor: "指导师 WX-D34", sample: "同类原声 31 条", tags: ["长期未使用", "提醒无响应", "时间不可用"], behavior: ["连续 7 日未启动", "解锁未参率 68%", "提醒打开率 9%"], conclusion: "原声与连续未启动和解锁未参一致，先验证家庭可用时间，不宜直接归因内容效果。" },
  noEffect: { tone: "refund", quote: "课倒是都跟着学了，但这次考试还是原来的分数，我们看不出来学完到底提升在哪里。", advisor: "指导师 WX-A11", sample: "同类原声 23 条", tags: ["成绩无变化", "效果不可见", "成果证明不足"], behavior: ["完课率 84%", "前后测仅 +1.6pp", "成果报告未查看"], conclusion: "学习过程完整但能力变化弱且未被呈现，效果感知不足与退费反馈相符。" },
  lightLearning: { tone: "refund", quote: "看孩子课程也都学完了，但整个过程感觉比较轻，就是点点选选，我觉得这不算真正在学习。", advisor: "指导师 WX-A17", sample: "同类原声 17 条", tags: ["过程感知轻", "点选方式不可信", "效果证据不足"], behavior: ["完课率 82.4%", "选择题占比 91%", "过程作答 0 次", "订正掌握 56%"], conclusion: "孩子完成了流程，但家长看不到深度思考证据；原声与高点选占比、低过程留痕一致。" },
  renewed: { tone: "renewed", quote: "现在不用催他也会自己打开学，错题还会回去改，最近考试碰到这类题也能做出来了。", advisor: "指导师 WX-C12", sample: "续费原声 36 条", tags: ["主动学习", "错题掌握", "效果可见"], behavior: ["主动启动 3.6 次/周", "完课率 82.4%", "订正掌握 78%", "同类题 +12.6pp"], conclusion: "原声与行为形成正向闭环：愿意学、真正改会、家长能观察到迁移效果。" },
  notRenewed: { tone: "not-renewed", quote: "孩子一直有在学，指导师也提醒得挺勤，但这学期成绩没看出什么明显变化，所以先不续了。", advisor: "指导师 WX-B06", sample: "未续费原声 42 条", tags: ["成绩无变化", "效果感知不足", "指导服务认可"], behavior: ["参课率 81.6%", "完课率 73.5%", "正确率仅 +1.8pp", "阶段报告未查看"], conclusion: "学习发生但效果没有被看见，问题集中在能力变化证明而非使用意愿。" }
};

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
  { name: "正向型", key: "engaged", share: 61.2, color: "#1b8c72" },
  { name: "受挫型（太难）", key: "frustrated", share: 18.4, color: "#f08068" },
  { name: "无聊型（太简单）", key: "bored", share: 12.7, color: "#5b7fc9" },
  { name: "涣散型（分心）", key: "distracted", share: 7.7, color: "#8772bb" }
];

function emotionDonut() {
  let acc = 0;
  const stops = emotions.map(e => { const from = acc; acc += e.share; return `${e.color} ${from}% ${acc}%`; }).join(",");
  return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${stops})"><div class="donut-center"><strong>38.8%</strong><span>存在厌烦倾向</span></div></div><div class="legend-list">${emotions.map(e => `<div class="legend-row"><i style="background:${e.color}"></i><span>${e.name}</span><b>${e.share}%</b></div>`).join("")}</div></div>${insight("<b>可干预的部分：</b>受挫型与无聊型合计 <b>31.1%</b>，均由内容难度错配引起，是最直接的迭代对象；涣散型 7.7% 多与外部环境相关，只做体验减负、不做内容归因。")}`;
}

// “学—练—改”三段行为判定。常规指标负责描述过程，异常阈值负责触发诊断；
// 两者分开呈现，避免把一次正常暂停或一次答错直接误判为负面情绪。
function stageBehaviorJudgement() {
  const learnRows = [
    ["暂停", "1 次 · 03:42", "次数、位置、停留时长", "≥3 次判频繁暂停"],
    ["拖拽", "5 次 · 向前 3 / 向后 2", "起止秒数、方向、跨度", "合计 ≥4 次判频繁拖拽"],
    ["快进", "连续 3 次 · 跳过 03:35", "seek_forward 次数与跳过时长", "连续 ≥3 次判异常快进"],
    ["视频跳出", "否 · 61% 时转入练", "exit + 视频播放进度", "仅 exit 发生在学环节才计视频跳出"]
  ];
  const practiceRows = [
    ["答题时长", "题均 71s", "单题耗时 / 历史中位数", "≤15s 秒答；>3× 中位为过长"],
    ["临近倒计时", "第 4 题 · 剩 4s 提交", "倒计时总时长 / 剩余秒数", "剩余 ≤5s 单独标记"],
    ["正确率", "2/4 · 50%", "首答与最终答分别计算", "连续错 ≥3 题触发受挫信号"],
    ["反复提交率", "1/4 · 25%", "提交 ≥3 次题数 / 已答题数", "同题提交 ≥3 次判反复"],
    ["答题跳出", "第 4 题", "进入题目未提交即 exit", "保留题号与停留时长"]
  ];
  const corrections = [
    ["错题 1", "62s", "✓ 正确", "否", "已掌握", "mastered"],
    ["错题 2", "118s", "× 仍错", "否", "未掌握", "unmastered"],
    ["错题 3", "74s", "— 未提交", "是", "待判断", "pending"]
  ];
  const miniTable = (rows) => `<div class="stage-rule-list">${rows.map(r => `<div><b>${r[0]}</b><strong>${r[1]}</strong><span>${r[2]}</span><em>${r[3]}</em></div>`).join("")}</div>`;
  return `<article class="panel panel-full stage-judgement-panel"><div class="panel-header"><div><h3>学—练—改行为判定补充</h3><p>既看完整过程指标，也保留触发异常的阈值与具体位置</p></div><span class="panel-tag">三段闭环</span></div>
    <div class="stage-judgement-grid">
      <section style="--stage:#1b8c72"><header><i>学</i><div><b>视频播放行为</b><small>暂停 · 拖拽 · 跳出 · 快进</small></div></header>${miniTable(learnRows)}</section>
      <section style="--stage:#5b7fc9"><header><i>练</i><div><b>训练答题行为</b><small>耗时 · 倒计时 · 正确率 · 提交 · 跳出</small></div></header>${miniTable(practiceRows)}</section>
      <section style="--stage:#8772bb"><header><i>改</i><div><b>错题掌握判定</b><small>独立订正会话 · 逐题核验是否真正掌握</small></div></header><div class="correction-judge-table"><div class="cj-head"><span>错题</span><span>时长</span><span>结果</span><span>跳出</span><span>掌握</span></div>${corrections.map(r => `<div><b>${r[0]}</b><span>${r[1]}</span><span>${r[2]}</span><span>${r[3]}</span><em class="${r[5]}">${r[4]}</em></div>`).join("")}</div><footer><span>订正正确率 <b>50%</b></span><span>错题掌握率 <b>33.3%</b></span></footer></section>
    </div>
    <div class="stage-judgement-note"><b>掌握判定：</b>原答错误 + 完成订正 + 最终答对 = 已掌握；订正后仍错 = 未掌握；进入错题后跳出或未提交 = 待判断，不计入正确率但计入订正跳出率。</div>
  </article>`;
}

function stageSignalCoverage() {
  const groups = [
    ["学 · 视频", "暂停 / 拖拽 / 快进 / 回看 / 视频跳出", "6 类", "定位到动画秒数", "#1b8c72"],
    ["练 · 答题", "秒答 / 临近倒计时 / 超时 / 连续答错 / 反复提交 / 答题跳出", "7 类", "另同步计算逐题正确率", "#5b7fc9"],
    ["改 · 错题", "订正耗时 / 订正正确率 / 仍答错 / 订正跳出 / 掌握状态", "3 类", "错题 1、2、3 逐题判断", "#8772bb"],
    ["跨环节", "静默 / 切后台 / 来回横跳 / 超长会话", "4 类", "判断分心与疲劳", "#e9b951"]
  ];
  return `<article class="panel panel-full signal-coverage-panel"><div class="panel-header"><div><h3>异常信号覆盖范围</h3><p>20 类信号已覆盖学、练、改三段；指标异常需连续或达到阈值才触发</p></div><span class="panel-tag">20 类信号</span></div><div class="signal-coverage-grid">${groups.map(g => `<div style="--signal:${g[4]}"><span>${g[0]}</span><b>${g[1]}</b><footer><strong>${g[2]}</strong><small>${g[3]}</small></footer></div>`).join("")}</div></article>`;
}

/* ===================== 连续行为链路还原 ===================== */

function chainTemplate() {
  return `<section class="fade-in">${detailHeader("连续行为链路还原", "以「会话」而非「课时」为观测单位，把每一次打开到离开还原成带时间戳的事件序列，精确定位断点位置。", "核心目标：让每一次脱离可定位")}
    <div class="kpi-grid">${kpiCard(`${lifecyclePeriod()[1]} 会话数`, scaled(5180), "+8.4%", "当前生命周期月内会话", "次")}${kpiCard("断点会话率", pct(28.4, true), "-2.1%", `${scaled(1472)} 次未完成即离开`, "!", true)}${kpiCard("断点后 24h 回归", pct(51.2), "+4.6%", "72 小时内回归 61.8%", "↻")}${kpiCard("回归后从头重来", pct(34.2, true), "+1.8%", "断点续学定位缺失", "↺", true)}</div>
    ${stageBehaviorJudgement()}
    <div class="dashboard-grid">
      <article class="panel panel-wide"><div class="panel-header"><div><h3>单次会话回放 · SES-8842</h3><p>固定脱敏案例 · 初二数学 L* · 2026/08/06 20:14–20:41 · 27 分钟 · 不随顶部筛选变化</p></div><span class="panel-tag alert-tag">厌烦指数 78 · 受挫型</span></div>${sessionTimeline()}</article>
      <article class="panel"><div class="panel-header"><div><h3>断点位置分布</h3><p>${lifecyclePeriod()[1]} · ${scaled(1472)} 次断点会话</p></div></div>${breakDistribution()}</article>
      <article class="panel"><div class="panel-header"><div><h3>断开之后去哪了</h3><p>断点会话的后续追踪</p></div><span class="panel-tag">连续性</span></div>${continuityMarkup()}</article>
      <article class="panel panel-wide"><div class="panel-header"><div><h3>断点热区 TOP 5</h3><p>精确到动画时间段与题号，可直接派给内容团队</p></div><div class="panel-actions"><button class="mini-tab ${state.chainRange === "current" ? "active" : ""}" data-chain-range="current">${lifecyclePeriod()[1]}</button><button class="mini-tab ${state.chainRange === "cumulative" ? "active" : ""}" data-chain-range="cumulative">M1–${lifecyclePeriod()[1]} 累计</button></div></div>${rankList([
        { n: "L05 · 相交线与平行线 — 动画 03:00–04:30", v: 214, s: chainScaled(214) + " 次" },
        { n: "L05 · 相交线与平行线 — 练习第 4 题", v: 188, s: chainScaled(188) + " 次" },
        { n: "L07 · 平面直角坐标系 — 练习第 3 题", v: 156, s: chainScaled(156) + " 次" },
        { n: "L03 · 一元一次方程 — 动画 02:05–02:40", v: 132, s: chainScaled(132) + " 次" },
        { n: "L06 · 实数 — 订正页进入 30 秒内", v: 118, s: chainScaled(118) + " 次" }
      ], "#1b8c72")}${insight("<b>同一节课出现两个热区：</b>L05「相交线与平行线」在动画 03:00–04:30（同位角/内错角辨析段）和练习第 4 题各断一次，说明不是题目单独偏难，而是<b>讲解没讲透 → 练习接不住</b>，应优先改动画而非换题。")}</article>
    </div></section>`;
}

// 一次真实会话的事件序列。flag 非空即为命中的异常信号。
const sessionSteps = [
  ["00:00", "打开产品", "session_start · 来源：桌面图标", "", ""],
  ["00:12", "进入课节「L05 · 相交线与平行线」", "unlock · 生命周期月内第 1 节", "", ""],
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
  ["16:20", "第 4 题 · 答错", "answer · 本会话连续第 3 次答错 · 倒计时剩 4 秒", "连续答错 ≥3 题 / 临近倒计时提交", "danger"],
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
  return `<section class="fade-in">${detailHeader("断点前异常信号", "以完课会话为基线，按学、练、改统计脱离前窗口内各类异常行为的出现率与提升度，找出最能预测脱离的前置动作。", "核心目标：在孩子走之前预测到")}
    <div class="kpi-grid">${kpiCard("信号库规模", "20 项", "+8 项", "覆盖学、练、改完整闭环", "⚡")}${kpiCard("断点前命中率", pct(87.6), "+3.5%", "脱离前 5 分钟命中 ≥1 个信号", "✓")}${kpiCard("最强信号提升度", "4.9×", "—", "连续答错 ≥3 题", "↑")}${kpiCard("窗口内平均提前量", "3.2 分钟", "+0.4", "仅统计退出前 5 分钟归因窗口", "时")}</div>
    ${stageSignalCoverage()}
    <div class="dashboard-grid">
      <article class="panel panel-full"><div class="panel-header"><div><h3>断点前异常信号排行</h3><p>深色 = 脱离会话出现率　浅色 = 完课会话基线　提升度 = 两者之比</p></div><div class="panel-actions"><button class="mini-tab ${state.signalSort === "lift" ? "active" : ""}" data-signal-sort="lift">按提升度</button><button class="mini-tab ${state.signalSort === "coverage" ? "active" : ""}" data-signal-sort="coverage">按覆盖率</button></div></div>${liftTable()}</article>
      <article class="panel"><div class="panel-header"><div><h3>脱离前最后 10 步</h3><p>会话 SES-8842 · 逆序回放</p></div><span class="panel-tag alert-tag">原始序列 6 步命中</span></div>${replayStrip()}</article>
      <article class="panel"><div class="panel-header"><div><h3>断点时段分布</h3><p>颜色越深代表断点会话越集中</p></div><span class="panel-tag">高峰 21–22 点</span></div>${heatmap()}${insight("21 点后断点率比 19–20 点高 <b>9.7 个百分点</b>，且以「静默 / 切后台」为主——更像<b>疲劳</b>而非内容问题，建议做时长提醒而不是改内容。")}</article>
      <article class="panel panel-full"><div class="panel-header"><div><h3>高危信号组合链</h3><p>按顺序出现的信号组合，比单一信号预测力更强</p></div><span class="panel-tag">4 条已验证</span></div>${comboChains()}</article>
    </div></section>`;
}

function liftTable() {
  const maxLift = Math.max(...signals.map(s => s.lift));
  // 在渲染时排序，而不是依赖 signals 的书写顺序——新信号追加到末尾时，
  // 面板标着「按提升度」却不再有序。
  const ranked = [...signals].sort((a, b) => state.signalSort === "coverage"
    ? b.brk - a.brk || b.lift - a.lift
    : b.lift - a.lift || b.brk - a.brk);
  return `<div class="lift-list">${ranked.map(s => `
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
  <div class="rp-note"><span>原始序列最早在退出前 <b>15 分 40 秒</b> 出现实时预警信号；为避免把早期波动当成离开原因，提升度与厌烦指数仍只使用最后 5 分钟窗口。</span></div>`;
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
  return `<section class="fade-in">${detailHeader("厌烦情绪锚定与干预", "把断点前信号按情绪归属加权成 0–100 的厌烦指数，区分受挫、无聊、涣散三型，并配套差异化干预与效果验证。", "核心目标：把情绪推测变成可验证的动作")}
    <div class="kpi-grid">${kpiCard("平均厌烦指数", "34.6", "-2.4", "0–100，越低越投入", "指")}${kpiCard("受挫型占比", pct(18.4, true), "-1.2%", "内容偏难，可直接迭代", "难", true)}${kpiCard("无聊型占比", pct(12.7, true), "+0.6%", "内容偏浅或节奏拖沓", "浅", true)}${kpiCard("需干预学生", scaled(186), "-12 人", `指数 ≥ 60（预警 + 高危），需在 ${lifecyclePeriod()[1]} 干预`, "!", true)}</div>
    <div class="dashboard-grid">
      <article class="panel panel-wide"><div class="panel-header"><div><h3>厌烦指数怎么算</h3><p>信号权重来自 anomaly_signal_dict，可随验证结果调参</p></div><span class="panel-tag">口径定义</span></div>${formulaBlock()}</article>
      <article class="panel"><div class="panel-header"><div><h3>情绪分型分布</h3><p>${lifecyclePeriod()[1]} · ${scaled(2384)} 名学习学生</p></div></div>${emotionDonut()}</article>
      <article class="panel"><div class="panel-header"><div><h3>${lifecyclePeriod()[1]} 需干预</h3><p>指数最高的学生 · 已脱敏</p></div><button class="panel-tag alert-tag panel-tag-button" data-view-all-alerts>查看全部</button></div>${alertList()}</article>
      <article class="panel panel-full"><div class="panel-header"><div><h3>三种厌烦的行为特征不一样，干预也必须不一样</h3><p>把「孩子是不是烦了」拆成可区分、可动作的三类</p></div></div>${emotionCompare()}</article>
      <article class="panel panel-full"><div class="panel-header"><div><h3>干预动作矩阵</h3><p>每条干预都绑定触发条件与验证指标</p></div><span class="panel-tag">可直接排期</span></div>${interventionTable()}</article>
      <article class="panel panel-full"><div class="panel-header"><div><h3>这个指数可信吗 · 三重验证</h3><p>不做验证的情绪推测等于占卜</p></div><span class="panel-tag">已验证</span></div>${validationBlock()}</article>
    </div>${drawerShell()}</section>`;
}

function formulaBlock() {
  return `<div class="formula-box">
    <div class="formula-line"><span class="f-label">会话级</span><code>厌烦指数 = 100 × ( 0.45·F<sub>受挫</sub> + 0.35·B<sub>无聊</sub> + 0.20·D<sub>涣散</sub> )</code></div>
    <div class="formula-line"><span class="f-label">分项</span><code>F / B / D = Σ( w<sub>i</sub> × 命中<sub>i</sub> × 2<sup>−Δt<sub>i</sub>/300</sup> ) ÷ Σ( w<sub>i</sub> )</code></div>
    <div class="formula-line"><span class="f-label">周级</span><code>周指数 = min(100, 会话均值 × ( 1 + 0.15 × 周内断点次数 ) × ( 1 − 0.10 × 24h 回归率 ))</code></div>
    <p class="formula-note">Δt = 信号距断点秒数，仅统计断点前 300 秒窗口；窗口内以 300 秒为半衰期衰减，越贴近脱离权重越高，5 分钟以外不计入。w<sub>i</sub> 为信号权重（0.5–1.0），按情绪归属分组求和；“单次时长 &gt;45 分钟”作为独立疲劳护栏，不参与 F/B/D 三型分数。</p>
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

const interventionStudents = [
  ["林*", "受挫型 · 连续 3 节卡在练习", "88", "#fff0ed", "#c65e49"],
  ["赵*宇", "无聊型 · 快进率 76%，正确率 91%", "74", "#edf2fb", "#5b7fc9"],
  ["陈*", "受挫型 · 订正页进入即走 ×4", "71", "#fff0ed", "#c65e49"],
  ["王*宁", "涣散型 · 单会话静默累计 8 分钟", "66", "#f2eff8", "#8772bb"],
  ["周*文", "受挫型 · 第 4 题反复提交 ×5", "65", "#fff0ed", "#c65e49"],
  ["刘*浩", "涣散型 · 连续 2 节解锁后未启动", "64", "#f2eff8", "#8772bb"],
  ["许*彤", "无聊型 · 视频倍速后连续秒答", "63", "#edf2fb", "#5b7fc9"],
  ["郑*一", "疲劳型 · 单次学习时长 52 分钟", "62", "#fff7de", "#b48825"],
  ["孙*妍", "受挫型 · 解析查看后订正仍错", "61", "#fff0ed", "#c65e49"],
  ["何*轩", "涣散型 · 切后台 4 次后退出", "61", "#f2eff8", "#8772bb"],
  ["高*", "无聊型 · 动画拖拽跳过 5 次", "60", "#edf2fb", "#5b7fc9"],
  ["吴*辰", "受挫型 · 连续答错后答题跳出", "60", "#fff0ed", "#c65e49"]
];

function alertList(limit = 4) {
  return `<div class="alert-list">${interventionStudents.slice(0, limit).map(x => `<div class="alert-row"><span class="student-avatar" style="--avatar-bg:${x[3]};--avatar-color:${x[4]}">${x[0].slice(0, 1)}</span><div><b>${x[0]}</b><small>${x[1]}</small></div><div class="risk-score"><strong>${x[2]}</strong><span>厌烦指数</span></div></div>`).join("")}</div>`;
}

function openAllInterventionStudents() {
  openDrawer(`<div class="drawer-kicker">用户情绪识别 · 干预名单</div><h2>${lifecyclePeriod()[1]} 需干预学生</h2><p class="drawer-sub">${courseFilterLabel()} · ${packageFilterLabel()} · ${courseStartLabel()}开课 · 按厌烦指数从高到低排列</p>
    <div class="drawer-metrics"><div><span>需干预学生</span><b>${scaled(186)} 人</b></div><div><span>当前阈值</span><b>≥ 60</b></div><div><span>优先时效</span><b>24 小时</b></div><div><span>演示记录</span><b>${interventionStudents.length} 条</b></div></div>
    <div class="intervention-drawer-note"><b>处理顺序</b><span>先回放首次异常会话，再按受挫、无聊、涣散或疲劳类型匹配干预，不直接向家长展示情绪标签。</span></div>
    <h3 class="drawer-title">全部脱敏示例</h3>${alertList(interventionStudents.length)}`);
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

const churnBreakpointPatterns = [
  { rank: "01", point: "连续 2 节未参", users: 127, rate: 68.3, stage: "L05–L07", signals: ["前一节参未完", "解锁 48h 未启动"], path: ["参未完", "未参", "持续未参"], action: "首次未参 24h 内触达，并支持断点续学" },
  { rank: "02", point: "练 · 第 3–4 题", users: 102, rate: 54.8, stage: "L03 / L05", signals: ["单题过长", "连续答错", "反复提交"], path: ["练中跳出", "下节延迟", "转为未参"], action: "补台阶题、拆分长题并降低首问难度" },
  { rank: "03", point: "学 · 动画 03:00–04:30", users: 78, rate: 41.9, stage: "L03 / L05", signals: ["反复回看", "拖拽跳过", "对应题低正确"], path: ["视频中断", "练习受挫", "连续脱离"], action: "重录高密度片段，并用对应题验证看懂" },
  { rank: "04", point: "改 · 订正后仍错", users: 70, rate: 37.6, stage: "L04–L06", signals: ["解析停留短", "二次正确率低", "改错跳出"], path: ["错题未掌握", "厌烦升高", "后续未参"], action: "解析分步化，订正后增加一道同类验证题" }
];

const renewalBands = [
  ["0–39 · 投入", 1459, "12.4%", "71.3%", "4.2%", "#1b8c72"],
  ["40–59 · 观察", 739, "31.6%", "52.8%", "11.7%", "#e9b951"],
  ["60–79 · 预警", 118, "58.2%", "28.4%", "26.5%", "#f08068"],
  ["80–100 · 高危", 68, "76.9%", "14.6%", "43.1%", "#c65e49"]
];

// 已流失用户的共性断点：从单个案例升级为群体聚合，支持确定迭代优先级。
function sessionDegradationPanel() {
  return `<article class="panel panel-full churn-breakpoint-panel" style="margin-top:18px"><div class="panel-header"><div><h3>已退费用户的共性断点分析</h3><p>聚合 186 名已退费用户，从首次异常到连续未参，识别反复出现的学习断点与演化路径</p></div><span class="panel-tag alert-tag">已退费用户 · n=186</span></div>
    <div class="churn-breakpoint-summary"><span><small>最普遍断点</small><b>连续 2 节未参</b><em>覆盖 68.3%</em></span><span><small>首个内容断点</small><b>练 · 第 3–4 题</b><em>L03 / L05 集中</em></span><span><small>从首断到流失</small><b>中位 12 天</b><em>通常经历 3 次异常</em></span><span><small>共同情绪信号</small><b>受挫 + 涣散</b><em>先卡住，再脱离</em></span></div>
    <div class="table-wrap"><table class="event-table churn-breakpoint-table"><thead><tr><th>优先级</th><th>共性断点</th><th>已流失用户覆盖</th><th>首次集中课时</th><th>断点前共性信号</th><th>典型演化路径</th><th>建议优化动作</th></tr></thead><tbody>${churnBreakpointPatterns.map(item => `<tr class="${item.rank === "01" || item.rank === "02" ? "row-alert" : ""}"><td><span class="breakpoint-rank">${item.rank}</span></td><td><b>${item.point}</b></td><td><div class="breakpoint-rate"><i style="--rate:${item.rate}%"></i><b>${item.rate}%</b><small>${item.users} 人</small></div></td><td>${item.stage}</td><td><div class="breakpoint-signals">${item.signals.map(signal => `<span>${signal}</span>`).join("")}</div></td><td><div class="breakpoint-path">${item.path.map(step => `<span>${step}</span>`).join("<i>→</i>")}</div></td><td>${item.action}</td></tr>`).join("")}</tbody></table></div>
    ${insight("<b>共性结论：</b>已流失通常不是一次退出造成，而是先在具体内容处卡住，再出现参未完和连续未参。优先处理覆盖率最高的两条路径——<b>连续 2 节未参</b>和<b>练习第 3–4 题受挫</b>，并以首断后 24 小时回归率、后续两节参课率验证改动。")}
  </article>`;
}

// 厌烦指数 × 续费：把过程情绪接到半年包的商业结果上。
function boredomRenewalPanel() {
  if (!isHalfYearPackage()) {
    return `<article class="panel panel-full metric-unavailable" style="margin-top:18px"><div class="panel-header"><div><h3>厌烦指数 × 续费结果</h3><p>当前为全年包，不套用半年包到期续费口径</p></div><span class="panel-tag">口径不可比</span></div><div class="empty-state">全年包需按 M12 到期观察窗重新计算续费率；当前演示数据仅覆盖半年包，因此暂不展示关联结论。</div></article>`;
  }
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
    const rapidRate = Math.max(1.2, Math.min(21, 16.8 - time * .09 + (questionIndex % 2) * 2.1));
    const longStayRate = Math.max(1.4, Math.min(28, (time - 38) * .19 + questionIndex * .8));
    const difficulty = accuracy < 60 ? "偏难" : accuracy < 76 ? "中等" : "偏易";
    let diagnosis = "表现正常", tone = "good";
    if (accuracy < 58 || jump >= 15) { diagnosis = accuracy < 58 ? "难度过高" : "高跳出"; tone = "risk"; }
    else if (time >= 95 || jump >= 10) { diagnosis = time >= 95 ? "耗时偏长" : "跳出偏高"; tone = "watch"; }
    else if (rapidRate >= 12) { diagnosis = "秒答偏高"; tone = "watch"; }
    return { no: `第 ${questionIndex + 1} 题`, type, difficulty, students, time, accuracy: accuracy.toFixed(1), jump: jump.toFixed(1), rapidRate: rapidRate.toFixed(1), longStayRate: longStayRate.toFixed(1), diagnosis, tone };
  });
}

function questionMetricTable(lessonIndex, compact = false) {
  const rows = lessonQuestionMetrics(lessonIndex);
  return `<div class="table-wrap"><table class="event-table question-metric-table ${compact ? "compact" : ""}"><thead><tr><th>题目</th><th>题型 / 难度</th><th>答题人数</th><th>中位答题时长</th><th>首答正确率</th><th>答题跳出率 <span title="进入该题后未提交即离开本课时的人数 / 进入该题人数">?</span></th><th>作答异常</th><th>题目诊断</th></tr></thead><tbody>${rows.map((q, qi) => `<tr class="${q.tone === "risk" ? "question-risk-row" : ""}"><td><button class="question-open" data-question="${lessonIndex}-${qi}" title="点击查看原题">${q.no}</button></td><td><span class="question-type">${q.type}</span><small class="difficulty ${q.difficulty === "偏难" ? "hard" : ""}">${q.difficulty}</small></td><td>${scaled(q.students)}</td><td><span class="question-value ${q.time >= 95 ? "is-risk" : ""}">${q.time}s</span></td><td><span class="metric-inline"><i style="--value:${q.accuracy}%"></i><b class="${Number(q.accuracy) < 60 ? "is-risk" : ""}">${q.accuracy}%</b></span></td><td><span class="metric-inline jump"><i style="--value:${Math.min(100, Number(q.jump) * 4)}%"></i><b class="${Number(q.jump) >= 15 ? "is-risk" : ""}">${q.jump}%</b></span></td><td><div class="answer-anomaly"><span class="${Number(q.rapidRate) >= 12 ? "on" : ""}">秒答 ${q.rapidRate}%</span><span class="${Number(q.longStayRate) >= 12 ? "slow" : ""}">长停留 ${q.longStayRate}%</span></div></td><td><span class="cause-pill ${q.tone}">${q.diagnosis}</span></td></tr>`).join("")}</tbody></table></div>`;
}

function lessonVideoMetrics(lessonIndex) {
  const lesson = lessonRows[lessonIndex];
  const related = lessonQuestionMetrics(lessonIndex).slice(2, 4);
  const relatedAccuracy = related.reduce((sum, q) => sum + Number(q.accuracy), 0) / related.length;
  const jump = Math.min(24, lesson.jump * .63 + lessonIndex * .15);
  const drag = Math.min(42, 11.8 + lessonIndex * 2.7 + lesson.jump * .22);
  const fast = Math.min(34, 7.4 + lessonIndex * 1.8 + lesson.jump * .18);
  const replay = Math.min(46, 12.6 + lessonIndex * 3.1 + lesson.jump * .47);
  const unclear = relatedAccuracy < 65 && replay >= 24;
  return { jump: jump.toFixed(1), drag: drag.toFixed(1), fast: fast.toFixed(1), replay: replay.toFixed(1), relatedAccuracy: relatedAccuracy.toFixed(1), unclear };
}

function lessonVideoAnalysis(lessonIndex, compact = false) {
  const lesson = lessonRows[lessonIndex], m = lessonVideoMetrics(lessonIndex);
  return `<section class="lesson-stage-analysis is-video ${compact ? "compact" : ""}"><header><i>01</i><div><span>视频分析</span><b>跳出、拖拽、快进与反复观看，必须和对应题结果一起看</b></div><em class="${m.unclear ? "risk" : "good"}">${m.unclear ? "疑似没讲明白" : "讲解承接正常"}</em></header><div class="video-analysis-metrics"><span><small>视频跳出率</small><b>${m.jump}%</b></span><span><small>拖拽率</small><b>${m.drag}%</b></span><span><small>倍速快进率</small><b>${m.fast}%</b></span><span><small>反复观看率</small><b>${m.replay}%</b></span><span><small>对应题首答正确率</small><b>${m.relatedAccuracy}%</b></span></div><div class="learning-evidence-bridge"><span><small>视频行为热区</small><b>03:00–04:30 · 拖拽/回看集中</b></span><i>→</i><span><small>对应考查题</small><b>第 3–4 题 · 首答 ${m.relatedAccuracy}%</b></span><i>→</i><strong>${m.unclear ? "反复看仍做不对：优先重做讲解" : "观看行为与答题结果匹配正常"}</strong></div><p>判断口径：高回看本身不等于认真；只有“反复观看/频繁拖拽 + 对应题低正确率或长停留”同时出现，才判定讲解可能没有让孩子学明白。当前：${lesson.name}。</p></section>`;
}

function lessonCorrectionMetrics(lessonIndex) {
  const questions = [...lessonQuestionMetrics(lessonIndex)].sort((a, b) => Number(a.accuracy) - Number(b.accuracy)).slice(0, 3);
  return questions.map((q, index) => {
    const wrongStudents = Math.round(q.students * (1 - Number(q.accuracy) / 100));
    const explanationRate = Math.max(46, Math.min(92, 61 + lessonIndex * 2.7 + index * 5.2));
    const correctionEntryRate = Math.max(50, Math.min(94, 82 - lessonIndex * 1.5 - index * 3));
    const correctionHitRate = Math.max(38, Math.min(91, 74 - lessonIndex * 2.8 - index * 4.6));
    const secondAccuracy = Math.max(42, Math.min(94, correctionHitRate + 8.4 - index * 1.3));
    const correctionJump = Math.max(2, Math.min(24, lessonRows[lessonIndex].jump * .48 + index * 2.1));
    const mastered = explanationRate >= 60 && secondAccuracy >= 70;
    const conclusion = mastered ? "解析后已掌握" : explanationRate >= 60 ? "看了解析仍未掌握" : "解析查看不足";
    return { no: q.no, wrongStudents, explanationRate: explanationRate.toFixed(1), correctionEntryRate: correctionEntryRate.toFixed(1), correctionHitRate: correctionHitRate.toFixed(1), secondAccuracy: secondAccuracy.toFixed(1), correctionJump: correctionJump.toFixed(1), mastered, conclusion };
  });
}

function lessonCorrectionAnalysis(lessonIndex, compact = false) {
  const rows = lessonCorrectionMetrics(lessonIndex);
  const average = key => (rows.reduce((sum, row) => sum + Number(row[key]), 0) / rows.length).toFixed(1);
  const explanation = average("explanationRate"), hit = average("correctionHitRate"), second = average("secondAccuracy"), jump = average("correctionJump");
  return `<section class="lesson-stage-analysis is-correction ${compact ? "compact" : ""}"><header><i>03</i><div><span>错题改错分析</span><b>看解析、进入改错、改错命中与二次正确必须连成一条链</b></div><em class="${Number(second) >= 70 ? "good" : "risk"}">${Number(second) >= 70 ? "整体已掌握" : "掌握不足"}</em></header><div class="correction-summary"><span><small>解析查看率</small><b>${explanation}%</b></span><i>→</i><span><small>改错命中率</small><b>${hit}%</b></span><i>→</i><span><small>二次正确率</small><b>${second}%</b></span><i>→</i><span><small>改错跳出率</small><b>${jump}%</b></span></div><div class="table-wrap"><table class="event-table correction-analysis-table"><thead><tr><th>原错题</th><th>原错人数</th><th>练环节解析查看率</th><th>改错进入率</th><th>改错命中率</th><th>二次正确率</th><th>改错跳出率</th><th>掌握判断</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.no}</td><td>${scaled(r.wrongStudents)}</td><td>${r.explanationRate}%</td><td>${r.correctionEntryRate}%</td><td>${r.correctionHitRate}%</td><td><b class="${Number(r.secondAccuracy) < 70 ? "metric-bad" : ""}">${r.secondAccuracy}%</b></td><td>${r.correctionJump}%</td><td><span class="cause-pill ${r.mastered ? "good" : "risk"}">${r.conclusion}</span></td></tr>`).join("")}</tbody></table></div><p>掌握口径：原答错误后查看解析并完成改错，且二次同类题答对，才判为掌握；只看解析未改对，判为“看了解析仍未掌握”。</p></section>`;
}

function lessonAnalysisMap() {
  return `<div class="lesson-analysis-map"><section><i>01</i><div><span>视频分析</span><b>跳出 · 拖拽 · 快进 · 反复观看</b><small>再用对应考查题验证是否讲明白</small></div></section><em>→</em><section><i>02</i><div><span>题目分析</span><b>难度 · 正确率 · 跳出 · 答题时长</b><small>识别秒答、长停留与难度断层</small></div></section><em>→</em><section><i>03</i><div><span>错题改错</span><b>解析查看 · 改错命中 · 二次正确</b><small>最终判断是否真正掌握</small></div></section></div>`;
}

function lessonAttributionRows() {
  return lessonRows.map((r, i) => {
    const expanded = state.expandedLesson === i;
    return `<tr class="lesson-summary-row ${expanded ? "is-expanded" : ""}" data-toggle-lesson-questions="${i}" tabindex="0" aria-expanded="${expanded}"><td><span class="lesson-expand-icon">${expanded ? "−" : "+"}</span><b>${r.name}</b></td><td>${r.time}</td><td>${r.duration}</td><td class="${r.jump > 15 ? "metric-bad" : ""}">${r.jump}%</td><td>${r.attend}%</td><td>${r.finish}%</td><td>${r.accuracy}%</td><td>${r.answer}</td><td><span class="cause-pill ${r.tone}">${r.cause}</span></td></tr>${expanded ? `<tr class="question-breakdown-row"><td colspan="9"><div class="question-breakdown"><div class="question-breakdown-head"><div><span>课时三环节分析</span><b>${r.name} · 视频 → 题目 → 改错掌握</b><small>不只看过程动作，还要用后续答题与二次正确验证是否学明白</small></div><button data-lesson-detail="${i}">打开课时详情 →</button></div>${lessonVideoAnalysis(i)}<section class="lesson-stage-analysis is-question"><header><i>02</i><div><span>题目分析</span><b>逐题查看难度、正确率、跳出率、答题时长与作答异常</b></div><em>6 道训练题</em></header>${questionMetricTable(i)}<p>秒答率 = 用时 ≤15 秒的作答占比；长停留率 = 用时超过该题历史中位数 3 倍的作答占比。</p></section>${lessonCorrectionAnalysis(i)}</div></td></tr>` : ""}`;
  }).join("");
}

const trackingUsers = [
  {id:"STU-1024",name:"林*然",city:"北京",channel:"抖音直播",trials:2,device:"iPad",studyYear:"首学年",refunded:false,renew:true,states:["done","done","done","done","done","done","done","done","done"]},
  {id:"STU-1087",name:"赵*宇",city:"上海",channel:"公众号",trials:1,device:"安卓平板",studyYear:"非首学年",refunded:false,renew:true,states:["done","done","done","done","done","done","learning","missed","learning"]},
  {id:"STU-1132",name:"陈*欣",city:"杭州",channel:"社群转介绍",trials:3,device:"iPad",studyYear:"首学年",refunded:false,renew:false,states:["done","done","done","exit","done","learning","missed","missed","missed"]},
  {id:"STU-1196",name:"王*宁",city:"成都",channel:"信息流广告",trials:1,device:"安卓手机",studyYear:"首学年",refunded:true,renew:false,states:["done","done","exit","missed","missed","missed","missed","missed","missed"]},
  {id:"STU-1251",name:"周*文",city:"南京",channel:"线下活动",trials:2,device:"Windows",studyYear:"非首学年",refunded:false,renew:false,states:["done","done","done","done","exit","done","learning","missed","missed"]},
  {id:"STU-1308",name:"刘*浩",city:"武汉",channel:"短视频",trials:1,device:"安卓平板",studyYear:"首学年",refunded:true,renew:false,states:["done","exit","missed","missed","missed","missed","missed","missed","missed"]},
  {id:"STU-1364",name:"许*彤",city:"深圳",channel:"老客转介绍",trials:2,device:"iPad",studyYear:"非首学年",refunded:false,renew:true,states:["done","done","done","done","done","done","done","learning","done"]},
  {id:"STU-1419",name:"郑*一",city:"西安",channel:"小红书",trials:3,device:"Mac",studyYear:"首学年",refunded:false,renew:false,states:["done","done","learning","done","done","exit","missed","missed","missed"]}
];

const userGroups = [
  ["all","全部用户","2,384"],
  ["refunded","退费用户","186"],
  ["notRefunded","未退费用户","2,198"],
  ["renewed","续费用户","1,086"],
  ["notRenewed","未续费用户","1,298"]
];
const statusMeta = { done:["完课","done"], learning:["参未完","learning"], exit:["跳出","exit"], missed:["未参课","missed"] };

function userProfileMarkup(user, compact = false) {
  const fields = [["城市", user.city], ["购买渠道", user.channel], ["体验课次数", `${user.trials} 次`], ["上课设备", user.device], ["首/非首学年", user.studyYear]];
  return `<div class="user-profile-strip ${compact ? "compact" : ""}">${fields.map(f => `<span><small>${f[0]}</small><b>${f[1]}</b></span>`).join("")}</div>`;
}

function drawerShell() {
  return `<div class="drawer-layer" id="detailDrawer" aria-hidden="true"><button class="drawer-backdrop" data-close-drawer aria-label="关闭详情" tabindex="-1"></button><aside class="detail-drawer" role="dialog" aria-modal="true" aria-label="下钻详情" tabindex="-1"><button class="drawer-close" data-close-drawer aria-label="关闭">×</button><div id="drawerContent"></div></aside></div>`;
}

function lessonTemplate() {
  return `<section class="fade-in">${detailHeader("课时维度归因—扫除硬伤", "按视频、题目、错题改错三段验证孩子是否看懂、做对并真正掌握，识别最值得优先迭代的内容。", "目标：从过程异常定位到掌握结果")}
    <div class="analysis-toolbar"><div><span>当前班期</span><b>${courseFilterLabel()} · ${packageFilterLabel()} · ${courseStartLabel()}开课 · A 班</b></div><label>对比口径<select disabled aria-label="对比口径，当前演示仅支持同班期全部用户"><option>同班期全部用户</option></select></label><span class="data-note"><i></i> 演示数据 · 其他对比口径待接入</span></div>
    <div class="kpi-grid">
      ${kpiCard("本月解锁课时","9 / 9","已全部解锁","四周 8 节 + 月度挑战 1 节","课")}
      ${kpiCard("平均参课率","82.6%","-2.1%","随课时推进略有下降","人",true)}
      ${kpiCard("平均参完率","73.5%","-3.4%","完课人数 / 参课人数","✓",true)}
      ${kpiCard("高优迭代课时","3 节","+1 节","满足至少 2 项异常规则","!",true)}
    </div>
    ${lessonAnalysisMap()}
    <article class="panel attribution-panel"><div class="panel-header"><div><h3>课时表现与归因</h3><p>点击课时展开视频、逐题与错题改错三段分析，判断孩子是否真正掌握</p></div><div class="legend-inline"><span><i class="legend-good"></i>健康</span><span><i class="legend-watch"></i>观察</span><span><i class="legend-risk"></i>迭代</span></div></div>
      <div class="metric-definition lesson-definition"><span><b>课时层</b>先定位异常课时</span><i>→</i><span><b>视频层</b>看讲解行为</span><i>→</i><span><b>题目层</b>验证是否看懂</span><i>→</i><span><b>改错层</b>验证是否掌握</span><em>只有行为与结果同时异常，才进入产品归因</em></div>
      <div class="table-wrap attribution-wrap"><table class="event-table attribution-table"><thead><tr><th>课时</th><th>完成时间</th><th>完成时长</th><th>课时跳出率</th><th>参课率</th><th>参完率</th><th>课时答题正确率</th><th>课时题均时长</th><th>归因结论</th></tr></thead><tbody>${lessonAttributionRows()}</tbody></table></div>
    </article>
    <div class="insight-box"><span class="bulb">${icons.bulb}</span><span><b>归因结论：</b>L05、L07 同时出现动画跳出高、题均耗时长和参完率低；优先拆短讲解、降低首组题目难度，再以同班期未流失用户作为对照组验证。</span></div>
    ${breakDensityPanel()}
    ${versionComparePanel()}
    ${drawerShell()}
  </section>`;
}

function isPotentialRisk(user) {
  return !user.refunded && !user.renew
    && user.states.slice(-4).filter(s => s === "missed" || s === "exit" || s === "learning").length >= 2;
}

function userMatchesGroup(user) {
  return state.userGroup === "all"
    || (state.userGroup === "refunded" && user.refunded)
    || (state.userGroup === "notRefunded" && !user.refunded)
    || (state.userGroup === "renewed" && user.renew)
    || (state.userGroup === "notRenewed" && !user.renew);
}

function userLessonRecord(user, lessonIndex) {
  const status = user.states[lessonIndex];
  if (status === "missed") return { attended: false, status: "未参" };
  const seed = Number(user.id.slice(-2)) + lessonIndex * 7;
  const duration = status === "done" ? 23 + lessonIndex + seed % 5 : status === "exit" ? 27 : 14 + seed % 6;
  const hour = 19 + lessonIndex % 2;
  const minute = (seed * 3) % 48;
  const endTotal = hour * 60 + minute + duration;
  const time = `${lessonDateLabel(lessonIndex)} ${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}–${String(Math.floor(endTotal/60)).padStart(2,"0")}:${String(endTotal%60).padStart(2,"0")}`;
  const done = status === "done";
  // 断点落在哪个环节，决定了这次会话走到哪一步——之前不管断在哪都渲染全部 6 题，
  // 与「断在练第 3 题」自相矛盾。
  const breakStage = done ? null : ["learn", "practice", "correct"][lessonIndex % 3];
  const questionLimits = [90, 120, 150, 60, 120, 180];   // 每题倒计时上限（秒）
  const baseTimes = [38, 56, 82, 11, 69, 104];
  const breakQuestion = breakStage === "practice" ? 2 + seed % 3 : null;   // 断在第几题（0 基）
  const questions = baseTimes.map((base, q) => {
    const seconds = Math.max(7, base + (seed + q * 5) % 17 - 8);
    const limit = questionLimits[q];
    const correct = (seed + q + lessonIndex) % 4 !== 0;
    const repeated = q === 2 && (seed + lessonIndex) % 3 === 0;
    const attempts = repeated ? 3 : (seed + q) % 5 === 0 ? 2 : 1;
    const buzzer = seconds >= limit - 12 && seconds < limit;              // 压哨提交
    const abandoned = breakQuestion !== null && q === breakQuestion;      // 进入未提交即离开
    const skipped = breakStage === "learn" || (breakQuestion !== null && q > breakQuestion); // 未进练习，或断点之后未做
    let anomaly = "";
    if (abandoned) anomaly = "未提交";
    else if (seconds <= 15) anomaly = "秒答";
    else if (repeated) anomaly = "反复×3";
    else if (buzzer) anomaly = "压哨";
    else if (seconds >= 100) anomaly = "过长";
    return { seconds, limit, correct: abandoned || skipped ? false : correct, attempts, buzzer, abandoned, skipped, anomaly };
  });
  const answered = questions.filter(q => !q.abandoned && !q.skipped);
  // 正确率从题目实际对错算，不再另起一套公式——否则表头 89% 和下面 2 道错题对不上。
  const accuracy = answered.length ? Math.round(answered.filter(q => q.correct).length / answered.length * 100) : 0;

  // 改错环节：练中做错的题逐题重做，用来判断「之前错的是否掌握了」。
  const reachedCorrection = done || breakStage === "correct";
  const wrongs = questions.map((q, i) => ({ ...q, no: i + 1 })).filter(q => !q.correct && !q.skipped && !q.abandoned);
  const breakCorrection = breakStage === "correct" && wrongs.length ? seed % wrongs.length : null;
  const corrections = !reachedCorrection ? [] : wrongs.map((w, k) => {
    const abandoned = breakCorrection !== null && k === breakCorrection;
    const skipped = breakCorrection !== null && k > breakCorrection;
    const seconds = Math.max(12, Math.round(w.seconds * (1.1 + ((seed + k * 3) % 7) * .08)));
    const attempts = (seed + k) % 4 === 0 ? 2 : 1;
    return {
      no: w.no, seconds, attempts, abandoned, skipped,
      fixed: abandoned || skipped ? false : (seed + k * 5 + lessonIndex) % 5 !== 0   // 订正后是否答对
    };
  });
  const attemptedFix = corrections.filter(c => !c.abandoned && !c.skipped);
  const masteryRate = attemptedFix.length ? Math.round(attemptedFix.filter(c => c.fixed).length / attemptedFix.length * 100) : null;

  const jumpLabel = breakStage === "learn" ? "学·动画中途"
    : breakStage === "practice" ? `练·第 ${breakQuestion + 1} 题`
      : breakStage === "correct" ? (breakCorrection === null ? "改·订正入口" : `改·错题 ${breakCorrection + 1}`) : "—";
  return {
    attended: true,
    status: done ? "完课" : "参未完",
    statusClass: done ? "done" : "unfinished",
    time,
    duration: `${duration} min`,
    jump: done ? "—" : jumpLabel,
    accuracy: `${accuracy}%`,
    questions, breakStage, breakQuestion, breakCorrection,
    reachedCorrection, corrections, masteryRate, wrongCount: wrongs.length
  };
}

// 原题题库：9 节课 × 6 题，题型与 questionTypeCycle（选/填/选/解/选/解）严格对齐。
// options + answer(下标) 为选择题；仅 answer(字符串) 为填空与解答题。
const questionBank = [
  [ // L01 有理数与数轴
    { stem: "−3 的相反数是（　）", options: ["3", "−3", "1/3", "−1/3"], answer: 0, analysis: "只有符号不同的两个数互为相反数，−3 的相反数是 3。" },
    { stem: "计算：|−7| = ______", answer: "7", analysis: "负数的绝对值等于它的相反数，|−7| = 7。" },
    { stem: "数轴上表示 −2 的点与表示 3 的点之间的距离是（　）", options: ["1", "5", "−5", "6"], answer: 1, analysis: "距离 = |3 −(−2)| = 5，距离恒为非负数。" },
    { stem: "计算：(−2) + 7 − (−3)", answer: "8", analysis: "减去一个数等于加上它的相反数：−2 + 7 + 3 = 8。" },
    { stem: "下列各数中最小的是（　）", options: ["−2", "0", "−1/2", "1"], answer: 0, analysis: "负数都小于 0，且 −2 < −1/2，故最小为 −2。" },
    { stem: "把 −3、0、2、−1/2 在数轴上表示出来，并按从小到大排列", answer: "−3 < −1/2 < 0 < 2", analysis: "数轴上右边的数总比左边的大，按位置从左到右读出即可。" }
  ],
  [ // L02 整式的加减
    { stem: "单项式 −3x²y 的系数与次数分别是（　）", options: ["−3，2", "3，3", "−3，3", "−3，1"], answer: 2, analysis: "系数为 −3；次数为各字母指数之和 2 + 1 = 3。" },
    { stem: "合并同类项：5a − 3a = ______", answer: "2a", analysis: "同类项相加减，只把系数相加减，字母部分不变。" },
    { stem: "化简 2(x − 1) + 3 的结果是（　）", options: ["2x + 1", "2x − 1", "2x + 2", "2x − 5"], answer: 0, analysis: "去括号得 2x − 2 + 3 = 2x + 1。" },
    { stem: "化简：3(2a − b) − 2(a − 2b)", answer: "4a + b", analysis: "6a − 3b − 2a + 4b = 4a + b。注意第二个括号前是负号，去括号要变号。" },
    { stem: "下列各式中，是单项式的是（　）", options: ["x + 1", "3ab", "(a+b)/2", "1/x"], answer: 1, analysis: "单项式是数与字母的积，3ab 符合；含加号或分母含字母的都不是。" },
    { stem: "先化简再求值：2(x² − 3x) − (x² − 5x)，其中 x = 2", answer: "x² − x，值为 2", analysis: "2x² − 6x − x² + 5x = x² − x；代入 x=2 得 4 − 2 = 2。" }
  ],
  [ // L03 一元一次方程
    { stem: "下列方程中，是一元一次方程的是（　）", options: ["x² = 1", "2x + 1 = 0", "xy = 1", "1/x = 2"], answer: 1, analysis: "一元一次方程只含一个未知数且未知数次数为 1。" },
    { stem: "方程 3x − 6 = 0 的解是 x = ______", answer: "2", analysis: "移项得 3x = 6，两边同除以 3 得 x = 2。" },
    { stem: "解方程 2(x − 1) = 4，得 x =（　）", options: ["2", "3", "4", "1"], answer: 1, analysis: "两边同除以 2 得 x − 1 = 2，故 x = 3。" },
    { stem: "解方程：(x − 1)/2 − (x + 2)/3 = 1", answer: "x = 13", analysis: "两边乘 6 去分母：3(x−1) − 2(x+2) = 6，即 x − 7 = 6，x = 13。" },
    { stem: "把 5x = 3x + 8 移项，正确的是（　）", options: ["5x − 3x = 8", "5x + 3x = 8", "5x = 8 − 3x", "5x − 8 = 3x"], answer: 0, analysis: "移项要变号：把 3x 从右边移到左边变为 −3x。" },
    { stem: "某数的 3 倍减去 5 等于 16，求这个数", answer: "7", analysis: "设该数为 x，则 3x − 5 = 16，解得 x = 7。" }
  ],
  [ // L04 几何图形初步
    { stem: "下列几何体中，属于柱体的是（　）", options: ["球", "圆锥", "三棱柱", "四棱锥"], answer: 2, analysis: "柱体上下两底面平行且全等，三棱柱符合。" },
    { stem: "经过两点有且只有 ______ 条直线", answer: "一", answer_note: "两点确定一条直线", analysis: "这是直线的基本事实，也是「两点确定一条直线」的表述。" },
    { stem: "一个角是 35°，它的余角是（　）", options: ["55°", "65°", "145°", "35°"], answer: 0, analysis: "两角互余，和为 90°：90° − 35° = 55°。" },
    { stem: "已知 ∠AOB = 90°，OC 平分 ∠AOB，求 ∠AOC 的度数", answer: "45°", analysis: "角平分线把角分成两个相等的角，∠AOC = 90° ÷ 2 = 45°。" },
    { stem: "线段 AB = 8 cm，M 是 AB 的中点，则 AM =（　）", options: ["2 cm", "4 cm", "8 cm", "16 cm"], answer: 1, analysis: "中点把线段平分，AM = 8 ÷ 2 = 4 cm。" },
    { stem: "线段 AB = 10 cm，点 C 在 AB 上且 AC = 4 cm，D 是 BC 的中点，求 AD", answer: "7 cm", analysis: "BC = 10 − 4 = 6，D 为中点故 CD = 3，AD = AC + CD = 4 + 3 = 7 cm。" }
  ],
  [ // L05 相交线与平行线
    { stem: "直线 a、b 被直线 c 所截，∠1 与 ∠2 位于截线两侧、两直线之间，它们是（　）", options: ["同位角", "内错角", "同旁内角", "对顶角"], answer: 1, analysis: "「两直线之间、截线两侧」正是内错角的位置特征。" },
    { stem: "对顶角 ______", answer: "相等", analysis: "对顶角相等，是由邻补角互补推出的基本性质。" },
    { stem: "若 a∥b，∠1 = 50°，则与 ∠1 同位的 ∠2 =（　）", options: ["40°", "50°", "130°", "90°"], answer: 1, analysis: "两直线平行，同位角相等，故 ∠2 = 50°。" },
    { stem: "已知 ∠1 = ∠2（∠1、∠2 是内错角），判断 a 与 b 的位置关系并说明理由", answer: "a∥b", analysis: "内错角相等，两直线平行。这是平行线的判定定理。" },
    { stem: "两直线平行，同旁内角（　）", options: ["相等", "互余", "互补", "不确定"], answer: 2, analysis: "两直线平行，同旁内角互补，即和为 180°。" },
    { stem: "如图 AB∥CD，点 E 在两平行线之间，∠B = 60°，∠D = 40°，求 ∠BED", answer: "100°", analysis: "过 E 作 EF∥AB，则 ∠BEF = ∠B = 60°，∠DEF = ∠D = 40°，∠BED = 60° + 40° = 100°。" }
  ],
  [ // L06 实数
    { stem: "√9 的值是（　）", options: ["±3", "3", "−3", "9"], answer: 1, analysis: "算术平方根只取非负值，√9 = 3；而 9 的平方根才是 ±3。" },
    { stem: "4 的平方根是 ______", answer: "±2", analysis: "平方等于 4 的数有两个：2 和 −2，注意与算术平方根区分。" },
    { stem: "下列各数中，是无理数的是（　）", options: ["0.5", "22/7", "√2", "−3"], answer: 2, analysis: "无理数是无限不循环小数，√2 符合；22/7 是分数，属于有理数。" },
    { stem: "计算：√16 + ∛27", answer: "7", analysis: "√16 = 4，∛27 = 3，和为 7。" },
    { stem: "比较大小：√5 ____ 2", options: [">", "<", "=", "无法比较"], answer: 0, analysis: "因为 5 > 4，所以 √5 > √4 = 2。" },
    { stem: "计算：|√2 − 1| + (√2)² − ∛(−8)", answer: "√2 + 3", analysis: "√2 > 1 故 |√2−1| = √2−1；(√2)² = 2；∛(−8) = −2，减去得 +2。合计 √2 + 3。" }
  ],
  [ // L07 平面直角坐标系
    { stem: "点 P(−2, 3) 位于第几象限（　）", options: ["第一象限", "第二象限", "第三象限", "第四象限"], answer: 1, analysis: "横坐标为负、纵坐标为正的点在第二象限。" },
    { stem: "点 A(3, 0) 在 ______ 轴上", answer: "x", analysis: "纵坐标为 0 的点都在 x 轴上。" },
    { stem: "点 (2, −5) 关于 x 轴对称的点是（　）", options: ["(−2, 5)", "(2, 5)", "(−2, −5)", "(5, −2)"], answer: 1, analysis: "关于 x 轴对称，横坐标不变、纵坐标取相反数。" },
    { stem: "已知 A(1, 2)、B(4, 2)，求线段 AB 的长", answer: "3", analysis: "纵坐标相同，AB 平行于 x 轴，长度 = |4 − 1| = 3。" },
    { stem: "若点 P(m, 2) 在第二象限，则 m（　）", options: ["> 0", "< 0", "= 0", "≥ 0"], answer: 1, analysis: "第二象限内点的横坐标为负，故 m < 0。" },
    { stem: "已知点 M(a − 1, 2a + 3) 在 y 轴上，求点 M 的坐标", answer: "M(0, 5)", analysis: "在 y 轴上则横坐标为 0：a − 1 = 0，a = 1，代入得纵坐标 5。" }
  ],
  [ // L08 二元一次方程组
    { stem: "下列各组方程中，是二元一次方程组的是（　）", options: ["x + y = 1，x² = 4", "x + y = 3，x − y = 1", "x = 1", "xy = 2，x + y = 3"], answer: 1, analysis: "需含两个未知数且每个未知数次数均为 1，B 符合。" },
    { stem: "解方程组 x + y = 5，x − y = 1，得 x = ______", answer: "3", analysis: "两式相加得 2x = 6，x = 3（此时 y = 2）。" },
    { stem: "由 x = y + 2 代入 2x + y = 7，可得（　）", options: ["3y + 4 = 7", "2y + 2 + y = 7", "2y + 4 + y = 7", "2y − 4 + y = 7"], answer: 2, analysis: "2(y + 2) + y = 2y + 4 + y，注意括号要整体代入。" },
    { stem: "解方程组：2x + 3y = 12，x − y = 1", answer: "x = 3，y = 2", analysis: "由第二式 x = y + 1，代入第一式得 5y + 2 = 12，y = 2，x = 3。" },
    { stem: "方程组 2x + 3y = 8 与 2x − y = 4 两式相减，得（　）", options: ["4y = 4", "4y = 12", "2y = 4", "4y = −4"], answer: 0, analysis: "x 的系数相同，相减消去 x：3y − (−y) = 4y，8 − 4 = 4。" },
    { stem: "甲、乙两数的和为 10，差为 4，求这两个数", answer: "7 和 3", analysis: "设两数为 x、y，x + y = 10，x − y = 4，解得 x = 7，y = 3。" }
  ],
  [ // L09 月度综合挑战
    { stem: "若 |a| = 3，则 a =（　）", options: ["3", "−3", "±3", "0"], answer: 2, analysis: "绝对值为 3 的数有两个，须同时考虑正负。" },
    { stem: "化简：3x − (2x − 1) = ______", answer: "x + 1", analysis: "去括号变号：3x − 2x + 1 = x + 1。" },
    { stem: "方程 2x − 1 = 5 的解是（　）", options: ["2", "3", "4", "−3"], answer: 1, analysis: "移项得 2x = 6，故 x = 3。" },
    { stem: "已知 AB∥CD，∠1 = 110°，∠1 与 ∠2 是同旁内角，求 ∠2", answer: "70°", analysis: "两直线平行，同旁内角互补：180° − 110° = 70°。" },
    { stem: "点 (−1, −4) 在第几象限（　）", options: ["第一象限", "第二象限", "第三象限", "第四象限"], answer: 2, analysis: "横纵坐标均为负的点在第三象限。" },
    { stem: "解方程组：x + 2y = 8，3x − 2y = 0", answer: "x = 2，y = 3", analysis: "两式相加消去 y：4x = 8，x = 2，代回得 y = 3。" }
  ]
];

const optionLabels = ["A", "B", "C", "D"];

// 该生选了哪个选项：答对即正确项；答错时按题号确定性地取一个干扰项，保证多次渲染结果一致。
function chosenOption(q, qIndex, mine) {
  if (!q.options || !mine) return null;
  return mine.correct ? q.answer : (q.answer + 1 + qIndex) % q.options.length;
}

function questionPopHtml(lessonIndex, qIndex, mine) {
  const q = questionBank[lessonIndex][qIndex];
  const type = questionTypeCycle[qIndex];
  const stat = lessonQuestionMetrics(lessonIndex)[qIndex];
  const chosen = chosenOption(q, qIndex, mine);
  const body = q.options
    ? `<ol class="qp-options">${q.options.map((o, i) => {
        const tags = [];
        if (i === q.answer) tags.push("is-answer");
        if (chosen === i && i !== q.answer) tags.push("is-chosen");
        return `<li class="${tags.join(" ")}"><b>${optionLabels[i]}</b><span>${o}</span>${i === q.answer ? '<em>正确答案</em>' : chosen === i ? '<em class="wrong">该生所选</em>' : ""}</li>`;
      }).join("")}</ol>`
    : `<div class="qp-answer"><span>参考答案</span><b>${q.answer}</b></div>`;
  const mineRow = mine
    ? `<div class="qp-mine"><span>该生作答</span><b class="${mine.correct ? "ok" : "no"}">${mine.correct ? "正确" : "错误"}</b><i>用时 ${mine.seconds}s</i>${mine.anomaly ? `<em>${mine.anomaly}</em>` : ""}</div>`
    : "";
  return `<header><div><span>${lessonRows[lessonIndex].name} · 第 ${qIndex + 1} 题</span><b>${type}</b></div><button data-close-pop aria-label="关闭">×</button></header>
    <p class="qp-stem">${q.stem}</p>
    ${body}
    ${mineRow}
    <div class="qp-stats"><span>班期正确率 <b>${stat.accuracy}%</b></span><span>中位耗时 <b>${stat.time}s</b></span><span>跳出率 <b>${stat.jump}%</b></span></div>
    <p class="qp-analysis"><span>解析</span>${q.analysis}</p>`;
}

function closeQuestionPop() {
  document.getElementById("questionPop")?.remove();
}

function openQuestionPop(anchor, lessonIndex, qIndex, mine) {
  closeQuestionPop();
  const pop = document.createElement("div");
  pop.id = "questionPop";
  pop.className = "question-pop";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", `L${lessonIndex + 1} 第 ${qIndex + 1} 题详情`);
  pop.innerHTML = questionPopHtml(lessonIndex, qIndex, mine);
  // 挂到 body：留在表格或 .fade-in 内部时，祖先的 transform 会让 fixed 定位失效。
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight;
  pop.style.left = `${Math.max(12, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 12))}px`;
  pop.style.top = `${r.bottom + 10 + h > innerHeight - 12 ? Math.max(12, r.top - h - 10) : r.bottom + 10}px`;
  requestAnimationFrame(() => pop.classList.add("show"));
  pop.querySelector("[data-close-pop]").addEventListener("click", closeQuestionPop);
  pop.querySelector("[data-close-pop]").focus();
}

function questionDetailCell(question, index, lessonIndex) {
  if (question.skipped) return `<td class="blank-cell"><span class="question-not-reached">未到达</span></td>`;
  return `<td><button class="question-detail ${question.anomaly ? "has-anomaly" : ""}" data-question="${lessonIndex}-${index}" title="点击查看原题"><b>Q${index + 1} · ${question.seconds}s</b><small class="${question.abandoned ? "pending" : question.correct ? "correct" : "wrong"}">${question.abandoned ? "— 未提交" : question.correct ? "✓ 正确" : "× 错误"}</small>${question.anomaly ? `<em class="${question.anomaly.includes("秒答") ? "instant" : question.anomaly.includes("反复") ? "repeat" : "slow"}">${question.anomaly}</em>` : ""}</button></td>`;
}

// 单次会话的异常统计与情绪判定。会话回放和月度四步链共用这一个口径，
// 否则同一个学生在两处会给出互相矛盾的信号数与厌烦指数。
function sessionEmotion(record) {
  const isBreak = record.status === "参未完";
  const qs = record.questions.map((q, i) => ({ ...q, no: i + 1 }));
  const instant = qs.filter(q => q.anomaly === "秒答");
  const repeat = qs.filter(q => q.anomaly.includes("反复"));
  const slow = qs.filter(q => q.anomaly === "过长");
  const buzzer = qs.filter(q => q.anomaly === "压哨");            // 临近倒计时才提交
  const dropped = qs.filter(q => q.abandoned);                    // 进入某题未提交即离开
  const unfixed = (record.corrections || []).filter(c => !c.fixed && !c.skipped && !c.abandoned);  // 已提交订正但仍答错
  let streak = 0, maxStreak = 0;
  qs.filter(q => !q.skipped && !q.abandoned).forEach(q => { streak = q.correct ? 0 : streak + 1; maxStreak = Math.max(maxStreak, streak); });
  const flagCount = instant.length + repeat.length + slow.length + buzzer.length + dropped.length + (isBreak ? 3 : 0);
  const score = Math.min(96, (isBreak ? 46 : 12) + repeat.length * 9 + slow.length * 7 + maxStreak * 6
    + instant.length * 4 + buzzer.length * 5 + dropped.length * 8 + unfixed.length * 6);
  const type = score < 40 ? "正向型"
    : isBreak && repeat.length + slow.length + maxStreak + unfixed.length === 0 ? "涣散型"
      : (repeat.length + slow.length + maxStreak + unfixed.length) >= instant.length ? "受挫型" : "无聊型";
  return { isBreak, qs, instant, repeat, slow, buzzer, dropped, unfixed, maxStreak, flagCount, score, type };
}

// 月度聚合：把该学生所有参课会话的判定汇总，四步链的每个数字都由此而来。
function userMonthlyProfile(user) {
  const records = lessonRows.map((_, i) => userLessonRecord(user, i)).filter(r => r.attended);
  const items = records.map(r => ({ record: r, em: sessionEmotion(r) }));
  const sum = (pick) => items.reduce((s, x) => s + pick(x.em), 0);
  const slow = sum(e => e.slow.length), repeat = sum(e => e.repeat.length), instant = sum(e => e.instant.length);
  const breaks = items.filter(x => x.em.isBreak).length;
  const index = items.length ? Math.round(sum(e => e.score) / items.length) : 0;
  const missed = user.states.filter(s => s === "missed").length;
  const type = index < 40 && missed <= 1 ? "正向型"
    : missed >= 3 ? "涣散型"
      : (repeat + slow) >= instant ? "受挫型" : "无聊型";
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
    ["01", "连续学表现", user ? `${attended}/9 参课 · ${completed}/9 完课` : "月度 9 节状态 + 会话回放", "先还原每次打开到离开的真实过程", "chain"],
    ["02", "异常信号", signalText || "断点前 5 分钟 · 20 类信号", "判断离开前发生了什么", "signal"],
    ["03", "用户情绪识别", moodText || "受挫 / 无聊 / 涣散 / 正向", "把连续行为转成可验证的情绪判断", "emotion"],
    ["04", "断点优化点", fixText || "定位到动画秒段与具体题号", "将情绪原因落到可改的产品位置", "lesson"]
  ];
  return `<section class="user-monitoring-flow is-primary-flow"><div class="monitor-flow-head"><div><span>用户行为归因 · 总框架</span><h3>连续学表现 → 异常信号 → 情绪识别 → 断点优化</h3><p>${user ? `当前聚焦 ${user.name}，按四步从月度连续行为下钻到可执行优化点。` : "从学习事实出发，经由异常与情绪判断，最终落到可验证的产品优化动作。"}</p></div><div class="monitor-flow-actions"><button class="is-secondary" data-open="framework">查看总分析框架</button>${user ? "" : '<button data-example-session>打开会话样例 · SES-8842</button>'}</div></div>
    <div class="flow-logic-line"><span><small>输入</small><b>用户连续学习事实</b></span><i>→</i><span><small>分析</small><b>异常信号 × 情绪判断</b></span><i>→</i><span><small>输出</small><b>产品断点与优化动作</b></span></div>
    <div class="monitor-flow-grid">${steps.map((s,i)=>`<button ${user ? `data-open="${s[4]}"` : `data-analysis-jump="analysis-step-${s[0]}"`} class="monitor-flow-card" aria-label="${user ? "打开" : "定位到"}${s[1]}"><i>${s[0]}</i><span><b>${s[1]}</b><strong>${s[2]}</strong><small>${s[3]}</small><u>${user ? "打开专项分析" : "点击定位本步"} ↓</u></span>${i<steps.length-1?'<em>→</em>':""}</button>`).join("")}</div>
    <div class="flow-interaction-guide"><div><span>交互指引</span><b>${user ? "当前为单用户下钻，可点击四步打开专项分析" : "按 01 → 04 完成一轮归因"}</b></div><div><span><i>1</i>选月份与人群</span><span><i>2</i>点用户 / 课时回放</span><span><i>3</i>对照信号与情绪</span><span><i>4</i>形成优化动作</span></div></div>
  </section>`;
}

function analysisProcessNav() {
  const steps = [["01", "连续学表现"], ["02", "异常信号"], ["03", "情绪识别"], ["04", "断点优化"]];
  return `<nav class="analysis-process-nav" aria-label="用户行为归因分析过程"><span class="process-nav-label"><i></i><b>分析过程</b><small>点击跳转</small></span>${steps.map((step, index) => `<button class="${index === 0 ? "active" : ""}" data-analysis-jump="analysis-step-${step[0]}"><i>${step[0]}</i><span>${step[1]}</span>${index < steps.length - 1 ? "<em>→</em>" : ""}</button>`).join("")}</nav>`;
}

function signalDistributionPanel() {
  const stageMeta = [
    { key: "学", label: "学 · 视频", color: "#1b8c72", pale: "#e8f4ef" },
    { key: "练", label: "练 · 答题", color: "#5b7fc9", pale: "#edf2fb" },
    { key: "改", label: "改 · 订正", color: "#f08068", pale: "#fff0ed" },
    { key: "全", label: "跨环节", color: "#8772bb", pale: "#f2eff8" }
  ].map(stage => ({ ...stage, rows: signals.filter(signal => signal.stage === stage.key).sort((a, b) => b.brk - a.brk) }));
  const allHits = stageMeta.reduce((sum, stage) => sum + stage.rows.reduce((value, row) => value + row.brk, 0), 0);
  const topSignal = [...signals].sort((a, b) => b.brk - a.brk)[0];
  const strongestSignal = [...signals].sort((a, b) => b.lift - a.lift)[0];
  return `<article class="panel signal-distribution-panel"><div class="panel-header"><div><span class="signal-panel-kicker">02 / 异常信号 · 证据定位</span><h3>20 类异常信号：从哪里来，发生在哪节课、哪些人</h3><p>当前筛选范围内，从学习事件明细还原断点会话，在退出前 5 分钟按规则识别异常；点击任一信号可定位课时和用户。</p></div><span class="panel-tag">点击信号行 · 查看课时与用户</span></div>
    <div class="signal-source-map"><span><i>数据来源</i><b>学习事件明细表</b><small>session_id + event_sequence</small></span><em>→</em><span><i>分析对象</i><b>同批用户的断点会话</b><small>退出或参未完，当前筛选 ${visibleSignalScope()}</small></span><em>→</em><span><i>判定窗口</i><b>断点前 5 分钟</b><small>按 20 类规则逐条命中</small></span><em>→</em><span class="is-action"><i>下钻结果</i><b>课时 + 用户</b><small>点击下方任一信号行</small></span></div>
    <div class="signal-stage-summary"><div class="signal-stage-stack">${stageMeta.map(stage => { const hit = stage.rows.reduce((value, row) => value + row.brk, 0); return `<i style="width:${hit / allHits * 100}%;--stage-color:${stage.color}" title="${stage.label} · ${(hit / allHits * 100).toFixed(1)}%"></i>`; }).join("")}</div><div class="signal-stage-legend">${stageMeta.map(stage => { const hit = stage.rows.reduce((value, row) => value + row.brk, 0); return `<span><i style="--stage-color:${stage.color}"></i><b>${stage.label}</b><em>${(hit / allHits * 100).toFixed(1)}%</em><small>${stage.rows.length} 类</small></span>`; }).join("")}</div></div>
    <div class="signal-metric-guide"><span><b>阶段占比</b>上方比例是该阶段信号命中次数 ÷ 全部信号命中次数，不是用户占比</span><span><b>命中率</b>断点会话中出现该信号的比例</span><span><b>提升度</b>断点会话命中率 ÷ 完课会话命中率</span></div>
    <div class="signal-distribution-grid">${stageMeta.map(stage => `<section class="signal-stage-card" style="--stage-color:${stage.color};--stage-pale:${stage.pale}"><header><i></i><div><b>${stage.label}</b><small>${stage.rows.length} 类异常信号</small></div><em>${stage.rows.filter(row => row.lift >= 3.5).length} 类强关联</em></header><div><div class="signal-distribution-columns"><span>信号与判定规则</span><span>命中率</span><span>数值</span><span>提升度</span></div>${stage.rows.map(row => `<button class="signal-distribution-row" data-signal-detail="${signals.indexOf(row)}" title="点击定位课时和用户"><span><b>${row.name}</b><small>${row.rule}</small></span><div><i style="width:${row.brk}%"></i></div><b>${row.brk.toFixed(1)}%</b><em class="${row.lift >= 4 ? "is-strong" : ""}">${row.lift.toFixed(1)}×</em></button>`).join("")}</div></section>`).join("")}</div>
    <div class="signal-distribution-footer"><span><b>最高频</b>${topSignal.name} · ${topSignal.brk.toFixed(1)}%</span><span><b>最强关联</b>${strongestSignal.name} · ${strongestSignal.lift.toFixed(1)}×</span><p>命中率 = 断点会话中出现该信号的比例；提升度 = 断点会话命中率 ÷ 完课会话命中率。同一会话可命中多项，阶段占比按全部信号命中次数归一。</p></div>
  </article>`;
}

function visibleSignalScope() {
  return `${courseFilterLabel()} · ${packageFilterLabel()} · ${lifecyclePeriod()[1]} · ${userGroups.find(group => group[0] === state.userGroup)?.[1] || "全部用户"}`;
}

function openSignalEvidence(signalIndex) {
  const signal = signals[signalIndex];
  if (!signal) return;
  const stageLessons = { 学: [4, 3, 6], 练: [6, 4, 2], 改: [5, 4, 7], 全: [6, 7, 4] };
  const lessonIndexes = stageLessons[signal.stage] || stageLessons.全;
  const scopedUsers = trackingUsers.filter(userMatchesGroup);
  const userSamples = [0, 2, 5].map(offset => scopedUsers[(signalIndex + offset) % scopedUsers.length]).filter((user, index, rows) => user && rows.indexOf(user) === index);
  const sourceTables = signal.stage === "全" ? "学习事件明细表 + 用户周度汇总表" : "学习事件明细表 + 课程学习结果表";
  const stageLabel = { 学: "学 · 视频", 练: "练 · 答题", 改: "改 · 订正", 全: "跨环节" }[signal.stage];
  openDrawer(`<div class="drawer-kicker">异常信号证据下钻</div><h2>${signal.name}</h2><p class="drawer-sub">${visibleSignalScope()} · ${stageLabel}</p>
    <div class="signal-evidence-definition"><span><small>来源表</small><b>${sourceTables}</b></span><span><small>分析对象</small><b>退出 / 参未完会话</b></span><span><small>观察窗口</small><b>断点前 5 分钟</b></span><span><small>判定规则</small><b>${signal.rule}</b></span></div>
    <div class="drawer-metrics"><div><span>断点会话命中率</span><b>${signal.brk.toFixed(1)}%</b></div><div><span>完课会话基线</span><b>${signal.base.toFixed(1)}%</b></div><div><span>提升度</span><b class="danger">${signal.lift.toFixed(1)}×</b></div><div><span>情绪归属</span><b>${signal.emo}</b></div></div>
    <div class="signal-evidence-explain"><b>如何理解</b><p>同批断点会话中有 ${signal.brk.toFixed(1)}% 命中该行为，是完课会话的 ${signal.lift.toFixed(1)} 倍。它用于定位优先核查对象，不代表单凭这一项就能判定流失原因。</p></div>
    <div class="signal-locator-grid"><section><header><span>课时定位</span><b>异常集中在哪些课时？</b><small>点击打开课时三段分析</small></header>${lessonIndexes.map((lessonIndex, order) => `<button data-signal-lesson="${lessonIndex}"><i>L${String(lessonIndex + 1).padStart(2, "0")}</i><span><b>${lessonRows[lessonIndex].name.split(" · ")[1]}</b><small>${Math.round(signal.brk * (2.7 - order * .42))} 次命中 · 跳出率 ${lessonRows[lessonIndex].jump}%</small></span><em>查看课时 →</em></button>`).join("")}</section>
      <section><header><span>用户定位</span><b>哪些用户命中过？</b><small>点击打开月度连续行为与会话回放</small></header>${userSamples.map((user, order) => { const lessonIndex = lessonIndexes[order]; return `<button data-signal-user="${user.id}" data-signal-session="${lessonIndex}"><i>${user.name.slice(0, 1)}</i><span><b>${user.name}<small>${user.id}</small></b><small>${lessonRows[lessonIndex].name.split(" · ")[0]} · ${signal.name}</small></span><em>查看用户 →</em></button>`; }).join("")}</section></div>
    <div class="action-box"><b>分析下一步</b><p>先在“课时定位”判断是否为多人集中内容硬伤，再到“用户定位”回放具体事件序列；两侧证据一致后，才进入产品优化清单。</p></div>`);
  document.querySelectorAll("[data-signal-lesson]").forEach(button => button.addEventListener("click", () => {
    const lessonIndex = Number(button.dataset.signalLesson);
    navigate("lesson");
    openLessonDetail(lessonIndex);
  }));
  document.querySelectorAll("[data-signal-user]").forEach(button => button.addEventListener("click", () => {
    const user = trackingUsers.find(item => item.id === button.dataset.signalUser);
    state.selectedUser = user.id;
    const requestedSession = Number(button.dataset.signalSession);
    state.selectedLessonSession = user.states[requestedSession] !== "missed" ? requestedSession : user.states.findIndex(status => status !== "missed");
    navigate("users");
  }));
}

// 会话回放全部由 record.questions 的真实逐题数据推导，不写死事件。
// 否则完课的会话也会显示「连续答错、静默 142 秒」，与统计框和页脚结论互相矛盾。
// 动画（学环节）内的播放行为：是否拖拽、拖到哪、是否暂停、停在哪。
// 用「模拟播放」生成：视频位置线性推进，暂停额外消耗墙钟，拖拽瞬时改变位置。
// 因此每个标记同时有 atVideo（视频位置）和 atSession（会话时刻），两者不会互相矛盾。
function animationBehavior(user, lessonIndex, isBreak, totalSec, breakStage) {
  const seed = Number(user.id.slice(-2)) + lessonIndex * 7;
  // 先定暂停时长，再倒推动画时长，保证「学环节墙钟 = 12s + 播放 + 暂停」不超过上限。
  // 否则暂停会把学环节顶出预算，外层再夹一次就会出现「切到练习」排在暂停之前的时间倒挂。
  const cap = Math.round(totalSec * .58);
  const raw = [];
  const pauseCount = isBreak ? 1 + seed % 2 : seed % 3 === 0 ? 1 : 0;
  const holds = Array.from({ length: pauseCount }, (_, i) => 16 + (seed + i * 11) % 46);
  const totalHold = holds.reduce((a, b) => a + b, 0);
  const videoSec = Math.max(180, Math.min(Math.round(cap * .84), cap - 12 - totalHold));
  for (let i = 0; i < pauseCount; i++)
    raw.push({ kind: "pause", at: videoSec * (.3 + i * .3 + (seed % 6) * .012), hold: holds[i] });
  const seekCount = isBreak ? 1 + (seed % 3 === 0 ? 1 : 0) : seed % 4 === 0 ? 1 : 0;
  for (let i = 0; i < seekCount; i++) {
    const at = videoSec * (.42 + i * .26 + (seed % 5) * .014);
    const backward = isBreak ? i > 0 : true;   // 断点会话首次拖拽多为快进跳过；完课会话的拖拽多为回看
    const span = videoSec * (backward ? .05 + (seed % 4) * .012 : .12 + (seed % 5) * .022);
    raw.push({ kind: "seek", at, to: Math.max(0, Math.min(videoSec, at + (backward ? -span : span))), backward });
  }
  // 倍速快进：与「拖拽跳过」不同——不跳过内容，只是加速播放，指向的是「嫌慢」而非「嫌难」。
  const speedUp = (seed % 5 === 0 || isBreak) ? { kind: "speed", at: videoSec * (.55 + (seed % 4) * .03), rate: seed % 3 === 0 ? 2 : 1.5 } : null;
  if (speedUp) raw.push(speedUp);
  raw.sort((a, b) => a.at - b.at);

  let wall = 12, pos = 0, play = 0, maxPos = 0, rate = 1;   // 12s = 进入动画的时刻
  const marks = [];
  for (const m of raw) {
    if (m.at < pos) continue;                       // 已被拖过去的位置不再触发
    wall += (m.at - pos) / rate; play += m.at - pos; pos = m.at; maxPos = Math.max(maxPos, pos);
    marks.push({ ...m, atSession: Math.round(wall), atVideo: Math.round(pos), toVideo: m.to != null ? Math.round(m.to) : null });
    if (m.kind === "pause") wall += m.hold;
    else if (m.kind === "speed") rate = m.rate;                 // 之后的播放按倍速走
    else { pos = m.to; maxPos = Math.max(maxPos, pos); }
  }
  // 断在学环节的会话不会看到底；断在别处的说明动画已看完。
  const endPos = breakStage === "learn" ? Math.min(videoSec, pos + videoSec * .12) : videoSec;
  const tail = Math.max(0, endPos - pos);
  wall += tail / rate; play += tail;
  maxPos = Math.max(maxPos, endPos);
  return {
    videoSec, marks, learnEnd: Math.round(wall), playSeconds: Math.round(play),
    progress: Math.min(1, maxPos / videoSec),   // 完成度按到达过的最远位置算，回看不应拉低它
    exitedInVideo: breakStage === "learn",
    pauses: marks.filter(m => m.kind === "pause"),
    seeks: marks.filter(m => m.kind === "seek"),
    speeds: marks.filter(m => m.kind === "speed")
  };
}

function animationTrack(anim) {
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  const pct = (s) => `${(s / anim.videoSec * 100).toFixed(1)}%`;
  const segs = anim.seeks.map(s => {
    const a = Math.min(s.atVideo, s.toVideo), b = Math.max(s.atVideo, s.toVideo);
    return `<span class="at-seg ${s.backward ? "is-replay" : "is-skip"}" style="left:${pct(a)};width:${pct(b - a)}" title="${s.backward ? "回看" : "快进跳过"} ${fmt(s.atVideo)} → ${fmt(s.toVideo)}（会话 ${fmt(s.atSession)}）"><em>${s.backward ? "回看" : "跳过"} ${fmt(b - a)}</em></span>`;
  }).join("");
  const pins = anim.pauses.map(p => `<span class="at-pin" style="left:${pct(p.atVideo)}" title="暂停在 ${fmt(p.atVideo)}，停留 ${p.hold} 秒（会话 ${fmt(p.atSession)}）"><i></i><em>暂停 ${fmt(p.atVideo)}</em></span>`).join("");
  const summary = [
    `时长 ${fmt(anim.videoSec)}`,
    `观看至 ${(anim.progress * 100).toFixed(0)}%`,
    anim.pauses.length ? `暂停 ${anim.pauses.length} 次` : "无暂停",
    anim.seeks.length ? `拖拽 ${anim.seeks.length} 次` : "无拖拽"
  ].join(" · ");
  const detail = anim.marks.length
    ? anim.marks.map(m => m.kind === "pause"
        ? `<li class="is-pause"><b>暂停</b><span>视频 ${fmt(m.atVideo)}</span><i>停留 ${m.hold}s</i><small>会话 ${fmt(m.atSession)}</small></li>`
        : `<li class="${m.backward ? "is-replay" : "is-skip"}"><b>${m.backward ? "向后拖拽 · 回看" : "向前拖拽 · 跳过"}</b><span>视频 ${fmt(m.atVideo)} → ${fmt(m.toVideo)}</span><i>${m.backward ? "重看" : "略过"} ${fmt(Math.abs(m.toVideo - m.atVideo))}</i><small>会话 ${fmt(m.atSession)}</small></li>`).join("")
    : `<li class="is-clean"><b>无拖拽、无暂停</b><span>完整顺序观看</span></li>`;
  return `<div class="anim-track">
    <div class="at-head"><span>动画播放行为</span><b>${summary}</b></div>
    <div class="at-bar"><i class="at-watched" style="width:${(anim.progress * 100).toFixed(1)}%"></i>${segs}${pins}</div>
    <div class="at-axis"><span>00:00</span><span>${fmt(anim.videoSec)}</span></div>
    <ul class="at-detail">${detail}</ul>
  </div>`;
}

function lessonSessionReplay(user, lessonIndex, record) {
  const isBreak = record.status === "参未完";
  const sessionId = user.id === "STU-1132" && lessonIndex === 3
    ? "SES-8842"
    : `SES-${(isBreak ? 8800 : 8200) + lessonIndex * 37 + Number(user.id.slice(-2))}`;
  const totalSec = parseInt(record.duration, 10) * 60;
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  const { qs, instant, repeat, slow, buzzer, dropped, unfixed, maxStreak, score, type } = sessionEmotion(record);

  const anim = animationBehavior(user, lessonIndex, isBreak, totalSec, record.breakStage);
  const learnEnd = anim.learnEnd;   // animationBehavior 内部已保证不超预算，此处不能再夹
  const events = [["00:00", "打开课时", "session_start", ""],
    ["00:12", "进入动画", `play · 时长 ${mmss(anim.videoSec)}`, ""]];
  // 学环节事件用模拟播放算出的真实时刻，视频位置与会话时刻一一对应。
  anim.marks.forEach(m => events.push(
    m.kind === "pause" ? [mmss(m.atSession), `暂停 · 视频 ${mmss(m.atVideo)}`, `pause · 停留 ${m.hold} 秒`, "warn"]
    : m.kind === "speed" ? [mmss(m.atSession), `倍速快进 ${m.rate}×`, `playback_rate · 从视频 ${mmss(m.atVideo)} 起`, "warn"]
    : [mmss(m.atSession), `${m.backward ? "拖拽回看" : "拖拽跳过"} · 视频 ${mmss(m.atVideo)}`,
       `${m.backward ? "replay" : "seek_forward"} · ${mmss(m.atVideo)} → ${mmss(m.toVideo)}`, "warn"]));

  // 断在学环节：不进练习，直接结束。之前不管断在哪都渲染全部 6 题，与断点位置矛盾。
  if (record.breakStage === "learn") {
    events.push([mmss(totalSec), "退出课时", `exit · 视频 ${mmss(Math.round(anim.videoSec * anim.progress))}（完成 ${(anim.progress * 100).toFixed(0)}%）`, "break"]);
  } else {
    events.push([mmss(learnEnd), "切到练习", `stage_switch · 动画完成 ${(anim.progress * 100).toFixed(0)}%`, ""]);
    const played = qs.filter(q => !q.skipped);
    const tail = record.reachedCorrection ? Math.round(totalSec * .78) : totalSec;
    const slot = (tail - learnEnd) / (played.length + 1);
    played.forEach((q, i) => {
      const at = learnEnd + slot * (i + 1);
      if (q.abandoned) {
        events.push([mmss(at), `第 ${q.no} 题 · 未提交`, `exit · 停留 ${q.seconds}s 未提交（限时 ${q.limit}s）`, "danger", `${lessonIndex}-${q.no - 1}`]);
        return;
      }
      const tone = q.anomaly === "过长" || q.anomaly.includes("反复") || q.anomaly === "压哨" ? "danger" : q.anomaly === "秒答" ? "warn" : "";
      const extra = q.attempts > 1 ? ` · 提交 ${q.attempts} 次` : q.buzzer ? ` · 限时 ${q.limit}s 压哨` : "";
      events.push([mmss(at), q.anomaly ? `第 ${q.no} 题 · ${q.anomaly}` : `第 ${q.no} 题 · ${q.correct ? "答对" : "答错"}`,
        `用时 ${q.seconds}s · ${q.correct ? "正确" : "错误"}${extra}`, tone, `${lessonIndex}-${q.no - 1}`]);
    });
    if (record.breakStage === "practice") {
      events.push([mmss(totalSec), "退出课时", `exit · ${record.jump}`, "break"]);
    } else {
      // 改错环节：把练中错题逐题重做，判断是否掌握。
      events.push([mmss(tail), "切到订正", `stage_switch · ${record.wrongCount} 道错题待订正`, ""]);
      const cs = record.corrections.filter(c => !c.skipped);
      const cslot = (totalSec - tail) / (cs.length + 1);
      cs.forEach((c, i) => {
        const at = tail + cslot * (i + 1);
        if (c.abandoned) {
          events.push([mmss(at), `错题 ${i + 1}（原第 ${c.no} 题）· 未完成`, `exit · 停留 ${c.seconds}s 未提交`, "danger", `${lessonIndex}-${c.no - 1}`]);
          return;
        }
        events.push([mmss(at), `错题 ${i + 1}（原第 ${c.no} 题）· ${c.fixed ? "已掌握" : "仍错"}`,
          `correction · 用时 ${c.seconds}s${c.attempts > 1 ? ` · 提交 ${c.attempts} 次` : ""}`, c.fixed ? "" : "danger", `${lessonIndex}-${c.no - 1}`]);
      });
      events.push([mmss(totalSec), isBreak ? "退出课时" : "完成学练改",
        isBreak ? `exit · ${record.jump}` : `complete · 订正掌握 ${record.masteryRate === null ? "—" : record.masteryRate + "%"}`, isBreak ? "break" : "done"]);
    }
  }

  // 时间轴上真正被标记的事件数：动画行为 + 异常题 + 静默。统计框必须与之相等。
  // 直接数时间轴上真正标了色的事件，而不是另起一套公式平行推导——
  // 平行推导会在「断在学环节、练习题根本没渲染」时把它们也算进去。
  const timelineFlags = events.filter(e => e[3] === "warn" || e[3] === "danger").length;
  const chain = [];
  if (anim.seeks.some(x => !x.backward)) chain.push(`拖拽跳过 ×${anim.seeks.filter(x => !x.backward).length}`);
  if (anim.seeks.some(x => x.backward)) chain.push(`回看 ×${anim.seeks.filter(x => x.backward).length}`);
  if (anim.speeds.length) chain.push(`倍速快进 ×${anim.speeds.length}`);
  if (anim.pauses.length) chain.push(`暂停 ×${anim.pauses.length}`);
  if (anim.exitedInVideo) chain.push("视频中途跳出");
  if (slow.length) chain.push(`单题过长 ×${slow.length}`);
  if (buzzer.length) chain.push(`压哨提交 ×${buzzer.length}`);
  if (dropped.length) chain.push(`答题未提交跳出 ×${dropped.length}`);
  if (repeat.length) chain.push(`反复提交 ×${repeat.length}`);
  if (maxStreak >= 2) chain.push(`连续答错 ×${maxStreak}`);
  if (instant.length) chain.push(`秒答 ×${instant.length}`);
  if (unfixed.length) chain.push(`订正未掌握 ×${unfixed.length}`);
  if (isBreak && record.breakStage === "correct") chain.push("订正中途跳出");

  const worst = [...qs].sort((a, b) => b.seconds - a.seconds)[0];
  const mood = type === "受挫型" ? `多次尝试仍未通过，判为受挫型（指数 ${score}）`
    : type === "无聊型" ? `作答过快且正确率不低，判为无聊型（指数 ${score}）`
      : type === "涣散型" ? `过程发生中断但未形成难度受挫，判为涣散型（指数 ${score}）`
        : chain.length ? `仅偶发单点异常，整体仍为正向型（指数 ${score}）`
          : `全程无异常信号，判为正向型（指数 ${score}）`;
  const optimize = isBreak ? `${record.jump} 前置台阶题 + 该处讲解重录`
    : type === "无聊型" ? "开放「我会了」跳测，直给挑战题"
      : repeat.length || slow.length ? `第 ${worst.no} 题（${worst.seconds}s）拆解为两问` : "保持当前内容梯度";

  return `<tr class="session-replay-row"><td colspan="12"><div class="inline-session-replay"><header><div><span>单次会话回放</span><h4>${sessionId} · 行为还原</h4><p>${user.name} · ${lessonRows[lessonIndex].name} · ${record.time}</p></div><div class="session-replay-stats"><span><b>${record.duration}</b>会话时长</span><span class="${timelineFlags >= 4 ? "risk" : ""}"><b>${timelineFlags} 个</b>异常信号</span><span class="${record.reachedCorrection && record.masteryRate !== null && record.masteryRate < 60 ? "risk" : ""}"><b>${!record.reachedCorrection ? "未进入" : record.masteryRate === null ? "无有效订正" : `${record.masteryRate}%`}</b>订正掌握</span><span class="${score >= 60 ? "risk" : ""}"><b>${score} · ${type}</b>情绪识别</span></div></header>${animationTrack(anim)}<div class="session-event-track">${events.map(e => e[4]
      ? `<button class="session-event is-question ${e[3] ? "is-" + e[3] : ""}" data-question="${e[4]}" title="点击查看原题"><time>${e[0]}</time><i></i><b>${e[1]}</b><small>${e[2]}</small></button>`
      : `<div class="session-event ${e[3] ? "is-" + e[3] : ""}"><time>${e[0]}</time><i></i><b>${e[1]}</b><small>${e[2]}</small></div>`).join("")}</div><footer><div><span>异常信号</span><b>${chain.length ? chain.join(" → ") : "全程无异常信号"}</b></div><i>→</i><div><span>情绪判断</span><b>${mood}</b></div><i>→</i><div class="optimize"><span>产品优化点</span><b>${optimize}</b></div></footer></div></td></tr>`;
}

function userLessonDetailTable(user) {
  const records = lessonRows.map((_, index) => userLessonRecord(user, index));
  const attended = records.filter(r => r.attended).length;
  const completed = records.filter(r => r.status === "完课").length;
  const anomalies = records.reduce((sum, r) => sum + (r.questions || []).filter(q => q.anomaly).length, 0);
  return `<article class="panel user-detail-panel">
    <div class="user-detail-heading"><button data-back-users><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>返回用户矩阵</button><div class="selected-user-avatar">${user.name.slice(0,1)}</div><div><span>当前学生</span><h3>${user.name} <small>${user.id}</small></h3><p>${user.refunded ? "已退费" : "未退费"} · ${user.renew ? "已续费" : "未续费"} · ${lifecyclePeriod()[1]} ${lifecyclePeriod()[2]}</p></div><div class="user-detail-summary"><span><b>${attended}/9</b>参课</span><span><b>${completed}/9</b>完课</span><span><b>${anomalies}</b>异常题</span></div></div>
    ${userProfileMarkup(user)}
    <div class="detail-rule"><i></i><span>未参课仅保留状态，其余字段为空；参未完和完课均展示实际学习行为。</span></div>
    <div class="tracking-wrap"><table class="lesson-detail-table"><thead><tr><th>周次 / 课时</th><th>状态</th><th>学习时间</th><th>学习时长</th><th>跳出节点</th><th>正确率</th>${[1,2,3,4,5,6].map(i=>`<th>第 ${i} 题</th>`).join("")}</tr></thead><tbody>${records.map((r,i)=> {
      const week = i < 8 ? `第 ${Math.floor(i/2)+1} 周` : "月度加课";
      if (!r.attended) return `<tr class="unattended-row"><td><div class="lesson-row-title"><span class="session-toggle-placeholder"></span><div><span>${week}</span><b>${lessonRows[i].name}</b></div></div></td><td><span class="detail-status blank">未参</span></td>${Array(10).fill('<td class="blank-cell"></td>').join("")}</tr>`;
      const expanded = state.selectedLessonSession === i;
      return `<tr class="${expanded ? "is-session-open" : ""}"><td><div class="lesson-row-title"><button data-toggle-user-session="${i}" aria-label="${expanded ? "收起" : "展开"}课时会话回放">${expanded ? "−" : "+"}</button><div><span>${week}</span><b>${lessonRows[i].name}</b><em>单次会话回放</em></div></div></td><td><span class="detail-status ${r.statusClass}">${r.status}</span></td><td class="study-time">${r.time}</td><td>${r.duration}</td><td class="${r.jump!=="—" ? "jump-node" : ""}">${r.jump}</td><td><b>${r.accuracy}</b></td>${r.questions.map((q, qi) => questionDetailCell(q, qi, i)).join("")}</tr>${expanded ? lessonSessionReplay(user,i,r) : ""}`;
    }).join("")}</tbody></table></div>
  </article>`;
}

const userEmotionClusterMeta = {
  frustration: { label: "受挫型", feeling: "太难", color: "#c65e49", pale: "#fff0ed", evidence: "过长、反复提交、连续答错", criterion: "过长题 + 反复提交 ≥4 次，或断点 ≥2 次" },
  boredom: { label: "无聊型", feeling: "太简单", color: "#5b7fc9", pale: "#edf2fb", evidence: "秒答、快进、跳过讲解", criterion: "未命中正向/涣散，且月度秒答 ≥7 次" },
  distraction: { label: "涣散型", feeling: "分心", color: "#8772bb", pale: "#f2eff8", evidence: "未参、会话中断、连续脱节", criterion: "月度未参 ≥3 节，已形成持续性脱离" },
  positive: { label: "正向型", feeling: "投入顺畅", color: "#1b8c72", pale: "#e8f4ef", evidence: "主动参课、稳定完课、订正掌握", criterion: "完课 ≥7 节、未参 ≤1 节且异常指数 <50" },
  pending: { label: "待观测用户", feeling: "证据不足", color: "#82918b", pale: "#f1f4f2", evidence: "四类标准均未命中，继续积累有效会话", criterion: "未达到正向、涣散、无聊或受挫任一标准" }
};

// 情绪聚类只使用上表已经呈现的课时状态与逐题行为，不引入问卷标签。
// 每位用户只进入一个分组；证据不足或前两类得分过近时不强行贴标签，进入待观测。
function userBehaviorCluster(user) {
  const profile = userMonthlyProfile(user);
  const missed = user.states.filter(s => s === "missed").length;
  const completed = user.states.filter(s => s === "done").length;
  const attended = user.states.length - missed;
  const recentAdverse = user.states.slice(-4).filter(s => s !== "done").length;
  let type = "pending";
  if (completed >= 7 && missed <= 1 && profile.index < 50) type = "positive";
  else if (missed >= 3) type = "distraction";
  else if (profile.instant >= 7) type = "boredom";
  else if (profile.slow + profile.repeat >= 4 || profile.breaks >= 2) type = "frustration";
  const matchedEvidence = {
    frustration: [`过长题 ${profile.slow} 次`, `反复提交 ${profile.repeat} 次`, `断点 ${profile.breaks} 次`],
    boredom: [`秒答 ${profile.instant} 次`, `完课 ${completed}/9`, `异常指数 ${profile.index}`],
    distraction: [`未参 ${missed}/9`, `近 4 节异常 ${recentAdverse} 节`, `断点 ${profile.breaks} 次`],
    positive: [`参课 ${attended}/9`, `完课 ${completed}/9`, `异常指数 ${profile.index}`],
    pending: [`参课 ${attended}/9`, `过长/反复 ${profile.slow + profile.repeat} 次`, `秒答 ${profile.instant} 次`]
  }[type];
  return { type, profile, missed, completed, attended, recentAdverse, matchedEvidence };
}

function dropoutWarning(user) {
  const cluster = userBehaviorCluster(user);
  const breaks = user.states.filter(s => s === "exit" || s === "learning").length;
  const tailMissed = [...user.states].reverse().findIndex(s => s !== "missed");
  const consecutiveMissed = tailMissed < 0 ? user.states.length : tailMissed;
  const score = Math.min(96, 18 + cluster.recentAdverse * 12 + cluster.missed * 4 + breaks * 7 + (user.renew ? -8 : 8));
  const level = score >= 70 ? "高危" : score >= 50 ? "观察" : "稳定";
  const signals = [];
  if (consecutiveMissed >= 2) signals.push(`连续 ${consecutiveMissed} 节未参`);
  if (cluster.recentAdverse >= 2) signals.push(`最近 4 节 ${cluster.recentAdverse} 节异常`);
  if (breaks) signals.push(`累计 ${breaks} 次参未完/跳出`);
  return { user, cluster, score, level, signals: signals.slice(0, 2) };
}

function userEmotionAndWarningPanel(users) {
  const clustered = users.map(user => ({ user, ...userBehaviorCluster(user) }));
  const warnings = users.filter(user => !user.refunded).map(dropoutWarning).filter(item => item.score >= 50).sort((a, b) => b.score - a.score).slice(0, 4);
  const counts = Object.fromEntries(Object.keys(userEmotionClusterMeta).map(key => [key, clustered.filter(item => item.type === key).length]));
  const total = Math.max(1, users.length);
  const classifiedCount = users.length - counts.pending;
  return `<div class="table-to-insight-link"><i></i><span>由连续学表现与 20 类异常信号共同计算</span><svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg></div>
    <section class="behavior-intelligence-panel"><header><div><span>03 / 情绪识别 · 行为结果衍生分析</span><h3>用户使用情绪聚类 × 脱离用户预警</h3><p>将上方当前筛选的全部用户逐一匹配到唯一分组；无法可靠分类的用户进入待观测，不强行贴标签。</p></div><em>当前筛选 ${users.length} 人 · 已全部分配</em></header>
      <div class="behavior-intelligence-grid">
        <article class="emotion-cluster-block"><div class="intelligence-title"><div><span>A / 用户使用情绪聚类</span><b>孩子使用时是什么感受？</b></div><small>行为聚类，不是心理诊断</small></div>
          <div class="emotion-assignment-summary"><span><small>当前选择</small><b>${userGroups.find(group => group[0] === state.userGroup)?.[1] || "全部用户"} · ${users.length} 人</b></span><i>→</i><span><small>四类已匹配</small><b>${classifiedCount} 人</b></span><i>+</i><span><small>待观测兜底</small><b>${counts.pending} 人</b></span><em>= ${users.length} 人全部有归属</em></div>
          <div class="emotion-assignment-rule"><b>分配规则</b><span>每位用户只进入一个分组：先识别稳定正向与连续脱离两类强证据，再区分无聊与受挫；四类标准均未命中时进入待观测。</span></div>
          <div class="emotion-cluster-grid">${Object.entries(userEmotionClusterMeta).map(([key, meta]) => { const members = clustered.filter(item => item.type === key); return `<section class="emotion-cluster-card ${key === "pending" ? "is-pending" : ""}" style="--cluster-color:${meta.color};--cluster-pale:${meta.pale}"><i></i><span><b>${meta.label}<em>${meta.feeling}</em></b><small>${meta.evidence}</small></span><strong>${counts[key]}<small>人 · ${(counts[key] / total * 100).toFixed(0)}%</small></strong><p><b>分类标准</b>${meta.criterion}</p><div class="emotion-assigned-users"><small>匹配用户</small>${members.length ? members.map(item => `<button data-select-user="${item.user.id}" title="${item.matchedEvidence.join(" · ")}"><b>${item.user.name}</b><span>${item.matchedEvidence.slice(0, 2).join(" · ")}</span><em>查看行为 →</em></button>`).join("") : "<span class=\"emotion-no-user\">当前筛选暂无匹配用户</span>"}</div></section>`; }).join("")}</div><footer><b>聚类用途</b><span>每位用户仅进入一个分组：受挫型降难度，无聊型提供跳测与挑战，涣散型优化续学提醒，正向型沉淀路径，待观测用户继续积累行为证据。</span></footer></article>
        <article class="dropout-warning-block"><div class="intelligence-title"><div><span>B / 脱离用户预警</span><b>谁正在从连续学习中脱离？</b></div><small>高危 ≥70 · 观察 50–69</small></div><div class="warning-summary"><span><b>${warnings.filter(w => w.level === "高危").length}</b>高危</span><span><b>${warnings.filter(w => w.level === "观察").length}</b>观察</span><p>按最近 4 节异常、累计未参及参未完联合评分</p></div><div class="warning-user-list">${warnings.length ? warnings.map(item => `<button data-select-user="${item.user.id}" class="warning-user is-${item.level === "高危" ? "high" : "watch"}"><span class="warning-avatar">${item.user.name.slice(0, 1)}</span><span><b>${item.user.name}<small>${userEmotionClusterMeta[item.cluster.type].label}</small></b><em>${item.signals.join(" · ") || "连续性开始下降"}</em></span><strong>${item.score}<small>${item.level}</small></strong><i>查看行为 →</i></button>`).join("") : '<div class="warning-empty">当前筛选人群暂无达到预警阈值的用户</div>'}</div><footer><b>建议动作</b><span>高危用户 24 小时内触达，先回放首次异常会话，再匹配难度、跳测或断点续学策略。</span></footer></article>
      </div>
    </section>`;
}

function usersTemplate() {
  const visibleUsers = trackingUsers.filter(userMatchesGroup);
  const selectedUser = trackingUsers.find(user => user.id === state.selectedUser);
  const matrix = `<article class="panel tracking-panel"><div class="panel-header"><div><h3>月度用户课时状态矩阵</h3><p>一个月 9 节：四周每周解锁 2 节，另加 1 节月度综合课；点击用户名查看完整课时明细</p></div><div class="status-legend"><span><i class="done"></i>完课</span><span><i class="learning"></i>参未完</span><span><i class="exit"></i>跳出</span><span><i class="missed"></i>未参</span></div></div>
      <div class="tracking-wrap"><table class="tracking-table month-tracking-table"><thead><tr class="week-band"><th rowspan="2">用户</th><th rowspan="2">结果状态</th><th colspan="2">第 1 周</th><th colspan="2">第 2 周</th><th colspan="2">第 3 周</th><th colspan="2">第 4 周</th><th>月度加课</th></tr><tr>${lessonRows.map((_,i)=>`<th>L${String(i+1).padStart(2,"0")}</th>`).join("")}</tr></thead><tbody>${visibleUsers.map(u=>`<tr><td><button class="student-name-button" data-select-user="${u.id}"><b>${u.name}</b><small>${u.id} · ${u.city} · ${u.channel}</small><em>查看课时明细 →</em></button></td><td><span class="lifecycle ${u.refunded?'churn':'active'}">${u.refunded?'已退费':'未退费'}</span><span class="lifecycle ${u.renew?'renew':'no-renew'}">${u.renew?'已续费':'未续费'}</span>${isPotentialRisk(u)?'<span class="lifecycle risk">潜在风险</span>':''}</td>${u.states.map((s,i)=>`<td><button class="lesson-state ${statusMeta[s][1]}" data-user-detail="${u.id}" data-lesson="${i}" title="${u.name} · ${lessonRows[i].name} · ${statusMeta[s][0]}"><i></i><span>${s==="learning"||s==="exit"?"参未完":s==="missed"?"未参":"完课"}</span></button></td>`).join("")}</tr>`).join("")}</tbody></table></div>
    </article>`;
  const groupAnalysis = selectedUser ? "" : `<section id="analysis-step-02" class="analysis-step-section" data-analysis-section="02">${signalDistributionPanel()}</section>
    <section id="analysis-step-03" class="analysis-step-section" data-analysis-section="03">${userEmotionAndWarningPanel(visibleUsers)}</section>
    <section id="analysis-step-04" class="analysis-step-section optimization-output-section" data-analysis-section="04"><div class="optimization-step-head"><div><span>04 / 断点优化</span><h2>把共性断点转成产品优化动作</h2><p>用结果人群对照判断优先级，再将动作定位到提醒时机、动画片段、具体题目与订正路径。</p></div><em>输出：可执行、可验证</em></div>
      <div class="compare-grid"><article><span>退费用户典型路径</span><b>连续 2 节未参课 → 退费风险升高</b><p>首次跳出多集中于 L03、L05，且跳出前一节正确率均值低于 65%。</p></article><article><span>续费用户典型路径</span><b>前 6 节完成 ≥ 5 节 → 续费率 71%</b><p>稳定完课用户的错题订正率比未续费用户高 19.4 个百分点。</p></article></div>
      ${sessionDegradationPanel()}
      ${boredomRenewalPanel()}
    </section>`;
  return `<section class="fade-in">${detailHeader("用户行为归因：连续学表现 → 异常信号 → 情绪识别 → 断点优化", "先看连续学习事实，再定位异常、识别使用情绪，并将断点落到可执行的产品优化位置。", "点击用户/课时：展开会话回放")}
    ${userMonitoringFlow(selectedUser)}
    ${selectedUser ? "" : analysisProcessNav()}
    <section id="analysis-step-01" class="analysis-step-section" data-analysis-section="01"><div class="continuity-section-head"><div><span>01 / 连续学表现</span><h2>用户学习行为的连续性表现</h2><p>从当前用户生命周期月份开始，每月连续观察四周 8 节常规课和 1 节月度加课。</p></div><em>当前用户生命周期月份开始</em></div>
      <div class="analysis-toolbar"><div><span>当前用户生命周期月份开始</span><b>${lifecyclePeriod()[1]} · ${lifecyclePeriod()[2]} · ${courseFilterLabel()} · ${packageFilterLabel()} · ${courseStartLabel()}开课</b></div><label>周期<select data-lifecycle-period>${lifecyclePeriodOptions()}</select></label><span class="cohort-range">同批进入 2,384 人 · ${lifecyclePeriod()[1]} 共 9 节</span></div>
      <div class="month-plan"><span><b>第 1 周</b>L01–L02</span><i></i><span><b>第 2 周</b>L03–L04</span><i></i><span><b>第 3 周</b>L05–L06</span><i></i><span><b>第 4 周</b>L07–L08</span><i></i><span class="extra"><b>月度加课</b>L09 综合挑战</span></div>
      <div class="segment-tabs">${userGroups.map(g=>`<button class="${state.userGroup===g[0]?'active':''}" data-user-group="${g[0]}"><span>${g[1]}</span><b>${g[2]}</b></button>`).join("")}</div>
      <div class="segment-definition"><b>潜在流失风险口径</b><span>未退费且未续费，并在最近 4 节中至少 2 节出现未参、参未完或跳出。</span></div>
      ${selectedUser ? userLessonDetailTable(selectedUser) : matrix}
    </section>
    ${selectedUser ? insight(`<b>${selectedUser.name} 的月度行为：</b>异常标签已按题目阈值标记——≤15 秒为秒答，同题提交 ≥3 次为反复，≥100 秒为过长；可直接定位需要回放的题目。`) : groupAnalysis}
    ${drawerShell()}
  </section>`;
}

function openDrawer(content) {
  const layer = document.getElementById("detailDrawer");
  if (!layer) return;
  drawerReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.getElementById("drawerContent").innerHTML = content;
  layer.classList.add("open");
  layer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  layer.querySelectorAll("[data-close-drawer]").forEach(x=>x.addEventListener("click", closeDrawer));
  layer.querySelector(".drawer-close")?.focus();
}

function closeDrawer() {
  const layer = document.getElementById("detailDrawer");
  if (!layer?.classList.contains("open")) return;
  layer.classList.remove("open");
  layer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (drawerReturnFocus?.isConnected) drawerReturnFocus.focus();
  drawerReturnFocus = null;
}

function openLessonDetail(index) {
  const r = lessonRows[index];
  const questions = lessonQuestionMetrics(index);
  const riskiest = [...questions].sort((a, b) => (Number(b.jump) + (100 - Number(b.accuracy)) / 5) - (Number(a.jump) + (100 - Number(a.accuracy)) / 5))[0];
  openDrawer(`<div class="drawer-kicker">课时维度归因—扫除硬伤详情</div><h2>${r.name}</h2><p class="drawer-sub">${courseFilterLabel()} · ${packageFilterLabel()} · ${courseStartLabel()}开课 · A 班 · 当前人群已解锁 ${scaled(2384)} 人</p>
    <div class="drawer-metrics"><div><span>参课率</span><b>${r.attend}%</b></div><div><span>参完率</span><b>${r.finish}%</b></div><div><span>课时跳出率</span><b class="danger">${r.jump}%</b></div><div><span>课时正确率</span><b>${r.accuracy}%</b></div></div>
    <div class="drawer-question-summary"><span>需优先检查</span><b>${riskiest.no} · ${riskiest.type}</b><p>答题 ${riskiest.time}s · 正确率 ${riskiest.accuracy}% · 跳出率 ${riskiest.jump}%</p></div>
    ${lessonVideoAnalysis(index, true)}
    <section class="lesson-stage-analysis is-question compact"><header><i>02</i><div><span>题目分析</span><b>难度、首答正确率、跳出、耗时、秒答与长停留</b></div></header>${questionMetricTable(index, true)}</section>
    ${lessonCorrectionAnalysis(index, true)}
    <h3 class="drawer-title">产品归因</h3><div class="root-cause"><span class="${r.tone}">${r.cause}</span><p>${index===4||index===6?`${riskiest.no} 同时出现低正确率、高耗时和高跳出，说明讲解承接到练习的难度跃迁过大。`:'逐题指标处于班期正常区间，继续观察后续课时的衰减趋势。'}</p></div>
    <div class="action-box"><b>建议迭代</b><p>优先调整 ${riskiest.no}：增加脚手架步骤或降低首问难度；改版后逐题对比答题时长、正确率与跳出率。</p></div>`);
}

function openTrackingDetail(studentId, lessonIndex) {
  const u = trackingUsers.find(x=>x.id===studentId), s = u.states[lessonIndex], base = 49 + lessonIndex*5 + studentId.charCodeAt(4)%9;
  const duration = s==="done" ? 24 + lessonIndex : s==="learning" ? 13 : s==="exit" ? 8 : 0;
  const accuracy = s==="missed" ? "—" : `${Math.max(48,88-lessonIndex*3-(u.refunded?14:0))}%`;
  const questions = [base,base+17,base+42,base+8,base+29];
  openDrawer(`<div class="drawer-kicker">用户 × 课时下钻</div><div class="student-drawer-head"><span>${u.name.slice(0,1)}</span><div><h2>${u.name}</h2><p>${u.id} · ${u.refunded?'退费用户':'未退费用户'} · ${u.renew?'已续费':'未续费'}</p></div></div>${userProfileMarkup(u, true)}
    <div class="lesson-focus"><small>当前课时</small><b>${lessonRows[lessonIndex].name}</b><span class="cause-pill ${s==='done'?'good':s==='exit'?'risk':'watch'}">${statusMeta[s][0]}</span></div>
    <div class="drawer-metrics six"><div><span>完成时间</span><b>${s==='done'?'07-18 20:46':'—'}</b></div><div><span>完成时长</span><b>${duration?duration+' min':'—'}</b></div><div><span>跳出</span><b class="${s==='exit'?'danger':''}">${s==='exit'?'是':'否'}</b></div><div><span>参课</span><b>${s==='missed'?'否':'是'}</b></div><div><span>完课</span><b>${s==='done'?'是':'否'}</b></div><div><span>正确率</span><b>${accuracy}</b></div></div>
    <h3 class="drawer-title">每道题答题时长</h3>${s==='missed'?'<div class="empty-state">该用户本节课未参课，暂无答题记录</div>':`<div class="question-bars">${questions.map((v,i)=>`<div><span>第 ${i+1} 题</span><i><em class="${v>90?'slow':''}" style="width:${Math.min(v/1.2,100)}%"></em></i><b>${v}s</b></div>`).join("")}</div>`}
    <div class="action-box"><b>行为归因</b><p>${s==='exit'?'用户在动画 68% 处退出，退出前发生 2 次快进；建议核查该片段信息密度。':s==='missed'?'前序课时未形成连续完课，建议在解锁后 24 小时进行学习提醒。':u.refunded?'本节学习路径完整，但该用户最终仍然退费——说明退费并非发生在这一节，需回看其首次出现连续断点的课时。':'学习路径完整，可作为未退费/续费用户的正向对照样本。'}</p></div>`);
}

const eventRows = [
  ["session_start / session_end", "会话开始与结束", "session_id、设备、入口来源", "会话数 / 单次时长", "新增"],
  ["open / unlock", "打开产品、课程解锁", "课程ID、课节ID、解锁周", "活跃 / 解锁率", ""],
  ["play / pause", "动画播放与暂停", "动画ID、版本、播放位置", "观看时长 / 内容卡点", ""],
  ["seek_forward", "动画向前拖动", "起止位置、连续次数", "拖拽跳过率 / 跳过区间", ""],
  ["playback_rate", "切换倍速播放", "倍速值、起始播放位置", "倍速快进率 / 嫌慢信号", "新增"],
  ["replay", "回看已播片段", "区间起止、重复次数", "重复回看信号", "新增"],
  ["stage_switch", "学 / 练 / 改环节切换", "来源环节、目标环节、当前进度", "跳过讲解 / 来回横跳信号", "新增"],
  ["answer", "提交题目答案", "题目ID、题序、尝试次数、正误、耗时、倒计时剩余", "秒答 / 临近倒计时 / 正确率 / 反复提交", ""],
  ["answer_change", "提交前修改答案", "题目ID、修改次数", "答案反复修改信号", "新增"],
  ["correction", "提交错题订正", "原错题事件ID、错题序号、耗时、正误、订正轮次", "错题1/2/3 · 订正正确率 / 跳出率 / 掌握率", ""],
  ["hint_view", "查看提示或答案解析", "题目ID、内容类型、停留时长、发生环节", "解析查看率 / 解析后改错命中率", "新增"],
  ["idle", "静默超时无操作", "静默时长、所在位置", "静默信号 / 空转时长", "新增"],
  ["app_background / app_foreground", "切后台与回前台", "离开时长、所在位置", "切后台信号 / 分心度", "新增"],
  ["exit", "退出当前课节", "所在环节、进度、题序、退出方式", "断点定位 / 断点会话率", ""],
  ["complete", "完成课节闭环", "学练改结果、延展题结果", "单课 / 双课完成率", ""]
];

function modelTemplate() {
  const models = [
    ["01", "用户基础表", "students", "年级学科、课包属性、开课日期、渠道与学习阶段画像", ["student_id · 学生ID", "grade / subject · 年级学科", "package_type / term · 全年/半年及班型", "city · 城市", "acquisition_channel · 购买渠道", "trial_lesson_count · 体验课次数", "device_type / model · 上课设备", "learning_year_type · 首/非首学年", "cohort_started_at · 开课日期"], "基础层", false],
    ["02", "学习会话表", "learning_sessions", "一次打开到离开为一行 · 断点定位主表", ["session_id · 会话ID", "is_break · 是否断点", "break_stage · 断点环节", "break_position_label · 断点位置", "resume_mode · 续接方式", "boredom_score · 厌烦指数"], "连续行为层", true],
    ["03", "学习事件明细表", "learning_events", "原始行为事实 · 按 event_sequence 还原序列", ["event_name · 19 类事件", "stage · 所属环节", "prev_event_gap_seconds · 距上一步", "question_index · 题序", "answer_attempt · 尝试次数", "properties_json · 扩展"], "连续行为层", true],
    ["04", "异常信号字典", "anomaly_signal_dict", "20 类信号的判定规则与权重 · 可配置", ["signal_code · 信号编码", "detect_rule · 判定规则", "threshold_json · 阈值", "emotion_type · 情绪归属", "weight · 权重", "reference_lift · 参考提升度"], "信号层", true],
    ["05", "会话异常明细表", "session_anomaly_signals", "一次会话命中一个信号一行", ["session_id · 会话ID", "signal_code · 信号编码", "seconds_before_break · 距断点秒数", "steps_before_break · 距断点步数", "position_label · 命中位置", "intensity · 强度"], "信号层", true],
    ["06", "学生情绪状态表", "student_emotion_states", "学生 × 自然周 · 厌烦指数与分型", ["boredom_index · 厌烦指数", "emotion_type · 情绪分型", "frustration / boredom / distraction", "top_signal_codes · 主导信号", "alert_level · 预警等级", "suggested_action · 建议动作"], "情绪层", true],
    ["07", "课程学习结果表", "course_learning_results", "每位学生 × 每节课", ["完成时间 / 完成时长", "参课 / 完课 / 跳出", "训练题数 / 首答正确", "错题数 / 订正正确", "lesson_sequence · 课序", "is_completed"], "结果层", false],
    ["08", "用户周度汇总表", "user_weekly_summaries", "每位学生 × 每自然周", ["解锁 / 学习 / 完成数", "session / break 计数", "resume_within_24h_count", "答题数 / 正确率", "health_score · 健康分", "risk_level · 风险等级"], "结果层", false],
    ["09", "内容质量表", "content_quality", "知识点 × 内容版本 × 日", ["动画ID / 版本", "题集ID / 版本", "break_session_rate · 断点率", "top_break_position · 断点热区", "难度 / 退出指标", "掌握指标"], "评估层", false],
    ["10", "用户结果决策表", "user_outcome_decisions", "一次退费/续费结果一行，冻结当时完课表现与反馈原因", ["outcome_type · 决策类型", "outcome_status · 结果状态", "completion_band · 完课分层", "completion_rate · 当时完课率", "primary_reason_code · 原因", "feedback_source · 反馈来源"], "结果决策层", true],
    ["11", "家长微信原声表", "parent_voice_feedback", "指导师收到的脱敏原声、分类主题及行为匹配结论", ["voice_text · 脱敏原声", "advisor_id · 指导师匿名ID", "primary_topic · 主主题", "topic_labels_json · 分类标签", "classification_confidence · 置信度", "behavior_evidence_json · 行为证据", "attribution_conclusion · 归因", "recommended_action · 动作"], "原声归因层", true]
  ];
  return `<section class="fade-in">${detailHeader("底层数据模型", "十一张表把用户结果、家长原声、用户画像、连续行为、情绪状态与内容质量串起来。", "11 张表 · 19 类事件 · 17 个视图")}
    <div class="model-flow"><span>家长原声</span><i>分类抽取</i><span>结果决策</span><i>定位人群</i><span>学生画像</span><i>1 : N</i><span class="is-new">学习会话</span><i>1 : N</i><span class="is-new">行为事件</span><i>规则判定</i><span class="is-new">异常信号</span><i>加权</i><span class="is-new">情绪状态</span><i>验证</i><span>课节结果</span></div>
    <div class="model-grid">${models.map(m => `<article class="model-card ${m[6] ? "is-new" : ""}"><header><span>${m[0]}</span><div><h3>${m[1]}</h3><code>${m[2]}</code></div></header><p>${m[3]}</p><div class="field-list">${m[4].map(f => `<span>${f}</span>`).join("")}</div><footer><i></i>${m[5]}${m[6] ? " · 本次新增" : ""}</footer></article>`).join("")}</div>
    <div class="panel panel-full" style="margin-top:18px"><div class="panel-header"><div><h3>埋点事件口径</h3><p>同一 session_id 内按 event_sequence 排序，即可完整还原一次连续使用行为</p></div><span class="panel-tag">19 类事件 · 8 类新增</span></div><div class="table-wrap"><table class="event-table"><thead><tr><th>事件名</th><th>触发时机</th><th>关键属性</th><th>支持指标</th><th>状态</th></tr></thead><tbody>${eventRows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4] ? '<span class="status-dot is-new">待埋点</span>' : '<span class="status-dot">已上报</span>'}</td></tr>`).join("")}</tbody></table></div></div>
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
  framework: { title: "分析框架导图", eyebrow: "方法说明 / ANALYSIS LOGIC", render: frameworkTemplate },
  overview: { title: "客户决策行为背后的可能性主因", eyebrow: "决策驾驶舱 / OUTCOME FIRST", render: overviewTemplate },
  chain: { title: "连续行为链路还原", eyebrow: "断点定位 / SESSION PATH", render: chainTemplate },
  signal: { title: "断点前异常信号", eyebrow: "方案 02 / 异常归因", render: signalTemplate },
  emotion: { title: "厌烦情绪锚定与干预", eyebrow: "方案 03 / 情绪与动作", render: emotionTemplate },
  lesson: { title: "课时维度归因—扫除硬伤", eyebrow: "迭代归因 / 课时", render: lessonTemplate },
  users: { title: "用户行为归因", eyebrow: "迭代归因 / 用户", render: usersTemplate },
  model: { title: "底层数据模型", eyebrow: "数据管理", render: modelTemplate }
};

function render() {
  const view = views[state.view];
  document.getElementById("gradeSelect").value = state.grade;
  document.getElementById("subjectSelect").value = state.subject;
  document.getElementById("packageTypeSelect").value = state.packageType;
  document.getElementById("courseStartDate").value = state.courseStartDate;
  document.getElementById("analysisCycleSelect").value = state.analysisCycle;
  document.getElementById("segmentSelect").value = state.segment;
  document.getElementById("pageTitle").textContent = view.title;
  document.getElementById("pageEyebrow").textContent = view.eyebrow;
  // 上一视图移到 body 上的抽屉与原题浮层不会随 #content 重绘被清掉，先移除。
  document.querySelectorAll("body > .drawer-layer").forEach(el => el.remove());
  closeQuestionPop();
  analysisStepObserver?.disconnect();
  analysisStepObserver = null;
  document.body.style.overflow = "";
  document.getElementById("content").innerHTML = view.render();
  // 抽屉必须挂在 body 上：留在 .fade-in 内部时，动画期间的 transform 会让它
  // 成为 position: fixed 的包含块，抽屉会贴着 section 定位而不是视口。
  const drawer = document.getElementById("detailDrawer");
  if (drawer) document.body.appendChild(drawer);
  const monitoringViews = ["chain", "signal", "emotion"];
  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.view === state.view);
    el.classList.toggle("parent-active", el.dataset.view === "users" && monitoringViews.includes(state.view));
  });
  document.querySelectorAll("[data-open]").forEach(el => el.addEventListener("click", () => navigate(el.dataset.open)));
  document.querySelectorAll("[data-view-all-alerts]").forEach(el => el.addEventListener("click", openAllInterventionStudents));
  document.querySelectorAll("[data-signal-detail]").forEach(el => el.addEventListener("click", () => openSignalEvidence(Number(el.dataset.signalDetail))));
  const analysisJumpButtons = [...document.querySelectorAll("[data-analysis-jump]")];
  const analysisSections = [...document.querySelectorAll("[data-analysis-section]")];
  const activateAnalysisStep = targetId => {
    analysisJumpButtons.forEach(button => button.classList.toggle("active", button.dataset.analysisJump === targetId));
    analysisSections.forEach(section => section.classList.toggle("is-active-step", section.id === targetId));
  };
  analysisJumpButtons.forEach(button => button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.analysisJump);
    if (!target) return;
    activateAnalysisStep(target.id);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  if (analysisSections.length && "IntersectionObserver" in window) {
    analysisStepObserver = new IntersectionObserver(entries => {
      const current = entries.filter(entry => entry.isIntersecting).sort((a, b) => Math.abs(a.boundingClientRect.top - 178) - Math.abs(b.boundingClientRect.top - 178))[0];
      if (current) activateAnalysisStep(current.target.id);
    }, { rootMargin: "-170px 0px -62% 0px", threshold: [0, .05, .2] });
    analysisSections.forEach(section => analysisStepObserver.observe(section));
  }
  document.querySelectorAll("[data-toggle-voice]").forEach(button => button.addEventListener("click", () => {
    const card = button.closest(".reason-voice-evidence");
    const expanded = card.classList.toggle("open");
    button.setAttribute("aria-expanded", String(expanded));
    button.querySelector(".voice-toggle-label").textContent = expanded ? "收回原声" : "展开原声";
  }));
  document.querySelectorAll("[data-signal-sort]").forEach(el => el.addEventListener("click", () => { state.signalSort = el.dataset.signalSort; render(); }));
  document.querySelectorAll("[data-chain-range]").forEach(el => el.addEventListener("click", () => { state.chainRange = el.dataset.chainRange; render(); }));
  document.querySelectorAll("[data-question]").forEach(el => el.addEventListener("click", event => {
    event.stopPropagation();
    const [lessonIndex, qIndex] = el.dataset.question.split("-").map(Number);
    // 只在该学生自己的明细面板里才带上作答记录。用 DOM 上下文判断而不是 state.selectedUser：
    // 后者切换视图后仍会残留，会把上一个学生的答题结果显示在与他无关的课时归因页上。
    const inUserPanel = !!el.closest(".user-detail-panel");
    const user = inUserPanel ? trackingUsers.find(u => u.id === state.selectedUser) : null;
    const record = user ? userLessonRecord(user, lessonIndex) : null;
    openQuestionPop(el, lessonIndex, qIndex, record && record.attended ? record.questions[qIndex] : null);
  }));
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
  document.querySelectorAll("[data-user-detail]").forEach(el => el.addEventListener("click", () => {
    const id = el.dataset.userDetail, lesson = Number(el.dataset.lesson);
    const user = trackingUsers.find(u => u.id === id);
    state.selectedUser = id;
    // 未参课的课时没有会话可回放，退回到该生第一节参过的课，避免下钻后一片空白。
    state.selectedLessonSession = user && user.states[lesson] !== "missed"
      ? lesson
      : user ? user.states.findIndex(s => s !== "missed") : lesson;
    render();
  }));
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
  document.querySelectorAll("[data-user-group]").forEach(el => el.addEventListener("click", () => {
    state.userGroup = el.dataset.userGroup;
    state.segment = el.dataset.userGroup;
    if (segmentOutcomeMap[state.segment]) state.outcome = segmentOutcomeMap[state.segment];
    state.selectedUser = null;
    state.selectedLessonSession = null;
    render();
  }));
  document.querySelectorAll("[data-lifecycle-period]").forEach(el => el.addEventListener("change", () => { state.period = el.value; state.selectedUser = null; state.selectedLessonSession = null; render(); }));
  document.querySelectorAll("[data-outcome]").forEach(el => el.addEventListener("click", () => {
    state.outcome = el.dataset.outcome;
    state.segment = outcomeSegmentMap[state.outcome];
    state.userGroup = state.segment;
    state.selectedUser = null;
    state.selectedLessonSession = null;
    render();
  }));
  document.querySelectorAll("[data-close-drawer]").forEach(el => el.addEventListener("click", closeDrawer));
}

function navigate(view) {
  state.view = view;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  closeMenu();
}

function exportTableForCurrentView() {
  let headers, rows;
  if (state.view === "overview") {
    headers = ["结果人群", "用户数", "占比", "关键判断"];
    rows = outcomeGroups.map(group => [group.label, group.count, group.rate, group.key]);
  } else if (state.view === "chain") {
    headers = ["断点环节", "断点占比", "热区", "热区说明"];
    rows = breakStages.map(stage => [stage.name, `${stage.total}%`, stage.buckets[stage.hot][0], stage.note]);
  } else if (state.view === "signal") {
    headers = ["异常信号", "环节", "判定规则", "断点会话命中率", "完课会话基线", "提升度", "情绪归属"];
    const ordered = [...signals].sort((a, b) => state.signalSort === "coverage" ? b.brk - a.brk : b.lift - a.lift);
    rows = ordered.map(signal => [signal.name, signal.stage, signal.rule, `${signal.brk}%`, `${signal.base}%`, `${signal.lift}×`, signal.emo]);
  } else if (state.view === "emotion") {
    headers = ["情绪分型", "占比", "分级/处理"];
    rows = emotions.map(emotion => [emotion.name, `${emotion.share}%`, emotion.key === "engaged" ? "投入" : "需结合会话证据干预"]);
  } else if (state.view === "lesson") {
    headers = ["课时", "完成时间", "完成时长", "跳出率", "参课率", "参完率", "正确率", "题均时长", "归因结论"];
    rows = lessonRows.map(lesson => [lesson.name, lesson.time, lesson.duration, `${lesson.jump}%`, `${lesson.attend}%`, `${lesson.finish}%`, `${lesson.accuracy}%`, lesson.answer, lesson.cause]);
  } else if (state.view === "users") {
    headers = ["用户ID", "脱敏姓名", "退费状态", "续费状态", "城市", "渠道", ...lessonRows.map((_, index) => `L${String(index + 1).padStart(2, "0")}`)];
    rows = trackingUsers.filter(userMatchesGroup).map(user => [user.id, user.name, user.refunded ? "已退费" : "未退费", user.renew ? "已续费" : "未续费", user.city, user.channel, ...user.states.map(status => statusMeta[status][0])]);
  } else if (state.view === "model") {
    headers = ["事件名", "触发时机", "关键属性", "支持指标", "状态"];
    rows = eventRows.map(row => [row[0], row[1], row[2], row[3], row[4] ? "待埋点" : "已上报"]);
  } else {
    headers = ["页面", "当前筛选摘要"];
    rows = [[views[state.view].title, `${courseFilterLabel()} · ${packageFilterLabel()} · ${analysisPeriodLabel()} · ${segmentFilterLabel()}`]];
  }
  const contextHeaders = ["年级", "学科", "课包", "开班日期", "分析周期", "针对人群"];
  const context = [gradeFilterLabel(), subjectFilterLabel(), packageFilterLabel(), state.courseStartDate, analysisPeriodLabel(), segmentFilterLabel()];
  return { headers: [...headers, ...contextHeaders], rows: rows.map(row => [...row, ...context]) };
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

document.querySelectorAll(".nav-item").forEach(el => el.addEventListener("click", () => navigate(el.dataset.view)));
document.querySelector(".brand").addEventListener("click", event => { event.preventDefault(); navigate("overview"); });
document.getElementById("gradeSelect").addEventListener("change", e => { state.grade = e.target.value; state.selectedUser = null; state.selectedLessonSession = null; render(); });
document.getElementById("subjectSelect").addEventListener("change", e => { state.subject = e.target.value; state.selectedUser = null; state.selectedLessonSession = null; render(); });
document.getElementById("packageTypeSelect").addEventListener("change", e => {
  state.packageType = e.target.value;
  if (isHalfYearPackage() && Number(state.period.slice(1)) > 6) state.period = "m1";
  state.selectedUser = null;
  state.selectedLessonSession = null;
  render();
});
document.getElementById("courseStartDate").addEventListener("change", e => { state.courseStartDate = e.target.value || "2026-08-01"; state.selectedUser = null; state.selectedLessonSession = null; render(); });
document.getElementById("analysisCycleSelect").addEventListener("change", e => { state.analysisCycle = e.target.value; state.selectedUser = null; state.selectedLessonSession = null; render(); });
document.getElementById("segmentSelect").addEventListener("change", e => {
  state.segment = e.target.value;
  state.userGroup = e.target.value;
  if (segmentOutcomeMap[state.segment]) state.outcome = segmentOutcomeMap[state.segment];
  state.selectedUser = null;
  state.selectedLessonSession = null;
  render();
});
document.getElementById("exportButton").addEventListener("click", () => {
  const { headers, rows } = exportTableForCurrentView();
  const csv = "﻿" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `周周学，周周up_${views[state.view].title.replaceAll("/", "-")}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  const toast = document.getElementById("toast"); toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2200);
});

// 原题浮层：点空白处、按 Esc、页面滚动都收起（浮层按锚点定位，滚动后位置会失真）。
document.addEventListener("click", e => { if (!e.target.closest("#questionPop")) closeQuestionPop(); });
document.addEventListener("keydown", e => {
  const openDrawerLayer = document.querySelector("#detailDrawer.open");
  if (e.key === "Tab" && openDrawerLayer) {
    const focusable = [...openDrawerLayer.querySelectorAll('button:not([disabled]), a[href], select:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    if (focusable.length) {
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  if (e.key !== "Escape") return;
  closeQuestionPop();
  closeDrawer();
  closeMenu();
});
window.addEventListener("scroll", closeQuestionPop, { passive: true });

const sidebar = document.querySelector(".sidebar"), scrim = document.getElementById("scrim");
const menuButton = document.getElementById("menuButton");
function closeMenu() { sidebar.classList.remove("open"); scrim.classList.remove("show"); menuButton.setAttribute("aria-expanded", "false"); menuButton.setAttribute("aria-label", "打开菜单"); }
menuButton.setAttribute("aria-expanded", "false");
menuButton.addEventListener("click", () => { sidebar.classList.add("open"); scrim.classList.add("show"); menuButton.setAttribute("aria-expanded", "true"); menuButton.setAttribute("aria-label", "关闭菜单"); });
scrim.addEventListener("click", closeMenu);
render();
