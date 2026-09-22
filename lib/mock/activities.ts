import type { Activity, ActivityType, ActivityWithAuthor } from "@/types/domain";
import { CURRENT_USER_ID, WORKSPACE } from "./seed";
import { delay, nextId, store } from "./store";
import { memberById } from "./workspace";

export interface ActivityInput {
  leadId: string;
  type: ActivityType;
  description: string;
}

export async function listActivities(leadId: string): Promise<ActivityWithAuthor[]> {
  await delay();
  return store.activities
    .filter((a) => a.leadId === leadId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => ({ ...a, author: memberById(a.authorId) }));
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  await delay();

  const activity: Activity = {
    id: nextId("act"),
    workspaceId: WORKSPACE.id,
    // Na M8 o autor passa a vir da sessão, nunca do cliente.
    authorId: CURRENT_USER_ID,
    createdAt: new Date().toISOString(),
    ...input,
  };

  store.activities.unshift(activity);
  return activity;
}

export async function deleteActivity(id: string): Promise<void> {
  await delay();

  const index = store.activities.findIndex((a) => a.id === id);
  if (index === -1) throw new Error("Atividade não encontrada");
  store.activities.splice(index, 1);
}
