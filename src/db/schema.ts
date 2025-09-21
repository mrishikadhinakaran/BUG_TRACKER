import { sqliteTable, integer, text, unique, index } from 'drizzle-orm/sqlite-core';



// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Bug Tracker tables
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['admin', 'manager', 'developer', 'tester'] }).notNull().default('developer'),
  image: text('image'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  description: text('description'),
  status: text('status', { enum: ['active', 'archived'] }).notNull().default('active'),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const projectMembers = sqliteTable('project_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id),
  userId: integer('user_id').notNull().references(() => users.id),
  role: text('role', { enum: ['owner', 'maintainer', 'contributor', 'viewer'] }).notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  uniqueProjectUser: unique().on(table.projectId, table.userId),
}));

export const bugs = sqliteTable('bugs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull().references(() => projects.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'critical'] }).notNull().default('medium'),
  status: text('status', { enum: ['open', 'in_progress', 'resolved', 'closed'] }).notNull().default('open'),
  reporterId: integer('reporter_id').notNull().references(() => users.id),
  assigneeId: integer('assignee_id').references(() => users.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bugId: integer('bug_id').notNull().references(() => bugs.id),
  authorId: integer('author_id').notNull().references(() => users.id),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const bugHistory = sqliteTable('bug_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bugId: integer('bug_id').notNull().references(() => bugs.id),
  userId: integer('user_id').notNull().references(() => users.id),
  field: text('field').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: text('created_at').notNull(),
});

export const attachments = sqliteTable('attachments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull(),
  storedName: text('stored_name').notNull().unique(),
  path: text('path').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  issueId: integer('issue_id').references(() => bugs.id, { onDelete: 'set null' }),
  projectId: integer('project_id').references(() => projects.id, { onDelete: 'set null' }),
  uploaderId: integer('uploader_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});