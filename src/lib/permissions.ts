export type UserRole = "admin" | "editor" | "viewer";

export const canManageTools = (role: UserRole) => role === "admin" || role === "editor";

export const canDeleteTools = (role: UserRole) => role === "admin";

export const canConfigureSkills = (role: UserRole) => role === "admin" || role === "editor";

export const canManageSkills = (role: UserRole) => role === "admin" || role === "editor";
