const db = require("../config/db");

async function createDocument(fileName, filePath) {
    const result = await db.query(`INSERT INTO documents (file_name, file_path) VALUES ($1, $2) RETURNING *`, [fileName, filePath]);
    return result.rows[0];
}

async function getDocument(id) {
    const result = await db.query(`SELECT * FROM documents WHERE id = $1`, [id]);
    return result.rows[0];
}

async function deleteDocument(id) {
    await db.query(`DELETE FROM documents WHERE id = $1`, [id]);
}

module.exports = {
    createDocument,
    getDocument,
    deleteDocument
};