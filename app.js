const state = { view: "overview", period: "week", segment: "all" };

const icons = {
  open: '<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 8h8M8 12h6"/></svg>',
  learn: '<svg viewBox="0 0 24 24"><path d="m4 6 8-3 8 3-8 3-8-3Z"/><path d="M7 8v6c0 1 2.2 3 5 3s5-2 5-3V8M20 7v7"/></svg>',
  practice: '<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM8 9l2 2 4-4M8 15h8"/></svg>',
  revise: '<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 1-2.3-5.7L20 8"/><path d="M20 3v5h-5M9 12l2 2 4-5"/></svg>',
  bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M8.5 15.5a7 7 0 1 1 7 0c-.8.6-1.5 1.4-1.5 2.5h-4c0-1.1-.7-1.9-1.5-2.5Z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="m9 7 8 5-8 5V7Z"/><circle cx="12" cy="12" r="9"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  alert: '<svg viewBox="0 0 24 24"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17.5v.1"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>'
};

const periodFactors = { week: 1, lastWeek: .94, month: 3.82 };
const segmentFactors = { all: 1, new: .31, risk: .14 };
const formatNumber = (value) => Math.round(value).toLocaleString("zh-CN");
const scaled = (value) => formatNumber(value * periodFactors[state.period] * segmentFactors[state.segment]);
const pctShift = () => state.segment === "risk" ? -11.2 : state.segment === "new" ? 3.1 : 0;
const pct = (value) => `${Math.max(0, value + pctShift()).toFixed(1)}%`;

const schemes = [
  { id: "journey", no: "01", title: "学习闭环监测", color: "#1b8c72", pale: "#e8f4ef", desc: "看学生是否顺利完成“解锁—学—练—改”，定位每一步的关键流失。", footer: "回答：流程走得顺不顺" },
  { id: "experience", no: "02", title: "体验质量诊断", color: "#5b7fc9", pale: "#edf2fb", desc: "观察时长、卡顿、退出与错误分布，发现具体内容和交互体验问题。", footer: "回答：哪里需要被优化" },
  { id: "outcome", no: "03", title: "学习结果与预警", color: "#f08068", pale: "#fff0ed", desc: "连接完成、正确率与坚持度，识别高风险学生并衡量真实学习结果。", footer: "回答：学生有没有学会" }
];

function kpiCard(label, value, trend, note, icon = "↗", down = false) {
  return `<article class="kpi-card"><div class="kpi-head"><span>${label}</span><i>${icon}</i></div><div class="kpi-value"><strong>${value}</strong><span class="trend ${down ? "down" : ""}">${trend}</span></div><small>${note}</small></article>`;
}

function overviewTemplate() {
  return `
    <section class="fade-in">
      <div class="intro-row"><div><h2>先看全局，再定位问题</h2><p>三套方案从过程、体验到结果逐层深入。建议先用闭环监测发现流失，再用体验诊断定位原因，最后以学习结果验证改版价值。</p></div><span class="data-note"><i></i> 当前为演示数据</span></div>
      <div class="scheme-grid">
        ${schemes.map(s => `<article class="scheme-card" data-open="${s.id}" style="--scheme-color:${s.color};--scheme-pale:${s.pale}"><div class="scheme-top"><span class="scheme-number">${s.no}</span><span class="scheme-arrow">${icons.arrow}</span></div><h3>${s.title}</h3><p>${s.desc}</p><footer><i></i>${s.footer}</footer></article>`).join("")}
      </div>
      <div class="kpi-grid">
        ${kpiCard("本周学习学生", scaled(2384), "+8.4%", "较上周同期", "人")}
        ${kpiCard("双课完成率", pct(68.4), "+3.2%", "完成每周 2 节课", "%")}
        ${kpiCard("练习正确率", pct(76.8), "+1.6%", "首答正确题目占比", "✓")}
        ${kpiCard("待关注学生", scaled(186), "-12 人", "连续 7 天未学习", "!", true)}
      </div>
      <div class="dashboard-grid">
        <article class="panel"><div class="panel-header"><div><h3>学习闭环转化</h3><p>本周解锁课程的学生 · 去重人数</p></div><span class="panel-tag">核心漏斗</span></div>${funnelMarkup()}<div class="insight-box"><span class="bulb">${icons.bulb}</span><span><b>本周洞察：</b>“练 → 改”仍是主要流失环节，建议强化错题入口反馈与完成激励。</span></div></article>
        <article class="panel"><div class="panel-header"><div><h3>高流失内容 TOP 5</h3><p>按进入后未完成率排序</p></div><span class="panel-tag">需关注</span></div>${rankList([{n:"一次函数图像",v:42},{n:"全等三角形",v:37},{n:"整式乘法",v:33},{n:"浮力与压强",v:29},{n:"古诗文理解",v:24}], "#f08068")}</article>
      </div>
    </section>`;
}

function funnelMarkup() {
  const base = [2384, 2146, 1932, 1651];
  const stages = [
    ["learn", "完成“学”", "90.0%", "平均 8.6 分钟", "#1b8c72", "#e8f4ef"],
    ["practice", "完成“练”", "81.0%", "平均 12.4 分钟", "#5b7fc9", "#edf2fb"],
    ["revise", "完成“改”", "69.3%", "平均 6.2 分钟", "#8772bb", "#f2eff8"],
    ["open", "完整闭环", "68.4%", "双课完成", "#f08068", "#fff0ed"]
  ];
  return `<div class="funnel">${stages.map((s,i)=>`<div class="funnel-step" style="--stage-color:${s[4]};--stage-pale:${s[5]}"><span class="funnel-icon">${icons[s[0]]}</span><b>${scaled(base[i])}</b><span>${s[1]} · ${pct(parseFloat(s[2]))}</span><small>${s[3]}</small></div>`).join("")}</div>`;
}

function rankList(rows, color) {
  const max = Math.max(...rows.map(r=>r.v));
  return `<div class="rank-list">${rows.map(r=>`<div class="rank-row"><span class="rank-label">${r.n}</span><div class="bar-track"><div class="bar-fill" style="width:${r.v/max*100}%;--bar-color:${color}"></div></div><span class="rank-value">${r.v}%</span></div>`).join("")}</div>`;
}

function detailHeader(title, desc, goal) {
  return `<button class="back-button" data-open="overview"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>返回总览</button><div class="section-head"><div><h2>${title}</h2><p>${desc}</p></div><span class="goal-pill">${goal}</span></div>`;
}

function journeyTemplate() {
  return `<section class="fade-in">${detailHeader("方案一 · 学习闭环监测", "追踪从每周课程解锁到完成错题订正的完整路径，快速识别流失节点。", "核心目标：提高双课闭环率")}
    <div class="kpi-grid">${kpiCard("课程解锁人数",scaled(2650),"+6.3%","本周期至少解锁 1 节","人")}${kpiCard("首课启动率",pct(89.9),"+2.4%","解锁后 24 小时内启动","%")}${kpiCard("单课闭环率",pct(72.6),"+3.5%","完整完成学练改","✓")}${kpiCard("双课闭环率",pct(68.4),"+3.2%","每周 2 节均完成","2")}</div>
    <div class="dashboard-grid">
      <article class="panel panel-wide"><div class="panel-header"><div><h3>本周学习旅程</h3><p>人数与上一步转化率</p></div><span class="panel-tag">目标 ≥ 75%</span></div>${flowMarkup()}</article>
      <article class="panel"><div class="panel-header"><div><h3>双课闭环率趋势</h3><p>近 8 周 · 每周完成 2 节课</p></div><div class="panel-actions"><button class="mini-tab active">闭环率</button><button class="mini-tab">人数</button></div></div>${lineChart([58,61,60,64,66,65,67,68])}<div class="insight-box"><span class="bulb">${icons.bulb}</span><span>第 15 周上线“错题回顾提醒”后，闭环率累计提升 <b>4.3 个百分点</b>。</span></div></article>
      <article class="panel"><div class="panel-header"><div><h3>环节关键指标</h3><p>学、练、改三段拆解</p></div></div>${stageCards()}</article>
    </div></section>`;
}

function flowMarkup() {
  const nodes = [
    ["解锁",scaled(2650),"100%","#294c45","#e8efed"], ["进入学习",scaled(2384),pct(89.9),"#1b8c72","#e8f4ef"],
    ["完成动画",scaled(2146),pct(90),"#5b7fc9","#edf2fb"], ["完成训练",scaled(1932),pct(90),"#8772bb","#f2eff8"], ["完成订正",scaled(1651),pct(85.5),"#f08068","#fff0ed"]
  ];
  return `<div class="flow-track">${nodes.map((n,i)=>`<div class="flow-node" style="--node-color:${n[3]};--node-pale:${n[4]}"><i>${i+1}</i><b>${n[0]} · ${n[1]}</b><small>${n[2]}</small></div>`).join("")}</div><div class="insight-box"><span class="bulb">${icons.bulb}</span><span><b>最大机会点：</b>训练完成后仍有 14.5% 学生未进入订正，约影响 ${scaled(281)} 人/周。</span></div>`;
}

function lineChart(values) {
  const min = 50, max = 75;
  const pts = values.map((v,i)=>`${i/(values.length-1)*100},${100-(v-min)/(max-min)*100}`).join(" ");
  const area = `0,100 ${pts} 100,100`;
  return `<div class="line-chart"><div class="y-axis"><span>75%</span><span>65%</span><span>55%</span><span>50%</span></div><div class="plot"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b8c72" stop-opacity=".22"/><stop offset="1" stop-color="#1b8c72" stop-opacity="0"/></linearGradient></defs><polygon class="area" points="${area}"/><polyline class="chart-line" points="${pts}"/>${values.map((v,i)=>`<circle class="dot" cx="${i/(values.length-1)*100}" cy="${100-(v-min)/(max-min)*100}" r="1.8"/>`).join("")}</svg></div><div class="x-axis">${["W11","W12","W13","W14","W15","W16","W17","本周"].map(x=>`<span>${x}</span>`).join("")}</div></div>`;
}

function stageCards() {
  const stages = [
    ["学","动画讲解","#1b8c72","#e8f4ef",[["完成率",pct(90)],["平均观看", "8.6 min"],["拖拽/跳过","12.3%"]]],
    ["练","知识训练","#5b7fc9","#edf2fb",[["完成率",pct(81)],["首答正确率",pct(76.8)],["平均用时","12.4 min"]]],
    ["改","错题订正","#8772bb","#f2eff8",[["进入率",pct(85.5)],["订正正确率",pct(84.1)],["延展题完成","63.7%"]]]
  ];
  return `<div class="stage-grid">${stages.map(s=>`<div class="stage-card" style="--stage-color:${s[2]};--stage-pale:${s[3]}"><div class="stage-title"><i>${s[0]}</i><div><b>${s[1]}</b><small>环节表现</small></div></div>${s[4].map(m=>`<div class="stage-metric"><span>${m[0]}</span><strong>${m[1]}</strong></div>`).join("")}</div>`).join("")}</div>`;
}

function experienceTemplate() {
  return `<section class="fade-in">${detailHeader("方案二 · 体验质量诊断", "用时、退出、重复操作与内容难度共同还原学生在每个环节的真实体验。", "核心目标：降低异常退出率")}
    <div class="kpi-grid">${kpiCard("平均单课用时","27.2 min","-1.8 min","目标区间 25–30 分钟","时")}${kpiCard("异常退出率",pct(8.7),"-1.4%","未完成且 30 分钟内未返回","!")}${kpiCard("视频有效观看率",pct(86.3),"+2.1%","观看超过视频时长 80%","▶")}${kpiCard("内容困难度","0.68","+0.03","错误率与耗时综合指数","ƒ")}</div>
    <div class="dashboard-grid">
      <article class="panel"><div class="panel-header"><div><h3>一周学习时段热力</h3><p>颜色越深代表活跃学生越多</p></div><span class="panel-tag">高峰 20:00</span></div>${heatmap()}</article>
      <article class="panel"><div class="panel-header"><div><h3>体验问题雷达</h3><p>按影响学生人数排序</p></div><span class="panel-tag">本周 4 项</span></div>${issueList()}</article>
      <article class="panel panel-wide"><div class="panel-header"><div><h3>内容困难度排行</h3><p>综合首答错误率、平均答题时长与重复观看率</p></div><div class="panel-actions"><button class="mini-tab active">全部年级</button><button class="mini-tab">初一</button><button class="mini-tab">初二</button></div></div>${rankList([{n:"八上数学 · 全等三角形判定",v:88},{n:"八上物理 · 浮力的计算",v:81},{n:"七下数学 · 一元一次不等式组",v:76},{n:"九上化学 · 化学方程式配平",v:68},{n:"七上语文 · 古诗文理解",v:62}], "#5b7fc9")}<div class="insight-box"><span class="bulb">${icons.bulb}</span><span><b>建议：</b>“全等三角形判定”动画回看率达 31%，且训练第 4 题停留超均值 42 秒，优先检查讲解与题目梯度。</span></div></article>
    </div></section>`;
}

function heatmap() {
  const rows = ["06–09","09–12","12–15","15–18","18–21","21–24"], days=["周一","周二","周三","周四","周五","周六","周日"];
  const vals = [[.08,.06,.08,.07,.08,.12,.14],[.08,.07,.06,.08,.08,.26,.31],[.12,.11,.12,.1,.13,.35,.38],[.2,.18,.19,.22,.24,.57,.52],[.68,.73,.71,.77,.8,.84,.76],[.38,.42,.4,.46,.44,.52,.47]];
  return `<div class="heatmap-wrap"><div class="heatmap"><span></span>${days.map(d=>`<span>${d}</span>`).join("")}${rows.map((r,i)=>`<span>${r}</span>${vals[i].map((v,j)=>`<span class="heat-cell" style="--intensity:${v};--intensity-text:${v<.3?'#70808a':'white'}" title="${days[j]} ${r}"></span>`).join("")}`).join("")}</div></div><div class="heat-legend"><span>低</span>${[.1,.25,.45,.65,.85].map(i=>`<i style="--i:${i}"></i>`).join("")}<span>高</span></div>`;
}

function issueList() {
  const issues = [["play","动画中途退出","影响 143 人 · 集中在 03:20–04:10","高","#f08068","#fff0ed"],["clock","单题停留过久","影响 98 人 · 超过 P90 用时","中","#e9b951","#fff5d6"],["alert","连续重复提交","影响 76 人 · 同题 ≥ 3 次","中","#8772bb","#f2eff8"],["revise","订正页往返跳转","影响 51 人 · 单次 ≥ 4 次","中","#5b7fc9","#edf2fb"]];
  return `<div class="issue-list">${issues.map(x=>`<div class="issue"><span class="issue-icon" style="--issue-color:${x[4]};--issue-pale:${x[5]}">${icons[x[0]]}</span><div><b>${x[1]}</b><small>${x[2]}</small></div><span class="severity ${x[3]==='高'?'high':'mid'}">${x[3]}优先</span></div>`).join("")}</div>`;
}

function outcomeTemplate() {
  return `<section class="fade-in">${detailHeader("方案三 · 学习结果与预警", "将过程行为与学习表现相连，既验证“是否学会”，也及时发现需要干预的学生。", "核心目标：提升学习有效性")}
    <div class="kpi-grid">${kpiCard("首答正确率",pct(76.8),"+1.6%","全部训练题","✓")}${kpiCard("订正后掌握率",pct(84.1),"+2.8%","错题订正后二次作答","↻")}${kpiCard("延展题完成率",pct(63.7),"+4.2%","进入并完成延展题","↗")}${kpiCard("预警学生",scaled(186),"-6.0%","满足至少一项风险规则","!",true)}</div>
    <div class="dashboard-grid">
      <article class="panel"><div class="panel-header"><div><h3>学生学习状态分层</h3><p>基于近 4 周完成度、正确率与学习频次</p></div><span class="panel-tag">${scaled(2384)} 人</span></div>${donut()}</article>
      <article class="panel"><div class="panel-header"><div><h3>需优先关注</h3><p>风险分最高的学生 · 已脱敏</p></div><span class="panel-tag">查看全部</span></div>${alertList()}</article>
      <article class="panel panel-wide"><div class="panel-header"><div><h3>结果指标关联</h3><p>不同学习行为组的近 4 周表现对比</p></div></div><div class="table-wrap"><table class="event-table"><thead><tr><th>行为分组</th><th>学生数</th><th>双课完成率</th><th>首答正确率</th><th>订正后掌握率</th><th>建议动作</th></tr></thead><tbody><tr><td>稳定完成组</td><td>${scaled(1126)}</td><td>91.4%</td><td>83.2%</td><td>91.7%</td><td>保持正向激励</td></tr><tr><td>只学不练组</td><td>${scaled(328)}</td><td>34.6%</td><td>68.1%</td><td>72.5%</td><td>强化训练入口</td></tr><tr><td>练后不改组</td><td>${scaled(281)}</td><td>42.3%</td><td>61.7%</td><td>—</td><td>增加错题提醒</td></tr><tr><td>间歇学习组</td><td>${scaled(463)}</td><td>51.8%</td><td>73.4%</td><td>80.2%</td><td>固定每周学习计划</td></tr><tr><td>流失风险组</td><td>${scaled(186)}</td><td>18.2%</td><td>59.6%</td><td>65.1%</td><td>家长端温和触达</td></tr></tbody></table></div></article>
    </div></section>`;
}

function donut() {
  return `<div class="donut-wrap"><div class="donut"><div class="donut-center"><strong>${pct(68)}</strong><span>状态良好</span></div></div><div class="legend-list">${[["稳定学习","54%","#1b8c72"],["偶尔波动","24%","#dff176"],["需要关注","13%","#5b7fc9"],["高风险","9%","#e7ebe9"]].map(x=>`<div class="legend-row"><i style="background:${x[2]}"></i><span>${x[0]}</span><b>${x[1]}</b></div>`).join("")}</div></div><div class="insight-box"><span class="bulb">${icons.bulb}</span><span>连续两周未完成“改”的学生，下周流失概率是稳定完成组的 <b>2.6 倍</b>。</span></div>`;
}

function alertList() {
  return `<div class="alert-list">${[["林*","连续 9 天未学习","92","#fff0ed","#c65e49"],["赵*宇","2 周未完成订正","86","#fff5d6","#9b761f"],["陈*","正确率持续下降","81","#edf2fb","#5b7fc9"],["王*宁","动画多次中途退出","78","#f2eff8","#8772bb"]].map(x=>`<div class="alert-row"><span class="student-avatar" style="--avatar-bg:${x[3]};--avatar-color:${x[4]}">${x[0].slice(0,1)}</span><div><b>${x[0]}</b><small>${x[1]}</small></div><div class="risk-score"><strong>${x[2]}</strong><span>风险分</span></div></div>`).join("")}</div>`;
}

const eventRows = [
  ["course_unlock","课程解锁成功","课程ID、年级、学科、解锁周","解锁人数 / 启动率"],
  ["lesson_start","进入单节学习","课程ID、来源、距解锁时长","课程启动率"],
  ["video_progress","动画观看进度","视频ID、进度、播放时长、倍速","有效观看率 / 跳出点"],
  ["video_complete","动画播放完成","视频ID、总时长、回看次数","学环节完成率"],
  ["practice_start","进入知识训练","练习ID、题目数、来源","练环节进入率"],
  ["answer_submit","提交题目答案","题目ID、答案、是否正确、耗时","首答正确率 / 单题耗时"],
  ["correction_start","进入错题订正","错题数、入口来源","改环节进入率"],
  ["correction_complete","完成错题订正","订正题数、二答正确数","订正后掌握率"],
  ["extension_complete","完成延展题","题目ID、正确率、耗时","延展题完成率"],
  ["lesson_exit","退出当前课程","所在环节、进度、退出方式","异常退出率"],
];

function eventsTemplate() {
  return `<section class="fade-in">${detailHeader("核心埋点字典", "用最小事件集覆盖三套监测方案；所有事件需携带匿名 student_id、session_id 与时间戳。", "建议版本：v1.0")}
    <div class="panel"><div class="panel-header"><div><h3>事件与指标映射</h3><p>上线前由产品、研发、数据共同校验触发时机</p></div><span class="panel-tag">10 个核心事件</span></div><div class="table-wrap"><table class="event-table"><thead><tr><th>事件名</th><th>触发时机</th><th>关键属性</th><th>支持指标</th><th>状态</th></tr></thead><tbody>${eventRows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td><span class="status-dot">待接入</span></td></tr>`).join("")}</tbody></table></div></div>
    <div class="insight-box" style="margin-top:14px"><span class="bulb">${icons.bulb}</span><span><b>口径提醒：</b>学生数据默认使用匿名 ID；家长端仅呈现必要的学习建议，不展示行为监控细节。单课完成定义为同一课程的“学、练、改”均触发完成事件。</span></div>
  </section>`;
}

const views = {
  overview: { title: "用户行为监测总览", eyebrow: "数据驾驶舱", render: overviewTemplate },
  journey: { title: "学习闭环监测", eyebrow: "方案 01 / 过程", render: journeyTemplate },
  experience: { title: "体验质量诊断", eyebrow: "方案 02 / 体验", render: experienceTemplate },
  outcome: { title: "学习结果与预警", eyebrow: "方案 03 / 结果", render: outcomeTemplate },
  events: { title: "核心埋点字典", eyebrow: "数据管理", render: eventsTemplate }
};

function render() {
  const view = views[state.view];
  document.getElementById("pageTitle").textContent = view.title;
  document.getElementById("pageEyebrow").textContent = view.eyebrow;
  document.getElementById("content").innerHTML = view.render();
  document.querySelectorAll(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.view === state.view));
  document.querySelectorAll("[data-open]").forEach(el => el.addEventListener("click", () => navigate(el.dataset.open)));
  document.querySelectorAll(".mini-tab").forEach(el => el.addEventListener("click", () => { el.parentElement.querySelectorAll(".mini-tab").forEach(x=>x.classList.remove("active")); el.classList.add("active"); }));
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
  const csv = "\ufeff" + [headers, ...rows].map(row => row.join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"}));
  const a = document.createElement("a"); a.href = url; a.download = `拾光学习_${views[state.view].title}.csv`; a.click(); URL.revokeObjectURL(url);
  const toast = document.getElementById("toast"); toast.classList.add("show"); setTimeout(()=>toast.classList.remove("show"), 2200);
});

const sidebar = document.querySelector(".sidebar"), scrim = document.getElementById("scrim");
function closeMenu(){ sidebar.classList.remove("open"); scrim.classList.remove("show"); }
document.getElementById("menuButton").addEventListener("click", ()=>{ sidebar.classList.add("open"); scrim.classList.add("show"); });
scrim.addEventListener("click", closeMenu);
render();
