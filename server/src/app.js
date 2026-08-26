import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { env } from './config/env.js'
import { testRoutes } from './routes/testRoutes.js'
import { attemptRoutes } from './routes/attemptRoutes.js'
import { submissionRoutes } from './routes/submissionRoutes.js'
import { analyticsRoutes } from './routes/analyticsRoutes.js'
import teamRoutes from './routes/teamRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import authRoutes from './routes/authRoutes.js'
import lookupRoutes from './routes/lookupRoutes.js'
import schoolRoutes from './routes/schoolRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const clientDistPath = path.resolve(__dirname, '../../client/dist')

const sanitizeInputObject = (value) => {
  if (!value || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeInputObject(item))
  }

  for (const key of Object.keys(value)) {
    const nextValue = value[key]
    const isUnsafeKey = key.includes('$') || key.includes('.')

    if (isUnsafeKey) {
      delete value[key]
      continue
    }

    value[key] = sanitizeInputObject(nextValue)
  }

  return value
}

export const createApp = () => {
  const app = express()

  const allowedOrigins = String(env.corsOrigin || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.use(helmet())
  if (env.nodeEnv !== 'production') {
    app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            callback(null, true)
            return
          }

          callback(new Error('CORS blocked for this origin'))
        },
        credentials: true
      })
    )
  }
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 400
    })
  )

  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    next()
  })

  app.use(express.json({ limit: '1mb' }))
  app.use((req, res, next) => {
    sanitizeInputObject(req.body)
    sanitizeInputObject(req.params)
    next()
  })
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })
  app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/tests', testRoutes)
  app.use('/api/attempts', attemptRoutes)
  app.use('/api/submissions', submissionRoutes)
  app.use('/api/analytics', analyticsRoutes)
  app.use('/api/teams', teamRoutes)
  app.use('/api/projects', projectRoutes)
  app.use('/api/lookups', lookupRoutes)
  app.use('/api/schools', schoolRoutes)
  app.use('/api/settings', settingsRoutes)

  app.use('/api/v1/auth', authRoutes)
  app.use('/api/v1/tests', testRoutes)
  app.use('/api/v1/attempts', attemptRoutes)
  app.use('/api/v1/submissions', submissionRoutes)
  app.use('/api/v1/analytics', analyticsRoutes)
  app.use('/api/v1/teams', teamRoutes)
  app.use('/api/v1/projects', projectRoutes)
  app.use('/api/v1/lookups', lookupRoutes)
  app.use('/api/v1/schools', schoolRoutes)
  app.use('/api/v1/settings', settingsRoutes)

  if (existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath))
    app.get(/^(?!\/api(\/|$)).*/, (req, res) => {
      // Do not rewrite static asset requests to index.html.
      if (req.path.startsWith('/assets/') || path.extname(req.path)) {
        res.status(404).end()
        return
      }

      res.sendFile(path.join(clientDistPath, 'index.html'))
    })
  }

  app.use(notFound)
  app.use(errorHandler)

  return app
}
