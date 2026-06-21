import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

import authRoutes              from './routes/auth.js'
import stagesRoutes            from './routes/stages.js'
import logboekenRoutes         from './routes/logboeken.js'
import evaluatiesRoutes        from './routes/evaluaties.js'
import competentiesRoutes      from './routes/competenties.js'
import adminRoutes             from './routes/admin.js'
import stageovereenkomstRoutes from './routes/stageovereenkomst.js'
import notificatiesRoutes      from './routes/notificaties.js'
import documentenRoutes        from './routes/documenten.js'
import docentRoutes            from './routes/docent.js'
import mentorRoutes            from './routes/mentor.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3000

const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(cors())
app.use(express.json())

// Frontend serveren zodat alles via http://localhost:3000 werkt.
// Geen caching tijdens ontwikkeling, zodat je altijd de nieuwste HTML/JS/CSS krijgt.
app.use(express.static(path.join(__dirname, '../frontend'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => res.setHeader('Cache-Control', 'no-store')
}))

app.use('/api/auth',              authRoutes)
app.use('/api/stages',            stagesRoutes)
app.use('/api/logboeken',         logboekenRoutes)
app.use('/api/evaluaties',        evaluatiesRoutes)
app.use('/api/competenties',      competentiesRoutes)
app.use('/api/admin',             adminRoutes)
app.use('/api/stageovereenkomst', stageovereenkomstRoutes)
app.use('/api/notificaties',      notificatiesRoutes)
app.use('/api/documenten',        documentenRoutes)
app.use('/api/docent',            docentRoutes)
app.use('/api/mentor',            mentorRoutes)

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`)
})

