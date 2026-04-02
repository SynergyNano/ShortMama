/**
 * Redis connection configuration for BullMQ
 * Upstash: host/port/password + tls (권장 형식)
 * 로컬: url
 */

import { DEFAULT_REDIS_URL } from './constants'

type RedisConnectionOptions =
  | { url: string; maxRetriesPerRequest: null; enableReadyCheck: boolean; keepAlive: number; tls?: object }
  | { host: string; port: number; password: string; maxRetriesPerRequest: null; enableReadyCheck: boolean; keepAlive: number; tls: object }

function validateRedisUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'redis:' || parsed.protocol === 'rediss:'
  } catch {
    return false
  }
}

const redisUrl = process.env.REDIS_URL || DEFAULT_REDIS_URL

if (!validateRedisUrl(redisUrl)) {
  throw new Error(`Invalid Redis URL format: ${redisUrl}`)
}

function parseUpstashOptions(url: string): RedisConnectionOptions | null {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname?.includes('upstash.io')) return null
    const password = parsed.password || decodeURIComponent(parsed.username || '')
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      password,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      keepAlive: 30000,
      tls: {},
    }
  } catch {
    return null
  }
}

let cachedConnection: RedisConnectionOptions | null = null
let connectionSummaryLogged = false

function logRedisConnectionResolved(opts: RedisConnectionOptions): void {
  if (connectionSummaryLogged) return
  connectionSummaryLogged = true

  const base = {
    timestamp: new Date().toISOString(),
    envSource: process.env.REDIS_URL
      ? 'REDIS_URL'
      : 'unset → DEFAULT_REDIS_URL (localhost)',
  }

  if ('host' in opts && opts.host) {
    console.log('[Redis] 연결 설정 (비밀번호 제외)', {
      ...base,
      mode: 'upstash',
      host: opts.host,
      port: opts.port,
      tls: true,
    })
    return
  }

  if ('url' in opts && opts.url) {
    try {
      const u = new URL(opts.url)
      console.log('[Redis] 연결 설정 (비밀번호 제외)', {
        ...base,
        mode: 'url',
        host: u.hostname,
        port: u.port || '6379',
        tls: u.protocol === 'rediss:',
        hasPassword: Boolean(u.password || u.username),
      })
    } catch {
      console.log('[Redis] 연결 설정', { ...base, mode: 'url-parse-error' })
    }
  }
}

/**
 * Redis 연결 실패 시 원인 추적용 (비밀번호 미포함)
 */
export function logRedisErrorDiagnostics(
  context: string,
  err: unknown
): void {
  const e = err as NodeJS.ErrnoException & {
    address?: string
    port?: number
    hostname?: string
  }
  const payload: Record<string, unknown> = {
    context,
    timestamp: new Date().toISOString(),
    message: err instanceof Error ? err.message : String(err),
    code: e.code,
    errno: e.errno,
    syscall: e.syscall,
    hostname: e.hostname,
    address: e.address,
    port: e.port,
  }

  if (err && typeof err === 'object' && 'cause' in err && (err as Error).cause) {
    const c = (err as Error).cause
    payload.cause =
      c instanceof Error ? c.message : typeof c === 'object' ? JSON.stringify(c) : String(c)
  }

  if (e.code === 'ENOTFOUND') {
    payload.hint =
      'DNS가 호스트를 찾지 못함. REDIS_URL 호스트, Upstash 콘솔에서 엔드포인트, 네트워크/DNS를 확인하세요.'
  } else if (e.code === 'ECONNREFUSED') {
    payload.hint =
      '연결 거부. Redis가 해당 포트에서 수신 중인지, 방화벽·로컬이면 redis:local 실행 여부를 확인하세요.'
  } else if (e.code === 'ETIMEDOUT') {
    payload.hint = '연결 시간 초과. 네트워크·방화벽·Upstash 리전을 확인하세요.'
  } else if (e.code === 'ECONNRESET' || e.code === 'EPIPE') {
    payload.hint = '연결이 끊김. Redis/프록시 재시작 또는 TLS( rediss ) 설정을 확인하세요.'
  }

  console.error('[Redis] 연결/오류', payload)
}

export const redisConnection = {
  get connection(): RedisConnectionOptions {
    if (!cachedConnection) {
      const upstashOpts = parseUpstashOptions(redisUrl)
      if (upstashOpts) {
        cachedConnection = upstashOpts
      } else {
        cachedConnection = {
          url: redisUrl,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          keepAlive: 30000,
          ...(redisUrl.startsWith('rediss://') ? { tls: {} } : {}),
        }
      }
      logRedisConnectionResolved(cachedConnection)
    }
    return cachedConnection
  },
}
