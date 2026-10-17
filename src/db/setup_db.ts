import fs from "fs/promises";
import client from "./db.js";

const setupDatabase = async () => {
  try {
    const sql = await fs.readFile("src/db/schema.sql", "utf-8");
    await client.query(sql);
    console.log("Database setup completed successfully.");
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
};

setupDatabase();