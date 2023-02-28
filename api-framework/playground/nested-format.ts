/*
  Want to play with various scenarios and how we could work with them
*/

import { formatOutput, IResolverField } from '../lib/field-definition'

const scenarios: {
  [x: string]: () => void
} = {}

const assert = (value: any, test: any): void => {
  if (value !== test) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Assertion failed: ${value} is not ${test}`)
  }
}

// S0 - base case, simple source and output
scenarios.S0 = () => {
  const source = {
    name: 'test',
    age: 32
  }

  const fields = [
    'name',
    'age'
  ]

  const output = formatOutput({
    source,
    fields
  })

  assert(output.name, 'test')
  assert(output.age, 32)
}

// S1 - source has nested fields we want to expose in a flat way
scenarios.S1 = () => {
  const source = {
    name: 'test',
    location: {
      city: 'Denver',
      state: 'CO'
    }
  }

  const fields: IResolverField[] = [
    'name',
    {
      field: 'city',
      source: 'location.city'
    },
    {
      field: 'state',
      source: 'location.state'
    }
  ]

  const output = formatOutput({
    source,
    fields
  })

  assert(output.name, 'test')
  assert(output.city, 'Denver')
  assert(output.state, 'CO')
}

// S2 - source has nested fields we want to expose as same structure
scenarios.S2 = () => {
  const source = {
    name: 'test',
    location: {
      city: 'Denver',
      state: 'CO'
    }
  }

  const fields: IResolverField[] = [
    'name',
    'location'
  ]

  const output = formatOutput({
    source,
    fields
  })

  assert(output.name, 'test')
  assert(output.location.city, 'Denver')
  assert(output.location.state, 'CO')
}

// S3 - source has nested fields we want to expose a subset of
scenarios.S3 = () => {
  const source = {
    name: 'test',
    location: {
      city: 'Denver',
      state: 'CO',
      country: 'USA'
    }
  }

  const fields: IResolverField[] = [
    'name',
    {
      field: 'location',
      nested: [
        'city',
        'state'
      ]
    }
  ]

  const output = formatOutput({
    source,
    fields
  })

  assert(output.name, 'test')
  assert(output.location.city, 'Denver')
  assert(output.location.state, 'CO')
  assert(output.location.country, undefined)
}

// S4 - source has flat fields we want to expose in a nested way
scenarios.S4 = () => {
  const source = {
    name: 'test',
    city: 'Denver',
    state: 'CO',
    country: 'USA'
  }

  const fields: IResolverField[] = [
    'name',
    {
      field: 'location',
      source: null,
      nested: [
        'city',
        'state'
      ]
    }
  ]

  // Hmm... ok, divergent paths
  // could say that the source has to have the field we want to expose
  // and call it that

  // Or, we could indicate that location is not a source field (source: null?)
  // so all of the nested fields are pulled from the main object

  // how would this work for deeper nested objects?

  const output = formatOutput({
    source,
    fields
  })

  assert(output.name, 'test')
  assert(output.location.city, 'Denver')
  assert(output.location.state, 'CO')
  assert(output.location.country, undefined)
}

// S5 - enforcing nested recursion is all good or not
scenarios.S5 = () => {
  const source = {
    name: 'test',
    email: 'test@test.com',
    location: {
      city: 'Dallas'
    },
    company: {
      name: 'test HQ',
      location: {
        city: 'Denver'
      }
    }
  }

  const fields: IResolverField[] = [
    'name',
    'email',
    {
      field: 'location',
      source: null,
      nested: [
        {
          field: 'city',
          source: 'location.city'
        },
        {
          field: 'company_city',
          source: 'company.location.city'
        },
        'boo'
      ]
    }
  ]

  const output = formatOutput({
    source,
    fields
  })

  assert(output.location?.city, 'Dallas')
  assert(output.location?.company_city, 'Denver')
}

// run scenarios
for (const [name, cb] of Object.entries(scenarios)) {
  console.log(`= running scenario ${name}:`)
  const start = process.hrtime.bigint()
  try {
    cb()
    console.log('    Success')
  } catch (err: any) {
    console.log('    Failure -', err?.message ?? err)
  }
  const end = process.hrtime.bigint()
  console.log(`    Time: ${(end - start) / BigInt(1000)}μs`)
}
