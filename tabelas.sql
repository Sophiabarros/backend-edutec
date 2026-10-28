-- PostgreSQL
-- Pode rodar quantas vezes quiser: só cria o que ainda não existe
-- e não apaga dados (importante, já que o banco fica online).
-- Rode com: npm run db:setup

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    score INT NOT NULL,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
