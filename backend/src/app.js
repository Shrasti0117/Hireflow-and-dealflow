import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import authRoutes from './routes/auth.routes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import healthRoutes from './routes/health.routes.js'
import projectRoutes from './routes/project.routes.js'
import providerRoutes from './routes/provider.routes.js'

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/providers', providerRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
