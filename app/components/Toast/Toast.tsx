'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react'
import './Toast.css'

const EASE_OUT = [0.22, 1, 0.36, 1] as const
const EASE_IN = [0.4, 0, 0.2, 1] as const

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}

interface ToastProps {
  toasts: Toast[]
  onRemove: (id: string) => void
  position?: 'top-center' | 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
}

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={20} />
    case 'error':
    case 'warning':
      return <AlertTriangle size={20} />
    case 'info':
      return <Info size={20} />
    default:
      return <AlertTriangle size={20} />
  }
}

const getIconColor = (type: ToastType): string => {
  switch (type) {
    case 'error':
      return '#dc2626'
    case 'warning':
      return '#d97706'
    case 'success':
      return '#7c3aed'
    case 'info':
      return '#9333ea'
    default:
      return '#52525b'
  }
}

export default function Toast({ toasts, onRemove, position = 'top-center' }: ToastProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className={`toast-container ${position}`}>
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className="toast-wrapper"
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.96 }
            }
            animate={
              reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0.12 } }
                : {
                    opacity: 0,
                    y: -6,
                    scale: 0.985,
                    transition: { duration: 0.34, ease: EASE_IN },
                  }
            }
            transition={{
              duration: reduceMotion ? 0.12 : 0.45,
              ease: EASE_OUT,
            }}
          >
            <div
              className={`toast-content toast-content--${toast.type}`}
            >
              <div className="toast-body">
                <div className="toast-icon" style={{ color: getIconColor(toast.type) }}>
                  {getIcon(toast.type)}
                </div>
                <div className="toast-message-wrapper">
                  {toast.title && (
                    <div className="toast-title">{toast.title}</div>
                  )}
                  <div className="toast-message">{toast.message}</div>
                </div>
              </div>
              <button
                className="toast-close"
                onClick={() => onRemove(toast.id)}
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
