export const MODELS = {
  GPT_5_2: {
    id: 'gpt-5.2',
    name: 'GPT 5.2',
    provider: 'OPENAI',
  },
  CLAUDE_SONNET_4_5: {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'ANTHROPIC',
  },
  GEMINI_2_5_FLASH: {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'GOOGLE',
  },
};

export const DEFAULT_MODEL = MODELS.GEMINI_2_5_FLASH;

export const FREE_MODELS = [
  MODELS.GPT_5_2,
  MODELS.CLAUDE_SONNET_4_5,
  MODELS.GEMINI_2_5_FLASH,
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
  REASONING: 'reasoning',
  STREAMING: 'streaming',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const;

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  STRUCTURED: 'structured',
} as const;
