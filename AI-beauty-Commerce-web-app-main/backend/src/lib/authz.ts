/** Pure role predicates (no Next imports — unit-testable). */
export function hasAnyRole(roles: string[], ...required: string[]): boolean {
  return required.some((r) => roles.includes(r));
}
