import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()
const router = Router()

enum FormaPagamento {
  DINHEIRO = "DINHEIRO",
  CARTAO = "CARTAO",
  PIX = "PIX"
}


const pagamentoSchema = z.object({
  clienteId: z.number(),
  tipo: z.nativeEnum(FormaPagamento)
})


router.get("/", async (req, res) => {
  try {
    const pagamentos = await prisma.pagamento.findMany({
      include: {
        cliente: true
      }
    })
    res.status(200).json(pagamentos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})


router.post("/", async (req, res) => {
  const valida = pagamentoSchema.safeParse(req.body)
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error })
  }

  const { clienteId, tipo } = valida.data

  try {
    const pagamento = await prisma.pagamento.create({
      data: { clienteId, tipo }
    })
    res.status(201).json(pagamento)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})


router.delete("/:id", async (req, res) => {
  const { id } = req.params
  const idNum = Number(id)

  if (isNaN(idNum)) {
    return res.status(400).json({ erro: "ID inválido" })
  }

  try {
    const pagamento = await prisma.pagamento.delete({ where: { id: idNum } })
    res.status(200).json(pagamento)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router
