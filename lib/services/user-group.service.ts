import { apiFetch } from "@/lib/api-client";

export interface GroupMember {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  is_active: boolean;
  role_in_group: string;
  added_at: string;
}

export interface UserGroup {
  id: string;
  business_id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  member_count: number;
  assigned_inbound_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserGroupDetail extends UserGroup {
  members: GroupMember[];
}

export interface UserGroupCreateInput {
  name: string;
  description?: string;
  status?: string;
  member_ids?: string[];
}

export interface UserGroupUpdateInput {
  name?: string;
  description?: string;
  status?: string;
  member_ids?: string[];
}

export interface GroupStats {
  total_groups: number;
  active_groups: number;
  total_members: number;
  available_agents: number;
}

export const userGroupService = {
  getStats: () => apiFetch<GroupStats>("/api/user-groups/stats/summary"),
  
  list: (statusFilter?: string) => {
    const query = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : "";
    return apiFetch<UserGroup[]>(`/api/user-groups${query}`);
  },

  get: (id: string) => apiFetch<UserGroupDetail>(`/api/user-groups/${id}`),

  create: (data: UserGroupCreateInput) =>
    apiFetch<UserGroupDetail>("/api/user-groups", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UserGroupUpdateInput) =>
    apiFetch<UserGroupDetail>(`/api/user-groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ success: boolean; message: string; unassigned_inbound_count: number }>(`/api/user-groups/${id}`, {
      method: "DELETE",
    }),

  listMembers: (groupId: string) => apiFetch<GroupMember[]>(`/api/user-groups/${groupId}/members`),

  addMembers: (groupId: string, userIds: string[], roleInGroup: string = "MEMBER") =>
    apiFetch<GroupMember[]>(`/api/user-groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ user_ids: userIds, role_in_group: roleInGroup }),
    }),

  removeMember: (groupId: string, userId: string) =>
    apiFetch<{ success: boolean; message: string }>(`/api/user-groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    }),
};
