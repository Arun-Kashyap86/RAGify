const db = require("../config/db");

async function createUser(name, email, passwordHash) {
  const result = await db.query(
    `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, created_at;
    `,
    [name, email.toLowerCase().trim(), passwordHash],
  );

  return result.rows[0];
}

async function getUserByEmail(email) {
  const result = await db.query(
    `
    SELECT *
    FROM users
    WHERE LOWER(email) = LOWER($1);
    `,
    [email.trim()],
  );

  return result.rows[0];
}

async function getUserById(id) {
  const result = await db.query(
    `
    SELECT id, name, email, created_at
    FROM users
    WHERE id = $1;
    `,
    [id],
  );

  return result.rows[0];
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
};
