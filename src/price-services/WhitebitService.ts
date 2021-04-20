import https from 'https'

import { BasePriceService, IPriceData } from './BasePriceService'

interface ITickerResult {
  bid: string
  ask: string
  open: string
  high: string
  low: string
  last: string
  volume: string
  deal: string
  change: string
}

interface ITickerResponse {
  success: boolean
  message: string
  result: ITickerResult
}

const getJson = <T extends {} | any[]>(url: string, headers?: { [key: string]: string }) => new Promise<T>((resolve, reject) => {
  https.get(url, { headers }, response => {
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

export class WhitebitService extends BasePriceService {
  readonly name = 'Whitebit'

  private readonly _baseUrl = 'https://whitebit.com/api'
  private readonly _baseWebUrl = 'https://whitebit.com/trade'

  async getWebUrl(currencySymbol: string): Promise<string | null> {
    const symbol = WhitebitService._symbolMap[currencySymbol] ?? currencySymbol
    return symbol ? `${ this._baseWebUrl }/${ symbol }_USDT` : null
  }

  async getLatest(currencySymbol: string): Promise<IPriceData | null> {
    try {
      const symbol = WhitebitService._symbolMap[currencySymbol] ?? currencySymbol
      const url = `${ this._baseUrl }/v1/public/ticker?market=${ symbol }_USDT`
      const { success, message, result } = await getJson<ITickerResponse>(url)
      if (!success) {
        console.error(`[Whitebit] ticker failed: ${ message }`)
        return null
      }
      const { last } = result
      return { price: last, timestamp: Date.now() }
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async getDateRange(currencySymbol: string, start: Date, end: Date, intervalSeconds: number): Promise<IPriceData[] | null> {
    return null
  }

  private static _symbolMap: Readonly<{ [key: string]: string }> = Object.freeze({
    SAFEMOON: 'SFM'
  })
}
