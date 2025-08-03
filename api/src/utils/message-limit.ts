import { convertToCoreMessages, CoreMessage } from 'ai'

/**
 * Truncates an array of messages to ensure the total token count does not exceed the specified maximum.
 * Messages are processed in order, and only those that fit within the limit are included.
 * Any leading messages not from the 'user' role are removed from the result.
 *
 * @param {CoreMessage[]} messages - The array of messages to truncate.
 * @param {number} maxTokens - The maximum allowed token count.
 * @returns {CoreMessage[]} - The truncated array of messages.
 */
export function truncateMessages(
  messages: CoreMessage[],
  maxTokens: number
): CoreMessage[] {
  let totalTokens = 0
  const truncated: CoreMessage[] = []

  // Traverse messages in reverse to accumulate from the latest
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    const messageTokens = message.content?.length ?? 0

    if (totalTokens + messageTokens > maxTokens) {
      break
    }

    totalTokens += messageTokens
    truncated.unshift(message)
  }

  while (truncated.length && truncated[0].role !== 'user') {
    truncated.shift()
  }

  return truncated
}

