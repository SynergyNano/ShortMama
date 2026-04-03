import { Queue } from 'bullmq'
import { logRedisErrorDiagnostics, redisConnection } from './redis'
import {
  QUEUE_NAME,
  JOB_ATTEMPTS,
  BACKOFF_DELAY,
  COMPLETED_JOB_RETENTION_COUNT,
  COMPLETED_JOB_RETENTION_AGE,
  FAILED_JOB_RETENTION_COUNT,
  FAILED_JOB_RETENTION_AGE,
} from './constants'

/**
 * Job data structure for video search queue
 */
export interface SearchJobData {
  query: string
  platform: 'tiktok' | 'douyin'
  dateRange?: string
  isRecrawl?: boolean
  apifyRunId?: string
  apifyRunIds?: string[]
}

/** BullMQ job.data에서 Apify run ID 목록 (도우인 병렬 = 여러 run) */
export function getApifyRunIdsFromJobData(data: SearchJobData): string[] {
  return data.apifyRunIds ?? (data.apifyRunId ? [data.apifyRunId] : [])
}

let searchQueueInstance: Queue<SearchJobData> | undefined

function createSearchQueue(): Queue<SearchJobData> {
  const q = new Queue<SearchJobData>(QUEUE_NAME, {
    connection: redisConnection.connection,
    defaultJobOptions: {
      removeOnComplete: {
        count: COMPLETED_JOB_RETENTION_COUNT,
        age: COMPLETED_JOB_RETENTION_AGE,
      },
      removeOnFail: {
        count: FAILED_JOB_RETENTION_COUNT,
        age: FAILED_JOB_RETENTION_AGE,
      },
      attempts: JOB_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: BACKOFF_DELAY,
      },
    },
  })
  q.on('error', (err) => {
    logRedisErrorDiagnostics('BullMQ Queue', err)
  })
  return q
}

function getSearchQueue(): Queue<SearchJobData> {
  if (!searchQueueInstance) {
    searchQueueInstance = createSearchQueue()
  }
  return searchQueueInstance
}

/** Lazy init: `next build` 시 Redis 연결하지 않음 (Docker 빌드에 Redis 없음). */
export const searchQueue: Queue<SearchJobData> = new Proxy(
  {} as Queue<SearchJobData>,
  {
    get(_target, prop, receiver) {
      const q = getSearchQueue()
      const value = Reflect.get(q, prop, receiver)
      if (typeof value === 'function') {
        return value.bind(q)
      }
      return value
    },
  }
)
