import type { Member, Workspace } from "@/types/domain";
import { CURRENT_USER_ID, MEMBERS, WORKSPACE, WORKSPACES } from "./seed";
import { delay } from "./store";

export async function getWorkspace(): Promise<Workspace> {
  await delay(20);
  return WORKSPACE;
}

export async function listWorkspaces(): Promise<Workspace[]> {
  await delay(20);
  return WORKSPACES;
}

export async function listMembers(): Promise<Member[]> {
  await delay(20);
  return MEMBERS;
}

export async function getCurrentMember(): Promise<Member> {
  await delay(10);
  return MEMBERS.find((m) => m.id === CURRENT_USER_ID) ?? MEMBERS[0];
}

/** Resolve o autor/responsável de um registro. Nunca retorna `undefined`. */
export function memberById(id: string): Member {
  return MEMBERS.find((m) => m.id === id) ?? MEMBERS[0];
}
