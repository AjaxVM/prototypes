import express, {
  Express
} from 'express'

import { contextMiddleware } from './lib/plugins/express'

const app: Express = express()

app.use(contextMiddleware)

// TODO: how to use IRequestWithContext?
app.get('/test', (req: any, res) => {
  console.log(req.context)
  res.json({ message: 'test' })
})

;(async () => {
  app.listen(3000)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
