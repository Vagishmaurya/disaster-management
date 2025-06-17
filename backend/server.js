const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const compression = require("compression")
const { createServer } = require("http")
const { Server } = require("socket.io")
require("dotenv").config()

const logger = require("./utils/logger")
const rateLimiter = require("./middleware/rateLimiter")
const errorHandler = require("./middleware/errorHandler")

// Import routes
const disasterRoutes = require("./routes/disasters")
const reportRoutes = require("./routes/reports")
const geocodeRoutes = require("./routes/geocode")
const geminiRoutes = require("./routes/gemini")

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ["http://localhost:3000", "https://*.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
})

const PORT = process.env.PORT || 5000

// Trust proxy for deployment
app.set("trust proxy", 1)

// Middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https:", "wss:"],
      },
    },
  }),
)
app.use(compression())
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true)

      const allowedOrigins = ["http://localhost:3000", "https://localhost:3000", process.env.FRONTEND_URL]

      // Allow any Vercel deployment
      if (origin.includes("vercel.app")) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      callback(new Error("Not allowed by CORS"))
    },
    credentials: true,
  }),
)
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting
app.use("/api/", rateLimiter.general)

// Make io available to routes
app.use((req, res, next) => {
  req.io = io
  next()
})

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Disaster Response Backend API",
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  })
})

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  })
})

// API Routes
app.use("/api/disasters", disasterRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/geocode", geocodeRoutes)
app.use("/api/gemini", geminiRoutes)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  })
})

// Error handling middleware
app.use(errorHandler)

// Socket.IO connection handling
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`)

  socket.on("join_disaster", (disasterId) => {
    socket.join(`disaster_${disasterId}`)
    logger.info(`Client ${socket.id} joined disaster room: ${disasterId}`)
  })

  socket.on("leave_disaster", (disasterId) => {
    socket.leave(`disaster_${disasterId}`)
    logger.info(`Client ${socket.id} left disaster room: ${disasterId}`)
  })

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })
})

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully")
  server.close(() => {
    logger.info("Process terminated")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully")
  server.close(() => {
    logger.info("Process terminated")
    process.exit(0)
  })
})

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error)
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})

server.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 Disaster Response Backend Server running on port ${PORT}`)
  logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`)
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`)
  logger.info(`🌐 API Base: http://localhost:${PORT}/api`)
})

module.exports = { app, server, io }
