import { NextFunction, Request, Response } from 'express'
import { IContext } from '../resolver'

// TODO: probably need to makes this a type definition or something to work in the world
export interface IRequestWithContext extends Request {
  context: IContext
}

export const contextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const context: IContext = {
    resolverMetrics: {}
  }
  const request = req as IRequestWithContext
  request.context = context
  next()
}
