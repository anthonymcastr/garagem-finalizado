import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()
const router = Router()

const boxSchema = z.object({
  numero: z.number().int().positive(),
  precoMensal: z.number().positive()
})


router.get("/", async (req, res) => {
  try {
    const boxes = await prisma.box.findMany()
    res.status(200).json(boxes)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

// Criar novo box
router.post("/", async (req, res) => {
  const valida = boxSchema.safeParse(req.body)
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error })
  }

  try {
    const box = await prisma.box.create({ data: valida.data })
    res.status(201).json(box)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})


router.put("/:id", async (req, res) => {
  const id = Number(req.params.id)
  const valida = boxSchema.safeParse(req.body)
  if (!valida.success) {
    return res.status(400).json({ erro: valida.error })
  }

  try {
    const box = await prisma.box.update({
      where: { id },
      data: valida.data
    })
    res.status(200).json(box)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})


router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id)
  try {
    const box = await prisma.box.delete({ where: { id } })
    res.status(200).json(box)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router
