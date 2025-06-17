import { createUseZero } from '@rocicorp/zero/react';
import type { Schema } from '~/db/schema';
import type { Mutators } from '~/db/mutators';
export const useZero = createUseZero<Schema, Mutators>();
