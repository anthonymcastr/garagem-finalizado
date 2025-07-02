import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import { authMiddleware } from '../middlewares/auth'

const prisma = new PrismaClient()
const router = Router()

const clienteSchema = z.object({
  nome: z.string().min(5, { message: "Nome deve possuir no mínimo 5 caracteres" }),
  telefone: z.string().min(10, { message: "Telefone deve ser válido" }),
  email: z.string().email({ message: "Email inválido" }),
  placa: z.string().min(6, { message: "A placa deve ser válida" })
})

router.get("/", authMiddleware, async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany()
    await prisma.log.create({ data: { acao: 'Listou clientes', usuarioId: req.usuario!.id } })
    res.status(200).json(clientes)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", authMiddleware, async (req, res) => {
  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error })
  }

  const { nome, telefone, email, placa } = valida.data

  try {
    const cliente = await prisma.cliente.create({
      data: { nome, telefone, email, placa }
    })

    await prisma.log.create({ data: { acao: 'Criou cliente', usuarioId: req.usuario!.id } })

    res.status(201).json(cliente)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params
  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error })
  }

  const { nome, telefone, email, placa } = valida.data

  try {
    const cliente = await prisma.cliente.update({
      where: { id: Number(id) },
      data: { nome, telefone, email, placa }
    })

    await prisma.log.create({ data: { acao: `Atualizou cliente ${id}`, usuarioId: req.usuario!.id } })

    res.status(200).json(cliente)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params

  if (req.usuario!.nivel < 3) {
    return res.status(403).json({ erro: 'Apenas usuários com nível 3 podem excluir clientes.' })
  }

  try {
    const cliente = await prisma.cliente.delete({
      where: { id: Number(id) }
    })

    await prisma.log.create({ data: { acao: `Excluiu cliente ${id}`, usuarioId: req.usuario!.id } })

    res.status(200).json(cliente)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.get("/email/:id", authMiddleware, async (req, res) => {
  const { id } = req.params

  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: Number(id) },
      include: {
        alugueis: {
          include: {
            box: true
          }
        }
      }
    })

    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrado" })
    }

    await enviaEmail(cliente)
    await prisma.log.create({ data: { acao: `Enviou e-mail ao cliente ${id}`, usuarioId: req.usuario!.id } })

    res.status(200).json({ mensagem: "Email enviado com sucesso", cliente })
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

function gerarTabelaHTML(cliente: any) {
  let html = `
    <html>
      <body style="font-family: Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <img src="https://i.imgur.com/YtF6BVf.png" alt="Logo da Garagem" style="max-width: 50px; margin-bottom: 20px;" />
          <h2 style="color: #2c3e50;">Garagem: Relatório de Aluguéis</h2>
          <h3 style="color: #34495e;">Cliente: ${cliente.nome}</h3>
          <p style="font-size: 16px; color: #555;">Confira abaixo seus aluguéis ativos:</p>
          <table cellpadding="10" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #efefef;">
                <th style="text-align: left; border-bottom: 1px solid #ccc;">Data de Início</th>
                <th style="text-align: left; border-bottom: 1px solid #ccc;">Box</th>
                <th style="text-align: left; border-bottom: 1px solid #ccc;">Status</th>
              </tr>
            </thead>
            <tbody>
  `;

  for (const aluguel of cliente.alugueis) {
    if (aluguel.ativo) {
      html += `
        <tr style="border-bottom: 1px solid #eee;">
          <td>${new Date(aluguel.inicio).toLocaleDateString()}</td>
          <td>${aluguel.box?.numero || 'Box não informado'}</td>
          <td style="color: green; font-weight: bold;">Aluguel Ativo</td>
        </tr>
      `;
    }
  }

  html += `
            </tbody>
          </table>
          <p style="margin-top: 30px; font-size: 14px; color: #888;">Se tiver dúvidas, entre em contato conosco.</p>
        </div>
      </body>
    </html>
  `;

  return html;
}

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  auth: {
    user: "6527d9dd524a5f",
    pass: "3e8afb04e179e6",
  },
})

async function enviaEmail(cliente: any) {
  const html = gerarTabelaHTML(cliente)
  await transporter.sendMail({
    from: 'Garagem XYZ <contato@garagemxyz.com>',
    to: cliente.email,
    subject: "Relatório de Aluguéis",
    html,
  })
}

export default router
export { enviaEmail }
