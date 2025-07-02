import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'segredo123';

// Função para validar a senha
function validarSenha(senha: string): boolean {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  return regex.test(senha);
}

// Criar usuário (aceita campo 'nivel')
router.post('/', async (req, res) => {
  const { nome, email, senha, nivel = 1 } = req.body;

  if (!validarSenha(senha)) {
    return res.status(400).json({
      erro: 'A senha deve ter pelo menos 8 caracteres, letras maiúsculas, minúsculas, números e símbolos.',
    });
  }

  const hash = await bcrypt.hash(senha, 10);

  try {
    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: hash, nivel },
    });
    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao criar usuário.' });
  }
});

// Listar usuários
router.get('/', async (req, res) => {
  const usuarios = await prisma.usuario.findMany();
  res.json(usuarios);
});

// Login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) return res.status(401).json({ erro: 'Usuário não encontrado.' });

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) return res.status(401).json({ erro: 'Senha inválida.' });

  const token = jwt.sign({ id: usuario.id, nivel: usuario.nivel }, JWT_SECRET, { expiresIn: '1h' });

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ultimoLogin: new Date() },
  });

  await prisma.log.create({ data: { acao: 'Login realizado', usuarioId: usuario.id } });

  const saudacao = usuario.ultimoLogin
    ? `Bem-vindo de volta! Seu último login foi em ${new Date(usuario.ultimoLogin).toLocaleString()}`
    : 'Bem-vindo! Este é seu primeiro acesso ao sistema.';

  res.json({ token, mensagem: saudacao });
});

// Trocar senha
router.post('/trocar-senha', authMiddleware, async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  if (!req.usuario?.id) {
    return res.status(401).json({ erro: 'Usuário não autenticado.' });
  }

  const usuarioId = req.usuario.id;

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const senhaOk = await bcrypt.compare(senhaAtual, usuario.senha);
  if (!senhaOk) return res.status(401).json({ erro: 'Senha atual incorreta.' });

  if (!validarSenha(novaSenha)) {
    return res.status(400).json({
      erro: 'Nova senha inválida. Deve conter letras, números e símbolos.',
    });
  }

  const novaHash = await bcrypt.hash(novaSenha, 10);
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { senha: novaHash },
  });

  await prisma.log.create({ data: { acao: 'Senha alterada', usuarioId } });

  res.json({ mensagem: 'Senha alterada com sucesso.' });
});

// promovemos o usuário (somente admins nível 3 conseguem promover)
router.patch('/:id/promover', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nivel } = req.body;

  if (req.usuario?.nivel !== 3) {
    return res.status(403).json({ erro: 'Apenas administradores podem promover usuários.' });
  }

  if (![1, 2, 3].includes(nivel)) { // caso não inclusa o nivel, 1 2 ou 3 apresenta o erro no status
    return res.status(400).json({ erro: 'Nível inválido. Permitido: 1, 2 ou 3.' });
  }

  try {
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: Number(id) },
      data: { nivel },
    });

    await prisma.log.create({
      data: {
        acao: `Promoveu usuário ID ${id} para ADM, nivel: ${nivel}`,
        usuarioId: req.usuario.id,
      },
    });

    res.json({ mensagem: `Usuário promovido para nível ${nivel}. (ADM)`, usuarioAtualizado });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao promover usuário.' });
  }
});

export default router;
