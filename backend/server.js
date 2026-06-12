import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')))

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'))
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server draait op http://localhost:${PORT}`)
})
