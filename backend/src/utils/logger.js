import winston from "winston";
import config from "../config/env.js";

const { createLogger, format, transports } = winston;

const logFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),

  format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  }),
);

const logger = createLogger({
  level: config.logLevel,

  format: format.combine(format.errors({ stack: true }), logFormat),

  //   1 - transport
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), logFormat),
    }),

    //   2nd transport
    new transports.File({
      filename: "logs/error.log",
      level: "error",
    }),

    // 3-transport
    new transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

export default logger;
