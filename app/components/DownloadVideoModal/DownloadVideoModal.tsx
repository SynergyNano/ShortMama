"use client";

import { useState, useRef } from "react";
import { X, Download, AlertCircle, FileText, Sparkles } from "lucide-react";

interface Video {
  id: string;
  title: string;
  creator: string;
  playCount: number;
  likeCount: number;
  videoUrl?: string;
}

interface DownloadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (video: Video) => void;
  isLoading?: boolean;
}

const TIMEOUT_MS = 90_000; // 90초 초과 시 자동 종료

export default function DownloadVideoModal({ isOpen, onClose, onDownload, isLoading = false }: DownloadVideoModalProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<"tiktok" | "douyin" | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTriggeredRef = useRef(false);

  const [isExtractingSubtitle, setIsExtractingSubtitle] = useState(false);
  const [subtitleError, setSubtitleError] = useState("");
  const subtitleAbortControllerRef = useRef<AbortController | null>(null);
  const subtitleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subtitleTimeoutTriggeredRef = useRef(false);

  if (!isOpen) return null;

  const handleCancelDownload = (closeAfter = false) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setError("다운로드가 취소되었습니다.");
    setIsDownloading(false);
    if (closeAfter) onClose();
  };

  const handleCancelSubtitle = (closeAfter = false) => {
    if (subtitleTimeoutRef.current) {
      clearTimeout(subtitleTimeoutRef.current);
      subtitleTimeoutRef.current = null;
    }
    if (subtitleAbortControllerRef.current) {
      subtitleAbortControllerRef.current.abort();
      subtitleAbortControllerRef.current = null;
    }
    setSubtitleError("자막 추출이 취소되었습니다.");
    setIsExtractingSubtitle(false);
    if (closeAfter) onClose();
  };

  const detectPlatformFromUrl = (url: string): "tiktok" | "douyin" | null => {
    if (url.includes("tiktok.com")) return "tiktok";
    if (url.includes("douyin.com")) return "douyin";
    return null;
  };

  const extractVideoIdFromUrl = (url: string): string | null => {
    try {
      // TikTok: /video/7595183372683463957
      let match = url.match(/\/video\/(\d+)/);
      if (match) return match[1];

      // Douyin: /video/7595183372683463957 or /aweme/detail/7595183372683463957
      match = url.match(/\/aweme\/detail\/(\d+)/);
      if (match) return match[1];

      return null;
    } catch {
      return null;
    }
  };

  const handleDownload = async () => {
    setError("");

    if (!input.trim()) {
      setError("URL을 입력해주세요.");
      return;
    }

    const webVideoUrl = input.trim();
    const platformDetected = detectPlatformFromUrl(webVideoUrl);
    if (!platformDetected) {
      setError("지원하지 않는 플랫폼입니다. TikTok 또는 Douyin URL을 입력해주세요.");
      return;
    }

    const videoId = extractVideoIdFromUrl(webVideoUrl) || "video";
    setIsDownloading(true);
    timeoutTriggeredRef.current = false;
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      timeoutTriggeredRef.current = true;
      abortControllerRef.current?.abort();
    }, TIMEOUT_MS);

    try {
      const response = await fetch("/api/download-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webVideoUrl,
          videoId,
          platform: platformDetected,
        }),
        signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "다운로드 실패");
      }

      // 동영상 파일 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${platformDetected}_${videoId}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setInput("");
      onClose();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError(timeoutTriggeredRef.current
          ? "다운로드 시간이 초과되었습니다. (90초) 다시 시도해 주세요."
          : "다운로드가 취소되었습니다.");
        return;
      }
      const message = err instanceof Error ? err.message : "다운로드 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      timeoutTriggeredRef.current = false;
      abortControllerRef.current = null;
      setIsDownloading(false);
    }
  };

  const handleExtractSubtitle = async () => {
    setSubtitleError("");

    if (!input.trim()) {
      setSubtitleError("URL을 입력해주세요.");
      return;
    }

    const webVideoUrl = input.trim();
    const platformDetected = detectPlatformFromUrl(webVideoUrl);
    if (!platformDetected) {
      setSubtitleError("지원하지 않는 플랫폼입니다. TikTok 또는 Douyin URL을 입력해주세요.");
      return;
    }

    const videoId = extractVideoIdFromUrl(webVideoUrl) || "video";
    setIsExtractingSubtitle(true);
    subtitleTimeoutTriggeredRef.current = false;
    subtitleAbortControllerRef.current = new AbortController();
    const signal = subtitleAbortControllerRef.current.signal;

    subtitleTimeoutRef.current = setTimeout(() => {
      subtitleTimeoutRef.current = null;
      subtitleTimeoutTriggeredRef.current = true;
      subtitleAbortControllerRef.current?.abort();
    }, TIMEOUT_MS);

    try {
      const response = await fetch("/api/extract-subtitles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webVideoUrl,
          videoId,
          platform: platformDetected,
          format: "text",
        }),
        signal,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "자막 추출 실패");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${platformDetected}_${videoId}_subtitles.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setSubtitleError(subtitleTimeoutTriggeredRef.current
          ? "자막 추출 시간이 초과되었습니다. (90초) 다시 시도해 주세요."
          : "자막 추출이 취소되었습니다.");
        return;
      }
      const message = err instanceof Error ? err.message : "자막 추출 중 오류가 발생했습니다.";
      setSubtitleError(message);
    } finally {
      if (subtitleTimeoutRef.current) {
        clearTimeout(subtitleTimeoutRef.current);
        subtitleTimeoutRef.current = null;
      }
      subtitleTimeoutTriggeredRef.current = false;
      subtitleAbortControllerRef.current = null;
      setIsExtractingSubtitle(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isDownloading && !isExtractingSubtitle && !isLoading) {
      handleDownload();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  const isBusy = isDownloading || isExtractingSubtitle;

  return (
    <>
      <div
        className="download-modal-overlay"
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(24, 24, 27, 0.45)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <div
          className="download-modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "28px 32px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow:
              "0 25px 50px -12px rgba(24, 24, 27, 0.15), 0 0 0 1px rgba(24, 24, 27, 0.06)",
            animation: "slideUp 0.3s ease-out",
            border: "1px solid rgba(167, 139, 250, 0.22)",
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#18181b",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                letterSpacing: "-0.02em",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(192, 132, 252, 0.15) 100%)",
                  color: "#7c3aed",
                }}
              >
                <Sparkles size={22} strokeWidth={2} />
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start" }}>
                <span>영상 자막 추출</span>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "#71717a" }}>숏마마 · URL로 다운로드·자막</span>
              </span>
            </h2>
            <button
              type="button"
              onClick={() => {
                if (isDownloading) handleCancelDownload(true);
                else if (isExtractingSubtitle) handleCancelSubtitle(true);
                else onClose();
              }}
              disabled={isLoading}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: isLoading ? "not-allowed" : "pointer",
                color: "#a1a1aa",
                padding: "0",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.color = "#7c3aed")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#a1a1aa")}
              title={isBusy ? "취소" : "닫기"}
            >
              <X size={20} />
            </button>
          </div>

          {/* 정보 메시지 */}
          <div
            style={{
              padding: "12px 14px",
              backgroundColor: "#f5f3ff",
              border: "1px solid rgba(167, 139, 250, 0.35)",
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "13px",
              color: "#5b21b6",
              lineHeight: 1.5,
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "1px", color: "#7c3aed" }} />
            <div>
              <strong style={{ color: "#6d28d9" }}>TikTok·Douyin</strong> 영상 URL을 붙여넣으면 플랫폼을 자동 감지해 다운로드하거나 자막을 추출합니다.
            </div>
          </div>

          {/* 다운로드 진행 중 표시 */}
          {isDownloading && (
            <div
              style={{
                marginBottom: "12px",
                padding: "12px 14px",
                backgroundColor: "#faf5ff",
                border: "1px solid rgba(167, 139, 250, 0.35)",
                borderRadius: "10px",
                fontSize: "13px",
                color: "#6d28d9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    border: "2px solid rgba(124, 58, 237, 0.2)",
                    borderTop: "2px solid #7c3aed",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                비디오를 다운로드 중입니다... (90초 초과 시 자동 취소)
              </span>
              <button
                type="button"
                onClick={() => handleCancelDownload()}
                style={{
                  padding: "6px 12px",
                  border: "1px solid rgba(24, 24, 27, 0.12)",
                  background: "#ffffff",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#3f3f46",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: "none",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fafafa";
                  e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.35)";
                  e.currentTarget.style.color = "#6d28d9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "rgba(24, 24, 27, 0.12)";
                  e.currentTarget.style.color = "#3f3f46";
                }}
              >
                취소
              </button>
            </div>
          )}

          {/* 자막 추출 진행 중 표시 */}
          {isExtractingSubtitle && (
            <div
              style={{
                marginBottom: "12px",
                padding: "12px 14px",
                backgroundColor: "#faf5ff",
                border: "1px solid rgba(167, 139, 250, 0.35)",
                borderRadius: "10px",
                fontSize: "13px",
                color: "#6d28d9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    display: "inline-block",
                    width: "12px",
                    height: "12px",
                    border: "2px solid rgba(124, 58, 237, 0.2)",
                    borderTop: "2px solid #7c3aed",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                자막을 추출 중입니다... (90초 초과 시 자동 취소)
              </span>
              <button
                type="button"
                onClick={() => handleCancelSubtitle()}
                style={{
                  padding: "6px 12px",
                  border: "1px solid rgba(24, 24, 27, 0.12)",
                  background: "#ffffff",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#3f3f46",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: "none",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fafafa";
                  e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.35)";
                  e.currentTarget.style.color = "#6d28d9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "rgba(24, 24, 27, 0.12)";
                  e.currentTarget.style.color = "#3f3f46";
                }}
              >
                취소
              </button>
            </div>
          )}

          {/* URL 입력 필드 */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#3f3f46",
                marginBottom: "8px",
              }}
            >
              영상 URL
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                const newInput = e.target.value;
                setInput(newInput);
                setError("");
                setSubtitleError("");
                // Detect platform as user types
                setDetectedPlatform(detectPlatformFromUrl(newInput));
              }}
              onKeyDown={handleKeyDown}
              placeholder="https://www.tiktok.com/@gulum323/video/7595183372683463957"
              disabled={isBusy || isLoading}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: (error || subtitleError) ? "2px solid #f87171" : "1px solid rgba(24, 24, 27, 0.12)",
                borderRadius: "10px",
                fontSize: "13px",
                fontFamily: "inherit",
                boxSizing: "border-box",
                backgroundColor: isBusy || isLoading ? "#f4f4f5" : "#fafafa",
                color: "#18181b",
                outline: "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
                marginBottom: "12px",
              }}
              className="download-modal-input"
              onFocus={(e) => {
                if (!error && !subtitleError) {
                  e.currentTarget.style.borderColor = "#7c3aed";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124, 58, 237, 0.12)";
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = (error || subtitleError) ? "#f87171" : "rgba(24, 24, 27, 0.12)";
              }}
            />
            {/* 버튼 행 */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleDownload}
                disabled={isBusy || isLoading || !input.trim()}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "1px solid transparent",
                  background:
                    isBusy || isLoading || !input.trim()
                      ? "rgba(124, 58, 237, 0.22)"
                      : "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: isBusy || isLoading || !input.trim() ? "not-allowed" : "pointer",
                  color: isBusy || isLoading || !input.trim() ? "#a1a1aa" : "#6d28d9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.3s",
                  whiteSpace: "nowrap",
                  boxShadow: isBusy || isLoading || !input.trim() ? "none" : "inset 0 0 0 1px rgba(167, 139, 250, 0.45)",
                }}
                onMouseEnter={(e) => {
                  if (!isBusy && !isLoading && input.trim()) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)";
                    e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(124, 58, 237, 0.45)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isBusy && !isLoading && input.trim()) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)";
                    e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(167, 139, 250, 0.45)";
                  }
                }}
              >
                {isDownloading ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        width: "12px",
                        height: "12px",
                        border: "2px solid rgba(124, 58, 237, 0.25)",
                        borderTop: "2px solid #7c3aed",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    다운로드 중...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    다운로드
                  </>
                )}
              </button>
              <button
                onClick={handleExtractSubtitle}
                disabled={isBusy || isLoading || !input.trim()}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "none",
                  background:
                    isBusy || isLoading || !input.trim()
                      ? "rgba(124, 58, 237, 0.25)"
                      : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: isBusy || isLoading || !input.trim() ? "not-allowed" : "pointer",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.3s",
                  whiteSpace: "nowrap",
                  boxShadow: isBusy || isLoading || !input.trim() ? "none" : "0 4px 14px rgba(124, 58, 237, 0.35)",
                }}
                onMouseEnter={(e) => {
                  if (!isBusy && !isLoading && input.trim()) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isBusy && !isLoading && input.trim()) {
                    e.currentTarget.style.background = "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)";
                  }
                }}
              >
                {isExtractingSubtitle ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        width: "12px",
                        height: "12px",
                        border: "2px solid rgba(255,255,255,0.35)",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    추출 중...
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    자막 추출
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 에러 메시지 - 다운로드 */}
          {error && (
            <div
              style={{
                marginBottom: "12px",
                padding: "12px 14px",
                backgroundColor: "#fef2f2",
                border: "1px solid rgba(248, 113, 113, 0.35)",
                borderRadius: "10px",
                color: "#b91c1c",
                fontSize: "13px",
              }}
            >
              <div style={{ marginBottom: !error.includes("취소") ? "10px" : 0 }}>{error}</div>
              {!error.includes("취소") && (
                <button
                  type="button"
                  onClick={() => setError("")}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid rgba(248, 113, 113, 0.45)",
                    background: "#ffffff",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#b91c1c",
                    cursor: "pointer",
                  }}
                >
                  다시 시도
                </button>
              )}
            </div>
          )}

          {/* 에러 메시지 - 자막 */}
          {subtitleError && (
            <div
              style={{
                marginBottom: "12px",
                padding: "12px 14px",
                backgroundColor: "#fef2f2",
                border: "1px solid rgba(248, 113, 113, 0.35)",
                borderRadius: "10px",
                color: "#b91c1c",
                fontSize: "13px",
              }}
            >
              <div style={{ marginBottom: !subtitleError.includes("취소") ? "10px" : 0 }}>{subtitleError}</div>
              {!subtitleError.includes("취소") && (
                <button
                  type="button"
                  onClick={() => setSubtitleError("")}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid rgba(248, 113, 113, 0.45)",
                    background: "#ffffff",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#b91c1c",
                    cursor: "pointer",
                  }}
                >
                  다시 시도
                </button>
              )}
            </div>
          )}

          {/* 하단 버튼: 진행 중이면 취소, 아니면 닫기 */}
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            {isBusy ? (
              <button
                type="button"
                onClick={() => {
                  if (isDownloading) handleCancelDownload();
                  else handleCancelSubtitle();
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid rgba(248, 113, 113, 0.35)",
                  backgroundColor: "#fef2f2",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  color: "#b91c1c",
                  transition: "all 0.2s",
                  boxShadow: "none",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fee2e2";
                  e.currentTarget.style.borderColor = "rgba(248, 113, 113, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fef2f2";
                  e.currentTarget.style.borderColor = "rgba(248, 113, 113, 0.35)";
                }}
              >
                취소
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid rgba(24, 24, 27, 0.12)",
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  color: "#52525b",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = "#fafafa";
                    e.currentTarget.style.borderColor = "rgba(124, 58, 237, 0.25)";
                    e.currentTarget.style.color = "#6d28d9";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.borderColor = "rgba(24, 24, 27, 0.12)";
                  e.currentTarget.style.color = "#52525b";
                }}
              >
                닫기
              </button>
            )}
          </div>

          <style>{`
            @keyframes slideUp {
              from {
                transform: translateY(20px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    </>
  );
}
