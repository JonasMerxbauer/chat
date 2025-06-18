export const MODELS = {
  GPT_4O: {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OPENAI',
  },
  CLAUDE_3_HAIKU: {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'ANTHROPIC',
  },
  GEMINI_2_0_FLASH: {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'GOOGLE',
  },
};

export const DEFAULT_MODEL = MODELS.GEMINI_2_0_FLASH;

export const FREE_MODELS = [
  MODELS.GPT_4O,
  MODELS.CLAUDE_3_HAIKU,
  MODELS.GEMINI_2_0_FLASH,
];

// Helper function to get all models as a flat array
export const getAllModels = () => {
  return Object.values(MODELS);
};

// Helper function to find model by ID
export const findModelById = (modelId: string) => {
  return getAllModels().find((model) => model.id === modelId);
};

// Message status types
export const MESSAGE_STATUSES = {
  SENDING: 'sending',
  PENDING: 'pending',
  STREAMING: 'streaming',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const;

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  STRUCTURED: 'structured',
} as const;
