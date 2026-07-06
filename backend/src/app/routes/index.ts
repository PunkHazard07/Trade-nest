import { Application } from "express";
import { ZodError } from "zod";
import { AppError} from "../utils/appError.js";

export default (app: Application): void => {
  const apiVersion = "/v1";


  app.get(`${apiVersion}/healthz`, (req, res) => {
    res.status(200).json({
      success: true,
      message: `${process.env.APP_NAME || "trade-nest"} is healthy and running!`,
    });
  });

  // 404 handler
  app.use((req, res) => {
    console.warn("Route not found", { method: req.method, url: req.originalUrl });
    res.status(404).json({
      success: false,
      message: "Requested route not found",
    });
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    if (!err) return next();

    // Handle Zod validation errors explicitly
    const isZodError = err instanceof ZodError || err.constructor?.name === "ZodError";
    if (isZodError) {
      const issuesArray = Array.isArray(err.issues) ? err.issues : [];
      const errorMessages = issuesArray.map((e: any) => e.message || "Invalid value").join("; ");
      return res.status(400).json({
        success: false,
        message: errorMessages || "Bad request data",
        errors: "validationError",
        service: process.env.APP_NAME || "trade-nest",
      });
    }

    // Handle our own AppError
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }

    // Fallback for anything unhandled
    const statusCode = err.httpStatusCode || err.status || 500;

    console.error("Unhandled application error", {
      error: err.message || "Unknown error",
      stack: err.stack,
      httpStatus: statusCode,
      method: req.method,
      url: req.originalUrl || req.url,
    });

    res.status(statusCode).json({
      success: false,
      message: err.message || "Internal server error",
    });
  });
};