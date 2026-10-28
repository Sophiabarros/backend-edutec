import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db, initDb } from "./database.js";
import bcrypt from "bcrypt";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Garante que as tabelas existem antes de qualquer rota usar o banco
app.use(async (req, res, next) => {
    try {
        await initDb();
        next();
    } catch {
        res.status(503).json({ message: "Banco de dados indisponível." });
    }
});

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
        const { rows: existing } = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Email já cadastrado!" });
        }

        // Hash da senha
        const hashed = await bcrypt.hash(password, 10);

        // Inserção no banco
        await db.query(
            "INSERT INTO users (nome, email, password) VALUES ($1, $2, $3)",
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

        const { rows } = await db.query(
            "SELECT * FROM users WHERE email = $1",
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

        await db.query(
            "INSERT INTO scores (user_id, score) VALUES ($1, $2)",
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
        const { rows } = await db.query(
            `SELECT users.nome, MAX(scores.score) AS maior_pontuacao
             FROM scores
             INNER JOIN users ON scores.user_id = users.id
             GROUP BY users.id, users.nome
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
//  PONTUAÇÃO DE UM USUÁRIO
// ----------------------------------------
app.get("/score/:user_id", async (req, res) => {
    try {
        const userId = Number(req.params.user_id);

        if (!Number.isInteger(userId)) {
            return res.status(400).json({ message: "Usuário inválido." });
        }

        const { rows: users } = await db.query(
            "SELECT id, nome FROM users WHERE id = $1",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        // Melhor pontuação, nº de partidas e posição no ranking geral
        const { rows: [resumo] } = await db.query(
            `WITH melhores AS (
                 SELECT user_id, MAX(score) AS maior_pontuacao, COUNT(*)::int AS partidas
                 FROM scores
                 GROUP BY user_id
             ),
             posicoes AS (
                 SELECT user_id, maior_pontuacao, partidas,
                        RANK() OVER (ORDER BY maior_pontuacao DESC)::int AS posicao
                 FROM melhores
             )
             SELECT maior_pontuacao, partidas, posicao FROM posicoes WHERE user_id = $1`,
            [userId]
        );

        const { rows: historico } = await db.query(
            `SELECT score, data FROM scores
             WHERE user_id = $1
             ORDER BY data DESC
             LIMIT 10`,
            [userId]
        );

        res.json({
            nome: users[0].nome,
            maior_pontuacao: resumo ? resumo.maior_pontuacao : null,
            posicao: resumo ? resumo.posicao : null,
            partidas: resumo ? resumo.partidas : 0,
            historico
        });

    } catch (err) {
        console.error("Erro em /score/:user_id:", err);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
});


// ----------------------------------------
//  INICIAR SERVIDOR
// ----------------------------------------
// Na Vercel o app é exportado e rodado como função; localmente sobe com listen.
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3333;

    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

export default app;
