// src/routes/backup.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// Backup de dados
router.get('/', authMiddleware, async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany();
    const clientes = await prisma.cliente.findMany();
    const boxes = await prisma.box.findMany();
    const alugueis = await prisma.aluguel.findMany();
    const pagamentos = await prisma.pagamento.findMany();
    const logs = await prisma.log.findMany();

    const dados = {
      usuarios,
      clientes,
      boxes,
      alugueis,
      pagamentos,
      logs
    };

    await prisma.log.create({ data: { acao: 'Backup realizado', usuarioId: req.usuario!.id } });

    res.status(200).json(dados);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao realizar backup.' });
  }
});

// Restore de dados
router.post('/', authMiddleware, async (req, res) => {
  const dados = req.body;

  try {
    // Limpar dados antigos
    await prisma.pagamento.deleteMany();
    await prisma.aluguel.deleteMany();
    await prisma.box.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.log.deleteMany();
    await prisma.usuario.deleteMany();

    // Recriar os dados (na ordem certa para não quebrar as foreign keys)
    await prisma.usuario.createMany({ data: dados.usuarios });
    await prisma.cliente.createMany({ data: dados.clientes });
    await prisma.box.createMany({ data: dados.boxes });
    await prisma.aluguel.createMany({ data: dados.alugueis });
    await prisma.pagamento.createMany({ data: dados.pagamentos });
    await prisma.log.createMany({ data: dados.logs });

    await prisma.log.create({ data: { acao: 'Restore realizado', usuarioId: req.usuario!.id } });

    res.status(200).json({ mensagem: 'Restore realizado com sucesso.' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao restaurar dados.', detalhes: error });
  }
});

export default router;
