import { useEffect, useState } from 'react'
import Link from 'next/link' // <--- 1. We import Link here
import { supabase } from '../lib/supabaseClient'

export default function AnalystList({ keyProp }) {
  const [analysts, setAnalysts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalysts()
  }, [keyProp])

  async function fetchAnalysts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('analysts')
      .select('*')
    
    if (error) {
      console.error('Error fetching:', error)
    } else {
      const sortedData = sortAnalysts(data)
      setAnalysts(sortedData)
    }
    setLoading(false)
  }

  // --- LOGIC HELPERS ---

  const getDaysElapsed = (dateString) => {
    if (!dateString) return Infinity
    const lastContact = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today - lastContact)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
  }

  const getHealthStatus = (tier, dateString) => {
    const days = getDaysElapsed(dateString)
    if (tier === 'Tier 1' && days > 30) return 'OVERDUE'
    if (tier === 'Tier 2' && days > 60) return 'NEEDS_UPDATE'
    return 'HEALTHY'
  }

  const sortAnalysts = (data) => {
    const priority = { 'OVERDUE': 0, 'NEEDS_UPDATE': 1, 'HEALTHY': 2 }
    return data.sort((a, b) => {
      const statusA = getHealthStatus(a.tier, a.last_contact_date)
      const statusB = getHealthStatus(b.tier, b.last_contact_date)
      return priority[statusA] - priority[statusB]
    })
  }

  // --- UI HELPERS ---

  const renderBadge = (status) => {
    if (status === 'OVERDUE') {
      return <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-800 border border-red-200">Overdue</span>
    }
    if (status === 'NEEDS_UPDATE') {
      return <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-800 border border-yellow-200">Needs Update</span>
    }
    return <span className="px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-800 border border-green-200">Healthy</span>
  }

  if (loading) return <div className="text-center py-4 text-gray-500">Loading data...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {analysts.map((item) => {
        const status = getHealthStatus(item.tier, item.last_contact_date)
        const daysAgo = getDaysElapsed(item.last_contact_date)

        return (
          // <--- 2. The Link starts here and wraps the entire card
          <Link href={`/analyst/${item.id}`} key={item.id} className="block group"> 
            
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 group-hover:shadow-md group-hover:border-blue-300 transition-all relative overflow-hidden h-full">
              
              {/* Color Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                status === 'OVERDUE' ? 'bg-red-500' : 
                status === 'NEEDS_UPDATE' ? 'bg-yellow-400' : 'bg-green-500'
              }`}></div>

              <div className="flex justify-between items-start mb-2 pl-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                  <p className="text-sm text-gray-500 font-medium">{item.firm}</p>
                </div>
                {renderBadge(status)}
              </div>
              
              <div className="mt-4 space-y-2 pl-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Tier:</span>
                  <span className="font-semibold text-gray-700">{item.tier}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Last Contact:</span>
                  <div className="text-right">
                    <span className="block font-medium text-gray-800">
                      {item.last_contact_date || 'Never'}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({daysAgo === Infinity ? 'N/A' : `${daysAgo} days ago`})
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Sentiment:</span>
                  <span className="font-medium text-gray-800">{item.sentiment_score}/10</span>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
      
      {analysts.length === 0 && (
        <p className="text-gray-500 col-span-full text-center">No analysts recorded yet.</p>
      )}
    </div>
  )
}