import {
  STAGES,
  CHECKPOINT_STAGES,
  type StageName,
  type WorkflowState,
  type StageOutputMap,
} from './types';
import { saveWorkflow, getWorkflow } from './storage';
import {
  runTopicResearch,
  runScriptOutline,
  runFullBrief,
} from '../ai/agents';

// ============================================================================
// WORKFLOW ENGINE
// ============================================================================

export interface StageResult {
  success: boolean;
  workflow: WorkflowState;
  requiresApproval: boolean;
  error?: string;
}

/**
 * Run a single stage of the workflow
 */
export async function runStage(
  workflowId: string,
  stage: StageName,
  feedback?: string
): Promise<StageResult> {
  console.log(`[Engine] Running stage: ${stage} for workflow: ${workflowId}`);
  
  const workflow = await getWorkflow(workflowId);

  if (!workflow) {
    console.error(`[Engine] Workflow ${workflowId} not found`);
    throw new Error(`Workflow ${workflowId} not found`);
  }

  // Update workflow status
  workflow.status = 'running';
  workflow.currentStage = stage;
  workflow.stages[stage].status = 'running';
  workflow.stages[stage].startedAt = new Date().toISOString();
  workflow.stages[stage].attempts += 1;
  workflow.error = undefined;
  await saveWorkflow(workflow);

  try {
    // Get previous output if this is a revision
    const previousOutput = workflow.stages[stage].output as
      | StageOutputMap[typeof stage]
      | undefined;

    console.log(`[Engine] Calling AI agent for stage: ${stage}`);
    
    // Run the appropriate agent
    const result = await runStageAgent(workflow, stage, previousOutput, feedback);

    console.log(`[Engine] Agent result for ${stage}:`, result.success ? 'SUCCESS' : `FAILED: ${result.error}`);

    if (!result.success) {
      workflow.stages[stage].status = 'pending';
      workflow.status = 'failed';
      workflow.error = result.error || 'Unknown agent error';
      await saveWorkflow(workflow);

      return {
        success: false,
        workflow,
        requiresApproval: false,
        error: result.error,
      };
    }

    // Store the output
    workflow.stages[stage].output = result.data;
    workflow.stages[stage].completedAt = new Date().toISOString();

    // Check if this stage requires approval
    const checkpointStages = CHECKPOINT_STAGES[workflow.controlLevel];
    const requiresApproval = checkpointStages.includes(stage);

    console.log(`[Engine] Stage ${stage} requiresApproval: ${requiresApproval} (controlLevel: ${workflow.controlLevel})`);

    if (requiresApproval) {
      workflow.stages[stage].status = 'awaiting-approval';
      workflow.status = 'paused';
    } else {
      workflow.stages[stage].status = 'approved';
    }

    await saveWorkflow(workflow);

    return {
      success: true,
      workflow,
      requiresApproval,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Engine] Error in stage ${stage}:`, errorMessage);
    
    workflow.stages[stage].status = 'pending';
    workflow.status = 'failed';
    workflow.error = errorMessage;
    await saveWorkflow(workflow);

    return {
      success: false,
      workflow,
      requiresApproval: false,
      error: errorMessage,
    };
  }
}

/**
 * Approve a stage and optionally continue to the next stage
 */
export async function approveStage(
  workflowId: string,
  stage: StageName,
  continueToNext: boolean = true
): Promise<StageResult> {
  const workflow = await getWorkflow(workflowId);

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  workflow.stages[stage].status = 'approved';
  workflow.stages[stage].feedback = undefined;
  await saveWorkflow(workflow);

  // Find next stage
  const currentIndex = STAGES.indexOf(stage);
  const nextStage = STAGES[currentIndex + 1];

  if (!nextStage) {
    // This was the last stage
    workflow.status = 'completed';
    workflow.currentStage = null;
    await saveWorkflow(workflow);

    return {
      success: true,
      workflow,
      requiresApproval: false,
    };
  }

  if (continueToNext) {
    return runStage(workflowId, nextStage);
  }

  workflow.status = 'paused';
  await saveWorkflow(workflow);

  return {
    success: true,
    workflow,
    requiresApproval: false,
  };
}

/**
 * Reject a stage with feedback and regenerate
 */
export async function rejectStage(
  workflowId: string,
  stage: StageName,
  feedback: string
): Promise<StageResult> {
  const workflow = await getWorkflow(workflowId);

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  workflow.stages[stage].status = 'rejected';
  workflow.stages[stage].feedback = feedback;
  await saveWorkflow(workflow);

  // Re-run the stage with feedback
  return runStage(workflowId, stage, feedback);
}

/**
 * Run the full pipeline (respecting checkpoints)
 */
export async function runPipeline(
  workflowId: string,
  startFromStage?: StageName
): Promise<StageResult> {
  const workflow = await getWorkflow(workflowId);

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  const startIndex = startFromStage ? STAGES.indexOf(startFromStage) : 0;

  for (let i = startIndex; i < STAGES.length; i++) {
    const stage = STAGES[i];
    const result = await runStage(workflowId, stage);

    if (!result.success) {
      return result;
    }

    if (result.requiresApproval) {
      // Stop here and wait for human approval
      return result;
    }
  }

  // All stages completed
  const finalWorkflow = await getWorkflow(workflowId);
  return {
    success: true,
    workflow: finalWorkflow!,
    requiresApproval: false,
  };
}

/**
 * Continue pipeline from where it left off
 */
export async function continuePipeline(workflowId: string): Promise<StageResult> {
  const workflow = await getWorkflow(workflowId);

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  // Find the first stage that's not approved
  const nextStage = STAGES.find(
    (stage) => workflow.stages[stage].status !== 'approved'
  );

  if (!nextStage) {
    workflow.status = 'completed';
    await saveWorkflow(workflow);
    return {
      success: true,
      workflow,
      requiresApproval: false,
    };
  }

  return runPipeline(workflowId, nextStage);
}

// ============================================================================
// INTERNAL: Stage Agent Dispatcher
// ============================================================================

async function runStageAgent(
  workflow: WorkflowState,
  stage: StageName,
  previousOutput?: unknown,
  feedback?: string
) {
  const { input } = workflow;

  // Get outputs from previous stages
  const topicResearch = workflow.stages['topic-research'].output;
  const scriptOutline = workflow.stages['script-outline'].output;

  switch (stage) {
    case 'topic-research':
      return runTopicResearch(input, previousOutput as never, feedback);

    case 'script-outline':
      if (!topicResearch) {
        return { success: false, error: 'Topic research not found' };
      }
      return runScriptOutline(
        input,
        topicResearch as never,
        previousOutput as never,
        feedback
      );

    case 'full-brief':
      if (!topicResearch || !scriptOutline) {
        return { success: false, error: 'Previous stages not completed' };
      }
      return runFullBrief(
        input,
        topicResearch as never,
        scriptOutline as never,
        previousOutput as never,
        feedback
      );

    default:
      return { success: false, error: `Unknown stage: ${stage}` };
  }
}
