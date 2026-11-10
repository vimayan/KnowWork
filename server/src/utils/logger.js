import winston from 'winston';
import 'winston-daily-rotate-file';
import { config } from '../config/index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const fmt = printf(({ level, message, timestamp, stack, ...meta }) => {
  const m = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return `${timestamp} [${level}] ${stack || message}${m}`;
});

const transports = [
  new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), fmt),
  }),
];

if (config.isProd) {
  transports.push(
    new winston.transports.DailyRotateFile({ filename: 'logs/error-%DATE%.log',    level: 'error', maxFiles: '14d', datePattern: 'YYYY-MM-DD' }),
    new winston.transports.DailyRotateFile({ filename: 'logs/combined-%DATE%.log', maxFiles: '7d',  datePattern: 'YYYY-MM-DD' }),
  );
}

export const logger = winston.createLogger({
  level: config.isDev ? 'debug' : 'info',
  format: combine(timestamp(), errors({ stack: true }), fmt),
  transports,
});
