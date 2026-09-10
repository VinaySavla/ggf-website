export const ROLES = Object.freeze({
  USER: "USER",
  ORGANIZER: "ORGANIZER",
  FINANCE_REVIEWER: "FINANCE_REVIEWER",
  SUPER_ADMIN: "SUPER_ADMIN",
});

export const ADMIN_ROLES = [ROLES.ORGANIZER, ROLES.FINANCE_REVIEWER, ROLES.SUPER_ADMIN];

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

export function isSuperAdmin(role) {
  return role === ROLES.SUPER_ADMIN;
}
