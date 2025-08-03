
import { sha256 } from '@noble/hashes/sha256'

export const anchorLogScanner = (logs: string[], programId: string) => {
  const executionStack: string[] = []
  const programEvents: { [key: string]: string[] } = {}

  for (const log of logs) {
    if (log.includes('invoke')) {
      const program = log.split(' ')[1]
      executionStack.push(program)
      if (programEvents[program] == undefined) {
        programEvents[program] = []
      }
    } else {
      const currentProgram = executionStack[executionStack.length - 1]
      if (log.match(/^Program (.*) success/g) !== null) {
        executionStack.pop()
        continue
      }
      if (currentProgram == programId) {
        if (log.startsWith('Program data: ')) {
          const data = log.split('Program data: ')[1]
          programEvents[currentProgram].push(data)
        }
        continue
      }
    }
  }
  return programEvents[programId]
}

export const createAnchorSigHash = (sig: string) => {
  return Buffer.from(sha256(sig).slice(0, 8))
}
