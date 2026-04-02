import { NextRequest, NextResponse } from 'next/server'
import { searchQueue, getApifyRunIdsFromJobData } from '@/lib/queue/search-queue'
import { abortApifyRuns } from '@/lib/apify'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const job = await searchQueue.getJob(jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    const runIds = getApifyRunIdsFromJobData(job.data)
    const apiKey = process.env.APIFY_API_KEY
    if (runIds.length > 0 && apiKey) {
      try {
        await abortApifyRuns(runIds, apiKey)
      } catch {
        // ignore
      }
    }

    await job.remove()

    return NextResponse.json({
      status: 'cancelled',
      jobId,
      message: 'Job cancelled successfully'
    })
  } catch (error) {
    console.error('[CancelAPI] Error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    )
  }
}
