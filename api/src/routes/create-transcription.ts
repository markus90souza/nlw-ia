import { FastifyInstance } from 'fastify'
import { createReadStream } from 'node:fs'
import { prisma } from '../libs/prisma'
import { z } from 'zod'
import { openIA } from '../libs/openia'

const createTranscriptionRoute = async (app: FastifyInstance) => {
  app.post('/videos/:videoId/transcription', async (request) => {
    const paramSchema = z.object({
      videoId: z.string().uuid(),
    })

    const { videoId } = paramSchema.parse(request.params)

    const bodySchema = z.object({
      prompt: z.string(),
    })

    const { prompt } = bodySchema.parse(request.body)

    const video = await prisma.video.findFirstOrThrow({
      where: {
        id: videoId,
      },
    })

    const videoPath = video.path

    const audioReadStream = createReadStream(videoPath)

    const response = await openIA.audio.transcriptions.create({
      file: audioReadStream,
      model: 'whisper-1',
      language: 'pt',
      response_format: 'json',
      prompt,
      temperature: 0,
    })

    const transcription = await prisma.video.update({
      where: {
        id: videoId,
      },

      data: {
        transcription: response.text,
      },
    })

    return { transcription }
  })
}

export { createTranscriptionRoute }
