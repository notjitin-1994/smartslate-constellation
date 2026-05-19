import { randomUUID } from 'crypto';

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  ts: string;
  level: LogLevel;
  correlationId: string;
  msg: string;
  [key: string]: unknown;
}

export interface Logger {
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
  correlationId: string;
}

function emit(entry: LogEntry): void {
  // JSON lines to stdout — compatible with Vercel log drains and any structured log sink
  console.log(JSON.stringify(entry));
}

export function createLogger(correlationId?: string): Logger {
  const id = correlationId ?? randomUUID();

  const log = (level: LogLevel, msg: string, meta?: Record<string, unknown>) =>
    emit({ ts: new Date().toISOString(), level, correlationId: id, msg, ...meta });

  return {
    correlationId: id,
    info: (msg, meta) => log('INFO', msg, meta),
    warn: (msg, meta) => log('WARN', msg, meta),
    error: (msg, meta) => log('ERROR', msg, meta),
  };
}
