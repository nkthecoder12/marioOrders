import { randomBytes, randomUUID } from "node:crypto";
import type { MenuItem, Order, PublicUser, Role } from "../../shared/types.js";

export interface UserRecord extends PublicUser {
  // Demo only — production: store a bcrypt/argon2 hash, never plaintext.
  password: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  createdAt: string;
}

export const store = {
  users: new Map<string, UserRecord>(),
  usersByEmail: new Map<string, string>(),
  sessions: new Map<string, SessionRecord>(),
  menu: new Map<string, MenuItem>(),
  orders: new Map<string, Order>(),
  nextToken: 0,
};

export function publicUser(user: UserRecord): PublicUser {
  const { password: _pw, ...rest } = user;
  return rest;
}

export function addUser(input: Omit<UserRecord, "id"> & { id?: string }): UserRecord {
  const id = input.id ?? randomUUID();
  const user: UserRecord = { ...input, id };
  store.users.set(id, user);
  store.usersByEmail.set(user.email.toLowerCase(), id);
  return user;
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const id = store.usersByEmail.get(email.toLowerCase());
  return id ? store.users.get(id) : undefined;
}

export function createSession(userId: string): SessionRecord {
  const session: SessionRecord = {
    id: randomBytes(24).toString("hex"),
    userId,
    createdAt: new Date().toISOString(),
  };
  store.sessions.set(session.id, session);
  return session;
}

export function getSessionUser(sessionId: string | undefined): PublicUser | undefined {
  if (!sessionId) return undefined;
  const session = store.sessions.get(sessionId);
  if (!session) return undefined;
  const user = store.users.get(session.userId);
  return user ? publicUser(user) : undefined;
}

export function destroySession(sessionId: string | undefined): void {
  if (sessionId) store.sessions.delete(sessionId);
}

export function listMenu(): MenuItem[] {
  return [...store.menu.values()];
}

export function listOrders(): Order[] {
  return [...store.orders.values()];
}

export function nextTokenNumber(): number {
  store.nextToken += 1;
  return store.nextToken;
}

export function roleOf(userId: string): Role | undefined {
  return store.users.get(userId)?.role;
}
