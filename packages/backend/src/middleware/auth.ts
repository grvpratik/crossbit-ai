import { Request, Response, NextFunction } from "express";
import { auth } from "../utils/auth";
import {Account,Session,User}from "better-auth"
// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User ;
      session?: Session;
    }
  }
}

/**
 * Middleware to authenticate requests and attach user to req.user
 */
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (session) {
      req.user = session.user;
      req.session = session.session;
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    next();
  }
};

/**
 * Middleware to require authentication - returns 401 if not authenticated
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Please log in to access this resource",
      });
    }

    req.user = session.user;
    req.session = session.session;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      error: "Authentication failed",
      message: "Invalid or expired session",
    });
  }
};

/**
 * Middleware to optionally authenticate - doesn't fail if not authenticated
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (session) {
      req.user = session.user;
      req.session = session.session;
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    next();
  }
};

/**
 * Helper function to get user ID from request
 */
export const getUserId = (req: Request): string | null => {
  return req.user?.id || null;
};

/**
 * Helper function to check if user is authenticated
 */
export const isAuthenticated = (req: Request): boolean => {
  return !!req.user;
};


export const asyncHandler =
	<T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) =>
	(req: Request, res: Response, next: NextFunction): void => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
