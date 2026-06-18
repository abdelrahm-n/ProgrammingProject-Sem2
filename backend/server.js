import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes      from './routes/auth.js'
import logboekenRoutes from './routes/logboeken.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3000

const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors())
app.use(express.json())

// Frontend statisch serveren (zodat je naar http://localhost:3000 kan)
app.use(express.static(path.join(__dirname, '../frontend')))

// API-routes (afkomstig van de DEV-TESTING-2 branch)
app.use('/api/auth',      authRoutes)
app.use('/api/logboeken', logboekenRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server draait' })
})

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`)
})
