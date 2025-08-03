import winston from 'winston'
import path from 'path'

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'http'
}

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
}

winston.addColors(colors)

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const meta = info.meta || (info[Symbol.for('splat')] as unknown[])?.[0] || ''
    const metaString =
      meta && typeof meta === 'object' ? JSON.stringify(meta, null, 2) : meta
    return `${info.timestamp} ${info.level}: ${info.message} ${
      metaString ? `\n${metaString}` : ''
    }`
  })
)

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

const logDir = process.env.LOG_DIR || 'logs'

const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),

  // // Daily rotate file for all logs
  // new DailyRotateFile({
  // 	filename: path.join(logDir, "application-%DATE%.log"),
  // 	datePattern: "YYYY-MM-DD",
  // 	zippedArchive: true,
  // 	maxSize: "20m",
  // 	maxFiles: "14d",
  // 	format: fileFormat,
  // }),

  // // Daily rotate file for error logs only
  // new DailyRotateFile({
  // 	filename: path.join(logDir, "error-%DATE%.log"),
  // 	datePattern: "YYYY-MM-DD",
  // 	zippedArchive: true,
  // 	maxSize: "20m",
  // 	maxFiles: "30d",
  // 	level: "error",
  // 	format: fileFormat,
  // }),
]

const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  format: winston.format.cli(),
  exitOnError: false,
})

const stream = {
  write: (message: string) => {
    logger.http(message.trim())
  },
}

const logWithMeta = (level: string, message: string, meta?: any) => {
  if (meta) {
    logger.log({
      level,
      message,
      meta,
    })
  } else {
    logger.log({
      level,
      message,
    })
  }
}

export default {
  error: (message: string, meta?: any) => logWithMeta('error', message, meta),
  warn: (message: string, meta?: any) => logWithMeta('warn', message, meta),
  info: (message: string, meta?: any) => logWithMeta('info', message, meta),
  http: (message: string, meta?: any) => logWithMeta('http', message, meta),
  debug: (message: string, meta?: any) => logWithMeta('debug', message, meta),
  stream,
}
