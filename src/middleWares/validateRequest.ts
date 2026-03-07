import { NextFunction, Request, Response } from "express";
import { ZodObject, ZodRawShape, ZodError } from "zod";

export const validateRequest = (schema: ZodObject<ZodRawShape>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                params: req.params,
                query: req.query,
            });
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                return next(err); // passed to globalErrorHandler's ZodError handler
            }
            next(err);
        }
    };
};
