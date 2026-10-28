// Cria as tabelas no banco configurado no .env (DATABASE_URL ou DB_*).
// O servidor também faz isso sozinho na primeira requisição.
import { db, initDb } from "./database.js";

try {
    await initDb();
} catch {
    process.exitCode = 1;
} finally {
    await db.end();
}
