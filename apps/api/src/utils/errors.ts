export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: any;

  constructor(message: string, statusCode: number, code: string, details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request", code = "BAD_REQUEST", details: any = null) {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED", details: any = null) {
    super(message, 401, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN", details: any = null) {
    super(message, 403, code, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found", code = "NOT_FOUND", details: any = null) {
    super(message, 404, code, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", code = "CONFLICT", details: any = null) {
    super(message, 409, code, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation Failed", details: any = null) {
    super(message, 422, "VALIDATION_FAILED", details);
  }
}
