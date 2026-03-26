import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { healthRouter } from './routes/health'

dotenv.config()

const app = express()
const PORT = process.env.PORT 

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}))
app.use(express.json())

app.use('/api/health', healthRouter)

app.use((_req, res)=> {
    res.status(404).json({ message: 'Route not found' })
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})