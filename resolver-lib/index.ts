import { makeContext, resolver } from './lib'

const nResolver = resolver(
  'testnew',
  (arg) => {
    console.log(arg)
    return 32
  },
  async (result) => {
    return result * 2
  }
)

const nResolver2 = resolver(
  'testnew2',
  (arg) => {
    console.log('=>', arg)
    return 10
  },
  nResolver.transform
)

const test = async (): Promise<void> => {
  const data = await nResolver2('hi', makeContext())
  console.log(data)
}
void test()
