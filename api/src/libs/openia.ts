import 'dotenv/config'
import { OpenAI } from 'openai'

export const openIA = new OpenAI({
  apiKey: process.env.OPENIA_KEY,
})
