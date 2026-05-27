const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

const LogLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
}

type LogLevel = keyof typeof LogLevels

const currentLogLevel = LogLevels[LOG_LEVEL as LogLevel] || LogLevels.info

function shouldLog(level: LogLevel): boolean {
  return LogLevels[level] <= currentLogLevel
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function formatMessage(level: string, context: string, message: string, data?: any): string {
  const timestamp = formatTimestamp()
  const baseMsg = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`
  
  if (data) {
    return `${baseMsg} ${JSON.stringify(data, null, 2)}`
  }
  return baseMsg
}

export const logger = {
  error(context: string, message: string, error?: any) {
    if (shouldLog('error')) {
      console.error(formatMessage('error', context, message, error))
    }
  },

  warn(context: string, message: string, data?: any) {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', context, message, data))
    }
  },

  info(context: string, message: string, data?: any) {
    if (shouldLog('info')) {
      console.info(formatMessage('info', context, message, data))
    }
  },

  debug(context: string, message: string, data?: any) {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', context, message, data))
    }
  },

  trace(context: string, message: string, data?: any) {
    if (shouldLog('trace')) {
      console.log(formatMessage('trace', context, message, data))
    }
  },

  // Specialized logging methods
  apiRequest(method: string, url: string, status?: number, duration?: number) {
    const msg = `${method} ${url} ${status ? `[${status}]` : ''} ${duration ? `${duration}ms` : ''}`
    this.debug('API', msg)
  },

  dbQuery(query: string, duration?: number) {
    const msg = `DB Query ${duration ? `${duration}ms` : ''}`
    this.debug('DATABASE', msg, { query: query.substring(0, 100) })
  },

  jobProcessing(jobId: string, status: string, data?: any) {
    this.info('WORKER', `Job ${jobId} - ${status}`, data)
  },

  aiRequest(model: string, tokens: number, duration?: number) {
    const msg = `${model} - ${tokens} tokens ${duration ? `${duration}ms` : ''}`
    this.debug('AI', msg)
  },
}

export default logger
