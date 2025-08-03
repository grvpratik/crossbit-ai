import {
  appendResponseMessages,
  JSONValue,
  pipeDataStreamToResponse,
  streamText,
  tool,
  convertToCoreMessages,
  CoreMessage,
  DataStreamWriter,
} from 'ai'
import { Request, Response } from 'express'
import { z } from 'zod'

import {
  ApiError,
  AuthError,
  NotFoundError,
} from '../../middleware/error.middleware'
import { registry } from '../../services/ai/registry'
import logger from '../../utils/logger'

import { userService } from '../../services/user'
import { chatService, messageService } from '../../services/ai/chat.services'
import { truncateMessages } from '../../utils/message-limit'
import { Session } from '../../types/session.types'
import { executeStep, getTokenMetadataTool, ResearchStep, updateStepStatus } from '../../services/ai/tools'
import { getTokenAccountsByMint } from '../../services/onchain/pumpfun/rpc'
type AuthenticatedRequest = Request & { user: Session }



export const chat = async (req: AuthenticatedRequest, res: Response) => {
  const { messages, id } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format.' })
  }

  logger.info('Received chat request', {
    userId: req.user.is_guest ? 'guest' : req.user.auth?.user_id,
    chatId: id,
    messageCount: messages.length,
  })

  const session = req.user
  const isGuest = session.is_guest
  // apply rate limit here

  const model = registry.languageModel('google:free')

  const coreMessages: CoreMessage[] = convertToCoreMessages(messages)

  const maxContextTokens = 4000
  const messageContext = truncateMessages(coreMessages, maxContextTokens)

  pipeDataStreamToResponse(res, {
    execute: async (dataStreamWriter) => {
      const tokenResearch = tool({
        description: 'it will research full token analysis',
        parameters: z.object({
          mint: z.string().describe('mint address'),
          // uid: z.string().default('unique id'),
        }),
        execute: async ({ mint }, { toolCallId, messages }) => {
          // Initialize the research steps
          const steps: ResearchStep[] = [
            {
              id: 'mintinfo',
              title: 'Token Information',
              description: 'Fetching basic token information and metadata',
              status: 'waiting',
            },
            {
              id: 'socialVerify',
              title: 'Social Verification',
              description: 'Verifying social presence and community engagement',
              status: 'waiting',
            },
            {
              id: 'market',
              title: 'Market Analysis',
              description: 'Analyzing market cap and price performance',
              status: 'waiting',
            },
            {
              id: 'volume',
              title: 'Volume Analysis',
              description: 'Analyzing trading volume and liquidity',
              status: 'waiting',
            },
            {
              id: 'holders',
              title: 'Holder Analysis',
              description:
                'Analyzing token distribution and holder demographics',
              status: 'waiting',
            },
            {
              id: 'similar',
              title: 'Similar Tokens',
              description: 'Finding and comparing similar tokens',
              status: 'waiting',
            },
            {
              id: 'creator',
              title: 'Creator Analysis',
              description: 'Analyzing the token creator and team',
              status: 'waiting',
            },
            {
              id: 'sentiment',
              title: 'Sentiment Analysis',
              description: 'Analyzing social sentiment and community feedback',
              status: 'waiting',
            },
          ]

          // Update initial status to show all steps
          dataStreamWriter.writeData({
            type: 'research_progress',
            steps: steps as any,
            currentStep: null,
            overallProgress: 0,
          })

          try {
            // Step 1: Mint Info
            const mintInfo = await executeStep(
              dataStreamWriter,
              steps,
              'mintinfo',
              async () =>await getTokenAccountsByMint(mint)
            )

            // Step 2: Social Verification (continue only if mintInfo was successful)
            const socialInfo = await executeStep(
              dataStreamWriter,
              steps,
              'socialVerify',
              async () => {
                await new Promise((resolve) => setTimeout(resolve, 2500))
                return {
                  twitter: '@sampletoken',
                  discord: 'discord.gg/sampletoken',
                  website: 'sampletoken.io',
                  verified: true,
                }
              }
            )

            // Step 3: Market Analysis
            // conditional based on market analaysis skip or continue
            const marketInfo = await executeStep(
              dataStreamWriter,
              steps,
              'market',
              async () => {
                // throw new Error("custom error")
                await new Promise((resolve) => setTimeout(resolve, 4000))
                return {
                  marketCap: '$5,000,000',
                  price: '$0.005',
                  priceChange24h: '+2.5%',
                  bondingCurve: 'Linear',
                }
              }
            )

            // Step 4: Volume Analysis
            // conditional based on market analaysis skip or continue
            const volumeInfo = await executeStep(
              dataStreamWriter,
              steps,
              'volume',
              async () => {
                await new Promise((resolve) => setTimeout(resolve, 3500))
                return {
                  volume24h: '$350,000',
                  volumeChange7d: '+15%',
                  liquidity: '$750,000',
                }
              }
            )

            // Step 5: Holder Analysis
            const holderInfo = await executeStep(
              dataStreamWriter,
              steps,
              'holders',
              async () => {
                await new Promise((resolve) => setTimeout(resolve, 5000))
                return {
                  totalHolders: 2500,
                  top10Percentage: '45%',
                  distribution: 'Moderate concentration',
                }
              }
            )

            updateStepStatus(
              dataStreamWriter,
              steps,
              'similar',
              'skipped',
              'Skipped - no similar tokens found'
            )

            // Step 7: Creator Analysis
            const creatorInfo = await executeStep(
              dataStreamWriter,
              steps,
              'creator',
              async () => {
                await new Promise((resolve) => setTimeout(resolve, 3000))
                return {
                  address: 'abc...xyz',
                  verified: true,
                  otherProjects: 2,
                }
              }
            )

            // Step 8: Sentiment Analysis
            // check volume 
            const sentimentInfo = await executeStep(
              dataStreamWriter,
              steps,
              'sentiment',
              async () => {
                await new Promise((resolve) => setTimeout(resolve, 4000))
                return {
                  overall: 'Positive',
                  score: 7.5,
                  recentTrend: 'Stable',
                }
              }
            )

            // Final completion update
            dataStreamWriter.writeData({
              type: 'research_progress',
              steps: steps as any,
              currentStep: null,
              overallProgress: 100,
              completed: true,
              summary: {
                mintAddress: mint,
                name: mintInfo.name,
                symbol: mintInfo.symbol,
                marketCap: marketInfo.marketCap,
                sentiment: sentimentInfo.overall,
                riskLevel: 'Medium',
                recommendedAction: 'DYOR',
              },
            })

            return {
              finish_reason: 'completed',
              data: {
                mintInfo,
                socialInfo,
                marketInfo,
                volumeInfo,
                holderInfo,
                creatorInfo,
                sentimentInfo,
              },
            }
          } catch (error: any) {
            // If any step fails, we still want to return a partial result
            return {
              finish_reason: 'partial',
              error: error.message,
              data: steps
                .filter((step) => step.status === 'completed')
                .reduce((acc, step) => {
                  acc[step.id] = step.result
                  return acc
                }, {}),
            }
          }
        },
      })
      const myTool = tool({
        description: 'Example tool',
        parameters: z.object({
          input: z.string(),
        }),
        execute: async ({ input }, { toolCallId }) => {
          // Tool execution logic
          return { result: `Processed ${input}` }
        },
      })
      const result = streamText({
        toolCallStreaming: true,
        // toolChoice: { type: 'tool', toolName: 'tokenResearch' },
        // experimental_activeTools:,
        model,
        messages: coreMessages,
        tools: { tokenResearch, myTool },
        // tools,
        maxSteps: 5,
        // onChunk() {
        //   console.log('onChunk')
        // },

        onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
          // if user auth then save
          // console.log('onStepFinish', {
          //   text,
          //   toolCalls,
          //   toolResults,
          //   finishReason,
          //   usage,
          // })
        },
        async onFinish({ response }) {
          const startTime = Date.now()
          logger.info('AI stream started', { startTime })

          // logger.info('AI stream finished', { finishReason: response.finishReason, usage: response.usage });
          // console.log(session, 'fininsh session')
          if (isGuest) {
            // Handle guest user scenario (e.g., increment a counter)
            logger.info('Guest user chat finished - no save')
            // increment token usage for guest if applicable
            return
          }
          const userId = session.auth?.user_id
          // Ensure user is authenticated
          if (!userId) {
            logger.error(
              'Authenticated session but user ID is missing during onFinish.'
            )
            return
          }

          try {
            // const user = await userService.findById(userId)
            // if (!user) {
            //   logger.error(`User not found during onFinish: ${userId}`)

            //   return
            // }

            const last = messages.slice(-1)
            const lastMessage = appendResponseMessages({
              messages: last,
              responseMessages: response.messages,
            })
            const fullMessages = appendResponseMessages({
              messages: messages,
              responseMessages: response.messages,
            })

            const chatTitle = `Chat ${new Date().toLocaleString()}`

            await chatService.appendMessages({
              id,
              userId: userId,
              title: chatTitle,
              messages: lastMessage,
              fullMessages: fullMessages,
            })

            logger.debug('Chat messages saved successfully', {
              chatId: id,
              userId,
            })
            //dataStreamWriter.writeData({ type: 'title', title: chatTitle })
            // increment message count or token usage for authenticated users
          } catch (error: any) {
            // console.log(error)
            logger.error('Error saving chat messages in onFinish', {
              userId,
              chatId: id,
              error,
            })
          }
          const endTime = Date.now()
          const timeTaken = endTime - startTime
          console.warn('AI stream finished', timeTaken)
        },
      })

      result.mergeIntoDataStream(dataStreamWriter)
    },
    onError: (error) => {
      logger.error('Error in data stream execution', { error })

      return error instanceof Error ? error.message : String(error)
    },
  })
}

export const chatHistory = async (req: Request, res: Response) => {
  const session = req.user
  if (!session || session.is_guest) {
    throw new AuthError('guest not allowed')
  }
  const user = await chatService.findByUserId(session.auth.user_id)
  if (!user) throw new AuthError('user not found')
  const chats = user.map(({ userId, ...rest }) => rest)
  return res.json({ success: true, result: chats }).status(200)
}
export const chatDetails = async (req: AuthenticatedRequest, res: Response) => {
  const chatId = req.params.id || ''
  const query = req.query as { messages?: string }
  const messageInclude = query.messages === 'true'

  const session = req.user
  if (!session || session.is_guest) {
    throw new AuthError(
      'Guest users are not allowed to access chat conversations.'
    )
  }

  const userId = session.auth?.user_id
  if (!userId) {
    throw new AuthError('Authenticated session but user ID is missing.')
  }

  const user = await userService.findById(userId)
  if (!user) {
    throw new AuthError('User not found.')
  }

  try {
    if (!messageInclude) {
      const data = await chatService.findById(chatId, userId, false)
      if (!data) {
        throw new NotFoundError('Chat not found.')
      }
      return res.status(200).json({ success: true, result: data })
    }

    const chats = await chatService.findById(chatId, userId, true)
    if (!chats) {
      throw new NotFoundError('Chat not found.')
    }

    logger.info('Chat conversation retrieved successfully', {
      chatId,
      userId,
    })

    res.status(200).json({ success: true, result: chats })
  } catch (error: any) {
    logger.error('Error retrieving chat conversation', {
      chatId,
      userId,
      error: error.message,
    })
    throw error
  }
}

export const chatUpdate = async (req: AuthenticatedRequest, res: Response) => {
  const chatId = req.params.id || ''
  const { title, messages } = req.body

  const session = req.user
  if (!session || session.is_guest) {
    throw new AuthError('Guest users are not allowed to update chats.')
  }

  const userId = session.auth?.user_id
  if (!userId) {
    throw new AuthError('Authenticated session but user ID is missing.')
  }

  const user = await userService.findById(userId)
  if (!user) {
    throw new AuthError('User not found.')
  }

  try {
    const updatedChat = await chatService.update(chatId, userId, { title })
    if (!updatedChat) {
      throw new NotFoundError('Chat not found.')
    }

    logger.info('Chat updated successfully', {
      chatId,
      userId,
    })

    res.status(200).json({ success: true, result: updatedChat })
  } catch (error: any) {
    logger.error('Error updating chat', {
      chatId,
      userId,
      error: error.message,
    })
    throw new ApiError('failed to update user chat')
  }
}

export const chatDelete = async (req: AuthenticatedRequest, res: Response) => {
  const chatId = req.params.id || ''

  const session = req.user
  if (!session || session.is_guest) {
    throw new AuthError('Guest users are not allowed to delete chats.')
  }

  const userId = session.auth?.user_id
  if (!userId) {
    throw new AuthError('Authenticated session but user ID is missing.')
  }

  const user = await userService.findById(userId)
  if (!user) {
    throw new AuthError('User not found.')
  }

  try {
    const deletedChat = await chatService.delete(chatId, userId)
    if (!deletedChat) {
      throw new NotFoundError('Chat not found.')
    }

    logger.info('Chat deleted successfully', {
      chatId,
      userId,
    })

    res
      .status(200)
      .json({ success: true, message: 'Chat deleted successfully.' })
  } catch (error: any) {
    logger.error('Error deleting chat', {
      chatId,
      userId,
      error: error.message,
    })
    throw new ApiError('error deleting chat')
  }
}
export const chatCreate = async (req: AuthenticatedRequest, res: Response) => {
  const { messages, chatId } = req.body

  const session = req.user
  if (!session || session.is_guest) {
    throw new AuthError('Guest users are not allowed to create chats.')
  }

  const userId = session.auth?.user_id
  if (!userId) {
    throw new AuthError('Authenticated session but user ID is missing.')
  }

  const user = await userService.findById(userId)
  if (!user) {
    throw new AuthError('User not found.')
  }
  const sen = {
    role: messages.role,
    content: '',
    id: crypto.randomUUID(),
    parts: [messages.parts],
  }
  try {
    const chatTitle = `Chat ${new Date().toLocaleString()}` // Generate a default title

    const newChat = await chatService.appendMessages({
      userId: user.id,
      id: chatId,
      title: chatTitle,
      messages: [sen],
      fullMessages: [sen],
    })
    if (!newChat) {
      throw new ApiError('Failed to create chat.')
    }

    logger.info('Chat created successfully', {
      chatId,
      userId,
    })

    res.status(201).json({ success: true, result: newChat })
  } catch (error: any) {
    logger.error('Error creating chat', {
      userId,
      error: error.message,
    })
    throw new ApiError('Error creating chat')
  }
}

// mint info,social and hype ,marketorbonding curve,volume,holders,similar tokens,creator,social volume,sentiments,accounts,top posts

export const chatController = {}
