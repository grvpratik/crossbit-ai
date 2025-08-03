import { blob, Layout } from '@solana/buffer-layout'
import { PublicKey } from '@solana/web3.js'
import { struct } from '@solana/buffer-layout'
import { CreateEvent, TradeEvent, CompleteEvent } from './types'
export const pubKey = (property: string): Layout<PublicKey> => {
  const layout = blob(32, property)
  const pubKeyLayout = layout as Layout<unknown> as Layout<PublicKey>
  const decode = layout.decode.bind(layout)
  pubKeyLayout.decode = (buffer: Buffer, offset: number) => {
    const src = decode(buffer, offset)
    return new PublicKey(src)
  }
  return pubKeyLayout
}

export const uint64 = (property: string): Layout<bigint> => {
  const layout = blob(8, property)
  const uint64Layout = layout as Layout<unknown> as Layout<bigint>
  const decode = layout.decode.bind(layout)
  uint64Layout.decode = (buffer: Buffer, offset: number) => {
    const src = decode(buffer, offset)
    return Buffer.from(src).readBigUInt64LE()
  }
  return uint64Layout
}

export const uint128 = (property: string): Layout<bigint> => {
  const layout = blob(16, property)
  const uint128Layout = layout as Layout<unknown> as Layout<bigint>
  const decode = layout.decode.bind(layout)
  uint128Layout.decode = (buffer: Buffer, offset: number) => {
    const src = decode(buffer, offset)
    return Buffer.from(src).readBigUInt64LE()
  }
  return uint128Layout
}

export const stringLayout = (property: string): Layout<string> => {
  const layout = blob(4, property)
  const stringLayout = layout as Layout<unknown> as Layout<string>

  stringLayout.decode = (buffer: Buffer, offset: number) => {
    const length = buffer.readUInt32LE(offset)
    return buffer.slice(offset + 4, offset + 4 + length).toString('utf-8')
  }

  stringLayout.getSpan = (buffer: Buffer, offset: number) => {
    const length = buffer.readUInt32LE(offset)
    return 4 + length
  }

  return stringLayout
}

export const boolean = (property: string): Layout<boolean> => {
  const layout = blob(1, property)
  const booleanLayout = layout as Layout<unknown> as Layout<boolean>
  const decode = layout.decode.bind(layout)
  booleanLayout.decode = (buffer: Buffer, offset: number) => {
    const src = decode(buffer, offset)
    return src[0] === 1
  }
  return booleanLayout
}



////PUMP FUN////

export const CREATE_EVENT_LAYOUT = struct<CreateEvent>([
  stringLayout('name'),
  stringLayout('symbol'),
  stringLayout('uri'),
  pubKey('mint'),
  pubKey('bondingCurve'),
  pubKey('user'),
])

export const TRADE_EVENT_LAYOUT = struct<TradeEvent>([
  pubKey('mint'),
  uint64('solAmount'),
  uint64('tokenAmount'),
  boolean('isBuy'),
  pubKey('user'),
  uint64('timestamp'),
  uint64('virtualSolReserves'),
  uint64('virtualTokenReserves'),
])

export const COMPLETE_EVENT_LAYOUT = struct<CompleteEvent>([
  pubKey('user'),
  pubKey('mint'),
  pubKey('bondingCurve'),
  uint64('timestamp'),
])
