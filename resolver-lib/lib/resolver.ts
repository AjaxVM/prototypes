import { IContext, IResolveFunction, IResolver, ITransformFunction } from './interfaces'

export function makeContext (props?: Record<string, unknown>): IContext {
  return {
    resolverMetrics: {},
    ...props
  }
}

export function recordMetric (identifier: string, executionTime: number, context: IContext): void {
  if (typeof context.resolverMetrics[identifier] === 'undefined') {
    context.resolverMetrics[identifier] = {
      executionTimes: []
    }
  }
  context.resolverMetrics[identifier].executionTimes.push(executionTime)
}

export function resolver<T = any, U = any, V = undefined | any> (
  name: string,
  resolve: IResolveFunction<T, U>,
  transform?: ITransformFunction<U, T, V>
): IResolver<T, U, V> {
  if (typeof transform !== 'undefined') {
    const func = async (args: T, context: IContext): Promise<V> => {
      const start = Date.now()
      const result = await resolve(args, context)
      recordMetric(name, Date.now() - start, context)
      const start2 = Date.now()
      const transformed = await transform(result, args, context)
      recordMetric(`${name}.transform`, Date.now() - start2, context)
      return transformed
    }

    func.identifier = name
    func.transform = transform
    return func
  }
  const func = async (args: T, context: IContext): Promise<Awaited<U>> => {
    const start = Date.now()
    const result = await resolve(args, context)
    recordMetric(name, Date.now() - start, context)
    return result
  }

  func.identifier = name
  return func
}
