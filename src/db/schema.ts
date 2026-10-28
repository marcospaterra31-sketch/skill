import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// ------------------------------------------------------------------------------
// Usuários & Autenticação (Firebase Auth UID como chave de federação)
// ------------------------------------------------------------------------------
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  role: text('role').default('CREATOR').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ------------------------------------------------------------------------------
// Workspaces
// ------------------------------------------------------------------------------
export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  ownerId: text('owner_id').references(() => users.uid).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ------------------------------------------------------------------------------
// Skills
// ------------------------------------------------------------------------------
export const skills = pgTable('skills', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  tags: text('tags').array().default([]).notNull(),
  targetAudience: text('target_audience'),
  currentVersion: text('current_version').default('1.0.0').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  status: text('status').default('DRAFT').notNull(),
  workspaceId: text('workspace_id').references(() => workspaces.id).notNull(),
  authorId: text('author_id').references(() => users.uid).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ------------------------------------------------------------------------------
// Versões de Skills
// ------------------------------------------------------------------------------
export const skillVersions = pgTable('skill_versions', {
  id: text('id').primaryKey(),
  skillId: text('skill_id').references(() => skills.id).notNull(),
  versionNumber: text('version_number').notNull(),
  changelog: text('changelog'),
  systemPrompt: text('system_prompt').notNull(),
  userInstructions: text('user_instructions'),
  toolsConfig: jsonb('tools_config'),
  schemaConfig: jsonb('schema_config'),
  metadata: jsonb('metadata'),
  authorId: text('author_id').references(() => users.uid).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ------------------------------------------------------------------------------
// Laboratório de Testes
// ------------------------------------------------------------------------------
export const skillTests = pgTable('skill_tests', {
  id: text('id').primaryKey(),
  skillId: text('skill_id').references(() => skills.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  inputData: jsonb('input_data').notNull(),
  expectedOutput: jsonb('expected_output'),
  assertions: jsonb('assertions'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const skillTestResults = pgTable('skill_test_results', {
  id: text('id').primaryKey(),
  testId: text('test_id').references(() => skillTests.id).notNull(),
  versionId: text('version_id').references(() => skillVersions.id).notNull(),
  status: text('status').notNull(),
  score: doublePrecision('score'),
  latencyMs: integer('latency_ms'),
  tokensUsed: integer('tokens_used'),
  output: jsonb('output'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ------------------------------------------------------------------------------
// Auditor de Skills
// ------------------------------------------------------------------------------
export const skillAudits = pgTable('skill_audits', {
  id: text('id').primaryKey(),
  skillId: text('skill_id').references(() => skills.id).notNull(),
  versionId: text('version_id').references(() => skillVersions.id).notNull(),
  auditorType: text('auditor_type').default('AUTOMATED').notNull(),
  score: doublePrecision('score').notNull(),
  passed: boolean('passed').default(true).notNull(),
  summary: text('summary').notNull(),
  findings: jsonb('findings'),
  recommendations: jsonb('recommendations'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ------------------------------------------------------------------------------
// Exportações
// ------------------------------------------------------------------------------
export const skillExports = pgTable('skill_exports', {
  id: text('id').primaryKey(),
  skillId: text('skill_id').references(() => skills.id).notNull(),
  versionId: text('version_id').references(() => skillVersions.id).notNull(),
  format: text('format').default('ZIP').notNull(),
  fileName: text('file_name').notNull(),
  fileSizeBytes: integer('file_size_bytes'),
  downloadUrl: text('download_url'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ------------------------------------------------------------------------------
// Modelos / Templates
// ------------------------------------------------------------------------------
export const skillTemplates = pgTable('skill_templates', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  icon: text('icon'),
  targetFormat: text('target_format').default('ZIP').notNull(),
  defaultPrompt: text('default_prompt').notNull(),
  defaultInstructions: text('default_instructions'),
  toolsSample: jsonb('tools_sample'),
  tags: text('tags').array().default([]).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ------------------------------------------------------------------------------
// Relacionamentos Drizzle
// ------------------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  skills: many(skills),
  versions: many(skillVersions),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.uid],
  }),
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [skills.workspaceId],
    references: [workspaces.id],
  }),
  author: one(users, {
    fields: [skills.authorId],
    references: [users.uid],
  }),
  versions: many(skillVersions),
  tests: many(skillTests),
  audits: many(skillAudits),
  exports: many(skillExports),
}));

export const skillVersionsRelations = relations(skillVersions, ({ one, many }) => ({
  skill: one(skills, {
    fields: [skillVersions.skillId],
    references: [skills.id],
  }),
  author: one(users, {
    fields: [skillVersions.authorId],
    references: [users.uid],
  }),
  testResults: many(skillTestResults),
  audits: many(skillAudits),
  exports: many(skillExports),
}));
