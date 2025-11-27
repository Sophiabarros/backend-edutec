import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

export const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Testa conexão (sem crash)
db.getConnection((err, connection) => {
    if (err) {
        console.error("Erro ao conectar ao MySQL:", err.code, err.message);
        return;
    }
    console.log("Conexão com MySQL bem sucedida!");
    connection.release();
});
