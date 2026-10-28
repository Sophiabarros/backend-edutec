// Cria as tabelas no banco configurado no .env (DATABASE_URL ou DB_*).
import fs from "fs";
import { db } from "./database.js";

const sql = fs.readFileSync(new URL("./tabelas.sql", import.meta.url), "utf-8");

try {
    await db.query(sql);
    console.log("Tabelas criadas/verificadas com sucesso!");
} catch (err) {
    console.error("Erro ao criar as tabelas:", err.message);
    process.exitCode = 1;
} finally {
    await db.end();
}
