import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Log levels enum
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  data?: any;
}

/**
 * Logger service configuration
 */
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableTimestamp: boolean;
  maxLogHistory: number;
}

/**
 * Centralized logging service for the Angular application.
 * Provides consistent logging across all components and services.
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private config: LoggerConfig;
  private logHistory: LogEntry[] = [];

  constructor() {
    this.config = {
      level: environment.production ? LogLevel.WARN : LogLevel.DEBUG,
      enableConsole: true,
      enableTimestamp: true,
      maxLogHistory: 100
    };
  }

  /**
   * Set the log level dynamically
   */
  setLogLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Get log history for debugging
   */
  getLogHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearLogHistory(): void {
    this.logHistory = [];
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Add entry to log history
   */
  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.config.maxLogHistory) {
      this.logHistory.shift();
    }
  }

  /**
   * Format log message with optional data
   */
  private formatMessage(message: string, context?: string): string {
    const timestamp = this.config.enableTimestamp ? `[${this.formatTimestamp()}]` : '';
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp}${contextStr} ${message}`;
  }

  /**
   * Log error level messages
   * Use for errors that require immediate attention
   */
  error(message: string, data?: any, context?: string): void {
    if (this.config.level >= LogLevel.ERROR) {
      const entry: LogEntry = {
        timestamp: this.formatTimestamp(),
        level: 'ERROR',
        message,
        context,
        data
      };
      this.addToHistory(entry);

      if (this.config.enableConsole) {
        const formattedMessage = this.formatMessage(message, context);
        if (data) {
          console.error(`🔴 ${formattedMessage}`, data);
        } else {
          console.error(`🔴 ${formattedMessage}`);
        }
      }
    }
  }

  /**
   * Log warning level messages
   * Use for potentially problematic situations
   */
  warn(message: string, data?: any, context?: string): void {
    if (this.config.level >= LogLevel.WARN) {
      const entry: LogEntry = {
        timestamp: this.formatTimestamp(),
        level: 'WARN',
        message,
        context,
        data
      };
      this.addToHistory(entry);

      if (this.config.enableConsole) {
        const formattedMessage = this.formatMessage(message, context);
        if (data) {
          console.warn(`🟡 ${formattedMessage}`, data);
        } else {
          console.warn(`🟡 ${formattedMessage}`);
        }
      }
    }
  }

  /**
   * Log info level messages
   * Use for general informational messages
   */
  info(message: string, data?: any, context?: string): void {
    if (this.config.level >= LogLevel.INFO) {
      const entry: LogEntry = {
        timestamp: this.formatTimestamp(),
        level: 'INFO',
        message,
        context,
        data
      };
      this.addToHistory(entry);

      if (this.config.enableConsole) {
        const formattedMessage = this.formatMessage(message, context);
        if (data) {
          console.info(`🔵 ${formattedMessage}`, data);
        } else {
          console.info(`🔵 ${formattedMessage}`);
        }
      }
    }
  }

  /**
   * Log debug level messages
   * Use for detailed debugging information (disabled in production)
   */
  debug(message: string, data?: any, context?: string): void {
    if (this.config.level >= LogLevel.DEBUG) {
      const entry: LogEntry = {
        timestamp: this.formatTimestamp(),
        level: 'DEBUG',
        message,
        context,
        data
      };
      this.addToHistory(entry);

      if (this.config.enableConsole) {
        const formattedMessage = this.formatMessage(message, context);
        if (data) {
          console.debug(`⚪ ${formattedMessage}`, data);
        } else {
          console.debug(`⚪ ${formattedMessage}`);
        }
      }
    }
  }

  /**
   * Log HTTP request/response
   */
  http(method: string, url: string, status?: number, duration?: number, context?: string): void {
    if (this.config.level >= LogLevel.INFO) {
      const statusStr = status ? `${status}` : '';
      const durationStr = duration ? `${duration}ms` : '';
      const message = `${method} ${url} ${statusStr} ${durationStr}`.trim();
      
      const entry: LogEntry = {
        timestamp: this.formatTimestamp(),
        level: 'HTTP',
        message,
        context,
        data: { method, url, status, duration }
      };
      this.addToHistory(entry);

      if (this.config.enableConsole) {
        const formattedMessage = this.formatMessage(message, context);
        const statusColor = status && status >= 400 ? '🔴' : '🟢';
        console.log(`${statusColor} [HTTP] ${formattedMessage}`);
      }
    }
  }

  /**
   * Log user action/interaction
   */
  action(action: string, data?: any, context?: string): void {
    if (this.config.level >= LogLevel.INFO) {
      const entry: LogEntry = {
        timestamp: this.formatTimestamp(),
        level: 'ACTION',
        message: action,
        context,
        data
      };
      this.addToHistory(entry);

      if (this.config.enableConsole) {
        const formattedMessage = this.formatMessage(action, context);
        if (data) {
          console.log(`🟣 [ACTION] ${formattedMessage}`, data);
        } else {
          console.log(`🟣 [ACTION] ${formattedMessage}`);
        }
      }
    }
  }

  /**
   * Create a child logger with a preset context
   */
  createContextLogger(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }
}

/**
 * Context-aware logger for components/services
 */
export class ContextLogger {
  constructor(
    private logger: LoggerService,
    private context: string
  ) {}

  error(message: string, data?: any): void {
    this.logger.error(message, data, this.context);
  }

  warn(message: string, data?: any): void {
    this.logger.warn(message, data, this.context);
  }

  info(message: string, data?: any): void {
    this.logger.info(message, data, this.context);
  }

  debug(message: string, data?: any): void {
    this.logger.debug(message, data, this.context);
  }

  http(method: string, url: string, status?: number, duration?: number): void {
    this.logger.http(method, url, status, duration, this.context);
  }

  action(action: string, data?: any): void {
    this.logger.action(action, data, this.context);
  }
}
