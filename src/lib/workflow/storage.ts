import { promises as fs } from 'fs';
import path from 'path';
import type { WorkflowState } from './types';

// ============================================================================
// WORKFLOW STORAGE (JSON File-based)
// ============================================================================

const DATA_DIR = path.join(process.cwd(), 'data', 'workflows');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory exists
  }
}

function getWorkflowPath(id: string): string {
  return path.join(DATA_DIR, `${id}.json`);
}

export async function saveWorkflow(workflow: WorkflowState): Promise<void> {
  await ensureDataDir();
  workflow.updatedAt = new Date().toISOString();
  await fs.writeFile(
    getWorkflowPath(workflow.id),
    JSON.stringify(workflow, null, 2),
    'utf-8'
  );
}

export async function getWorkflow(id: string): Promise<WorkflowState | null> {
  try {
    const data = await fs.readFile(getWorkflowPath(id), 'utf-8');
    return JSON.parse(data) as WorkflowState;
  } catch {
    return null;
  }
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  try {
    await fs.unlink(getWorkflowPath(id));
    return true;
  } catch {
    return false;
  }
}

export async function listWorkflows(): Promise<WorkflowState[]> {
  await ensureDataDir();

  try {
    const files = await fs.readdir(DATA_DIR);
    const workflows: WorkflowState[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const data = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
          workflows.push(JSON.parse(data) as WorkflowState);
        } catch {
          // Skip invalid files
        }
      }
    }

    // Sort by most recent first
    return workflows.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

