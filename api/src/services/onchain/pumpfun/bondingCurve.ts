import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  EXPECTED_DISCRIMINATOR,
  PUMP_PROGRAM_ID,
  TOKEN_DECIMALS,
  TOKEN_PROGRAM_ID,
} from '../constant'
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'




export function readInt64LE(buffer: Buffer, offset = 0): bigint {
  const lo = buffer.readUInt32LE(offset)
  const hi = buffer.readUInt32LE(offset + 4)
  return BigInt(lo) + (BigInt(hi) << 32n)
}

export function leBytesToBigInt(bytes: Uint8Array): bigint {
  let result = 0n
  for (let i = bytes.length - 1; i >= 0; i--) {
    result = (result << 8n) + BigInt(bytes[i])
  }
  return result
}

export function bigIntToLeBytes(value: bigint, byteLength: number): Uint8Array {
  const bytes = new Uint8Array(byteLength)
  for (let i = 0; i < byteLength; i++) {
    bytes[i] = Number(value & 0xffn)
    value >>= 8n
  }
  return bytes
}

// === Address Derivation ===

export function getBondingCurveAddress(mint: PublicKey): PublicKey {
  const [addr] = PublicKey.findProgramAddressSync(
    [Buffer.from('bonding-curve'), mint.toBuffer()],
    PUMP_PROGRAM_ID
  )
  return addr
}

export function getAssociatedBondingCurveAccount(
  bondingCurve: PublicKey,
  mint: PublicKey
): PublicKey {
  const [addr] = PublicKey.findProgramAddressSync(
    [bondingCurve.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return addr
}

// === Curve State ===

export interface BondingCurveState {
  virtualTokenReserves: bigint
  virtualSolReserves: bigint
  realTokenReserves: bigint
  realSolReserves: bigint
  tokenTotalSupply: bigint
  complete: boolean
}

export async function getBondingCurveState(
  connection: Connection,
  curveAddress: PublicKey
): Promise<BondingCurveState> {
  const accountInfo = await connection.getAccountInfo(curveAddress)
  if (!accountInfo || !accountInfo.data) throw new Error('No curve state found')

  const data = accountInfo.data
  if (!EXPECTED_DISCRIMINATOR.equals(data.slice(0, 8))) {
    throw new Error('Invalid bonding curve discriminator')
  }

  let offset = 8
  const virtualTokenReserves = readInt64LE(data, offset)
  offset += 8
  const virtualSolReserves = readInt64LE(data, offset)
  offset += 8
  const realTokenReserves = readInt64LE(data, offset)
  offset += 8
  const realSolReserves = readInt64LE(data, offset)
  offset += 8
  const tokenTotalSupply = readInt64LE(data, offset)
  offset += 8
  const complete = data[offset] !== 0

  return {
    virtualTokenReserves,
    virtualSolReserves,
    realTokenReserves,
    realSolReserves,
    tokenTotalSupply,
    complete,
  }
}

export function calculateTokenPrice(state: {
  virtualTokenReserves: bigint
  virtualSolReserves: bigint
}): number {
  const sol = Number(state.virtualSolReserves) / LAMPORTS_PER_SOL
  const tokens = Number(state.virtualTokenReserves) / 10 ** TOKEN_DECIMALS
  return sol / tokens
}

export function calculateBondingCurveProgress(state: BondingCurveState): {
  bondingCurveProgress: string
  realTokenReserves: string
  tokenTotalSupply: string
  initialRealTokenReserves: string
  percentComplete: number
} {
  const { realTokenReserves, tokenTotalSupply } = state

  // Reserved tokens (206,900,000 with decimals)
  const reservedTokens = BigInt(206_900_000) * BigInt(10 ** TOKEN_DECIMALS)

  // Initial real token reserves (total supply minus reserved tokens)
  const initialRealTokenReserves = tokenTotalSupply - reservedTokens

  // Calculate progress as percentage
  const progressNumerator =
    BigInt(100) - (realTokenReserves * BigInt(100)) / initialRealTokenReserves

  const percentComplete = Number(progressNumerator)

  return {
    bondingCurveProgress: progressNumerator.toString(),
    realTokenReserves: realTokenReserves.toString(),
    tokenTotalSupply: tokenTotalSupply.toString(),
    initialRealTokenReserves: initialRealTokenReserves.toString(),
    percentComplete,
  }
}

export async function getBondingCurveInfo(
  connection: Connection,
  mint: PublicKey
) {
  const bondingCurveAddress = getBondingCurveAddress(mint)
  const associatedTokenAccount = getAssociatedBondingCurveAccount(
    bondingCurveAddress,
    mint
  )

  const state = await getBondingCurveState(connection, bondingCurveAddress)
  const price = calculateTokenPrice(state)
  const progress = calculateBondingCurveProgress(state)

  return {
    mintAddress: mint.toString(),
    bondingCurveAddress: bondingCurveAddress.toString(),
    associatedTokenAccount: associatedTokenAccount.toString(),
    tokenPrice: price,
    curveState: {
      ...Object.fromEntries(
        Object.entries(state).map(([k, v]) => [
          k,
          typeof v === 'bigint' ? v.toString() : v,
        ])
      ),
    },
    progress,
  }
}
