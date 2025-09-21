import { useApiCall, useApiMutation, PaginatedResponse } from './useApi';

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'developer' | 'tester';
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  name: string;
  key: string;
  description?: string;
  status: 'active' | 'archived';
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: number;
  userId: number;
  role: 'owner' | 'maintainer' | 'contributor' | 'viewer';
  createdAt: string;
  user: User;
}

export interface Bug {
  id: number;
  projectId: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  reporterId: number;
  assigneeId?: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    name: string;
    key: string;
  };
  reporter?: User;
}

export interface Comment {
  id: number;
  bugId: number;
  authorId: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: User;
}

export interface BugHistoryEntry {
  id: number;
  bugId: number;
  userId: number;
  field: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  user: User;
}

// Users API Hooks
export function useUsers(page = 1, pageSize = 10, search?: string) {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('pageSize', pageSize.toString());
  if (search) params.set('search', search);

  return useApiCall<PaginatedResponse<User>>(
    `/api/users?${params}`,
    undefined,
    [page, pageSize, search]
  );
}

export function useUser(id: number) {
  return useApiCall<User>(`/api/users/${id}`, undefined, [id]);
}

export function useCreateUser() {
  return useApiMutation<User, Partial<User>>();
}

export function useUpdateUser() {
  return useApiMutation<User, Partial<User>>();
}

export function useDeleteUser() {
  return useApiMutation<User, void>();
}

// Projects API Hooks
export function useProjects(page = 1, pageSize = 10, status?: string) {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('pageSize', pageSize.toString());
  if (status) params.set('status', status);

  return useApiCall<PaginatedResponse<Project>>(
    `/api/projects?${params}`,
    undefined,
    [page, pageSize, status]
  );
}

export function useProject(id: number) {
  return useApiCall<Project>(`/api/projects/${id}`, undefined, [id]);
}

export function useCreateProject() {
  return useApiMutation<Project, Partial<Project>>();
}

export function useUpdateProject() {
  return useApiMutation<Project, Partial<Project>>();
}

export function useDeleteProject() {
  return useApiMutation<Project, void>();
}

// Project Members API Hooks
export function useProjectMembers(projectId: number) {
  return useApiCall<ProjectMember[]>(
    `/api/projects/${projectId}/members`,
    undefined,
    [projectId]
  );
}

export function useAddProjectMember() {
  return useApiMutation<ProjectMember, { userId: number; role: string }>();
}

export function useRemoveProjectMember() {
  return useApiMutation<ProjectMember, { userId: number }>();
}

// Bugs API Hooks
export function useBugs(filters?: {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  projectId?: number;
  assigneeId?: number;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());
  if (filters?.status) params.set('status', filters.status);
  if (filters?.priority) params.set('priority', filters.priority);
  if (filters?.projectId) params.set('projectId', filters.projectId.toString());
  if (filters?.assigneeId) params.set('assigneeId', filters.assigneeId.toString());
  if (filters?.search) params.set('search', filters.search);

  return useApiCall<PaginatedResponse<Bug>>(
    `/api/bugs?${params}`,
    undefined,
    [filters]
  );
}

export function useBug(id: number) {
  return useApiCall<Bug>(`/api/bugs/${id}`, undefined, [id]);
}

export function useCreateBug() {
  return useApiMutation<Bug, Partial<Bug>>();
}

export function useUpdateBug() {
  return useApiMutation<Bug, Partial<Bug>>();
}

export function useDeleteBug() {
  return useApiMutation<Bug, void>();
}

// Comments API Hooks
export function useBugComments(bugId: number) {
  return useApiCall<Comment[]>(`/api/bugs/${bugId}/comments`, undefined, [bugId]);
}

export function useCreateComment() {
  return useApiMutation<Comment, { authorId: number; body: string }>();
}

export function useUpdateComment() {
  return useApiMutation<Comment, { body: string }>();
}

export function useDeleteComment() {
  return useApiMutation<Comment, void>();
}

// Bug History API Hooks
export function useBugHistory(bugId: number) {
  return useApiCall<BugHistoryEntry[]>(`/api/bugs/${bugId}/history`, undefined, [bugId]);
}

// Helper hooks for common operations
export function useBugTrackerStats() {
  const { data: bugs } = useBugs();
  const { data: projects } = useProjects();
  const { data: users } = useUsers();

  return {
    totalBugs: bugs?.data?.length || 0,
    openBugs: bugs?.data?.filter(bug => bug.status === 'open').length || 0,
    totalProjects: projects?.data?.length || 0,
    totalUsers: users?.data?.length || 0,
  };
}