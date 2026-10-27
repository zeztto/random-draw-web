/** Local development diagnostics only. No network or browser-storage writes. */
const development = import.meta.env.DEV;
export const logger = {
  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    if (development) console.error(message, error, context);
  },
  warn(message: string, context?: Record<string, unknown>): void {
    if (development) console.warn(message, context);
  },
  info(message: string, context?: Record<string, unknown>): void {
    if (development) console.info(message, context);
  },
  debug(message: string, context?: Record<string, unknown>): void {
    if (development) console.debug(message, context);
  },
};
