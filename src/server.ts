import * as dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import db from './config/db';

const app = express();
const router = express.Router();

const PORT = process.env.PORT || 3000;

app.use(cors(), bodyParser.json(), express.json({ limit: '1gb' }), express.urlencoded({ limit: '1gb', extended: true }));

// app.use(bodyParser.json());
// app.use(express.json({ limit: '1gb' }));
// app.use(express.urlencoded({ limit: '1gb', extended: true }));

router.post('/api/users_post', async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Parâmetros inválidos' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query<import('mysql2').ResultSetHeader>(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        return res.status(201).json({
            message: 'Usuário criado com sucesso!',
            userId: result.insertId,
        });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email já cadastrado' });
        }
        console.error('Erro ao criar usuário:', error);
        return res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

router.post('/api/users_get', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Parâmetros inválidos' });
        }

        const [rows] = await db.query<any[]>(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const user = rows[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const { password: _, ...userData } = user;
        return res.status(200).json({ success: true, user: userData });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

router.post('/api/product', async (req: Request, res: Response) => {
    try {
        const { name, description, imageBase64, price, quantity, user_id } =
            req.body;

        let imageBuffer: Buffer | null = null;
        if (imageBase64) {
            imageBuffer = Buffer.from(imageBase64, 'base64');
        }

        // Faz o INSERT no banco
        const [result] = await db.query<import('mysql2').ResultSetHeader>(
            `INSERT INTO products 
         (name, description, image, price, quantity, user_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [name, description, imageBuffer, price, quantity, user_id]
        );

        return res.json({
            success: true,
            message: 'Produto criado com sucesso!',
            productId: result.insertId,
        });
    } catch (error: any) {
        console.error('Erro ao criar produto:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao criar produto.',
            error: error.message,
        });
    }
});

router.get('/api/get_products', async (req: Request, res: Response) => {
    try {
        const [rows] = await db.query<any[]>('SELECT * FROM products');

        const products = rows.map((product) => {
            if (product.image) {
                return {
                    ...product,
                    image: product.image.toString('base64'),
                };
            }
            return product;
        });

        return res.json({ success: true, products });
    } catch (error: any) {
        console.error('Erro ao buscar produtos:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar produtos',
            error: error.message,
        });
    }
});

app.use(router);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
