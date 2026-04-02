/**
 * 키워드 유효성 검증 (형식 + 로컬 의미 검증)
 */

export interface KeywordValidationResult {
  isValid: boolean
  error?: string
  sanitized?: string
}

interface LocalValidationResult {
  isValid: boolean
  reason?: string
}

function validateKeywordLocal(keyword: string): LocalValidationResult {
  if (/[ㄱ-ㅎㅏ-ㅣ]/.test(keyword)) {
    return { isValid: false, reason: '완성된 한글만 입력해주세요' }
  }

  if (/(.)\1{4,}/.test(keyword)) {
    return { isValid: false, reason: '반복되는 문자는 사용할 수 없습니다' }
  }

  const keyboardPatterns = [
    'qwerty', 'asdfgh', 'zxcvbn',
    'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
    'qwerasdf', 'asdfzxcv'
  ]
  const lower = keyword.toLowerCase()
  for (const pattern of keyboardPatterns) {
    if (lower.includes(pattern)) {
      return { isValid: false, reason: '무작위 키보드 입력은 사용할 수 없습니다' }
    }
  }

  for (let patternLen = 2; patternLen <= 3; patternLen++) {
    const seenPatterns = new Set<string>()
    for (let i = 0; i <= keyword.length - patternLen; i++) {
      const pattern = keyword.slice(i, i + patternLen)
      if (!seenPatterns.has(pattern)) {
        seenPatterns.add(pattern)
        const regex = new RegExp(`(${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})+`, 'g')
        const match = keyword.match(regex)
        if (match) {
          const longestMatch = match.reduce((a, b) => (a.length > b.length ? a : b), '')
          const repetitions = longestMatch.length / pattern.length
          if (repetitions >= 4) {
            return { isValid: false, reason: '반복되는 패턴은 사용할 수 없습니다' }
          }
        }
      }
    }
  }

  if (/^\d+$/.test(keyword.replace(/\s/g, ''))) {
    return { isValid: false, reason: '숫자만 입력할 수 없습니다' }
  }

  if (!/\s/.test(keyword)) {
    if (keyword.length < 2) {
      return { isValid: false, reason: '검색어가 너무 짧습니다 (최소 2자)' }
    }
    if (keyword.length > 30) {
      return { isValid: false, reason: '검색어가 너무 깁니다 (최대 30자)' }
    }
  }

  const words = keyword.split(/\s+/)
  if (words.length > 1 && words.every(w => w.length === 1)) {
    return { isValid: false, reason: '한 글자씩 띄어쓰기는 사용할 수 없습니다' }
  }

  const englishLetters = keyword.match(/[a-zA-Z]/g) || []
  if (englishLetters.length > 0) {
    const vowels = keyword.match(/[aeiouAEIOU]/g) || []
    const vowelRatio = vowels.length / englishLetters.length
    if (vowelRatio < 0.15 && englishLetters.length >= 5) {
      return { isValid: false, reason: '올바른 단어 형태가 아닙니다' }
    }
  }

  return { isValid: true }
}

export function validateKeyword(keyword: string): KeywordValidationResult {
  const trimmed = keyword.trim()
  if (!trimmed) {
    return { isValid: false, error: '검색어를 입력해주세요' }
  }

  const allowedPattern = /^[a-zA-Z0-9가-힣\u4e00-\u9fff\s]+$/
  if (!allowedPattern.test(trimmed)) {
    return {
      isValid: false,
      error: '특수문자는 사용할 수 없습니다. 알파벳, 숫자, 한글, 중국어만 입력 가능합니다'
    }
  }

  const sanitized = trimmed.replace(/\s+/g, ' ')

  const localCheck = validateKeywordLocal(sanitized)
  if (!localCheck.isValid) {
    return {
      isValid: false,
      error: localCheck.reason || '유효하지 않은 검색어입니다'
    }
  }

  return { isValid: true, sanitized }
}
