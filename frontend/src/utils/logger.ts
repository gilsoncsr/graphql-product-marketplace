// Sistema de logs para capturar erros no terminal
export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  error?: Error;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  log(level: LogLevel, message: string, context?: string, error?: Error, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      data
    };

    this.logs.push(entry);
    
    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log no console do terminal
    const timestamp = entry.timestamp.toISOString();
    const contextStr = context ? `[${context}]` : '';
    const errorStr = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
    const dataStr = data ? `\nData: ${JSON.stringify(data, null, 2)}` : '';

    console.log(`[${timestamp}] ${level.toUpperCase()} ${contextStr} ${message}${errorStr}${dataStr}`);

    // Log específico para erros
    if (level === LogLevel.ERROR) {
      console.error(`[${timestamp}] ERROR ${contextStr} ${message}${errorStr}${dataStr}`);
    }
  }

  error(message: string, context?: string, error?: Error, data?: any) {
    this.log(LogLevel.ERROR, message, context, error, data);
  }

  warn(message: string, context?: string, data?: any) {
    this.log(LogLevel.WARN, message, context, undefined, data);
  }

  info(message: string, context?: string, data?: any) {
    this.log(LogLevel.INFO, message, context, undefined, data);
  }

  debug(message: string, context?: string, data?: any) {
    this.log(LogLevel.DEBUG, message, context, undefined, data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  getErrorLogs(): LogEntry[] {
    return this.logs.filter(log => log.level === LogLevel.ERROR);
  }
}

export const logger = new Logger();

// Hook para usar o logger em componentes React
export const useLogger = (context?: string) => {
  return {
    error: (message: string, error?: Error, data?: any) => logger.error(message, context, error, data),
    warn: (message: string, data?: any) => logger.warn(message, context, data),
    info: (message: string, data?: any) => logger.info(message, context, data),
    debug: (message: string, data?: any) => logger.debug(message, context, data),
  };
};

// Função para capturar erros globais
export const setupErrorHandling = () => {
  // Capturar erros não tratados
  window.addEventListener('error', (event) => {
    logger.error('Unhandled error', 'Global', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      message: event.message
    });
  });

  // Capturar promises rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', 'Global', event.reason, {
      reason: event.reason
    });
  });

  // Capturar erros do React
  const originalConsoleError = console.error;
  console.error = (...args) => {
    logger.error('Console error', 'React', undefined, { args });
    originalConsoleError.apply(console, args);
  };
};
