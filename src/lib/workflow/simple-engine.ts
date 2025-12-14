import { generateVideoBrief, type VideoBrief } from '../ai/agents/video-brief-generator';
import type { WorkflowInput } from './types';

// ============================================================================
// SIMPLE VIDEO BRIEF ENGINE
// ============================================================================

export interface SimpleWorkflow {
  id: string;
  name: string;
  status: 'draft' | 'generating' | 'ready' | 'failed';
  input: WorkflowInput;
  brief?: VideoBrief;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateResult {
  success: boolean;
  workflow: SimpleWorkflow;
  error?: string;
}

// In-memory storage for simplicity (you can switch to file-based later)
const workflows = new Map<string, SimpleWorkflow>();

export function createSimpleWorkflow(
  name: string,
  input: WorkflowInput
): SimpleWorkflow {
  const workflow: SimpleWorkflow = {
    id: crypto.randomUUID(),
    name,
    status: 'draft',
    input,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  workflows.set(workflow.id, workflow);
  return workflow;
}

export function getSimpleWorkflow(id: string): SimpleWorkflow | null {
  return workflows.get(id) || null;
}

export function listSimpleWorkflows(): SimpleWorkflow[] {
  return Array.from(workflows.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function generateBrief(
  workflowId: string,
  feedback?: string
): Promise<GenerateResult> {
  const workflow = workflows.get(workflowId);
  
  if (!workflow) {
    return {
      success: false,
      workflow: null as never,
      error: 'Workflow not found',
    };
  }

  console.log(`[SimpleEngine] Generating brief for: ${workflowId}`);
  
  workflow.status = 'generating';
  workflow.error = undefined;
  workflow.updatedAt = new Date().toISOString();

  try {
    const result = await generateVideoBrief(
      workflow.input,
      workflow.brief,
      feedback
    );

    console.log(`[SimpleEngine] Generation result:`, result.success ? 'SUCCESS' : `FAILED: ${result.error}`);

    if (!result.success) {
      workflow.status = 'failed';
      workflow.error = result.error || 'Failed to generate brief';
      workflow.updatedAt = new Date().toISOString();
      
      return {
        success: false,
        workflow,
        error: result.error,
      };
    }

    workflow.brief = result.data;
    workflow.status = 'ready';
    workflow.updatedAt = new Date().toISOString();

    return {
      success: true,
      workflow,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SimpleEngine] Error:`, errorMessage);
    
    workflow.status = 'failed';
    workflow.error = errorMessage;
    workflow.updatedAt = new Date().toISOString();

    return {
      success: false,
      workflow,
      error: errorMessage,
    };
  }
}

export function deleteSimpleWorkflow(id: string): boolean {
  return workflows.delete(id);
}

