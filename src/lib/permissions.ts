export type UserRole = "admin" | "editor" | "viewer";

export const canManageAgents = (role: UserRole) => role === "admin" || role === "editor";

export const canDeleteAgents = (role: UserRole) => role === "admin";

export const canConfigureSkills = (role: UserRole) => role === "admin" || role === "editor";

export const canManageSkills = (role: UserRole) => role === "admin" || role === "editor";
