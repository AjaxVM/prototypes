import {
  formatOutput,
  IResolverField
} from '../lib/field-definition'

const fields: IResolverField[] = [
  'name',
  'age',
  {
    field: 'email',
    private: true
  },
  {
    field: 'location',
    nested: [
      'city',
      'state',
      {
        field: 'zipcode',
        source: 'zip',
        private: true
      },
      {
        field: 'country',
        internal: true
      }
    ]
  },
  {
    field: 'favorite_bar',
    internal: true
  }
]

console.log(formatOutput({
  source: {
    name: 'test',
    age: 22,
    email: 'test@test.com',
    location: {
      city: 'Denver',
      state: 'CO',
      zip: '12345',
      country: 'USA'
    },
    favorite_bar: 'Smelly\'s'
  },
  fields
  // fields,
  // includePrivate: [
  //   'email',
  //   'location.zipcode'
  // ]
  // includePrivate: true
}))
