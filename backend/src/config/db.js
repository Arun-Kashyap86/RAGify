const { Pool } = require("pg");
const config = require("./env");

const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: {
        rejectUnauthorized: false
    }
});
pool.on("error", (error) => {
    console.error(
        "Database pool error:",
        error
    );
});

module.exports = pool;