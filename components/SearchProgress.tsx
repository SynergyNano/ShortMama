"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, X } from "lucide-react";

interface SearchProgressProps {
  isSearching: boolean;
  onCancel: () => void;
  jobStatus?: "waiting" | "active" | "delayed" | "paused";
  realProgress?: number;
  queuePosition?: number;
  totalQueueSize?: number;
  statusMessage?: string;
  estimatedWaitSeconds?: number;
}

export function SearchProgress({
  isSearching,
  onCancel,
  jobStatus,
  realProgress,
  queuePosition,
  totalQueueSize,
  statusMessage: apiStatusMessage,
  estimatedWaitSeconds,
}: SearchProgressProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const maxProgressRef = useRef(0);

  useEffect(() => {
    if (!isSearching) {
      setElapsedSeconds(0);
      maxProgressRef.current = 0;
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSearching]);

  const visualState = jobStatus === "active" ? "ACTIVE" : "QUEUED";

  // 진행률은 절대 감소하지 않도록 유지 (깜빡임 방지)
  const rawProgress = realProgress ?? (visualState === "ACTIVE" ? 10 : 5);
  const stableProgress = Math.max(rawProgress, maxProgressRef.current);
  if (rawProgress > maxProgressRef.current) {
    maxProgressRef.current = rawProgress;
  }
  const displayProgress = Math.min(Math.max(stableProgress, visualState === "ACTIVE" ? 8 : 5), 99);

  const queueMessage =
    queuePosition && totalQueueSize ? `Position ${queuePosition} of ${totalQueueSize}` : queuePosition ? `Position ${queuePosition}` : null;

  const isFirstInQueue = queuePosition === 1 && visualState === "QUEUED";
  const elapsedExceedsEstimate = estimatedWaitSeconds && elapsedSeconds > estimatedWaitSeconds;

  let displayMessage = apiStatusMessage;
  if (!displayMessage) {
    if (elapsedExceedsEstimate) {
      displayMessage = "Processing...";
    } else if (isFirstInQueue) {
      displayMessage = "Starting worker...";
    } else if (visualState === "QUEUED") {
      displayMessage = "Waiting in queue...";
    } else {
      displayMessage = "Processing your request...";
    }
  }

  const showEstimatedWait = estimatedWaitSeconds && !elapsedExceedsEstimate;

  return (
    <div className={`search-progress-container ${visualState.toLowerCase()}`}>
      <div className="progress-content">
        {visualState === "QUEUED" && queuePosition ? (
          <>
            <div className="queue-position-display">
              <div className="queue-number">{queuePosition}</div>
              {totalQueueSize && <div className="queue-total">of {totalQueueSize}</div>}
            </div>
            {queueMessage && <p className="queue-message">{queueMessage}</p>}
            {showEstimatedWait && <p className="estimated-wait">Estimated wait: {Math.ceil(estimatedWaitSeconds)}s</p>}
          </>
        ) : (
          <>
            <div className="spinner-container">
              <Loader2 className="spinner-icon animate-spin" />
              <span className="elapsed-time">{elapsedSeconds}s</span>
            </div>
          </>
        )}

        <p className="status-message">{displayMessage}</p>

        <div className="progress-bar-container">
          <div
            className={`progress-bar-fill ${visualState.toLowerCase()}`}
            style={{ width: `${displayProgress}%` }}
          />
        </div>

        <button type="button" onClick={onCancel} className="cancel-button">
          <X className="w-4 h-4" strokeWidth={2} aria-hidden />
          검색 취소
        </button>
      </div>

      <style jsx>{`
        @keyframes queuePulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.92;
            transform: scale(1.01);
          }
        }

        .search-progress-container {
          margin: 24px 0;
          padding: 28px 32px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(24, 24, 27, 0.08);
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(24, 24, 27, 0.06), 0 0 0 1px rgba(124, 58, 237, 0.06);
          transition: box-shadow 0.3s ease, border-color 0.3s ease;
        }

        .search-progress-container.queued {
          border-color: rgba(124, 58, 237, 0.2);
        }

        .search-progress-container.active {
          border-color: rgba(124, 58, 237, 0.28);
          box-shadow: 0 8px 32px rgba(124, 58, 237, 0.08), 0 0 0 1px rgba(124, 58, 237, 0.08);
        }

        .progress-content {
          max-width: 480px;
          margin: 0 auto;
          text-align: center;
        }

        .queue-position-display {
          margin-bottom: 20px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(192, 132, 252, 0.06) 100%);
          border: 1px solid rgba(124, 58, 237, 0.18);
          border-radius: 14px;
        }

        .queue-number {
          font-size: 44px;
          font-weight: 700;
          color: #6d28d9;
          line-height: 1;
          letter-spacing: -0.03em;
          animation: queuePulse 1.5s ease-in-out infinite;
        }

        .queue-total {
          font-size: 14px;
          color: rgba(24, 24, 27, 0.45);
          margin-top: 6px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .queue-message {
          font-size: 13px;
          font-weight: 600;
          color: #7c3aed;
          margin-bottom: 10px;
          margin-top: 12px;
          letter-spacing: 0.02em;
        }

        .estimated-wait {
          font-size: 12px;
          color: rgba(24, 24, 27, 0.45);
          margin: 0;
          margin-top: 8px;
          font-weight: 500;
        }

        .spinner-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .spinner-icon {
          width: 22px;
          height: 22px;
          color: #7c3aed;
          opacity: 0.95;
        }

        .elapsed-time {
          font-size: 20px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: #3f3f46;
          letter-spacing: -0.02em;
        }

        .status-message {
          font-size: 13px;
          font-weight: 600;
          color: rgba(24, 24, 27, 0.72);
          margin-bottom: 22px;
          margin-top: 4px;
          letter-spacing: 0.01em;
          line-height: 1.5;
        }

        .progress-bar-container {
          width: 100%;
          height: 8px;
          background-color: rgba(24, 24, 27, 0.06);
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 9999px;
          background: linear-gradient(90deg, #7c3aed 0%, #a855f7 45%, #c026d3 100%);
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: width;
        }

        .progress-bar-fill.queued {
          opacity: 0.88;
        }

        .progress-bar-fill.active {
          opacity: 1;
          box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.15);
        }

        .cancel-button {
          margin-top: 4px;
          padding: 10px 20px;
          background: #ffffff;
          border: 1px solid rgba(24, 24, 27, 0.12);
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #52525b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }

        .cancel-button:hover {
          background: #fafafa;
          border-color: rgba(124, 58, 237, 0.35);
          color: #6d28d9;
          box-shadow: 0 2px 8px rgba(24, 24, 27, 0.06);
        }

        .cancel-button:active {
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .search-progress-container {
            margin: 16px 0;
            padding: 20px;
            border-radius: 14px;
          }
          .queue-number {
            font-size: 34px;
          }
          .elapsed-time {
            font-size: 18px;
          }
          .status-message {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
