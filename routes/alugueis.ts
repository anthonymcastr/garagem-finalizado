import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { enviaEmail } from './clientes'
 

const prisma = new PrismaClient()
const router = Router()

const aluguelSchema = z.object({
  clienteId: z.number(),
  boxId: z.number()
})


router.get("/", async (req, res) => {
  try {
    const alugueis = await prisma.aluguel.findMany({
      include: {
        cliente: true,
        box: true
      }
    })
    res.status(200).json(alugueis)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})


router.post("/", async (req, res) => {
  const valida = aluguelSchema.safeParse(req.body)
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error })
  }

  const { clienteId, boxId } = valida.data

  try {
    const box = await prisma.box.findUnique({ where: { id: boxId } })
    if (!box || box.ocupado) {
      return res.status(400).json({ erro: "Box inválido ou já ocupado" })
    }

    const aluguel = await prisma.$transaction(async (tx) => {
      const novoAluguel = await tx.aluguel.create({
        data: {
          clienteId,
          boxId,
          inicio: new Date()
        }
      })

      await tx.box.update({
        where: { id: boxId },
        data: { ocupado: true }
      })
      
      return novoAluguel
    })
    const cliente = await prisma.cliente.findFirst({
  where: { id: clienteId },
  include: {
    alugueis: {
      where: { ativo: true },
      include: {
        box: true
      }
    }
  }
})

if (cliente) {
  await enviaEmail(cliente)
}

    res.status(201).json(aluguel)

  } catch (error) {
    res.status(400).json({ erro: error })
  }
})


router.put("/encerrar/:id", async (req, res) => {
  const id = Number(req.params.id)
  try {
    const aluguel = await prisma.aluguel.findUnique({ where: { id } })
    if (!aluguel || !aluguel.ativo) {
      return res.status(400).json({ erro: "Aluguel não encontrado ou já encerrado" })
    }

    const aluguelFinalizado = await prisma.$transaction(async (tx) => {
      const encerrado = await tx.aluguel.update({
        where: { id },
        data: {
          fim: new Date(),
          ativo: false
        }
      })

      await tx.box.update({
        where: { id: aluguel.boxId },
        data: { ocupado: false }
      })

      return encerrado
    })

    res.status(200).json(aluguelFinalizado)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})


router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id)

  try {
    const aluguel = await prisma.aluguel.findUnique({ where: { id } })
    if (!aluguel) return res.status(404).json({ erro: "Aluguel não encontrado" })

    await prisma.$transaction([
      prisma.aluguel.delete({ where: { id } }),
      prisma.box.update({
        where: { id: aluguel.boxId },
        data: { ocupado: false }
      })
    ])

    res.status(200).json({ mensagem: "Aluguel deletado com sucesso" })
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router
