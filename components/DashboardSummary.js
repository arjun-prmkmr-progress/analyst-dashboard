import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function DashboardSummary() {
  const [metrics, setMetrics] = useState({
    total: 0,
    healthScore: 0,
    criticalActions: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calculateMetrics()
  }, [])

  async function calculateMetrics() {
    const { data: analysts, error } = await supabase
      .from('analysts')
      .select('*')

    if (error || !analysts) {
      setLoading(false)
      return
    }

    const total = analysts.length
    let overdueCount = 0
    let criticalCount = 0

    const today = new Date()

    analysts.forEach((a) => {
      // 1. Calculate Days Elapsed
      const lastContact = a.last_contact_date ? new Date(a.last_contact_date) : new Date('1970-01-01')
      const diffTime = Math.abs(today - lastContact)
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // 2. Determine Status
      const isTier1 = a.tier === 'Tier 1'
      // Definition of "Overdue" (Red)
      const isOverdue = (isTier1 && days > 30) 

      // 3. Update Counts
      if (isOverdue) {
        overdueCount++
        if (isTier1) criticalCount++ // Technically all Overdue are Tier 1 in this logic, but good to be explicit
      }
    })

    // Health Score: % of analysts who are NOT overdue
    // Avoid division by zero
    const healthScore = total === 0 ? 100 : Math.round(((total - overdueCount) / total) * 100)

    setMetrics({
      total,
      healthScore,
      criticalActions: criticalCount
    })
    setLoading(false)
  }

  // Helper for Circular Progress (SVG)
  const CircleChart = ({ percentage }) => {
    const radius = 30
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference
    
    // Color logic for the ring
    const color = percentage >= 80 ? 'text-green-500' : percentage >= 50 ? 'text-yellow-500' : 'text-red-500'

    return (
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Ring */}
          <circle
            cx="50%" cy="50%" r={radius}
            stroke="currentColor" strokeWidth="6" fill="transparent"
            className="text-gray-200"
          />
          {/* Progress Ring */}
          <circle
            cx="50%" cy="50%" r={radius}
            stroke="currentColor" strokeWidth="6" fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${color} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-700">{percentage}%</span>
        </div>
      </div>
    )
  }

  if (loading) return <div className="animate-pulse h-32 bg-gray-200 rounded-lg mb-8"></div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      
      {/* CARD 1: Total Analysts */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Analysts</p>
          <p className="text-4xl font-extrabold text-gray-900 mt-2">{metrics.total}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-full text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      </div>

      {/* CARD 2: Relationship Health */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Relationship Health</p>
          <p className="text-sm text-gray-400 mt-1">Analysts not overdue</p>
        </div>
        <CircleChart percentage={metrics.healthScore} />
      </div>

      {/* CARD 3: Critical Actions */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Critical Actions</p>
          <p className="text-xs text-red-500 mt-1 font-semibold">Tier 1 Overdue</p>
          <p className="text-4xl font-extrabold text-red-600 mt-1">{metrics.criticalActions}</p>
        </div>
        <div className="p-3 bg-red-50 rounded-full text-red-600 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>

    </div>
  )
}