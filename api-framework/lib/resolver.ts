interface IMetrics {
  [x: string]: {
    durations: number[]
  }
}

export interface IContext {
  resolverMetrics: IMetrics
  [x: string]: any
}

const recordMetric = (name: string, duration: number, context: IContext): void => {
  if (typeof context.resolverMetrics[name] === 'undefined') {
    context.resolverMetrics[name] = {
      durations: []
    }
  }
  context.resolverMetrics[name].durations.push(duration)
}

type IResolveFunc<T, U> = (args: T, context: IContext) => U
interface IResolver<T, U> {
  (args: T, context: IContext): Promise<Awaited<U>>
  name: string
}

export const resolver = <T = any, U = any>(
  name: string,
  resolve: IResolveFunc<T, U>
): IResolver<T, U> => {
  const func = async (args: T, context: IContext): Promise<Awaited<U>> => {
    const start = Date.now()
    const result = await resolve(args, context)
    recordMetric(name, Date.now() - start, context)
    return result
  }
  func.name = name
  return func
}

type ITransformFunc<T, U, V> = (data: Awaited<U>, args: T, context: IContext) => V
interface IResolverWithTransform<T, U, V> {
  (args: T, context: IContext): Promise<Awaited<V>>
  name: string
  transform: ITransformFunc<T, U, V>
}

export const transform = <T = any, U = any, V = any>(
  resolver: IResolver<T, U>,
  transform: ITransformFunc<T, U, V>
): IResolverWithTransform<T, U, V> => {
  const func = async (args: T, context: IContext): Promise<Awaited<V>> => {
    const data = await resolver(args, context)
    const start = Date.now()
    const transformed = await transform(data, args, context)
    recordMetric(`${resolver.name}.transform`, Date.now() - start, context)
    return transformed
  }
  func.name = resolver.name
  func.transform = transform
  return func
}

// TODO: mutator
/*
  Like a resolver, but takes a second parameter (object representing an entity)
  Field definition should be updated to define a readonly attribute
  A formatSource (or something) function added that pulls fields off of an input
    and maps them to a source - those nested variables will be tricky
    ignores readonly fields (so, an id should be marked readonly and passed in the args not in the object param)

  Revisit concept of transform, can we do it more cleanly somehow? Or just abandon in favor of expecting resolvers to work?
  Do we want a default transform that takes a source and returns a formatted output?
  Do we want an incoming transform on mutators that transforms to source?
  so many options

  Also pondering on whether we want to flag fields as optional. Otherwise we have some weird situations,
  because, we don't have enough info to know if this is a post/create, a full update (all fields) or a partial update.

  Maybe we have optional fields, but can do a partial to source for updates???
  So all non-optional fields have to be present (in input and output), but you can do a partial update easily enough.
  Could also allow partial output as well if we want to... hmm...?
*/

/*
  Idea: Resolver interface that accepts a param indicating which related or optional fields to fetch/return.
  Kind of like GraphQL, but rather than specific fields, probably at a field set/object level, ie:
    getCompany<something>(id, ['employees'], context)
  Need some way of nesting that probably, maybe { employees: true, products: { pricing: true } }?
*/

/*
  Idea:
    Generator resolvers (or some other batch resolver pattern?)
*/

/*
  Base resolvers vs purposeful ones:
    In general, all resolvers are basically functions with a specific interface (input and output).
    However, I have found that there are 3 specifics types of resolvers I want:
      Entity resolvers - responsible for fetching specific pieces of data from a source
      Composite resolvers - responsible for composing info from multiple entity/composite resolvers
      View resolvers - responsible for view specific logic to power an API route/endpoint
        This one feels the most like "convention", rather than adding value, and it is effectively a composite
        But the purpose is different enoungh that it seems useful to differentiate them
    Type could prepend to name when logging as well
*/
