import { FastifyInstance } from 'fastify'
import { prisma } from '../libs/prisma'

const getAllPromptsRoutes = async (app: FastifyInstance) => {
  app.get('/prompts', async () => {
    const prompts = await prisma.prompt.findMany()
    return prompts
  })
}

export { getAllPromptsRoutes }
