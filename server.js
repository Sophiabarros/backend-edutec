import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./database.js";
import bcrypt from "bcrypt";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------------------------
//  ROTA DE CADASTRO
// ----------------------------------------
app.post("/register", async (req, res) => {
    try {
        const { nome, email, password } = req.body;

        if (!nome || !email || !password) {
            return res.status(400).json({ message: "Preencha todos os campos!" });
        }

        // Verifica se e-mail já existe
        const [existing] = await db.promise().query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Email já cadastrado!" });
        }

        // Hash da senha
        const hashed = await bcrypt.hash(password, 10);

        // Inserção no banco
        await db.promise().query(
            "INSERT INTO users (nome, email, password) VALUES (?, ?, ?)",
            [nome, email, hashed]
        );

        res.status(201).json({ message: "Usuário cadastrado com sucesso!" });

    } catch (err) {
        console.error("Erro em /register:", err);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});


// ----------------------------------------
//  ROTA DE LOGIN (SEM TOKEN)
// ----------------------------------------
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await db.promise().query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: "Usuário não encontrado." });
        }

        const user = rows[0];

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return res.status(401).json({ message: "Senha incorreta." });
        }

        res.json({
            message: "Login realizado!",
            id: user.id,
            nome: user.nome
        });

    } catch (err) {
        console.error("Erro em /login:", err);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});


// ----------------------------------------
//  SALVAR SCORE NO FINAL DO QUIZ
// ----------------------------------------
app.post("/score", async (req, res) => {
    try {
        const { user_id, score } = req.body;

        if (!user_id || score === undefined) {
            return res.status(400).json({ message: "Dados inválidos." });
        }

        await db.promise().query(
            "INSERT INTO scores (user_id, score) VALUES (?, ?)",
            [user_id, score]
        );

        res.json({ message: "Pontuação salva!" });

    } catch (err) {
        console.error("Erro em /score:", err);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});


// ----------------------------------------
//  TOP 3 RANKING
// ----------------------------------------
app.get("/ranking", async (req, res) => {
    try {
        const [rows] = await db.promise().query(
            `SELECT users.nome, MAX(scores.score) AS maior_pontuacao
             FROM scores
             INNER JOIN users ON scores.user_id = users.id
             GROUP BY users.id
             ORDER BY maior_pontuacao DESC
             LIMIT 3`
        );

        res.json(rows);

    } catch (err) {
        console.error("Erro em /ranking:", err);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});


// ----------------------------------------
//  INICIAR SERVIDOR
// ----------------------------------------
const PORT = 3333;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
