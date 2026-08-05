import { randomUUID } from "node:crypto";

export const newSessionId = (): string => `sess_${randomUUID().replace(/-/g, "")}`;
