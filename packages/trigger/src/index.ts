/**
 * Side-effect imports register tasks with Trigger.dev when this package is loaded in the worker.
 * Re-export task IDs for callers that trigger by string id.
 */
import './jobs/daily-trigger';
import './jobs/batch-grader';
import './jobs/sunday-briefing';
import './jobs/shadow-replan';

export { dailyAssignmentTrigger } from './jobs/daily-trigger';
export { batchGraderTask, gradeTaskBatch } from './jobs/batch-grader';
export { sundayBriefingTask, generateSundayBriefing } from './jobs/sunday-briefing';
export { shadowReplanTask } from './jobs/shadow-replan';
