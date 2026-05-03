import React from 'react'
import { BadgeCheck, ShieldCheck, Star } from 'lucide-react'

export const getTrustBadge = (score) => {
  const normalizedScore = Number(score) || 0

  if (normalizedScore >= 200) {
    return {
      label: 'Chuyên gia',
      className: 'text-purple-600 bg-purple-50 border-purple-100',
      icon: <Star size={10} fill="currentColor" />,
    }
  }

  if (normalizedScore >= 100) {
    return {
      label: 'Uy tín cao',
      className: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      icon: <BadgeCheck size={10} />,
    }
  }

  if (normalizedScore >= 50) {
    return {
      label: 'Tin cậy',
      className: 'text-blue-600 bg-blue-50 border-blue-100',
      icon: <ShieldCheck size={10} />,
    }
  }

  return {
    label: 'Thành viên',
    className: 'text-slate-500 bg-slate-50 border-slate-200',
    icon: <ShieldCheck size={10} />,
  }
}
