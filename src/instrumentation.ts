import { logger } from "@/lib/logger"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Process-level unhandled promise rejection handler
    process.on("unhandledRejection", (reason: unknown) => {
      logger.error("Process", "Unhandled Promise Rejection", {
        reason:
          reason instanceof Error
            ? { message: reason.message, stack: reason.stack }
            : reason,
      })
    })

    // Process-level uncaught exception handler
    process.on("uncaughtException", (error: Error) => {
      logger.error("Process", "Uncaught Exception", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })
    })

    // Graceful container / server shutdown handling
    const handleShutdown = (signal: string) => {
      logger.info("Process", `Received ${signal}. Shutting down gracefully...`)
    }

    process.on("SIGTERM", () => handleShutdown("SIGTERM"))
    process.on("SIGINT", () => handleShutdown("SIGINT"))

    logger.info("Instrumentation", "Server instrumentation initialized successfully")
  }
}
