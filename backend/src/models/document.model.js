const db = require("../config/db");

async function createDocument(fileName, filePath, userId = null) {
  const result = await db.query(
    `INSERT INTO documents (file_name, file_path, user_id) VALUES ($1, $2, $3) RETURNING *`,
    [fileName, filePath, userId],
  );
  return result.rows[0];
}

async function deleteDocument(id, userId = null) {
  if (userId) {
    await db.query(`DELETE FROM documents WHERE id = $1 AND user_id = $2`, [
      id,
      userId,
    ]);
  } else {
    await db.query(`DELETE FROM documents WHERE id = $1`, [id]);
  }
}

module.exports = {
  createDocument,
  deleteDocument,
};
