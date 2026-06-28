// User stage — the user's current academic / career stage.
//
// Stored on the database `users.grade_level` column as a small integer so we
// don't need a schema migration. The mapping is fixed:
//
//   8–12  → 8th–12th grade (middle / high school)
//   13–16 → college freshman / sophomore / junior / senior
//   17    → working professional / other
//
// The string id is what UI components reference; gradeLevelToStage and
// stageToGradeLevel translate between persisted number and id.

export interface UserStage {
  id: string;
  label: string;
  group: 'school' | 'college' | 'work';
  /** The integer stored in users.grade_level for this stage. */
  gradeLevel: number;
}

export const USER_STAGES: readonly UserStage[] = [
  { id: 'grade_8',     label: '8th grade',           group: 'school',  gradeLevel: 8 },
  { id: 'grade_9',     label: '9th grade',           group: 'school',  gradeLevel: 9 },
  { id: 'grade_10',    label: '10th grade',          group: 'school',  gradeLevel: 10 },
  { id: 'grade_11',    label: '11th grade',          group: 'school',  gradeLevel: 11 },
  { id: 'grade_12',    label: '12th grade',          group: 'school',  gradeLevel: 12 },
  { id: 'freshman',    label: 'College freshman',    group: 'college', gradeLevel: 13 },
  { id: 'sophomore',   label: 'College sophomore',   group: 'college', gradeLevel: 14 },
  { id: 'junior',      label: 'College junior',      group: 'college', gradeLevel: 15 },
  { id: 'senior',      label: 'College senior',      group: 'college', gradeLevel: 16 },
  { id: 'professional', label: 'Working professional', group: 'work',  gradeLevel: 17 },
] as const;

export const DEFAULT_STAGE_ID = 'grade_11';

export function stageById(id: string | null | undefined): UserStage | undefined {
  if (!id) return undefined;
  return USER_STAGES.find((s) => s.id === id);
}

export function stageByGradeLevel(gradeLevel: number | null | undefined): UserStage {
  if (gradeLevel == null) return stageById(DEFAULT_STAGE_ID)!;
  const match = USER_STAGES.find((s) => s.gradeLevel === gradeLevel);
  return match ?? stageById(DEFAULT_STAGE_ID)!;
}

export function stageLabelForGradeLevel(gradeLevel: number | null | undefined): string {
  return stageByGradeLevel(gradeLevel).label;
}
