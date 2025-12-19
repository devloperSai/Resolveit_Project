export type UserRole = "citizen" | "officer" | "admin";

/**
 * Normalize role from backend (ROLE_ADMIN) to frontend (admin)
 */
export const normalizeRole = (role: string): UserRole => {
  const normalized = role.toLowerCase().replace("role_", "");
  
  if (normalized === "citizen" || normalized === "officer" || normalized === "admin") {
    return normalized as UserRole;
  }
  
  console.warn(`Unknown role: ${role}, defaulting to citizen`);
  return "citizen";
};

/**
 * Check if role matches (handles both formats)
 */
export const isRole = (userRole: string, targetRole: UserRole): boolean => {
  const normalized = normalizeRole(userRole);
  return normalized === targetRole;
};