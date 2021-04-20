export interface IPriceData {
  timestamp: number
  price: string
}

export abstract class BasePriceService {
  abstract readonly name: string

  abstract getWebUrl(currencySymbol: string): Promise<string | null>

  abstract getLatest(currencySymbol: string): Promise<IPriceData | null>

  abstract getDateRange(currencySymbol: string, start: Date, end: Date, intervalSeconds: number): Promise<IPriceData[] | null>
}
