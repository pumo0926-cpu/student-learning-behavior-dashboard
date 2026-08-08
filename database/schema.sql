-- 拾光学习用户行为监测数据模型 v1.0
-- SQLite 3.x；所有学生标识均应使用业务侧生成的匿名 ID。

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- 1. 用户基础表：一个学生一行，保存稳定的分群维度。
CREATE TABLE IF NOT EXISTS students (
    student_id          TEXT PRIMARY KEY,
    grade               INTEGER NOT NULL CHECK (grade BETWEEN 7 AND 9),
    purchased_at        TEXT NOT NULL,
    package_code        TEXT NOT NULL,
    acquisition_channel TEXT NOT NULL,
    device_type         TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web', 'tablet', 'other')),
    device_os_version   TEXT,
    device_model        TEXT,
    created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. 学习事件明细表：追加写入的原始事实层，一次行为一行。
CREATE TABLE IF NOT EXISTS learning_events (
    event_id               INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id             TEXT NOT NULL,
    session_id             TEXT NOT NULL,
    event_name             TEXT NOT NULL CHECK (event_name IN (
                               'open', 'unlock', 'play', 'pause', 'seek_forward',
                               'answer', 'correction', 'exit', 'complete'
                             )),
    event_at               TEXT NOT NULL,
    event_sequence         INTEGER NOT NULL DEFAULT 1 CHECK (event_sequence > 0),
    course_id              TEXT,
    lesson_id              TEXT,
    knowledge_point_id     TEXT,
    animation_id           TEXT,
    animation_version      TEXT,
    question_id            TEXT,
    question_version       TEXT,
    video_position_seconds INTEGER CHECK (video_position_seconds IS NULL OR video_position_seconds >= 0),
    duration_seconds       INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    answer_value           TEXT,
    is_correct             INTEGER CHECK (is_correct IS NULL OR is_correct IN (0, 1)),
    properties_json        TEXT CHECK (properties_json IS NULL OR json_valid(properties_json)),
    ingested_at            TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- 3. 课程学习结果表：一个学生每节课一行，沉淀“学、练、改”的结果。
CREATE TABLE IF NOT EXISTS course_learning_results (
    result_id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id                   TEXT NOT NULL,
    course_id                    TEXT NOT NULL,
    lesson_id                    TEXT NOT NULL,
    knowledge_point_id           TEXT NOT NULL,
    unlocked_at                  TEXT,
    started_at                   TEXT,
    completed_at                 TEXT,
    animation_id                 TEXT,
    animation_version            TEXT,
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
    completion_status            TEXT NOT NULL DEFAULT 'not_started' CHECK (completion_status IN (
                                   'not_started', 'learning', 'practice', 'correcting', 'completed', 'abandoned'
                                 )),
    is_completed                 INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
    updated_at                   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, lesson_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- 4. 用户周度汇总表：一个学生每个自然周一行，服务留存、健康分和预警。
CREATE TABLE IF NOT EXISTS user_weekly_summaries (
    student_id               TEXT NOT NULL,
    week_start               TEXT NOT NULL,
    unlocked_lesson_count    INTEGER NOT NULL DEFAULT 0 CHECK (unlocked_lesson_count >= 0),
    started_lesson_count     INTEGER NOT NULL DEFAULT 0 CHECK (started_lesson_count >= 0),
    completed_lesson_count   INTEGER NOT NULL DEFAULT 0 CHECK (completed_lesson_count >= 0),
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

-- 5. 内容质量表：按知识点及内容版本每日快照，避免版本变化污染历史结果。
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
    abnormal_exit_rate        REAL CHECK (abnormal_exit_rate IS NULL OR abnormal_exit_rate BETWEEN 0 AND 1),
    difficulty_index          REAL CHECK (difficulty_index IS NULL OR difficulty_index BETWEEN 0 AND 1),
    updated_at                TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (snapshot_date, knowledge_point_id, animation_version, question_version)
);

-- 高频看板查询索引。
CREATE INDEX IF NOT EXISTS idx_students_segment
    ON students (grade, package_code, acquisition_channel, purchased_at);
CREATE INDEX IF NOT EXISTS idx_events_student_time
    ON learning_events (student_id, event_at);
CREATE INDEX IF NOT EXISTS idx_events_lesson_name_time
    ON learning_events (lesson_id, event_name, event_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_session_sequence
    ON learning_events (session_id, event_sequence);
CREATE INDEX IF NOT EXISTS idx_results_course_status
    ON course_learning_results (course_id, completion_status, updated_at);
CREATE INDEX IF NOT EXISTS idx_weekly_week_risk
    ON user_weekly_summaries (week_start, risk_level, health_score);
CREATE INDEX IF NOT EXISTS idx_content_snapshot_grade
    ON content_quality (snapshot_date, grade, subject, difficulty_index);

-- 看板可直接查询的语义视图。
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

COMMIT;
