import { PRIORITIES, type Task } from "@/features/tasks/types";
import { addDays, toDateKey } from "@/utils/date";

export const SEED_PREFIX = "seed-";

const WORDS = [
  "Plan", "Review", "Write", "Call", "Email", "Fix", "Draft", "Order", "Book",
  "Clean", "Update", "Research", "Schedule", "Prepare", "Send", "Read",
];
const THINGS = [
  "report", "budget", "roadmap", "invoice", "slides", "groceries", "backlog",
  "contract", "workout", "travel plan", "newsletter", "inbox", "presentation",
];

// Deterministic pseudo-random so a seed is reproducible.
function rng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// Builds `count` varied tasks for performance testing: a mix of dates (past,
// today, future, none), priorities, projects, tags, subtasks and completion.
export function generateSeedTasks(
  count: number,
  now: Date,
  projectIds: string[] = [],
  tagIds: string[] = [],
): Task[] {
  const random = rng(42);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)];
  const today = toDateKey(now);
  const tasks: Task[] = [];

  for (let i = 0; i < count; i += 1) {
    const dated = random() < 0.7;
    const completed = random() < 0.35;
    const created = new Date(now.getTime() - Math.floor(random() * 90) * 86_400_000);
    const dueDate = dated ? addDays(today, Math.floor(random() * 60) - 20) : null;
    tasks.push({
      id: `${SEED_PREFIX}${i}`,
      title: `${pick(WORDS)} ${pick(THINGS)} #${i + 1}`,
      description: random() < 0.3 ? `Notes for ${pick(THINGS)} and ${pick(THINGS)}.` : "",
      completed,
      completedAt: completed ? new Date(now.getTime() - Math.floor(random() * 14) * 86_400_000).toISOString() : null,
      priority: pick(PRIORITIES),
      dueDate,
      dueTime: dueDate && random() < 0.4 ? `${String(Math.floor(random() * 24)).padStart(2, "0")}:${random() < 0.5 ? "00" : "30"}` : null,
      projectId: projectIds.length > 0 && random() < 0.5 ? pick(projectIds) : null,
      tagIds: tagIds.length > 0 && random() < 0.4 ? [pick(tagIds)] : [],
      subtasks:
        random() < 0.2
          ? Array.from({ length: 1 + Math.floor(random() * 4) }, (_, n) => ({
              id: `${SEED_PREFIX}${i}-s${n}`,
              title: `Step ${n + 1}`,
              completed: random() < 0.4,
            }))
          : [],
      reminder: null,
      recurrence: null,
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
    });
  }
  return tasks;
}
