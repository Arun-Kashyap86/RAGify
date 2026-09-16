const db = require("../config/db");

async function createMessage(conversationId, role, content) {
  const result = await db.query(
    `
        INSERT INTO messages
        (conversation_id, role, content)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
    [conversationId, role, content],
  );

  return result.rows[0];
}

async function getMessages(conversationId) {
  const result = await db.query(
    `
        SELECT *
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at ASC
        `,
    [conversationId],
  );

  return result.rows;
}

async function getRecentMessages(conversationId, limit = 10) {
  const result = await db.query(
    `
        SELECT role, content
        FROM (
            SELECT role, content, created_at
            FROM messages
            WHERE conversation_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        ) sub
        ORDER BY created_at ASC
        `,
    [conversationId, limit],
  );

  return result.rows;
}

async function deleteMessagesFrom(conversationId, messageId) {
  const result = await db.query(
    `
    DELETE FROM messages
    WHERE conversation_id = $1
      AND created_at >= (
        SELECT created_at
        FROM messages
        WHERE id = $2 AND conversation_id = $1
      )
    RETURNING id
    `,
    [conversationId, messageId],
  );

  return result.rows;
}

module.exports = {
  createMessage,
  getMessages,
  getRecentMessages,
  deleteMessagesFrom,
};
