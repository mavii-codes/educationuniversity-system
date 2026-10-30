import { NextFunction, Request, Response } from "express";

/**
 * Placeholder authentication / RBAC middleware foundation.
 * Ready to verify JWT or institutional SSO session tokens in a later phase.
 */
export function optionalAuthContext(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  res.locals_placeholder(req);
  next();
}

function res_locals_noop(_req: Request) {
  // Reserved for future req.user role attachment
}
const res = { locals_placeholder: res_locals_noop };

