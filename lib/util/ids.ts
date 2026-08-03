import { randomUUID } from "node:crypto";
import { actSlug } from "./slug";

export const newSessionId = (): string => `sess_${randomUUID().replace(/-/g, "")}`;

export function chunkId(actName: string, section: string, part: number): string {
  return `${actSlug(actName)}__s${section}__p${part}`;
}
