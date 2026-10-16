import { AppError } from '../utils/AppError.js'

export function notFound(req, res, next) {
  next(new AppError(404, 'Not found'))
}
