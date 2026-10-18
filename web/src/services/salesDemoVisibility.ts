/**
 * A salesperson owns demos they created and may also work on demos linked to
 * prospects assigned to them. The creator remains the canonical owner when a
 * demo is reused by another salesperson.
 */
export function getSalesDemoVisibilityFilter(
  staffId: string,
  assignedProspectIds: string[],
): string {
  const clauses = [`created_by.eq.${staffId}`];
  if (assignedProspectIds.length > 0) {
    clauses.push(`prospect_id.in.(${assignedProspectIds.join(',')})`);
  }
  return clauses.join(',');
}
