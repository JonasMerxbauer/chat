export const MODELS = {
  GPT_4O: { id: 'gpt-4o', name: 'GPT-4o', provider: 'OPENAI' },
  GPT_4O_MINI: { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OPENAI' },
  CLAUDE_3_5_SONNET: {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
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
  MODELS.GPT_4O_MINI,
  MODELS.CLAUDE_3_5_SONNET,
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
