import type { Task } from "@/features/tasks/types";

import { PROJECT_COLOR_IDS, type Project, type ProjectColorId } from "./types";

// The least-used colour, so new projects don't pile onto one swatch.
export function suggestProjectColor(projects: Iterable<Project>): ProjectColorId {
  const usage = new Map<ProjectColorId, number>(PROJECT_COLOR_IDS.map((id) => [id, 0]));
  for (const project of projects) {
    usage.set(project.color, (usage.get(project.color) ?? 0) + 1);
  }
  let best: ProjectColorId = PROJECT_COLOR_IDS[0];
  let bestCount = Infinity;
  for (const id of PROJECT_COLOR_IDS) {
    const count = usage.get(id) ?? 0;
    if (count < bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}

export function archivedProjectIds(projects: Iterable<Project>): Set<string> {
  const ids = new Set<string>();
  for (const project of projects) if (project.archived) ids.add(project.id);
  return ids;
}

export function projectProgress(
  tasks: readonly Task[],
  projectId: string,
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const task of tasks) {
    if (task.projectId !== projectId) continue;
    total += 1;
    if (task.completed) done += 1;
  }
  return { done, total };
}
