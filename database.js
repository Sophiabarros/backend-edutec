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

// Testa conexão (sem crash)
db.connect()
    .then((client) => {
        console.log("Conexão com PostgreSQL bem sucedida!");
        client.release();
    })
    .catch((err) => {
        console.error("Erro ao conectar ao PostgreSQL:", err.code, err.message);
    });
