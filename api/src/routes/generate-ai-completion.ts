import { FastifyInstance } from 'fastify'
import { prisma } from '../libs/prisma'
import { z } from 'zod'
import { openIA } from '../libs/openia'
import { streamToResponse, OpenAIStream } from 'ai'

const generateAICompletionRoute = async (app: FastifyInstance) => {
  app.post('/ai/complete', async (request, reply) => {
    const bodySchema = z.object({
      videoId: z.string().uuid(),
      prompt: z.string(),
      temperature: z.number().min(0).max(1).default(0.5),
    })

    const { videoId, temperature, prompt } = bodySchema.parse(request.body)

    const video = await prisma.video.findUniqueOrThrow({
      where: {
        id: videoId,
      },
    })

    if (!video.transcription) {
      return reply
        .status(400)
        .send({ error: 'video transcription not yet genereted' })
    }

    const promptMessage = prompt.replace('{transcription}', video.transcription)

    const response = await openIA.chat.completions.create({
      model: 'gpt-3.5-turbo-16k',
      temperature,
      messages: [
        {
          role: 'user',
          content: promptMessage,
        },
      ],
      stream: true,
    })

    const stream = OpenAIStream(response)

    streamToResponse(stream, reply.raw, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods':
          'GET, POST, PUT, DELETE, UPDATE, OPTIONS',
      },
    })
  })
}

export { generateAICompletionRoute }
