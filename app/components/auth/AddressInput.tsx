'use client'

import { useState, useCallback } from 'react'
import DaumPostcode from 'react-daum-postcode'
import { MapPin, X } from 'lucide-react'

interface AddressInputProps {
  value: {
    zipCode: string
    address: string
    detailAddress: string
  }
  onChange: (address: { zipCode: string; address: string; detailAddress: string }) => void
  error?: string
}

export default function AddressInput({ value, onChange, error }: AddressInputProps) {
  const [showPostcode, setShowPostcode] = useState(false)

  const handleSelectAddress = useCallback(
    (data: any) => {
      onChange({
        zipCode: data.zonecode,
        address: data.address,
        detailAddress: value.detailAddress,
      })
      setShowPostcode(false)
    },
    [onChange, value.detailAddress]
  )

  return (
    <div className="space-y-3">
      {showPostcode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 border border-zinc-200">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <h3 className="text-lg font-semibold text-zinc-900">주소 검색</h3>
              <button
                onClick={() => setShowPostcode(false)}
                className="p-1 hover:bg-zinc-100 rounded transition-colors text-zinc-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[500px] overflow-auto">
              <DaumPostcode onComplete={handleSelectAddress} />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-800 mb-2">
          우편번호 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value.zipCode}
            readOnly
            placeholder="우편번호"
            className="flex-1 px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 placeholder-zinc-400 cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => setShowPostcode(true)}
            className="px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl shadow-md shadow-teal-900/10 hover:shadow-lg transition-all font-semibold"
          >
            검색
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-800 mb-2">
          주소 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.address}
          readOnly
          placeholder="주소"
          className="w-full px-4 py-3 bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 placeholder-zinc-400 cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-800 mb-2">
          상세주소 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.detailAddress}
          onChange={(e) =>
            onChange({
              ...value,
              detailAddress: e.target.value,
            })
          }
          placeholder="상세주소 (예: 101호)"
          className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>

      {value.address && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex gap-3">
          <MapPin size={20} className="text-teal-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-zinc-700">
            <p className="font-medium text-zinc-900">{value.zipCode}</p>
            <p>{value.address}</p>
            {value.detailAddress && <p className="text-zinc-600">{value.detailAddress}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
