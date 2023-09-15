import { FastifyInstance } from 'fastify'
import fastifyMultipart from '@fastify/multipart'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { promisify } from 'node:util'
import { pipeline } from 'node:stream'
import fs from 'node:fs'
import { prisma } from '../libs/prisma'

const pump = promisify(pipeline)

const uploadVideoRoute = async (app: FastifyInstance) => {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_848_576 * 25, // 25mb
    },
  })

  app.post('/videos', async (request, reply) => {
    const data = await request.file()

    if (!data) {
      return reply.status(400).send({ error: 'missing file input ' })
    }

    const extension = path.extname(data.filename)

    if (extension !== '.mp3') {
      return reply
        .status(400)
        .send({ error: 'invalid input type, please upload a mp3 file ' })
    }

    const fileBaseName = path.basename(data.fieldname, extension)
    const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`

    const uploadDestination = path.resolve(
      __dirname,
      './../../tmp',
      fileUploadName,
    )

    await pump(data.file, fs.createWriteStream(uploadDestination))

    const video = await prisma.video.create({
      data: {
        name: data.filename,
        path: uploadDestination,
      },
    })

    return { video }
  })
}

export { uploadVideoRoute }
