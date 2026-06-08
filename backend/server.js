import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Server werkt' })
})

app.get('/api', (req, res) => {
  res.json({ message: 'API werkt' })
})

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`)
})