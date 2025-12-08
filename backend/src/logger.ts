import { Request, Response, NextFunction } from 'express';

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Log colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  green: '\x1b[32m'
};

interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableColors: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: this.getLogLevelFromEnv(),
      enableTimestamp: true,
      enableColors: process.env.NODE_ENV !== 'production',
      ...config
    };
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      default: return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, message: string, meta?: Record<string, any>): string {
    const timestamp = this.config.enableTimestamp ? `[${this.formatTimestamp()}]` : '';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
  }

  private colorize(text: string, color: string): string {
    if (!this.config.enableColors) return text;
    return `${color}${text}${colors.reset}`;
  }

  error(message: string, meta?: Record<string, any>): void {
    if (this.config.level >= LogLevel.ERROR) {
      const formatted = this.formatMessage('ERROR', message, meta);
      console.error(this.colorize(formatted, colors.red));
    }
  }

  warn(message: string, meta?: Record<string, any>): void {
    if (this.config.level >= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', message, meta);
      console.warn(this.colorize(formatted, colors.yellow));
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    if (this.config.level >= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', message, meta);
      console.info(this.colorize(formatted, colors.blue));
    }
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.config.level >= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message, meta);
      console.debug(this.colorize(formatted, colors.gray));
    }
  }

  // HTTP request logging
  http(req: Request, res: Response, responseTime: number): void {
    if (this.config.level >= LogLevel.INFO) {
      const statusColor = res.statusCode >= 400 ? colors.red : colors.green;
      const method = this.colorize(req.method, colors.cyan);
      const url = req.originalUrl || req.url;
      const status = this.colorize(res.statusCode.toString(), statusColor);
      const time = this.colorize(`${responseTime}ms`, colors.gray);
      
      const message = `${method} ${url} ${status} - ${time}`;
      const timestamp = this.config.enableTimestamp ? `[${this.formatTimestamp()}]` : '';
      console.log(`${timestamp} [HTTP] ${message}`);
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Express middleware for request logging
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request received
  logger.debug(`Incoming request: ${req.method} ${req.originalUrl}`, {
    headers: {
      'content-type': req.get('content-type'),
      'user-agent': req.get('user-agent')
    },
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body: req.body && Object.keys(req.body).length > 0 ? '[REDACTED]' : undefined
  });

  // Capture response
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logger.http(req, res, responseTime);
  });

  next();
};

// Error logging middleware
export const errorLogger = (err: Error, req: Request, _res: Response, next: NextFunction): void => {
  logger.error(`Error processing request: ${req.method} ${req.originalUrl}`, {
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });
  next(err);
};

export default logger;
