import https from 'https'

import { BasePriceService, IPriceData } from './BasePriceService'

const getJson = <T extends {} | any[]>(url: string) => new Promise<T>((resolve, reject) => {
  https.get(url, response => {
    let buffer = ''
    response.on('data', chunk => buffer += chunk)
    response.on('end', () => {
      try {
        resolve(JSON.parse(buffer))
      } catch (error) {
        reject(error)
      }
    })
  }).once('error', reject)
})

export class PancakeSwapService extends BasePriceService {
  readonly name = 'PancakeSwap'

  private readonly _baseUrl = 'https://api.pancakeswap.info/api'
  private _tokenIdMapPromise: Promise<{ [key: string]: string }> | null = null

  private async _getTokenId(symbol: string): Promise<string | null> {
    if (this._tokenIdMapPromise === null) {
      this._tokenIdMapPromise = getJson<{ data: { [key: string]: { symbol: string } } }>(`${ this._baseUrl }/tokens`)
        .then(({ data }) => Object.entries(data))
        .then(entries => entries.map(([ tokenCode, { symbol } ]) => [ symbol, tokenCode ]))
        .then(entries => Object.fromEntries(entries))
    }
    const map = await this._tokenIdMapPromise
    return map[symbol] ?? null
  }

  async getWebUrl(_currencySymbol: string): Promise<string | null> {
    return null
  }

  async getLatest(currencySymbol: string): Promise<IPriceData | null> {
    const token = await this._getTokenId(currencySymbol)
    if (!token) {
      return null
    }
    try {
      // Specific token requires an auth token, maybe an issue on API end???
      // const url = `https://api.pancakeswap.info/api/tokens/${ token }`
      const url = `${ this._baseUrl }/tokens`
      const {
        updated_at,
        data
      } = await getJson<{ updated_at: number, data: { [key: string]: { price: string } } }>(url)
      const { price } = data[token as string]
      return { price, timestamp: updated_at }
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async getDateRange(currencySymbol: string, start: Date, end: Date, intervalSeconds: number): Promise<IPriceData[] | null> {
    return null
  }
}
