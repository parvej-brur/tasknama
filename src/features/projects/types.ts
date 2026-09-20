export const PROJECT_COLOR_IDS = [
  "teal",
  "indigo",
  "amber",
  "green",
  "rose",
  "violet",
] as const;
export type ProjectColorId = (typeof PROJECT_COLOR_IDS)[number];

export type Project = {
  id: string;
  name: string;
  color: ProjectColorId;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};
