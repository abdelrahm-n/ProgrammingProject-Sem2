import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes      from './routes/auth.js'
import stagesRoutes    from './routes/stages.js'
import logboekenRoutes from './routes/logboeken.js'
import evaluatiesRoutes from './routes/evaluaties.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

/* Routes */
app.use('/api/auth',       authRoutes)
app.use('/api/stages',     stagesRoutes)
app.use('/api/logboeken',  logboekenRoutes)
app.use('/api/evaluaties', evaluatiesRoutes)

app.listen(PORT, () => {
  console.log('Server draait op http://localhost:' + PORT)
})
