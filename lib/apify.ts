/**
 * Apify actor run 중단 (검색 취소 시 RUNNING/READY run abort)
 */
export const APIFY_ACTOR_RUNS_BASE = 'https://api.apify.com/v2/actor-runs'

export async function abortApifyRuns(runIds: string[], apiKey: string): Promise<void> {
  if (runIds.length === 0) return
  await Promise.all(
    runIds.map((runId) =>
      fetch(`${APIFY_ACTOR_RUNS_BASE}/${runId}/abort?token=${apiKey}`, { method: 'POST' })
    )
  )
}
