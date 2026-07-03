import { Request, Response, NextFunction } from "express";
import { z } from "zod";

type SchemaConstraint = {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
  headers?: z.ZodTypeAny;
};

const zodValidator =
  (schema: SchemaConstraint) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (schema.body) {
      let bodySchema = schema.body;
      if (bodySchema instanceof z.ZodObject) {
        bodySchema = bodySchema.strict();
      }
      const result = bodySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        });
      }
      req.body = result.data;
    }

    if (schema.params) {
      let paramsSchema = schema.params;
      if (paramsSchema instanceof z.ZodObject) {
        paramsSchema = paramsSchema.strict();
      }
      const result = paramsSchema.safeParse(req.params);
      if (!result.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        });
      }
      req.params = result.data as any;
    }

    if (schema.query) {
      let querySchema = schema.query;
      if (querySchema instanceof z.ZodObject) {
        querySchema = querySchema.strict();
      }
      const result = querySchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        });
      }
      req.query = result.data as any;
    }

    if (schema.headers) {
      const result = schema.headers.safeParse(req.headers);
      if (!result.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        });
      }
      req.headers = result.data as any;
    }

    next();
  };

export default zodValidator;