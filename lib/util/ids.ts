import { actSlug } from "./slug";

export function sessionId(): string {
  return crypto.randomUUID();
}

export function chunkId(actName: string, section: string, part: number): string {
  return `${actSlug(actName)}__s${section}__p${part}`;
}
