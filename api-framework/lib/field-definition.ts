import { getValue, hasProperty, IObjectWithExtraProps } from './util'

/*
  Musing: any way we can specify the fields for a resolver in the definition, and have it pick those fields from the result(s)?
  How would we handle private fields/fields that will potentially come back?
  How would we pick whether to grab those private fields or just return null (or not include the field?)
*/

/*
More thoughts
  Resolvers are effectively interfaces that have a source they use to get data
  So we can think of them as an interface to a source object, that is mapped to an output shape

  So we have a few properties of a resolver itself:
    Input shape
      arguments + context
    Output shape
      the fields we will be placing on response objects
      could be a single object with those fields or an array
      or null if we found no object
    Source shape
      the internal properties of the source the resolver is fetching data from
    Source -> Output mapping
      aliases basically, for when the fields aren't the same
      also need to take into account nesting
        ie output location = { source.city, source.state, source.country }

  We also have a few external properties related to a resolver:
    Output properties
      For instance, openapi field definition of the expected response
    Input properties
      for instance, openapi field definition of the expected inputs

  I am not sure if these externa properties actually belong on a resolver at all.
  Especially because resolvers could be used in a variety of ways, with a variety of properties needed.
  Instead, it might be better to accept that you would need to create definitions based on
  the output shape at point of usage, with either a graphql schema or openapi spec or what have you.

  The question then turns to: what field properties to we want/need to define, what are general enough to be useful?
  We should naturally define the input and output shape, though they could be different things, but maybe not.

  Source shape and output mapping are helpful, as they allow us to take some source object and automatically construct an output.
  We can also make these fields available to be used by the resolver to actually collect those fields.
  Whether it is going to a database (so column names, though that might be tricky, ie table.foo -> foo) or another resolver.
  Actually, this can be weird because we might have multiple sources in a resolver (especially composites), hmm
    thought about defining source as the name of a source
    and sourceField as the name of the field on the source
    but not sure how to handle an overlay scenario where the same field could come from multiple sources
    Maybe this is overcomplicating it - the resolver is responsible for building a source object
    from it's various external sources that feeds into the field mapper,
    so overlaying and such is not a concern.
    What is a consideration is whether we can embed generic hints that would help with fetching the fields we are defining,
    i.e: columns from tables, private fields from child resolvers, etc.
    maybe we can support a sourceName which can be used with getSources(...sourceNames) but does nothing else?
    What if we have two sources with different names for same field and we want to combine?
      the resolver code could, but then do we specify the alternates as internal fields?
    Also, how do we reason about nested data?
      Fields to select off of a thing
    Maybe am barking up the wrong tree
      datasource field selection is completely unique to different data sources (or not allowed)
      and even then can be odd, maybe they support aliasing, maybe not
      maybe there are multiple tables that are joined and need to be combined somehow.
      Ultimately, even if we could map from our field definitions to datasource field selection,
        I think I am inclined to believe that explicitely handling that in the resolver as part of it's
        interaction is clearer, safer and simpler.
        Do we really want to encourage generating sql, graphql, whatever requests to a source?
        No, that is not the problem we are solving here
    Thus, we will be agnostic about the sources the resolver uses to fetch data, and instead simply
    expect the source fields we rely on to create a complete output.
    We will, though, provide a mechanism to retrieve all of the expected source field names,
    which can be used however desired.
    We will also support internal fields, so they can be defined still, but won't do anything with them.
  Also, separating those out requires duplicating names instead of building alongside somehow
*/

/*
  TODO: optional fields? that way we can optionally request certain fields as needed?
*/

// Field Property definitions
interface IResolverFieldProps {
  field: string // name of the output field
  private?: boolean // whether this is a private field, only conditionally populated from source (otherwise undefined), undefined is equivalent to false
  source?: null | string // name of the source field, undefined is equivalent to field
  nested?: [IResolverField, ...IResolverField[]] // nested fields related to source (or parent if source is null), undefined means there are none
  internal?: boolean // whether this is an internal property, undefined is equivalent to false
  annotate?: IObjectWithExtraProps // extra fields that are ignored ny this library but allows adding extra properties to fields for other uses
}
// a string represents an IResolverFieldProps with default values and field = string
export type IResolverField = string | IResolverFieldProps

// so we can't make Typescript type guarantees about the response structure here
// we could make accept a readonly array of fields so they can be defined as a const
// but... all of our formatting and such makes that weird
// maybe there is a way with `x: typeof T[number] | typeof T[number].field` or something like that
interface IFormatOutputArgs {
  source: IObjectWithExtraProps
  fields: IResolverField[]
  includePrivate?: boolean | string[]
  nested?: string
}
export const formatOutput = ({
  source,
  fields,
  includePrivate = false,
  nested = ''
}: IFormatOutputArgs): any => {
  const prefix = nested !== '' ? nested + '.' : nested
  const output: IObjectWithExtraProps = {}

  for (const props of fields) {
    let value
    let target
    if (typeof props === 'string') {
      // simple case
      target = props
      value = source[props]
    } else {
      // skip if this is an internal field
      if (props.internal === true) {
        continue
      }

      // skip if this is a private field not requested
      if (props.private === true && includePrivate !== true) {
        if (includePrivate === false || !includePrivate.includes(prefix + props.field)) {
          continue
        }
      }

      // set target on source
      target = props.source ?? props.field

      // get value from source target, if we have one
      if (props.source !== null) {
        value = getValue(source, target)
        // if we don't have this value or it is undefined, throw error
        if (typeof value === 'undefined') {
          throw new Error(`Cannot format output, missing source field: ${prefix}${target}`)
        }
      }

      if (props.nested !== undefined) {
        value = formatOutput({
          source: props.source === null ? source : value,
          fields: props.nested,
          nested: prefix + target,
          includePrivate
        })
      }
    }
    output[target] = value
  }

  return output
}

export const getSourceFields = (fields: IResolverField[]): string[] => {
  return fields.map((field) => typeof field === 'string' ? field : field.source ?? field.field)
}
