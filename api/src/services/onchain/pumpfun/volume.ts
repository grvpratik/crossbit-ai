import { LAMPORTS_PER_SOL } from '@solana/web3.js'



interface Trade {
  signature: string
  mint: string
  sol_amount: number // in lamports
  token_amount: number
  is_buy: boolean
  user: string
  timestamp: number // in seconds
  slot: number
}

interface VolumePeriod {
  startTime: string
  endTime: string
  //   startSlot: number
  //   endSlot: number
  volume: number
  buyVolume: number
  sellVolume: number
  userCount: number
}

interface VolumeResult {
  volume: number
  trend?: string
  volatility: number
  periods: VolumePeriod[]
}

function calculateVolume(
  trades: Trade[],
  minutes: number,
  currentTimestamp: number = Math.floor(Date.now() / 1000)
  // currentSlot?: number
): VolumeResult {
  const periodSeconds = minutes * 60

  if (trades.length === 0) {
    return {
      volume: 0,
      //   trend: 'insufficient data (no trades during this period)',
      volatility: 0,
      periods: [],
    }
  }

  const oldestRelevantTime = currentTimestamp - periodSeconds * 4
  const relevantTrades = trades.filter(
    (trade) =>
      trade.timestamp >= oldestRelevantTime &&
      trade.timestamp <= currentTimestamp
  )

  if (relevantTrades.length === 0) {
    return {
      volume: 0,
      //   trend: 'no trades in analysis period',
      volatility: 0,
      periods: [],
    }
  }

  // Slot info for slot-based range
  //   const slotMin = Math.min(...relevantTrades.map((t) => t.slot))
  //   const slotMax = Math.max(...relevantTrades.map((t) => t.slot))
  //   const slotRange = slotMax - slotMin
  //   const slotsPerPeriod = Math.floor(slotRange / 4)

  const periods: {
    startTime: number
    endTime: number
    // startSlot: number
    // endSlot: number
    volume: number
    buyVolume: number
    sellVolume: number
    userSet: Set<string>
  }[] = []

  for (let i = 0; i < 4; i++) {
    const periodEnd = currentTimestamp - i * periodSeconds
    const periodStart = periodEnd - periodSeconds

    // const slotEnd = slotMax - i * slotsPerPeriod
    // const slotStart = slotEnd - slotsPerPeriod

    const periodTrades = relevantTrades.filter(
      (t) => t.timestamp > periodStart && t.timestamp <= periodEnd
      //&&
      // t.slot >= slotStart &&
      // t.slot <= slotEnd
    )

    let buyVolume = 0
    let sellVolume = 0
    const userSet = new Set<string>()

    for (const trade of periodTrades) {
      const volume = trade.sol_amount / LAMPORTS_PER_SOL
      if (trade.is_buy) buyVolume += volume
      else sellVolume += volume

      userSet.add(trade.user)
    }

    const totalVolume = buyVolume + sellVolume

    periods.push({
      startTime: periodStart,
      endTime: periodEnd,
      //   startSlot: slotStart,
      //   endSlot:slotEnd,
      volume: totalVolume,
      buyVolume,
      sellVolume,
      userSet,
    })
  }

  const currentVolume = periods[0].volume

  //   // Trend detection
  //   let trend = 'stable'
  //   const recent = periods.slice(0, 3)
  //   if (recent.length === 3) {
  //     const [p1, p2, p3] = recent.map((p) => p.volume)
  //     const increases = Number(p1 > p2) + Number(p2 > p3)
  //     const decreases = Number(p1 < p2) + Number(p2 < p3)

  //     if (increases > decreases) trend = 'increasing'
  //     if (decreases > increases) trend = 'decreasing'
  //     if (increases === 2) trend = 'strongly increasing'
  //     if (decreases === 2) trend = 'strongly decreasing'
  //   }

  // Volatility calculation — std dev of 4 period volumes
  const avgVolume = periods.reduce((s, p) => s + p.volume, 0) / periods.length
  const variance =
    periods.reduce((sum, p) => sum + Math.pow(p.volume - avgVolume, 2), 0) /
    periods.length
  const volatility = Math.sqrt(variance)

  return {
    volume: currentVolume,

    volatility,
    periods: periods.map((p) => ({
      startTime: new Date(p.startTime * 1000).toISOString(),
      endTime: new Date(p.endTime * 1000).toISOString(),
      //   startSlot: p.startSlot,
      //   endSlot: p.endSlot,
      volume: p.volume,
      buyVolume: p.buyVolume,
      sellVolume: p.sellVolume,
      userCount: p.userSet.size,
    })),
  }
}

/**
 * Main function to analyze trades and return volume metrics
 * @param {Array} newTrades - Array of new trades to analyze
 * @param {number} timestamp - Optional timestamp to use for calculations
 * @returns {Object} Volume analysis for different time periods
 */
export function analyzePumpfunTradeVolume(
  newTrades = [],
  timestamp = Math.floor(Date.now() / 1000)
) {
  // Calculate volumes for different time periods
  const fifteenMinVol = calculateVolume(newTrades, 15, timestamp)
  const thirtyMinVol = calculateVolume(newTrades, 30, timestamp)
  const sixtyMinVol = calculateVolume(newTrades, 60, timestamp)
  return { fifteenMinVol, thirtyMinVol, sixtyMinVol }
}
// const res = await fetchPumpfunTradesApi(
//   '8R5ubFM41du7e7cyRriLd7ihpgCctmWyjgvtiYQupump'
// )
// const volumeAnalysis = analyzeTradeVolume(res)
// console.log(res.length)
// console.log(JSON.stringify(volumeAnalysis, null, 2))
