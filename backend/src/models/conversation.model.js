const db = require("../config/db");

async function createConversation(title) {
  const result = await db.query(
    `
        INSERT INTO conversations (title)
        VALUES ($1)
        RETURNING *;
        `,
    [title],
  );

  return result.rows[0];
}

async function getConversations() {
  const result = await db.query(
    `
        SELECT *
        FROM conversations
        ORDER BY created_at DESC;
        `,
  );

  return result.rows;
}

async function getConversation(id) {
  const result = await db.query(
    `
        SELECT *
        FROM conversations
        WHERE id = $1;
        `,
    [id],
  );

  return result.rows[0];
}

async function deleteConversation(id) {
  const result = await db.query(
    `
        DELETE FROM conversations
        WHERE id = $1
        RETURNING *;
        `,
    [id],
  );

  return result.rows[0];
}

async function attachDocument(conversationId, documentId) {
  const result = await db.query(
    `
        UPDATE conversations
        SET document_id = $1
        WHERE id = $2
        RETURNING *;
        `,
    [documentId, conversationId],
  );

  return result.rows[0];
}

async function updateConversationTitle(conversationId, title) {
  const query = `
        UPDATE conversations
        SET title = $1
        WHERE id = $2
        RETURNING *
    `;

  const result = await db.query(query, [title, conversationId]);

  return result.rows[0];
}

module.exports = {
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
  attachDocument,
  updateConversationTitle,
};
