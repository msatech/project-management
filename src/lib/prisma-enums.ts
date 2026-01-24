
export const ProjectType = {
  KANBAN: 'KANBAN',
  SCRUM: 'SCRUM',
} as const;
export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

export const StatusCategory = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;
export type StatusCategory = (typeof StatusCategory)[keyof typeof StatusCategory];

export const IssueType = {
  STORY: 'STORY',
  TASK: 'TASK',
  BUG: 'BUG',
  EPIC: 'EPIC',
} as const;
export type IssueType = (typeof IssueType)[keyof typeof IssueType];

export const Priority = {
  NONE: 'NONE',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const SprintStatus = {
  FUTURE: 'FUTURE',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
} as const;
export type SprintStatus = (typeof SprintStatus)[keyof typeof SprintStatus];

export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const OrgRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];
