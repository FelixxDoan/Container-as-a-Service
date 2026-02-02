import { examPool } from "../db/connPostgre.js";

const getQuestionService = async () => {
  const query = `SELECT question_id, question_text, difficulty
                        FROM exam_questions
                    ORDER BY question_id;
                    `;
  const { fields, rowCount, rows } = await examPool.query(query);
  return {
    statement: query.trim(),
    fields: fields.map((f) => f.name),
    rowCount,
    rows: rows || [],
  };
};

const tabeleService = async () => {
  const query = ` SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name NOT IN ('exam_questions', 'exam_submissions')
ORDER BY table_name;`;

  const { rows } = await examPool.query(query);
  return { rows };
};

const resultlService = async (id) => {
  const queryResult = await examPool.query(
    "SELECT expected_sql FROM exam_questions WHERE question_id = $1",
    [id]
  );

  if (queryResult.rows.length === 0) throw new Error("khong co cau hoi");
  const { expected_sql } = queryResult.rows[0];
  const { fields, rowCount, rows } = await examPool.query(expected_sql);
  return {
    fields: fields.map((f) => f.name),
    rowCount,
    rows: rows || [],
  };
};

const resultRunService = async (query) => {
  const { fields, rowCount, rows } = await examPool.query(query);
  return {
    fields: fields.map((f) => f.name),
    rowCount,
    rows: rows || [],
  };
};

const submitService = async (studentId, saved) => {
  let totalScore = 0;
  const submissions = [];

  for (const [questionId, studentQuery] of Object.entries(saved)) {
    try {
      // 1. Lấy expected_sql
      const { rows: qRows } = await examPool.query(
        "SELECT expected_sql FROM exam_questions WHERE question_id = $1",
        [questionId]
      );
      if (!qRows.length) {
        console.warn(`Không tìm thấy câu hỏi ID: ${questionId}`);
        continue;
      }

      const expectedSQL = qRows[0].expected_sql;

      // 2. Lấy dữ liệu từ expected_sql
      const { rows: expectedRows } = await examPool.query(expectedSQL);

      // 3. Lấy dữ liệu từ câu của sinh viên
      let studentRows;
      try {
        ({ rows: studentRows } = await examPool.query(studentQuery));
      } catch (err) {
        console.warn(`Query của SV lỗi ở câu ${questionId}: ${err.message}`);
        studentRows = [];
      }

      // 4. So sánh dữ liệu (không phụ thuộc thứ tự dòng)
      const normalize = (arr) =>
        arr
          .map((row) => JSON.stringify(row))
          .sort()
          .join("\n");

      let score = 0;
      if (normalize(expectedRows) === normalize(studentRows)) {
        score = 1;
        totalScore++;
      }

      // 5. Lưu submission vào mảng để insert 1 lần
      submissions.push({
        student_id: studentId,
        question_id: questionId,
        submitted_sql: studentQuery,
        score,
      });
    } catch (err) {
      console.error(`Lỗi xử lý câu ${questionId}:`, err.message);
    }
  }

  // 6. Insert tất cả submissions một lần
  if (submissions.length) {
    const values = [];
    const placeholders = submissions
      .map((s, i) => {
        const idx = i * 4;
        values.push(s.student_id, s.question_id, s.submitted_sql, s.score);
        return `($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4})`;
      })
      .join(", ");

    const sql = `
      INSERT INTO exam_submissions (student_id, question_id, submitted_sql, score)
      VALUES ${placeholders}
    `;

    await examPool.query(sql, values);
  }

  return totalScore;
};

export {
  getQuestionService,
  resultlService,
  resultRunService,
  submitService,
  tabeleService,
};
