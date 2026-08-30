const { Pool } = require("pg");
const config = require("./env");

const isProduction = config.nodeEnv === "production";
const requiresSsl =
  process.env.DATABASE_SSL === "true" ||
  (config.databaseUrl &&
    (config.databaseUrl.includes("sslmode=require") ||
      config.databaseUrl.includes("supabase.co") ||
      config.databaseUrl.includes("neon.tech") ||
      config.databaseUrl.includes("render.com") ||
      config.databaseUrl.includes("aws.com") ||
      isProduction));

const poolConfig = {
  connectionString: config.databaseUrl,
};

if (requiresSsl) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

pool.on("error", (error) => {
  console.error("Database pool error:", error);
});

module.exports = pool;
