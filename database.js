import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Usa DATABASE_URL (Neon, Supabase, Vercel etc.) se existir;
// senão, monta a conexão com as variáveis separadas.
export const db = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false }
    })
    : new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
    });

// Mesmo conteúdo do tabelas.sql. Só cria o que não existe; não apaga dados.
const SCHEMA = `
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
`;

// Cria as tabelas uma vez por instância do servidor.
// Se falhar (banco fora do ar), tenta de novo na próxima chamada.
let ready = null;

export function initDb() {
    if (!ready) {
        ready = db.query(SCHEMA)
            .then(() => console.log("Conexão com PostgreSQL OK, tabelas verificadas."))
            .catch((err) => {
                ready = null;
                console.error("Erro ao conectar ao PostgreSQL:", err.code, err.message);
                throw err;
            });
    }
    return ready;
}
