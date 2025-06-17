// Zero instances are now managed by the auth context

// Export schema and mutators for use in the Zero auth context
export { schema } from './schema';
export { createMutators } from './mutators';
export type { Schema } from './schema';
export type { Mutators } from './mutators';
