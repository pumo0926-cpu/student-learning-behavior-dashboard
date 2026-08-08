# 拾光学习 · 用户行为监测中心

面向初中生自主学习产品的行为监测看板原型，覆盖三套互补方案：

1. **学习闭环监测**：追踪“解锁 → 学 → 练 → 改”的转化与流失。
2. **体验质量诊断**：通过耗时、退出、重复操作和内容难度定位体验问题。
3. **学习结果与预警**：连接过程与正确率、掌握率、坚持度，识别需要干预的学生。

## 运行

这是一个无构建依赖的静态项目。`index.html` 已内嵌全部样式与交互脚本，可以单独下载、复制和直接打开；也可以在当前目录启动本地服务器：

```bash
python3 -m http.server 4173
```

然后访问 `http://localhost:4173`。

修改 `styles.css`、`app.js` 或 `index.template.html` 后，运行以下命令重新生成自包含页面：

```bash
node build-standalone.mjs
```

## 数据说明

- 页面当前数据均为演示数据，已在界面中标注。
- “数据模型”页展示五张核心表及 9 类学习行为，可作为一期数据接入清单。
- 真实接入时建议所有事件携带匿名 `student_id`、`session_id`、事件时间与内容版本。
- 单课闭环定义为同一课程的“学、练、改”三个完成事件均成功触发。

## 数据库

[`database/schema.sql`](database/schema.sql) 提供可直接执行的 SQLite 数据模型，包含：

1. `students`：用户基础表。
2. `learning_events`：学习事件明细表。
3. `course_learning_results`：课程学习结果表。
4. `user_weekly_summaries`：用户周度汇总表。
5. `content_quality`：内容质量表。

同时包含看板高频查询索引，以及周度监测、课节漏斗两个语义视图。可用以下命令校验或初始化：

```bash
sqlite3 learning_analytics.db < database/schema.sql
```
