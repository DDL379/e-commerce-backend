import createHttpError from "http-errors";

export default function notFoundMiddleware(req, res, next) {
  return next(createHttpError.NotFound());
}
