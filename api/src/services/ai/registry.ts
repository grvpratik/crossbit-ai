// import { xai } from "@ai-sdk/xai";
import { groq } from '@ai-sdk/groq'

import { createProviderRegistry, customProvider } from 'ai'
import { google } from '@ai-sdk/google'

export const registry = createProviderRegistry({
  // xai,

  google: customProvider({
    languageModels: {
      free: google('gemini-2.0-flash-exp-image-generation'),
      // reasoning:google("gemini-2.0-flash-thinking-exp-01-21")
    },
    fallbackProvider: google,
  }),

  groq: customProvider({
    languageModels: {
      'gemma2-9b-it': groq('gemma2-9b-it'),
      'qwen-qwq-32b': groq('qwen-qwq-32b'),
    },
  }),
})
