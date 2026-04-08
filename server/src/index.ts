import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { healthRouter } from './routes/health.js'
import { goalsRouter } from './routes/goals.js'
import { achievementsRouter } from './routes/achievements.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000 

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}))
app.use(express.json())

app.use('/api/health', healthRouter)

app.use('/api/goals', goalsRouter)
app.use('/api/achievements', achievementsRouter)

// Serve static frontend files in production
const frontendPath = path.join(__dirname, '../../client/dist')
app.use(express.static(frontendPath))

// SPA fallback - serve index.html for all non-API routes (Express 5 compatible)
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({ message: 'Route not found' })
    }
  })
})

app.use((_req, res)=> {
    res.status(404).json({ message: 'Route not found' })
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})