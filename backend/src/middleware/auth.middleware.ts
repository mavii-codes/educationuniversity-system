import { NextFunction, Request, Response } from "express";
import { AuthorizedRole } from "../models";

/**
 * Placeholder authentication / RBAC middleware foundation.
 * Ready to verify JWT or institutional SSO session tokens in production.
 */
export function optionalAuthContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const roleHeader = req.header("x-user-role") as AuthorizedRole | undefined;
  res.locals.userRole = roleHeader || "Administrator";
  next();
}

export function requireRoles(...allowedRoles: AuthorizedRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role =
      (req.header("x-user-role") as AuthorizedRole | undefined) ||
      (res.locals.userRole as AuthorizedRole | undefined) ||
      "Administrator";

    if (!allowedRoles.includes(role)) {
      res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to access this resource.",
      });
      return;
    }

    res.locals.userRole = role;
    next();
  };
}
