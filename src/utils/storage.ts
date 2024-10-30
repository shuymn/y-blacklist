export type Filter = {
  id: number;
  pattern: string;
  isValid: boolean;
};

export const Keys = {
  isEnabled: "local:isEnabled",
  filters: "local:filters",
} as const;
