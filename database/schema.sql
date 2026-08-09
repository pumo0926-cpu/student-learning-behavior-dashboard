-- 拾光学习用户行为监测数据模型 v2.3
-- SQLite 3.x；所有学生标识均应使用业务侧生成的匿名 ID。
--
-- v2.0 变更要点：从「课时维度聚合」升级为「会话维度连续行为序列」。
--   课时维度只能回答“这节课完课率多少、跳出率多少”；
--   会话维度可以回答“这个孩子在哪一秒、在第几题断的，断之前发生了什么异常”。
--   新增：learning_sessions（会话与断点）、anomaly_signal_dict（异常信号字典）、
--         session_anomaly_signals（断点前异常明细）、student_emotion_states（厌烦情绪状态）。
--   v2.1 新增：用户结果决策表，从退费/续费结果反向关联完课表现与反馈原因。
--   v2.2 新增：用户会话级归因视图，把连续表现、异常信号、情绪与断点优化串成一条链。
--   v2.3 新增：学/练/改判定字段与语义视图，还原视频播放、训练答题和错题掌握过程。

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- ============================================================
-- 一、基础层
-- ============================================================

-- 1. 用户基础表：一个学生一行，保存稳定的分群维度。
CREATE TABLE IF NOT EXISTS students (
    student_id          TEXT PRIMARY KEY,
    grade               INTEGER NOT NULL CHECK (grade BETWEEN 7 AND 9),
    purchased_at        TEXT NOT NULL,
    package_code        TEXT NOT NULL,
    cohort_code         TEXT NOT NULL,                 -- 同一购买/开课班期
    package_expires_at  TEXT,
    acquisition_channel TEXT NOT NULL,
    device_type         TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web', 'tablet', 'other')),
    device_os_version   TEXT,
    device_model        TEXT,
    churn_status        TEXT NOT NULL DEFAULT 'active' CHECK (churn_status IN ('active', 'churned')),
    churned_at           TEXT,
    refund_status       TEXT NOT NULL DEFAULT 'not_refunded' CHECK (refund_status IN ('refunded', 'not_refunded')),
    refunded_at          TEXT,
    renewal_status      TEXT NOT NULL DEFAULT 'not_renewed' CHECK (renewal_status IN ('renewed', 'not_renewed')),
    renewed_at           TEXT,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 二、连续行为事实层（v2.0 核心）
-- ============================================================

-- 2. 学习会话表：一次「打开—使用—离开」为一行，是还原连续行为的主键实体。
--    断点（break）定义：会话结束时未触发 complete，且停留在学/练/改任一环节内。
CREATE TABLE IF NOT EXISTS learning_sessions (
    session_id             TEXT PRIMARY KEY,
    student_id             TEXT NOT NULL,
    started_at             TEXT NOT NULL,
    ended_at               TEXT,
    duration_seconds       INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    device_type            TEXT,
    entry_source           TEXT CHECK (entry_source IS NULL OR entry_source IN ('icon', 'push', 'parent_share', 'widget', 'other')),
    course_id              TEXT,
    lesson_id              TEXT,
    event_count            INTEGER NOT NULL DEFAULT 0 CHECK (event_count >= 0),
    stage_reached          TEXT NOT NULL DEFAULT 'none' CHECK (stage_reached IN (
                               'none', 'learn', 'practice', 'correct', 'extension', 'completed'
                             )),

    -- 断点定位：把「跳出率」还原成「在哪一秒、第几题离开」
    exit_type              TEXT NOT NULL DEFAULT 'unknown' CHECK (exit_type IN (
                               'completed', 'break_exit', 'idle_timeout', 'app_kill', 'crash', 'unknown'
                             )),
    is_break               INTEGER NOT NULL DEFAULT 0 CHECK (is_break IN (0, 1)),
    break_stage            TEXT CHECK (break_stage IS NULL OR break_stage IN ('learn', 'practice', 'correct', 'extension')),
    break_progress_rate    REAL CHECK (break_progress_rate IS NULL OR break_progress_rate BETWEEN 0 AND 1),
    break_position_label   TEXT,     -- 人读位置，例：动画 03:42 / 练习第 4 题 / 订正第 2 题
    break_video_seconds    INTEGER CHECK (break_video_seconds IS NULL OR break_video_seconds >= 0),
    break_question_id      TEXT,
    break_question_index   INTEGER CHECK (break_question_index IS NULL OR break_question_index > 0),
    last_event_name        TEXT,

    -- 连续性：断开之后有没有回来、从哪一步回来
    idle_seconds_total     INTEGER NOT NULL DEFAULT 0 CHECK (idle_seconds_total >= 0),
    max_idle_seconds       INTEGER NOT NULL DEFAULT 0 CHECK (max_idle_seconds >= 0),
    background_count       INTEGER NOT NULL DEFAULT 0 CHECK (background_count >= 0),
    resume_session_id      TEXT,     -- 断点后真正续上的下一个会话
    resume_gap_hours       REAL CHECK (resume_gap_hours IS NULL OR resume_gap_hours >= 0),
    resume_mode            TEXT CHECK (resume_mode IS NULL OR resume_mode IN (
                               'continue', 'restart', 'switch_lesson', 'no_return'
                             )),

    -- 情绪锚定（由 session_anomaly_signals 汇总回写）
    anomaly_signal_count   INTEGER NOT NULL DEFAULT 0 CHECK (anomaly_signal_count >= 0),
    boredom_score          REAL CHECK (boredom_score IS NULL OR boredom_score BETWEEN 0 AND 100),
    emotion_type           TEXT CHECK (emotion_type IS NULL OR emotion_type IN (
                               'engaged', 'frustrated', 'bored', 'distracted', 'fatigued'
                             )),
    calculated_at          TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- 3. 学习事件明细表：追加写入的原始事实层，一次行为一行。
--    v2.0 新增 stage / prev_event_gap_seconds / seconds_from_session_start，
--    使同一 session_id 内按 event_sequence 排序即可完整还原连续行为链路。
CREATE TABLE IF NOT EXISTS learning_events (
    event_id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id                 TEXT NOT NULL,
    session_id                 TEXT NOT NULL,
    event_name                 TEXT NOT NULL CHECK (event_name IN (
                                   'session_start', 'session_end', 'open', 'unlock',
                                   'play', 'pause', 'seek_forward', 'replay',
                                   'stage_switch', 'answer', 'answer_change', 'correction',
                                   'hint_view', 'idle', 'app_background', 'app_foreground',
                                   'exit', 'complete'
                                 )),
    event_at                   TEXT NOT NULL,
    event_sequence             INTEGER NOT NULL DEFAULT 1 CHECK (event_sequence > 0),
    stage                      TEXT CHECK (stage IS NULL OR stage IN ('learn', 'practice', 'correct', 'extension', 'shell')),
    prev_event_gap_seconds     INTEGER CHECK (prev_event_gap_seconds IS NULL OR prev_event_gap_seconds >= 0),
    seconds_from_session_start INTEGER CHECK (seconds_from_session_start IS NULL OR seconds_from_session_start >= 0),
    course_id                  TEXT,
    lesson_id                  TEXT,
    knowledge_point_id         TEXT,
    animation_id               TEXT,
    animation_version          TEXT,
    question_id                TEXT,
    question_version           TEXT,
    question_index             INTEGER CHECK (question_index IS NULL OR question_index > 0),
    video_position_seconds     INTEGER CHECK (video_position_seconds IS NULL OR video_position_seconds >= 0),
    duration_seconds           INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    countdown_total_seconds    INTEGER CHECK (countdown_total_seconds IS NULL OR countdown_total_seconds > 0),
    countdown_remaining_seconds INTEGER CHECK (
                                   countdown_remaining_seconds IS NULL OR countdown_remaining_seconds >= 0
                                 ),
    answer_value               TEXT,
    answer_attempt             INTEGER CHECK (answer_attempt IS NULL OR answer_attempt > 0),
    is_correct                 INTEGER CHECK (is_correct IS NULL OR is_correct IN (0, 1)),
    source_wrong_event_id      INTEGER, -- 订正所对应的原始错题 answer.event_id
    correction_round           INTEGER CHECK (correction_round IS NULL OR correction_round > 0),
    mastery_status             TEXT CHECK (mastery_status IS NULL OR mastery_status IN (
                                   'mastered', 'unmastered', 'pending'
                                 )),
    properties_json            TEXT CHECK (properties_json IS NULL OR json_valid(properties_json)),
    ingested_at                TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (session_id) REFERENCES learning_sessions(session_id),
    FOREIGN KEY (source_wrong_event_id) REFERENCES learning_events(event_id)
);

-- ============================================================
-- 三、异常信号层（断点前发生了什么）
-- ============================================================

-- 4. 异常信号字典：可配置的判定规则与权重，改阈值不改代码。
--    lift = 断点会话命中率 / 完课会话命中率，用于给「哪个信号最能预测脱离」排序。
CREATE TABLE IF NOT EXISTS anomaly_signal_dict (
    signal_code       TEXT PRIMARY KEY,
    signal_name       TEXT NOT NULL,
    stage_scope       TEXT NOT NULL CHECK (stage_scope IN ('learn', 'practice', 'correct', 'session')),
    detect_rule       TEXT NOT NULL,     -- 可读判定规则，与 threshold_json 一一对应
    threshold_json    TEXT CHECK (threshold_json IS NULL OR json_valid(threshold_json)),
    emotion_type      TEXT NOT NULL CHECK (emotion_type IN ('frustrated', 'bored', 'distracted', 'fatigued')),
    weight            REAL NOT NULL DEFAULT 1 CHECK (weight >= 0),
    reference_lift    REAL CHECK (reference_lift IS NULL OR reference_lift >= 0),
    is_active         INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. 会话异常信号明细：一次会话命中一个信号一行。
--    seconds_before_break / steps_before_break 是「断点前置性」的核心字段，
--    只统计断点前 5 分钟（300 秒）窗口内的命中，避免把早期正常波动算进来。
CREATE TABLE IF NOT EXISTS session_anomaly_signals (
    anomaly_id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id           TEXT NOT NULL,
    student_id           TEXT NOT NULL,
    signal_code          TEXT NOT NULL,
    detected_at          TEXT NOT NULL,
    stage                TEXT CHECK (stage IS NULL OR stage IN ('learn', 'practice', 'correct', 'extension', 'shell')),
    position_label       TEXT,
    lesson_id            TEXT,
    knowledge_point_id   TEXT,
    question_id          TEXT,
    question_index       INTEGER CHECK (question_index IS NULL OR question_index > 0),
    seconds_before_break INTEGER CHECK (seconds_before_break IS NULL OR seconds_before_break >= 0),
    steps_before_break   INTEGER CHECK (steps_before_break IS NULL OR steps_before_break >= 0),
    intensity            REAL NOT NULL DEFAULT 1 CHECK (intensity BETWEEN 0 AND 1),
    evidence_json        TEXT CHECK (evidence_json IS NULL OR json_valid(evidence_json)),
    created_at           TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(session_id),
    FOREIGN KEY (signal_code) REFERENCES anomaly_signal_dict(signal_code)
);

-- 6. 学生情绪状态表：学生 × 自然周，把信号聚成可解释的厌烦指数与情绪类型。
CREATE TABLE IF NOT EXISTS student_emotion_states (
    student_id           TEXT NOT NULL,
    week_start           TEXT NOT NULL,
    session_count        INTEGER NOT NULL DEFAULT 0 CHECK (session_count >= 0),
    break_session_count  INTEGER NOT NULL DEFAULT 0 CHECK (break_session_count >= 0),
    break_rate           REAL CHECK (break_rate IS NULL OR break_rate BETWEEN 0 AND 1),
    frustration_score    REAL NOT NULL DEFAULT 0 CHECK (frustration_score BETWEEN 0 AND 100),
    boredom_score        REAL NOT NULL DEFAULT 0 CHECK (boredom_score BETWEEN 0 AND 100),
    distraction_score    REAL NOT NULL DEFAULT 0 CHECK (distraction_score BETWEEN 0 AND 100),
    boredom_index        REAL NOT NULL DEFAULT 0 CHECK (boredom_index BETWEEN 0 AND 100),
    index_delta          REAL,          -- 与上周差值，用于看情绪走向
    emotion_type         TEXT NOT NULL DEFAULT 'engaged' CHECK (emotion_type IN (
                             'engaged', 'frustrated', 'bored', 'distracted', 'fatigued'
                           )),
    top_signal_codes     TEXT,          -- 逗号分隔，主导信号
    alert_level          TEXT NOT NULL DEFAULT 'normal' CHECK (alert_level IN ('normal', 'watch', 'warn', 'high')),
    intervention_code    TEXT,
    suggested_action     TEXT,
    calculated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, week_start),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- ============================================================
-- 四、结果与内容层
-- ============================================================

-- 7. 课程学习结果表：一个学生每节课一行，沉淀「学、练、改」的结果。
CREATE TABLE IF NOT EXISTS course_learning_results (
    result_id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id                   TEXT NOT NULL,
    course_id                    TEXT NOT NULL,
    lesson_id                    TEXT NOT NULL,
    lesson_title                 TEXT NOT NULL,
    lesson_sequence              INTEGER NOT NULL CHECK (lesson_sequence > 0),
    knowledge_point_id           TEXT NOT NULL,
    unlocked_at                  TEXT,
    started_at                   TEXT,
    completed_at                 TEXT,
    animation_id                 TEXT,
    animation_version            TEXT,
    session_count                INTEGER NOT NULL DEFAULT 0 CHECK (session_count >= 0),
    break_count                  INTEGER NOT NULL DEFAULT 0 CHECK (break_count >= 0),
    video_watch_seconds          INTEGER NOT NULL DEFAULT 0 CHECK (video_watch_seconds >= 0),
    video_progress_rate          REAL NOT NULL DEFAULT 0 CHECK (video_progress_rate BETWEEN 0 AND 1),
    video_completed              INTEGER NOT NULL DEFAULT 0 CHECK (video_completed IN (0, 1)),
    training_question_count      INTEGER NOT NULL DEFAULT 0 CHECK (training_question_count >= 0),
    training_answered_count      INTEGER NOT NULL DEFAULT 0 CHECK (training_answered_count >= 0),
    first_correct_count          INTEGER NOT NULL DEFAULT 0 CHECK (first_correct_count >= 0),
    wrong_question_count         INTEGER NOT NULL DEFAULT 0 CHECK (wrong_question_count >= 0),
    first_attempt_accuracy       REAL CHECK (first_attempt_accuracy IS NULL OR first_attempt_accuracy BETWEEN 0 AND 1),
    corrected_question_count     INTEGER NOT NULL DEFAULT 0 CHECK (corrected_question_count >= 0),
    correction_correct_count     INTEGER NOT NULL DEFAULT 0 CHECK (correction_correct_count >= 0),
    correction_accuracy          REAL CHECK (correction_accuracy IS NULL OR correction_accuracy BETWEEN 0 AND 1),
    extension_question_count     INTEGER NOT NULL DEFAULT 0 CHECK (extension_question_count >= 0),
    extension_correct_count      INTEGER NOT NULL DEFAULT 0 CHECK (extension_correct_count >= 0),
    extension_completed          INTEGER NOT NULL DEFAULT 0 CHECK (extension_completed IN (0, 1)),
    total_learning_seconds       INTEGER NOT NULL DEFAULT 0 CHECK (total_learning_seconds >= 0),
    attended                     INTEGER NOT NULL DEFAULT 0 CHECK (attended IN (0, 1)),
    exit_count                   INTEGER NOT NULL DEFAULT 0 CHECK (exit_count >= 0),
    jumped_out                   INTEGER NOT NULL DEFAULT 0 CHECK (jumped_out IN (0, 1)),
    last_exit_at                 TEXT,
    completion_status            TEXT NOT NULL DEFAULT 'not_started' CHECK (completion_status IN (
                                   'not_started', 'learning', 'practice', 'correcting', 'completed', 'abandoned'
                                 )),
    is_completed                 INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
    updated_at                   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, lesson_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- 8. 用户周度汇总表：一个学生每个自然周一行，服务留存、健康分和预警。
CREATE TABLE IF NOT EXISTS user_weekly_summaries (
    student_id               TEXT NOT NULL,
    week_start               TEXT NOT NULL,
    unlocked_lesson_count    INTEGER NOT NULL DEFAULT 0 CHECK (unlocked_lesson_count >= 0),
    started_lesson_count     INTEGER NOT NULL DEFAULT 0 CHECK (started_lesson_count >= 0),
    completed_lesson_count   INTEGER NOT NULL DEFAULT 0 CHECK (completed_lesson_count >= 0),
    session_count            INTEGER NOT NULL DEFAULT 0 CHECK (session_count >= 0),
    break_session_count      INTEGER NOT NULL DEFAULT 0 CHECK (break_session_count >= 0),
    resume_within_24h_count  INTEGER NOT NULL DEFAULT 0 CHECK (resume_within_24h_count >= 0),
    active_day_count         INTEGER NOT NULL DEFAULT 0 CHECK (active_day_count BETWEEN 0 AND 7),
    total_learning_seconds   INTEGER NOT NULL DEFAULT 0 CHECK (total_learning_seconds >= 0),
    answered_question_count  INTEGER NOT NULL DEFAULT 0 CHECK (answered_question_count >= 0),
    correct_question_count   INTEGER NOT NULL DEFAULT 0 CHECK (correct_question_count >= 0),
    answer_accuracy          REAL CHECK (answer_accuracy IS NULL OR answer_accuracy BETWEEN 0 AND 1),
    corrected_wrong_count    INTEGER NOT NULL DEFAULT 0 CHECK (corrected_wrong_count >= 0),
    double_lesson_completed  INTEGER NOT NULL DEFAULT 0 CHECK (double_lesson_completed IN (0, 1)),
    health_score             REAL NOT NULL DEFAULT 0 CHECK (health_score BETWEEN 0 AND 100),
    risk_level               TEXT NOT NULL DEFAULT 'normal' CHECK (risk_level IN ('normal', 'watch', 'high')),
    last_active_at           TEXT,
    calculated_at            TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, week_start),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- 9. 内容质量表：按知识点及内容版本每日快照，避免版本变化污染历史结果。
CREATE TABLE IF NOT EXISTS content_quality (
    content_quality_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_date             TEXT NOT NULL,
    knowledge_point_id        TEXT NOT NULL,
    knowledge_point_name      TEXT NOT NULL,
    subject                   TEXT NOT NULL,
    grade                     INTEGER NOT NULL CHECK (grade BETWEEN 7 AND 9),
    animation_id              TEXT NOT NULL,
    animation_version         TEXT NOT NULL,
    question_set_id           TEXT NOT NULL,
    question_version          TEXT NOT NULL,
    exposed_student_count     INTEGER NOT NULL DEFAULT 0 CHECK (exposed_student_count >= 0),
    valid_sample_count        INTEGER NOT NULL DEFAULT 0 CHECK (valid_sample_count >= 0),
    avg_watch_seconds         REAL NOT NULL DEFAULT 0 CHECK (avg_watch_seconds >= 0),
    video_completion_rate     REAL CHECK (video_completion_rate IS NULL OR video_completion_rate BETWEEN 0 AND 1),
    video_skip_rate           REAL CHECK (video_skip_rate IS NULL OR video_skip_rate BETWEEN 0 AND 1),
    first_attempt_accuracy    REAL CHECK (first_attempt_accuracy IS NULL OR first_attempt_accuracy BETWEEN 0 AND 1),
    correction_mastery_rate   REAL CHECK (correction_mastery_rate IS NULL OR correction_mastery_rate BETWEEN 0 AND 1),
    extension_completion_rate REAL CHECK (extension_completion_rate IS NULL OR extension_completion_rate BETWEEN 0 AND 1),
    lesson_completion_rate    REAL CHECK (lesson_completion_rate IS NULL OR lesson_completion_rate BETWEEN 0 AND 1),
    break_session_rate        REAL CHECK (break_session_rate IS NULL OR break_session_rate BETWEEN 0 AND 1),
    top_break_position        TEXT,     -- 该内容最集中的断点位置，例：动画 03:20–04:10
    abnormal_exit_rate        REAL CHECK (abnormal_exit_rate IS NULL OR abnormal_exit_rate BETWEEN 0 AND 1),
    difficulty_index          REAL CHECK (difficulty_index IS NULL OR difficulty_index BETWEEN 0 AND 1),
    updated_at                TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (snapshot_date, knowledge_point_id, animation_version, question_version)
);

-- 10. 用户结果决策表：一次退费/续费观测一行。
--     退费与续费是两组独立口径，不强行设为四个互斥类别。
--     completion_band 必须在结果发生时固化，用于区分“没学”和“学了没效果”。
CREATE TABLE IF NOT EXISTS user_outcome_decisions (
    outcome_record_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id         TEXT NOT NULL,
    observed_at        TEXT NOT NULL,
    outcome_type       TEXT NOT NULL CHECK (outcome_type IN ('refund', 'renewal')),
    outcome_status     TEXT NOT NULL CHECK (outcome_status IN (
                           'refunded', 'not_refunded', 'renewed', 'not_renewed'
                         )),
    completion_band    TEXT NOT NULL DEFAULT 'unknown' CHECK (completion_band IN ('good', 'poor', 'unknown')),
    completion_rate    REAL CHECK (completion_rate IS NULL OR completion_rate BETWEEN 0 AND 1),
    primary_reason_code TEXT CHECK (primary_reason_code IS NULL OR primary_reason_code IN (
                            'child_dislikes_learning', 'schoolwork_conflict', 'no_time_low_usage',
                            'no_perceived_effect', 'interaction_format_ineffective',
                            'child_likes_learning', 'perceived_effect', 'no_score_change', 'other'
                          )),
    reason_text        TEXT,                         -- 原始回访摘要，保留语义但不存储敏感信息
    feedback_source    TEXT CHECK (feedback_source IS NULL OR feedback_source IN (
                           'refund_form', 'renewal_survey', 'service_call', 'parent_interview', 'other'
                         )),
    is_verified        INTEGER NOT NULL DEFAULT 0 CHECK (is_verified IN (0, 1)),
    created_at         TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, observed_at, outcome_type),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- ============================================================
-- 五、索引
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_students_segment
    ON students (cohort_code, grade, package_code, acquisition_channel, purchased_at);
CREATE INDEX IF NOT EXISTS idx_students_cohort_lifecycle
    ON students (cohort_code, refund_status, renewal_status, churn_status);
CREATE INDEX IF NOT EXISTS idx_sessions_student_time
    ON learning_sessions (student_id, started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_break
    ON learning_sessions (is_break, break_stage, lesson_id, started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_emotion
    ON learning_sessions (emotion_type, boredom_score);
CREATE INDEX IF NOT EXISTS idx_events_student_time
    ON learning_events (student_id, event_at);
CREATE INDEX IF NOT EXISTS idx_events_lesson_name_time
    ON learning_events (lesson_id, event_name, event_at);
CREATE INDEX IF NOT EXISTS idx_events_session_question
    ON learning_events (session_id, stage, question_id, event_sequence);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_session_sequence
    ON learning_events (session_id, event_sequence);
CREATE INDEX IF NOT EXISTS idx_anomaly_signal_break
    ON session_anomaly_signals (signal_code, seconds_before_break);
CREATE INDEX IF NOT EXISTS idx_anomaly_session
    ON session_anomaly_signals (session_id, detected_at);
CREATE INDEX IF NOT EXISTS idx_emotion_week_level
    ON student_emotion_states (week_start, alert_level, boredom_index);
CREATE INDEX IF NOT EXISTS idx_results_course_status
    ON course_learning_results (course_id, completion_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_weekly_week_risk
    ON user_weekly_summaries (week_start, risk_level, health_score);
CREATE INDEX IF NOT EXISTS idx_content_snapshot_grade
    ON content_quality (snapshot_date, grade, subject, difficulty_index);
CREATE INDEX IF NOT EXISTS idx_outcomes_status_band
    ON user_outcome_decisions (outcome_type, outcome_status, completion_band, observed_at);
CREATE INDEX IF NOT EXISTS idx_outcomes_reason
    ON user_outcome_decisions (primary_reason_code, outcome_status, observed_at);

-- ============================================================
-- 六、异常信号字典种子数据（配置项，非演示数据）
-- ============================================================

INSERT OR REPLACE INTO anomaly_signal_dict
    (signal_code, signal_name, stage_scope, detect_rule, threshold_json, emotion_type, weight, reference_lift) VALUES
('consecutive_wrong',  '连续答错',        'practice', '同一会话内连续 answer.is_correct = 0 达到阈值',                 '{"streak":3}',            'frustrated', 1.00, 4.9),
('question_overtime',  '单题停留过久',    'practice', '单题作答耗时 > 该题历史中位耗时的 N 倍',                        '{"median_multiple":3}',   'frustrated', 0.90, 3.8),
('repeat_submit',      '同题反复提交',    'practice', '同一 question_id 的 answer 次数达到阈值',                       '{"attempts":3}',          'frustrated', 0.85, 4.4),
('answer_flip_flop',   '答案反复修改',    'practice', '单题 answer_change 次数达到阈值',                               '{"changes":3}',           'frustrated', 0.70, 3.8),
('segment_replay',     '同片段重复回看',  'learn',    '同一动画区间 replay 次数达到阈值',                              '{"replays":2,"window":30}','frustrated', 0.60, 2.3),
('rapid_seek',         '动画连续快进',    'learn',    '连续 seek_forward 次数达到阈值',                                '{"seeks":3}',             'bored',      0.90, 3.7),
('snap_answer',        '秒答（疑似乱选）','practice', '连续多题作答耗时 < 该题历史 P5',                                '{"streak":3,"pct":5}',    'bored',      0.95, 4.8),
('skip_explanation',   '跳过讲解直奔练',  'learn',    '动画观看进度低于阈值即 stage_switch 到 practice',               '{"progress":0.2}',        'bored',      0.75, 3.7),
('long_idle',          '静默无操作',      'session',  '相邻事件 prev_event_gap_seconds 达到阈值且未退出',              '{"seconds":90}',          'distracted', 0.85, 2.9),
('stage_bouncing',     '环节来回横跳',    'session',  '单会话 stage_switch 往返次数达到阈值',                          '{"switches":4}',          'distracted', 0.65, 3.1),
('frequent_background','频繁切后台',      'session',  '单会话 app_background 次数达到阈值',                            '{"count":2}',             'distracted', 0.55, 1.9),
('over_long_session',  '单次时长过长',    'session',  '会话 duration_seconds 超过阈值后的行为衰减',                    '{"minutes":45}',          'fatigued',   0.50, 2.4),
('frequent_pause',     '视频频繁暂停',     'learn',    '同一动画 pause 次数达到阈值',                                  '{"pauses":3}',            'frustrated', 0.65, 2.3),
('frequent_drag',      '视频频繁拖拽',     'learn',    'seek_forward 与 replay 合计次数达到阈值',                       '{"drags":4}',             'frustrated', 0.70, 2.4),
('video_early_exit',   '视频未看完即跳出', 'learn',    '动画进度低于阈值且 exit 发生在 learn 环节',                     '{"progress":0.8}',        'frustrated', 0.85, 3.6),
('deadline_submit',    '临近倒计时提交',   'practice', 'answer.countdown_remaining_seconds 小于等于阈值',              '{"seconds":5}',           'frustrated', 0.60, 2.8),
('question_exit',      '答题中途跳出',     'practice', '已进入题目但未提交 answer 即退出课时',                         '{"submitted":false}',     'frustrated', 0.90, 4.0),
('correction_overtime','错题订正耗时过长', 'correct',  '订正耗时大于该题历史订正中位数的 N 倍',                        '{"median_multiple":3}',   'frustrated', 0.80, 3.4),
('correction_still_wrong','订正后仍答错',  'correct',  '同一错题最终 correction.is_correct = 0',                        '{"final_correct":false}', 'frustrated', 1.00, 4.7),
('correction_exit',    '订正中途跳出',     'correct',  '进入错题后未完成 correction 即退出课时',                       '{"submitted":false}',     'frustrated', 0.95, 3.9);

-- ============================================================
-- 七、看板可直接查询的语义视图
-- ============================================================

-- 断点分布：把「跳出率」拆到环节 × 进度位置。
CREATE VIEW IF NOT EXISTS v_breakpoint_distribution AS
SELECT
    lesson_id,
    break_stage,
    CASE
        WHEN break_progress_rate IS NULL     THEN '未知'
        WHEN break_progress_rate < 0.25      THEN '0-25%'
        WHEN break_progress_rate < 0.50      THEN '25-50%'
        WHEN break_progress_rate < 0.75      THEN '50-75%'
        ELSE '75-100%'
    END AS progress_bucket,
    COUNT(*)                                            AS break_sessions,
    COUNT(DISTINCT student_id)                          AS break_students,
    ROUND(AVG(duration_seconds), 1)                     AS avg_duration_seconds,
    ROUND(AVG(anomaly_signal_count), 2)                 AS avg_signal_count
FROM learning_sessions
WHERE is_break = 1
GROUP BY lesson_id, break_stage, progress_bucket;

-- 断点前信号提升度：断点会话命中率 ÷ 完课会话命中率，用于给信号排序。
-- break_rate / baseline_rate 为可直接展示的真实比率；
-- lift 走 +0.5 拉普拉斯平滑，否则「完课会话里从不出现」的最强信号会因除零变成 NULL 而掉出排序。
CREATE VIEW IF NOT EXISTS v_pre_exit_signal_lift AS
WITH totals AS (
    SELECT
        SUM(CASE WHEN is_break = 1 THEN 1 ELSE 0 END) AS break_sessions,
        SUM(CASE WHEN is_break = 0 THEN 1 ELSE 0 END) AS normal_sessions
    FROM learning_sessions
),
hits AS (
    SELECT
        a.signal_code,
        COUNT(DISTINCT CASE WHEN s.is_break = 1 AND a.seconds_before_break <= 300 THEN s.session_id END) AS break_hit,
        COUNT(DISTINCT CASE WHEN s.is_break = 0 THEN s.session_id END)                                   AS normal_hit
    FROM session_anomaly_signals a
    JOIN learning_sessions s ON s.session_id = a.session_id
    GROUP BY a.signal_code
)
SELECT
    d.signal_code,
    d.signal_name,
    d.emotion_type,
    d.stage_scope,
    COALESCE(h.break_hit, 0)                                                       AS break_hit_sessions,
    ROUND(1.0 * COALESCE(h.break_hit, 0)  / NULLIF(t.break_sessions, 0),  4)       AS break_rate,
    ROUND(1.0 * COALESCE(h.normal_hit, 0) / NULLIF(t.normal_sessions, 0), 4)       AS baseline_rate,
    ROUND(((COALESCE(h.break_hit, 0)  + 0.5) / (t.break_sessions  + 1.0))
        / ((COALESCE(h.normal_hit, 0) + 0.5) / (t.normal_sessions + 1.0)), 2)      AS lift
FROM anomaly_signal_dict d
LEFT JOIN hits h ON h.signal_code = d.signal_code
CROSS JOIN totals t
WHERE d.is_active = 1;

-- 连续性：断点之后有没有回来、以什么方式回来。
CREATE VIEW IF NOT EXISTS v_session_continuity AS
SELECT
    DATE(started_at)                                                               AS stat_date,
    COUNT(*)                                                                       AS total_sessions,
    SUM(is_break)                                                                  AS break_sessions,
    ROUND(1.0 * SUM(is_break) / NULLIF(COUNT(*), 0), 4)                            AS break_rate,
    SUM(CASE WHEN is_break = 1 AND resume_gap_hours <= 24 THEN 1 ELSE 0 END)       AS resume_24h,
    SUM(CASE WHEN is_break = 1 AND resume_gap_hours <= 72 THEN 1 ELSE 0 END)       AS resume_72h,
    SUM(CASE WHEN resume_mode = 'continue' THEN 1 ELSE 0 END)                      AS resume_continue,
    SUM(CASE WHEN resume_mode = 'restart'  THEN 1 ELSE 0 END)                      AS resume_restart,
    SUM(CASE WHEN resume_mode = 'no_return' THEN 1 ELSE 0 END)                     AS never_returned
FROM learning_sessions
GROUP BY stat_date;

-- 情绪分层：每周各情绪类型的人数、平均厌烦指数与断点率。
CREATE VIEW IF NOT EXISTS v_emotion_cohort AS
SELECT
    e.week_start,
    e.emotion_type,
    s.grade,
    COUNT(*)                                                    AS student_count,
    ROUND(AVG(e.boredom_index), 2)                              AS avg_boredom_index,
    ROUND(AVG(e.break_rate), 4)                                 AS avg_break_rate,
    SUM(CASE WHEN e.alert_level IN ('warn', 'high') THEN 1 ELSE 0 END) AS alert_students
FROM student_emotion_states e
JOIN students s ON s.student_id = e.student_id
GROUP BY e.week_start, e.emotion_type, s.grade;

-- 动画播放行为：是否拖拽、拖到哪、是否暂停、停在哪。
-- 直接由 learning_events 的 play / pause / seek_forward / replay 事件推出，
-- 关键是 video_position_seconds——它才是「在动画的哪一秒」，与会话墙钟不是一回事。
CREATE VIEW IF NOT EXISTS v_animation_playback AS
SELECT
    e.lesson_id,
    e.session_id,
    e.student_id,
    SUM(CASE WHEN e.event_name = 'pause'        THEN 1 ELSE 0 END) AS pause_count,
    SUM(CASE WHEN e.event_name IN ('seek_forward', 'replay') THEN 1 ELSE 0 END) AS drag_count,
    SUM(CASE WHEN e.event_name = 'seek_forward' THEN 1 ELSE 0 END) AS seek_forward_count,
    SUM(CASE WHEN e.event_name = 'replay'       THEN 1 ELSE 0 END) AS replay_count,
    -- 暂停停留总时长：pause 到下一个事件的间隔，记在下一条事件的 prev_event_gap_seconds 上
    SUM(CASE WHEN e.event_name = 'pause' THEN COALESCE(e.duration_seconds, 0) ELSE 0 END) AS pause_hold_seconds,
    MIN(CASE WHEN e.event_name = 'pause'        THEN e.video_position_seconds END) AS first_pause_position,
    MAX(CASE WHEN e.event_name = 'seek_forward' THEN e.video_position_seconds END) AS last_seek_position,
    MAX(e.video_position_seconds)                                                  AS max_video_position,
    MAX(CASE WHEN s.is_break = 1 AND s.break_stage = 'learn' THEN 1 ELSE 0 END)     AS is_video_jump_out,
    MAX(CASE WHEN s.is_break = 1 AND s.break_stage = 'learn' THEN s.break_video_seconds END) AS jump_out_video_seconds,
    MAX(CASE WHEN s.is_break = 1 AND s.break_stage = 'learn' THEN s.break_progress_rate END) AS jump_out_progress_rate,
    CASE WHEN SUM(CASE WHEN e.event_name IN ('pause','seek_forward','replay') THEN 1 ELSE 0 END) = 0
         THEN 'clean' ELSE 'interrupted' END                                       AS playback_pattern
FROM learning_events e
JOIN learning_sessions s ON s.session_id = e.session_id
WHERE e.stage = 'learn'
GROUP BY e.lesson_id, e.session_id, e.student_id;

-- 周度监测与课节漏斗（v1.0 保留）。
CREATE VIEW IF NOT EXISTS v_weekly_learning_monitor AS
SELECT
    w.week_start,
    s.grade,
    s.package_code,
    s.acquisition_channel,
    COUNT(*) AS student_count,
    SUM(w.started_lesson_count) AS learned_lessons,
    SUM(w.completed_lesson_count) AS completed_lessons,
    ROUND(AVG(w.answer_accuracy), 4) AS avg_answer_accuracy,
    ROUND(AVG(w.health_score), 2) AS avg_health_score,
    SUM(CASE WHEN w.risk_level = 'high' THEN 1 ELSE 0 END) AS high_risk_students
FROM user_weekly_summaries w
JOIN students s ON s.student_id = w.student_id
GROUP BY w.week_start, s.grade, s.package_code, s.acquisition_channel;

CREATE VIEW IF NOT EXISTS v_lesson_funnel AS
SELECT
    course_id,
    lesson_id,
    COUNT(*) AS unlocked_students,
    SUM(CASE WHEN started_at IS NOT NULL THEN 1 ELSE 0 END) AS started_students,
    SUM(video_completed) AS learned_students,
    SUM(CASE WHEN training_answered_count >= training_question_count AND training_question_count > 0 THEN 1 ELSE 0 END) AS practiced_students,
    SUM(CASE WHEN wrong_question_count = 0 OR corrected_question_count >= wrong_question_count THEN 1 ELSE 0 END) AS corrected_students,
    SUM(is_completed) AS completed_students
FROM course_learning_results
GROUP BY course_id, lesson_id;

-- 课时归因：同班期下按课时比较参课、完课、跳出、正确率和完成时长。
CREATE VIEW IF NOT EXISTS v_lesson_attribution AS
SELECT
    s.cohort_code,
    r.course_id,
    r.lesson_id,
    r.lesson_title,
    r.lesson_sequence,
    COUNT(*) AS unlocked_students,
    SUM(r.attended) AS attended_students,
    SUM(r.is_completed) AS completed_students,
    ROUND(1.0 * SUM(r.attended) / NULLIF(COUNT(*), 0), 4) AS attendance_rate,
    ROUND(1.0 * SUM(r.is_completed) / NULLIF(SUM(r.attended), 0), 4) AS attendance_completion_rate,
    ROUND(1.0 * SUM(r.jumped_out) / NULLIF(SUM(r.attended), 0), 4) AS jump_out_rate,
    ROUND(AVG(CASE WHEN r.is_completed = 1 THEN r.total_learning_seconds END), 1) AS avg_completion_seconds,
    ROUND(AVG(r.first_attempt_accuracy), 4) AS avg_answer_accuracy,
    ROUND(AVG(julianday(r.completed_at) - julianday(r.unlocked_at)), 2) AS avg_days_to_complete
FROM course_learning_results r
JOIN students s ON s.student_id = r.student_id
GROUP BY s.cohort_code, r.course_id, r.lesson_id, r.lesson_title, r.lesson_sequence;

-- 用户课时追踪：一行代表同班期内一位学生的一节课，可直接生成连续状态矩阵。
CREATE VIEW IF NOT EXISTS v_cohort_lesson_tracking AS
SELECT
    s.cohort_code,
    date(r.unlocked_at, 'start of month') AS tracking_month,
    s.student_id,
    s.grade,
    s.churn_status,
    s.refund_status,
    s.renewal_status,
    r.course_id,
    r.lesson_id,
    r.lesson_title,
    r.lesson_sequence,
    CASE WHEN r.lesson_sequence <= 8 THEN ((r.lesson_sequence - 1) / 2) + 1 ELSE 5 END AS month_week,
    CASE WHEN r.lesson_sequence <= 8 THEN 'weekly_lesson' ELSE 'monthly_bonus' END AS unlock_type,
    r.unlocked_at,
    r.started_at,
    r.completed_at,
    r.completion_status,
    r.attended,
    r.is_completed,
    r.jumped_out,
    (
      SELECT ls.break_position_label
      FROM learning_sessions ls
      WHERE ls.student_id = r.student_id
        AND ls.lesson_id = r.lesson_id
        AND ls.is_break = 1
      ORDER BY ls.ended_at DESC
      LIMIT 1
    ) AS latest_break_position,
    r.total_learning_seconds,
    r.first_attempt_accuracy,
    r.correction_accuracy,
    r.extension_completed
FROM students s
JOIN course_learning_results r ON r.student_id = s.student_id;

-- 结果决策主视图：直接支持“结果状态 → 完课分层 → 原因”三层下钻。
CREATE VIEW IF NOT EXISTS v_user_outcome_decision AS
SELECT
    s.cohort_code,
    s.student_id,
    s.grade,
    s.refund_status,
    s.renewal_status,
    o.observed_at,
    o.outcome_type,
    o.outcome_status,
    o.completion_band,
    o.completion_rate,
    o.primary_reason_code,
    o.reason_text,
    o.feedback_source,
    o.is_verified
FROM user_outcome_decisions o
JOIN students s ON s.student_id = o.student_id;

-- 单题耗时：保留每次作答，供用户课时详情下钻。
CREATE VIEW IF NOT EXISTS v_question_duration AS
SELECT
    e.student_id,
    e.session_id,
    e.course_id,
    e.lesson_id,
    e.question_id,
    e.question_index,
    e.question_version,
    e.event_at AS answered_at,
    e.duration_seconds,
    e.answer_attempt,
    e.is_correct,
    e.answer_value,
    CASE WHEN e.duration_seconds <= 15 THEN 1 ELSE 0 END AS is_instant_answer,
    CASE WHEN e.answer_attempt >= 3 THEN 1 ELSE 0 END AS is_repeated_answer,
    CASE WHEN e.duration_seconds >= 100 THEN 1 ELSE 0 END AS is_overlong_answer
FROM learning_events e
WHERE e.event_name IN ('answer', 'correction')
  AND e.question_id IS NOT NULL;

-- 课时 × 题目表现：统一产出答题时长、首答正确率和答题跳出率。
-- 答题跳出定义：停在该题且未完成课时的会话 /（已提交该题会话 + 停在该题会话）。
CREATE VIEW IF NOT EXISTS v_lesson_question_performance AS
WITH first_answers AS (
    SELECT
        e.*,
        ROW_NUMBER() OVER (
            PARTITION BY e.session_id, e.question_id
            ORDER BY e.event_sequence
        ) AS answer_order
    FROM learning_events e
    WHERE e.event_name = 'answer'
      AND e.question_id IS NOT NULL
),
answer_stats AS (
    SELECT
        course_id,
        lesson_id,
        question_id,
        question_index,
        question_version,
        COUNT(DISTINCT session_id) AS answering_sessions,
        ROUND(AVG(duration_seconds), 1) AS avg_answer_seconds,
        ROUND(AVG(is_correct), 4) AS first_answer_accuracy
    FROM first_answers
    WHERE answer_order = 1
    GROUP BY course_id, lesson_id, question_id, question_index, question_version
),
break_stats AS (
    SELECT
        course_id,
        lesson_id,
        break_question_id AS question_id,
        break_question_index AS question_index,
        COUNT(DISTINCT session_id) AS exited_sessions
    FROM learning_sessions
    WHERE is_break = 1
      AND break_question_id IS NOT NULL
    GROUP BY course_id, lesson_id, break_question_id, break_question_index
)
SELECT
    a.course_id,
    a.lesson_id,
    a.question_id,
    a.question_index,
    a.question_version,
    a.answering_sessions,
    a.avg_answer_seconds,
    a.first_answer_accuracy,
    COALESCE(b.exited_sessions, 0) AS exited_sessions,
    ROUND(
        1.0 * COALESCE(b.exited_sessions, 0) /
        NULLIF(a.answering_sessions + COALESCE(b.exited_sessions, 0), 0),
        4
    ) AS answer_jump_rate
FROM answer_stats a
LEFT JOIN break_stats b
  ON b.course_id = a.course_id
 AND b.lesson_id = a.lesson_id
 AND b.question_id = a.question_id;

-- 练环节逐题判定：秒答、临近倒计时、首/末答正确率、反复提交与答题跳出。
CREATE VIEW IF NOT EXISTS v_practice_question_judgement AS
WITH ranked_answers AS (
    SELECT
        e.*,
        ROW_NUMBER() OVER (
            PARTITION BY e.session_id, e.question_id ORDER BY e.event_sequence
        ) AS first_order,
        ROW_NUMBER() OVER (
            PARTITION BY e.session_id, e.question_id ORDER BY e.event_sequence DESC
        ) AS last_order
    FROM learning_events e
    WHERE e.event_name = 'answer'
      AND e.stage = 'practice'
      AND e.question_id IS NOT NULL
), answer_summary AS (
    SELECT
        session_id,
        student_id,
        course_id,
        lesson_id,
        question_id,
        question_index,
        question_version,
        COUNT(*) AS submit_count,
        SUM(COALESCE(duration_seconds, 0)) AS total_answer_seconds,
        MAX(CASE WHEN first_order = 1 THEN duration_seconds END) AS first_answer_seconds,
        MAX(CASE WHEN first_order = 1 THEN is_correct END) AS first_is_correct,
        MAX(CASE WHEN last_order = 1 THEN is_correct END) AS final_is_correct,
        MIN(countdown_remaining_seconds) AS min_countdown_remaining_seconds,
        MAX(CASE WHEN duration_seconds <= 15 THEN 1 ELSE 0 END) AS is_instant_answer,
        MAX(CASE WHEN countdown_remaining_seconds <= 5 THEN 1 ELSE 0 END) AS is_deadline_submit
    FROM ranked_answers
    GROUP BY session_id, student_id, course_id, lesson_id,
             question_id, question_index, question_version
), question_scope AS (
    SELECT * FROM answer_summary
    UNION ALL
    SELECT
        s.session_id,
        s.student_id,
        s.course_id,
        s.lesson_id,
        s.break_question_id,
        s.break_question_index,
        NULL AS question_version,
        0 AS submit_count,
        NULL AS total_answer_seconds,
        NULL AS first_answer_seconds,
        NULL AS first_is_correct,
        NULL AS final_is_correct,
        NULL AS min_countdown_remaining_seconds,
        0 AS is_instant_answer,
        0 AS is_deadline_submit
    FROM learning_sessions s
    WHERE s.is_break = 1
      AND s.break_stage = 'practice'
      AND s.break_question_id IS NOT NULL
      AND NOT EXISTS (
          SELECT 1
          FROM answer_summary a
          WHERE a.session_id = s.session_id
            AND a.question_id = s.break_question_id
      )
)
SELECT
    a.*,
    CASE WHEN a.submit_count >= 3 THEN 1 ELSE 0 END AS is_repeat_submit,
    CASE WHEN s.is_break = 1
               AND s.break_stage = 'practice'
               AND (s.break_question_id = a.question_id OR s.break_question_index = a.question_index)
         THEN 1 ELSE 0 END AS is_question_jump_out,
    CASE
        WHEN s.is_break = 1
             AND s.break_stage = 'practice'
             AND (s.break_question_id = a.question_id OR s.break_question_index = a.question_index)
            THEN '答题中途跳出'
        WHEN a.submit_count >= 3 THEN '反复提交'
        WHEN a.is_deadline_submit = 1 THEN '临近倒计时提交'
        WHEN a.is_instant_answer = 1 THEN '秒答'
        WHEN a.final_is_correct = 0 THEN '最终仍答错'
        ELSE '正常完成'
    END AS behavior_judgement
FROM question_scope a
JOIN learning_sessions s ON s.session_id = a.session_id;

-- 改环节错题掌握：错题 1/2/3 按原始错题顺序排列，并保留订正时长、正确率与跳出。
CREATE VIEW IF NOT EXISTS v_correction_mastery AS
WITH original_wrong AS (
    SELECT
        e.session_id,
        e.student_id,
        e.course_id,
        e.lesson_id,
        e.question_id,
        e.question_index,
        MIN(e.event_id) AS source_wrong_event_id,
        MIN(e.event_sequence) AS first_wrong_sequence
    FROM learning_events e
    WHERE e.event_name = 'answer'
      AND e.is_correct = 0
      AND e.question_id IS NOT NULL
    GROUP BY e.session_id, e.student_id, e.course_id, e.lesson_id,
             e.question_id, e.question_index
), numbered_wrong AS (
    SELECT
        w.*,
        ROW_NUMBER() OVER (
            PARTITION BY w.session_id ORDER BY w.first_wrong_sequence
        ) AS wrong_number
    FROM original_wrong w
), ranked_corrections AS (
    SELECT
        e.*,
        ROW_NUMBER() OVER (
            PARTITION BY e.session_id, e.question_id ORDER BY e.event_sequence DESC
        ) AS last_order
    FROM learning_events e
    WHERE e.event_name = 'correction'
      AND e.question_id IS NOT NULL
), correction_summary AS (
    SELECT
        session_id,
        question_id,
        COUNT(*) AS correction_submit_count,
        SUM(COALESCE(duration_seconds, 0)) AS correction_seconds,
        ROUND(AVG(is_correct), 4) AS correction_accuracy,
        MAX(CASE WHEN last_order = 1 THEN is_correct END) AS final_is_correct
    FROM ranked_corrections
    GROUP BY session_id, question_id
)
SELECT
    w.student_id,
    w.session_id,
    w.course_id,
    w.lesson_id,
    w.wrong_number,
    '错题 ' || w.wrong_number AS wrong_label,
    w.question_id,
    w.question_index,
    w.source_wrong_event_id,
    COALESCE(c.correction_submit_count, 0) AS correction_submit_count,
    c.correction_seconds,
    c.correction_accuracy,
    c.final_is_correct,
    CASE WHEN s.is_break = 1
               AND s.break_stage = 'correct'
               AND (s.break_question_id = w.question_id OR s.break_question_index = w.question_index)
         THEN 1 ELSE 0 END AS is_correction_jump_out,
    CASE
        WHEN c.final_is_correct = 1 THEN 'mastered'
        WHEN c.final_is_correct = 0 THEN 'unmastered'
        WHEN s.is_break = 1
             AND s.break_stage = 'correct'
             AND (s.break_question_id = w.question_id OR s.break_question_index = w.question_index)
            THEN 'pending'
        ELSE 'pending'
    END AS mastery_status
FROM numbered_wrong w
JOIN learning_sessions s ON s.session_id = w.session_id
LEFT JOIN correction_summary c
  ON c.session_id = w.session_id
 AND c.question_id = w.question_id;

-- 用户追踪诊断链：一行对应一次学习会话，既能回放 SES 行为序列，
-- 也能把「异常发生在哪里 → 推断何种情绪 → 优先优化什么」直接交给产品迭代。
CREATE VIEW IF NOT EXISTS v_user_breakpoint_emotion_attribution AS
SELECT
    s.cohort_code,
    ls.student_id,
    ls.session_id,
    ls.course_id,
    ls.lesson_id,
    ls.started_at,
    ls.ended_at,
    ls.duration_seconds,
    ls.event_count,
    ls.stage_reached,
    ls.is_break,
    ls.break_stage,
    ls.break_position_label,
    ls.break_video_seconds,
    ls.break_question_index,
    ls.anomaly_signal_count,
    ls.boredom_score AS session_boredom_score,
    ls.emotion_type AS session_emotion_type,
    (
        SELECT GROUP_CONCAT(signal_name, ' → ')
        FROM (
            SELECT d.signal_name
            FROM session_anomaly_signals a
            JOIN anomaly_signal_dict d ON d.signal_code = a.signal_code
            WHERE a.session_id = ls.session_id
            ORDER BY a.detected_at
        )
    ) AS anomaly_signal_chain,
    (
        SELECT GROUP_CONCAT(position_label, ' → ')
        FROM (
            SELECT a.position_label
            FROM session_anomaly_signals a
            WHERE a.session_id = ls.session_id
              AND a.position_label IS NOT NULL
            ORDER BY a.detected_at
        )
    ) AS anomaly_position_chain,
    es.boredom_index AS weekly_boredom_index,
    es.emotion_type AS weekly_emotion_type,
    es.alert_level,
    es.suggested_action,
    CASE
        WHEN ls.break_stage = 'learn' THEN '优化动画断点片段、节奏与解释方式'
        WHEN ls.break_stage = 'practice' THEN '优化断点题目及前置难度梯度'
        WHEN ls.break_stage = 'correct' THEN '优化订正入口、提示与反馈'
        WHEN ls.break_stage = 'extension' THEN '优化延展题难度与退出提示'
        WHEN ls.anomaly_signal_count >= 3 THEN '复核高频异常会话并安排对照实验'
        ELSE '继续观察连续学习趋势'
    END AS optimization_direction
FROM students s
JOIN learning_sessions ls ON ls.student_id = s.student_id
LEFT JOIN student_emotion_states es
  ON es.student_id = ls.student_id
 AND es.week_start = (
       SELECT MAX(e2.week_start)
       FROM student_emotion_states e2
       WHERE e2.student_id = ls.student_id
         AND e2.week_start <= date(ls.started_at)
   );

COMMIT;
