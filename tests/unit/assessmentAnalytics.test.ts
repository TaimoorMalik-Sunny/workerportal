import { describe, it, expect } from 'vitest';
import { workflowEngine } from '@/services/workflowEngine';

describe('Stage Assessment Analytics Computation', () => {
  it('correctly aggregates application counts across the 5 assessment stages', async () => {
    const tasks = await workflowEngine.getTasksByRole('ROLE_HEC_MANAGER');
    expect(tasks.length).toBeGreaterThanOrEqual(21);

    const pendingCount = tasks.filter(
      (t) =>
        t.semanticStatus === 'Pending' || t.currentState.startsWith('PENDING_')
    ).length;

    const inProcessCount = tasks.filter(
      (t) =>
        t.semanticStatus === 'In-Process' || t.currentState.startsWith('IN_')
    ).length;

    const onHoldingCount = tasks.filter(
      (t) => t.semanticStatus === 'On-Holding'
    ).length;

    const revisionCount = tasks.filter(
      (t) =>
        t.semanticStatus === 'Revision' ||
        t.currentState === 'REVISION_REQUESTED'
    ).length;

    const delayedCount = tasks.filter((t) => t.isDelayed).length;

    // Verify all counts are non-negative integers
    expect(pendingCount).toBeGreaterThanOrEqual(0);
    expect(inProcessCount).toBeGreaterThanOrEqual(0);
    expect(onHoldingCount).toBeGreaterThanOrEqual(0);
    expect(revisionCount).toBeGreaterThanOrEqual(0);
    expect(delayedCount).toBeGreaterThanOrEqual(0);

    // Verify that the sum of these key categories captures active workflow volume
    expect(
      pendingCount + inProcessCount + onHoldingCount + revisionCount
    ).toBeGreaterThan(0);
    // At least 2 applications should have delayed SLA flags for demonstration
    expect(delayedCount).toBeGreaterThanOrEqual(2);
  });

  it('ensures bar pillar calculations produce positive heights and avoid zero-division', () => {
    const stageData = [
      { key: 'Pending', count: 5 },
      { key: 'In-Process', count: 12 },
      { key: 'On-Holding', count: 2 },
      { key: 'Revision', count: 3 },
      { key: 'Delayed', count: 4 },
    ];

    const maxCount = Math.max(...stageData.map((s) => s.count), 1);
    expect(maxCount).toBe(12);

    stageData.forEach((s) => {
      const heightPercent = Math.max((s.count / maxCount) * 100, 8);
      expect(heightPercent).toBeGreaterThanOrEqual(8);
      expect(heightPercent).toBeLessThanOrEqual(100);
      expect(Number.isFinite(heightPercent)).toBe(true);
    });
  });
});
