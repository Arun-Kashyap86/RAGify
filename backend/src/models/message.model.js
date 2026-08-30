const db = require("../config/db");

async function createMessage(conversationId, role, content) {
    const result = await db.query(
        `
        INSERT INTO messages
        (conversation_id, role, content)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [conversationId, role, content]
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
        [conversationId]
    );

    return result.rows;
}

module.exports = {
    createMessage,
    getMessages
};