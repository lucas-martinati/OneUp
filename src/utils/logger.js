const isDevelopment = import.meta.env.DEV;

const LogLevel = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

const styles = {
  INFO: 'color: #3b82f6; font-weight: bold',
  SUCCESS: 'color: #10b981; font-weight: bold',
  WARN: 'color: #f59e0b; font-weight: bold',
  ERROR: 'color: #ef4444; font-weight: bold',
  DEBUG: 'color: #8b5cf6; font-weight: bold'
};

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  _log(level, message, ...args) {
    if (!isDevelopment) return;

    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [${this.context}]`;

    console.log(
      `%c${prefix} ${level}:`,
      styles[level],
      message,
      ...args
    );
  }

  info(message, ...args) {
    this._log(LogLevel.INFO, message, ...args);
  }

  success(message, ...args) {
    this._log(LogLevel.SUCCESS, message, ...args);
  }

  warn(message, ...args) {
    this._log(LogLevel.WARN, message, ...args);
  }

  error(message, ...args) {
    // Always log errors, even in production
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [${this.context}]`;
    console.error(`${prefix} ERROR:`, message, ...args);
  }

  debug(message, ...args) {
    this._log(LogLevel.DEBUG, message, ...args);
  }
}

// Create default logger instances for different modules
export const createLogger = (context) => new Logger(context);

export default new Logger('OneUp');
