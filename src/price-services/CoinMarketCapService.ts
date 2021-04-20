import https from 'https'

import { BasePriceService, IPriceData } from './BasePriceService'

interface IApiStatus {
  timestamp: string
  error_code: number
  error_message: string | null
  elapsed: number
  credit_count: number
  notice: string | null
}

interface IQuote {
  USD: {
    price: number
    volume_24h: number
    percent_change_1h: number
    percent_change_24h: number
    percent_change_7d: number
    percent_change_30d: number
    percent_change_60d: number
    percent_change_90d: number
    market_cap: number
    last_updated: string
  }
}

interface IPlatform {
  id: number
  name: string
  symbol: string
  slug: string
  token_address: string
}

interface IQuoteData {
  id: number
  name: string
  symbol: string
  slug: string
  num_market_pairs: number
  date_added: string
  tags: string[]
  max_supply: number | null
  circulating_supply: number
  total_supply: number
  platform: IPlatform | null
  is_active: number
  cmc_rank: number
  is_fiat: number
  last_updated: string
  quote: IQuote
}

interface IQuoteResponse {
  status: IApiStatus
  data: { [key: string]: IQuoteData }
}

interface IUrls {
  website: string[]
  twitter: string[]
  message_board: string[]
  chat: string[]
  explorer: string[]
  reddit: string[]
  technical_doc: string[]
  source_code: string[]
  announcement: string[]
}

interface IMetadata {
  id: number
  name: string
  symbol: string
  category: string
  description: string
  slug: string
  logo: string
  subreddit: string
  notice: string
  tags: string[]
  'tag-names': string[]
  'tag-groups': string[]
  urls: IUrls
  platform: IPlatform | null
  date_added: string
  twitter_username: string
  is_hidden: number
}

interface IMetadataResponse {
  status: IApiStatus
  data: { [key: string]: IMetadata }
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

export class CoinMarketCapService extends BasePriceService {
  readonly name = 'CoinMarketCap'

  private readonly _baseUrl = 'https://pro-api.coinmarketcap.com/v1'
  private readonly _baseWebUrl = 'https://coinmarketcap.com/currencies/'

  async getWebUrl(currencySymbol: string): Promise<string | null> {
    try {
      const { data } = await getJson<IMetadataResponse>(`${ this._baseUrl }/cryptocurrency/info?symbol=${ currencySymbol }`, {
        'X-CMC_PRO_API_KEY': process.env.COIN_MARKET_CAP_API_KEY || ''
      })
      const currencyData = data[currencySymbol]
      if (!currencyData) {
        return null
      }
      return `${ this._baseWebUrl }/${ currencyData.slug }`
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async getLatest(currencySymbol: string): Promise<IPriceData | null> {
    try {
      const { data } = await getJson<IQuoteResponse>(`${ this._baseUrl }/cryptocurrency/quotes/latest?symbol=${ currencySymbol }`, {
        'X-CMC_PRO_API_KEY': '0f5d074c-c118-4b36-8706-4f6d1ddf9920'
      })
      const quoteData = data[currencySymbol]?.quote.USD
      if (!quoteData) {
        return null
      }
      const { price, last_updated } = quoteData
      const timestamp = new Date(last_updated).valueOf()
      return { price: price.toString(10), timestamp }
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async getDateRange(currencySymbol: string, start: Date, end: Date, intervalSeconds: number): Promise<IPriceData[] | null> {
    return null
  }
}
