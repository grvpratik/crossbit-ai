type Token = {
  mint: string
  name: string
  image_uri:string
  symbol: string
  complete: boolean
  usd_market_cap: number
  created_timestamp: number
}

type MinimalTokenInfo = {
  name: string
  symbol: string
  image:string
  mint: string
  created_timestamp: number
}

type AnalysisResult = {
  count: number
  success_count: number
  rug_count: number
  progress_count: number
  success_tokens?: MinimalTokenInfo[]
  rug_tokens?: MinimalTokenInfo[]
  progress_tokens?: MinimalTokenInfo[]
}

export function analyzeTokens(
  tokens: Token[],
  include: boolean = false
): AnalysisResult {
  const result: AnalysisResult = {
    count: tokens.length,
    success_count: 0,
    rug_count: 0,
    progress_count: 0,
  }

  if (include) {
    result.success_tokens = []
    result.rug_tokens = []
    result.progress_tokens = []
  }

  for (const token of tokens) {
    const usdMarketCap = token.usd_market_cap || 0

    // Success
    if (token.complete) {
      result.success_count++
      if (include && result.success_tokens) {
        result.success_tokens.push({
          name: token.name,
          symbol: token.symbol,
          image:token.image_uri,
          mint: token.mint,
          created_timestamp: token.created_timestamp,
        })
      }
    }

    // Rug
    if (usdMarketCap < 4000) {
      result.rug_count++
      if (include && result.rug_tokens) {
        result.rug_tokens.push({
          name: token.name,
          symbol: token.symbol,
          image: token.image_uri,
          mint: token.mint,
          created_timestamp: token.created_timestamp,
        })
      }
    }

    // Progress
    else if (usdMarketCap >= 10000 && usdMarketCap <= 50000) {
      result.progress_count++
      if (include && result.progress_tokens) {
        result.progress_tokens.push({
          name: token.name,
          symbol: token.symbol,
          image: token.image_uri,
          mint: token.mint,
          created_timestamp: token.created_timestamp,
        })
      }
    }
  }

  return result
}
