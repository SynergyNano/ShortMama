import { NextRequest, NextResponse } from 'next/server'
import { searchQueue, getApifyRunIdsFromJobData } from '@/lib/queue/search-queue'
import { clearSearchCache } from '@/lib/cache'
import { abortApifyRuns } from '@/lib/apify'

export async function POST(request: NextRequest) {
  try {
    const { jobId, query, platform, dateRange } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID required' },
        { status: 400 }
      )
    }

    const job = await searchQueue.getJob(jobId)
    if (job) {
      const runIds = getApifyRunIdsFromJobData(job.data)
      const apiKey = process.env.APIFY_API_KEY

      if (runIds.length > 0 && apiKey) {
        try {
          await abortApifyRuns(runIds, apiKey)
          console.log('[CancelAPI] 스크래핑 작업 중단됨:', runIds)
        } catch (err) {
          console.warn('[CancelAPI] 스크래핑 작업 중단 실패 (이미 완료되었을 수 있음):', err)
        }
      }

      await job.remove()
    }

    if (query && platform) {
      await clearSearchCache(query, platform, dateRange)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CancelAPI] Error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    )
  }
}
