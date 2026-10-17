import pool from './db.js';

const seedDatabase = async () => {
    await pool.query(`
            INSERT INTO accounts (name, amount)
VALUES
    ('Alice', 100000),
    ('Bob', 50000)
RETURNING *;
        `)
}


seedDatabase();

await pool.end();