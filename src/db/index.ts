import { Zero } from '@rocicorp/zero'
import { schema } from './schema'
import { createMutators } from './mutators'

const z = new Zero({
  userID: 'anon',
  server: 'http://localhost:4848',
  schema,
  mutators: createMutators(),
})

export default z
