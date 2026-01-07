"use client";

import { useState } from 'react'
import DashboardSummary from '../components/DashboardSummary'
import AddAnalyst from '../components/AddAnalyst'
import AnalystList from '../components/AnalystList'

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Analyst Tracking Dashboard
        </h1>

        {/* 1. Summary Cards */}
        <DashboardSummary key={refreshKey} /> 
        
        {/* 2. Add Form */}
        <AddAnalyst onAnalystAdded={handleRefresh} />
        
        {/* 3. Analyst List */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Current Analysts</h2>
          <AnalystList keyProp={refreshKey} />
        </div>
      </div>
    </main>
  )
}