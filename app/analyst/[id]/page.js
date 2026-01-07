"use client";
import { useEffect, useState, use } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import Link from 'next/link'

export default function AnalystDetail({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [analyst, setAnalyst] = useState(null)
  const [interactions, setInteractions] = useState([])
  const [mentions, setMentions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('interactions')
  
  // Interaction Form State
  const [isInteractionFormOpen, setIsInteractionFormOpen] = useState(false)
  const [interactionData, setInteractionData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Call',
    notes: ''
  })

  // Mention Form State
  const [isMentionFormOpen, setIsMentionFormOpen] = useState(false)
  const [mentionData, setMentionData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    url: '',
    summary: ''
  })

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    setLoading(true)
    
    // 1. Fetch Analyst
    const { data: analystData } = await supabase
      .from('analysts')
      .select('*')
      .eq('id', id)
      .single()
    setAnalyst(analystData)

    // 2. Fetch Interactions
    const { data: interactionData } = await supabase
      .from('interactions')
      .select('*')
      .eq('analyst_id', id)
      .order('date', { ascending: false })
    setInteractions(interactionData || [])

    // 3. Fetch Mentions
    const { data: reportData } = await supabase
      .from('reports')
      .select('*')
      .eq('analyst_id', id)
      .order('report_date', { ascending: false })
    setMentions(reportData || [])

    setLoading(false)
  }

  // --- SAVE INTERACTION ---
  const handleSaveInteraction = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('interactions').insert([{
        analyst_id: id,
        date: interactionData.date,
        type: interactionData.type,
        notes: interactionData.notes
    }])
    if (error) alert('Error saving interaction')
    else {
      // Update parent date logic
      const current = analyst.last_contact_date ? new Date(analyst.last_contact_date) : new Date('1970-01-01');
      const newDate = new Date(interactionData.date);
      if (newDate >= current) {
         await supabase.from('analysts').update({ last_contact_date: interactionData.date }).eq('id', id)
      }
      setIsInteractionFormOpen(false)
      setInteractionData({ ...interactionData, notes: '' })
      fetchData()
    }
  }

  // --- SAVE MENTION ---
  const handleSaveMention = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('reports').insert([{
        analyst_id: id,
        title: mentionData.title,
        report_date: mentionData.date,
        url: mentionData.url,
        summary: mentionData.summary
    }])
    if (error) {
      console.error(error)
      alert('Error saving mention')
    } else {
      setIsMentionFormOpen(false)
      setMentionData({ title: '', date: new Date().toISOString().split('T')[0], url: '', summary: '' })
      fetchData()
    }
  }

  if (loading) return <div className="p-8 text-center">Loading profile...</div>
  if (!analyst) return <div className="p-8 text-center">Analyst not found</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Dashboard</Link>

        {/* PROFILE HEADER */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{analyst.name}</h1>
              <p className="text-xl text-gray-500">{analyst.firm}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-2">{analyst.tier}</span>
              <p className="text-sm text-gray-500">Sentiment: <strong>{analyst.sentiment_score}/10</strong></p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-200 mb-6">
          <button 
            onClick={() => setActiveTab('interactions')}
            className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === 'interactions' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Interactions ({interactions.length})
          </button>
          <button 
            onClick={() => setActiveTab('mentions')}
            className={`pb-3 px-4 font-medium text-sm transition-colors relative ${activeTab === 'mentions' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Report Mentions ({mentions.length})
          </button>
        </div>

        {/* === TAB CONTENT: INTERACTIONS === */}
        {activeTab === 'interactions' && (
          <div>
            {!isInteractionFormOpen ? (
              <button onClick={() => setIsInteractionFormOpen(true)} className="w-full py-3 bg-white border-2 border-dashed border-gray-300 text-gray-500 font-semibold rounded-lg hover:border-blue-500 hover:text-blue-500 transition-colors mb-8">
                + Log New Interaction
              </button>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-lg border border-blue-100 mb-8">
                <h3 className="font-bold text-lg mb-4">New Interaction</h3>
                <form onSubmit={handleSaveInteraction} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Fixed Input Colors */}
                    <input 
                      type="date" required 
                      className="border p-2 rounded bg-white text-gray-900 w-full" 
                      value={interactionData.date} 
                      onChange={e => setInteractionData({...interactionData, date: e.target.value})} 
                    />
                    <select 
                      className="border p-2 rounded bg-white text-gray-900 w-full" 
                      value={interactionData.type} 
                      onChange={e => setInteractionData({...interactionData, type: e.target.value})}
                    >
                      <option>Call</option><option>Email</option><option>Meeting</option>
                    </select>
                  </div>
                  <textarea 
                    required rows="2" 
                    className="w-full border p-2 rounded bg-white text-gray-900" 
                    placeholder="Notes..." 
                    value={interactionData.notes} 
                    onChange={e => setInteractionData({...interactionData, notes: e.target.value})}
                  ></textarea>
                  <div className="flex justify-end space-x-2">
                    <button type="button" onClick={() => setIsInteractionFormOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 before:bg-gray-200">
              {interactions.map((int) => (
                <div key={int.id} className="relative flex items-start pl-14">
                  <div className="absolute left-0 w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow text-slate-500 text-xs font-bold">
                    {int.type[0]}
                  </div>
                  <div className="bg-white p-4 rounded border border-gray-200 shadow-sm w-full">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-gray-900">{int.type}</span>
                      <span className="text-gray-400 text-sm">{int.date}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{int.notes}</p>
                  </div>
                </div>
              ))}
              {interactions.length === 0 && <p className="pl-14 text-gray-400">No interactions yet.</p>}
            </div>
          </div>
        )}

        {/* === TAB CONTENT: REPORT MENTIONS === */}
        {activeTab === 'mentions' && (
          <div>
            {!isMentionFormOpen ? (
              <button onClick={() => setIsMentionFormOpen(true)} className="w-full py-3 bg-white border-2 border-dashed border-purple-300 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors mb-8">
                + Log Report Mention
              </button>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-lg border border-purple-100 mb-8">
                <h3 className="font-bold text-lg mb-4 text-purple-700">Log a Mention</h3>
                <form onSubmit={handleSaveMention} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Report Name</label>
                      {/* Fixed Input Colors */}
                      <input 
                        required type="text" 
                        className="w-full border p-2 rounded bg-white text-gray-900" 
                        placeholder="e.g. Magic Quadrant for Cloud AI" 
                        value={mentionData.title} 
                        onChange={e => setMentionData({...mentionData, title: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Published Date</label>
                      <input 
                        type="date" required 
                        className="w-full border p-2 rounded bg-white text-gray-900" 
                        value={mentionData.date} 
                        onChange={e => setMentionData({...mentionData, date: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Report Link (Optional)</label>
                    <input 
                      type="url" 
                      className="w-full border p-2 rounded bg-white text-gray-900" 
                      placeholder="https://gartner.com/..." 
                      value={mentionData.url} 
                      onChange={e => setMentionData({...mentionData, url: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Mention Details / Quote</label>
                    <textarea 
                      rows="3" 
                      className="w-full border p-2 rounded bg-white text-gray-900" 
                      placeholder="e.g. They highlighted our new feature as a market differentiator..." 
                      value={mentionData.summary} 
                      onChange={e => setMentionData({...mentionData, summary: e.target.value})}
                    ></textarea>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button type="button" onClick={() => setIsMentionFormOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Save Mention</button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid gap-4">
              {mentions.map((rpt) => (
                <div key={rpt.id} className="bg-white p-5 rounded-lg border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">{rpt.title}</h4>
                      <p className="text-sm text-gray-500 mb-2">Published: {rpt.report_date}</p>
                    </div>
                    {rpt.url && (
                      <a href={rpt.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-600 transition-colors">
                        View Report ↗
                      </a>
                    )}
                  </div>
                  {rpt.summary && (
                    <div className="mt-3 bg-purple-50 p-3 rounded text-sm text-purple-900 italic border border-purple-100">
                      "{rpt.summary}"
                    </div>
                  )}
                </div>
              ))}
              {mentions.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-gray-400">No report mentions logged yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}