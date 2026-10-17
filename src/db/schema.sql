CREATE TABLE accounts{
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    amount INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
}

CREATE TABLE payments{
    id SERIAL PRIMARY KEY,
    from_account_id INTEGER REFERENCES accounts(id),
    to_account_id INTEGER REFERENCES accounts(id),
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT "pending",
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
}