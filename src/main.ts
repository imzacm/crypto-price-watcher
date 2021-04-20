import { join } from 'path'

import express from 'express'

import './env'
import {
  BasePriceService,
  CoinMarketCapService,
  IPriceData,
  PancakeSwapService,
  WhitebitService
} from './price-services'

const port = process.env.PORT ? Number(process.env.PORT) : 3001

const app = express()

app.locals = {
  priceServices: {
    pancake: new PancakeSwapService(),
    coinMarketCap: new CoinMarketCapService(),
    whitebit: new WhitebitService()
  }
}

app
  .get('/', express.static(join(__dirname, '../views')))
  .get('/api/price/:symbol', (request, response) => {
    const { symbol } = request.params as { symbol: string }
    const priceServices: { [key: string]: BasePriceService } = app.locals.priceServices
    const promises: Promise<[ string, { priceData: IPriceData | null, webUrl: string | null } ]>[] = []
    for (const service of Object.values(priceServices)) {
      promises.push(service.getLatest(symbol).then(async data => {
        const webUrl = await service.getWebUrl(symbol)
        return [ service.name, { priceData: data, webUrl } ]
      }))
    }
    Promise.all(promises)
      .then(entries => Object.fromEntries(entries))
      .then(data => response.status(200).json({ data }))
      .catch(error => response.status(500).json({ error: error.message }))
  })
  .get('/api/price/:symbol/:service', (request, response) => {
    const { symbol, service } = request.params as { symbol: string, service: string }
    const priceService: BasePriceService | undefined = app.locals.priceServices[service]
    if (!priceService) {
      response.status(404).json({ error: `Invalid price service: ${ service }` })
      return
    }
    priceService.getLatest(symbol)
      .then(async data => {
        const webUrl = await priceService.getWebUrl(symbol)
        response.status(200).json({ data: { priceData: data, webUrl } })
      })
      .catch(error => response.status(500).json({ error: error.message }))
  })
  .listen(port, () => console.log(`Listening on port ${ port }`))
