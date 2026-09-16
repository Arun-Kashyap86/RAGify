const app = require("./app");
const config = require("./config/env");
const db = require("./config/db");
const initDb = require("./config/initDb");

async function startServer() {
  try {
    await db.query("SELECT NOW()");

    console.log("Database connected successfully");

    await initDb();

    app.listen(config.port, "0.0.0.0", () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);

    process.exit(1);
  }
}

startServer();
