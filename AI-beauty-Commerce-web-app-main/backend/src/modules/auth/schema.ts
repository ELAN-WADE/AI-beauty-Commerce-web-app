import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/** Users: credentials + lockout state. Profile data lives in users module. */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(), // always stored lowercased (service)
  passwordHash: text('password_hash').notNull(), // scrypt, never plaintext (§7)
  emailVerifiedAt: timestamptz('email_verified_at'),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamptz('locked_until'),
  mfaSecretEncrypted: text('mfa_secret_encrypted'),
  mfaEnabledAt: timestamptz('mfa_enabled_at'),
  mfaLastTotpStep: integer('mfa_last_totp_step'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  signupIntent: text('signup_intent').notNull().default('CUSTOMER'),
});

/** Google subject is the provider identity; email alone is not its primary key. */
export const googleIdentities = pgTable('google_identities', {
  subject: text('subject').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
});

export const oauthRequests = pgTable('oauth_requests', {
  stateHash: text('state_hash').primaryKey(),
  browserHash: text('browser_hash').notNull(),
  verifierEncrypted: text('verifier_encrypted').notNull(),
  returnChallenge: text('return_challenge').notNull(),
  returnTo: text('return_to').notNull(),
  intent: text('intent').notNull(),
  expiresAt: timestamptz('expires_at').notNull(),
  consumedAt: timestamptz('consumed_at'),
});

/** One-minute, one-use browser-bound handoff. Never a session token. */
export const oauthGrants = pgTable('oauth_grants', {
  codeHash: text('code_hash').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  authScope: text('auth_scope').$type<'CUSTOMER' | 'ADMIN'>().notNull().default('CUSTOMER'),
  challenge: text('challenge').notNull(),
  returnTo: text('return_to').notNull(),
  expiresAt: timestamptz('expires_at').notNull(),
  consumedAt: timestamptz('consumed_at'),
});

/** Server sessions: token_hash = SHA-256(raw cookie token). Revocable, expiring. */
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  authScope: text('auth_scope').$type<'CUSTOMER' | 'ADMIN'>().notNull().default('CUSTOMER'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  expiresAt: timestamptz('expires_at').notNull(),
  revokedAt: timestamptz('revoked_at'),
  mfaVerifiedAt: timestamptz('mfa_verified_at'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
}, (t) => [index('user_sessions_active_scope_idx').on(t.userId, t.authScope, t.createdAt).where(sql`${t.revokedAt} is null`)]);

/** One-time recovery codes are SHA-256 hashed and deleted on use. */
export const mfaRecoveryCodes = pgTable('mfa_recovery_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull().unique(),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
}, (t) => [index('mfa_recovery_user_idx').on(t.userId)]);

/** Email verification: random 32B, hashed at rest, single-use, 24h. */
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamptz('expires_at').notNull(),
  consumedAt: timestamptz('consumed_at'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
});

/** Password reset: random 32B, hashed at rest, single-use, 1h. */
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamptz('expires_at').notNull(),
  consumedAt: timestamptz('consumed_at'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
});

/** RBAC catalogue (seeded). Checks enforced in service layer, not RLS (§2). */
export const roles = pgTable('roles', {
  id: text('id').primaryKey(), // CUSTOMER, SUPPORT, ...
  description: text('description').notNull().default(''),
});

export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(), // orders:read:all, ...
  description: text('description').notNull().default(''),
});

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    grantedBy: uuid('granted_by'),
    grantedAt: timestamptz('granted_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: text('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);
