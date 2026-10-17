import client from "./db.js";

const seedDatabase = async () => {
  try {
    const result = await client.query(`
      INSERT INTO accounts (name, amount)
      VALUES
        ('Alice', 100000),
        ('Bob', 50000)
      RETURNING *;
    `);
    console.log("Seeded accounts:", result.rows);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
};

seedDatabase();