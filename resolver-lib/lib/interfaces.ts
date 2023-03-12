export interface IMetrics {
  [identifier: string]: {
    executionTimes: number[]
  }
}

export interface IContext {
  resolverMetrics: IMetrics
  [otherFields: string]: unknown
}

export type IResolveFunction<T, U> = (args: T, context: IContext) => U
export type ITransformFunction<T, U, V> = (data: T, args: U, context: IContext) => V
export interface IResolver<T, U, V> {
  (args: T, context: IContext): Promise<Awaited<U> | V>
  identifier: string
  transform?: ITransformFunction<Awaited<U>, T, V>
}
