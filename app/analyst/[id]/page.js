"use client";
import { useEffect, useState, use } from 'react' // Import 'use' to unwrap params
import { supabase } from '../../../lib/supabaseClient'
import Link from 'next/link'

export default function AnalystDetail({ params }) {
  // Unwrap params using React.use() - Required for Next.js 15+ (and safe for 13/14)
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [analyst, setAnalyst] = useState(null)
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Default to today
    type: 'Call',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    setLoading(true)
    
    // 1. Fetch Analyst Profile
    const { data: analystData } = await supabase
      .from('analysts')
      .select('*')
      .eq('id', id)
      .single()

    setAnalyst(analystData)

    // 2. Fetch Interactions History
    const { data: interactionData } = await supabase
      .from('interactions')
      .select('*')
      .eq('analyst_id', id)
      .order('date', { ascending: false }) // Newest on top

    setInteractions(interactionData || [])
    setLoading(false)
  }

  const handleSaveInteraction = async (e) => {
    e.preventDefault()

    // A. Insert the Interaction
    const { error: insertError } = await supabase
      .from('interactions')
      .insert([{
        analyst_id: id,
        date: formData.date,
        type: formData.type,
        notes: formData.notes
      }])

    if (insertError) {
      alert('Error saving interaction')
      return
    }

    // B. Update the Parent Analyst's Last Contact Date
    // Only update if the new interaction is more recent than the existing date
    const currentLastContact = analyst.last_contact_date ? new Date(analyst.last_contact_date) : new Date('1970-01-01');
    const newContactDate = new Date(formData.date);

    if (newContactDate >= currentLastContact) {
       await supabase
        .from('analysts')
        .update({ last_contact_date: formData.date })
        .eq('id', id)
    }

    // C. Cleanup and Refresh
    setFormData({ date: new Date().toISOString().split('T')[0], type: 'Call', notes: '' })
    setIsFormOpen(false)
    fetchData() // Refresh UI
  }

  if (loading) return <div className="p-8 text-center">Loading profile...</div>
  if (!analyst) return <div className="p-8 text-center">Analyst not found</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          &larr; Back to Dashboard
        </Link>

        {/* TOP SECTION: Analyst Profile */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{analyst.name}</h1>
              <p className="text-xl text-gray-500">{analyst.firm}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-2">
                {analyst.tier}
              </span>
              <p className="text-sm text-gray-500">Sentiment: <strong>{analyst.sentiment_score}/10</strong></p>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: Log New Interaction */}
        <div className="mb-8">
          {!isFormOpen ? (
             <button 
               onClick={() => setIsFormOpen(true)}
               className="w-full py-3 bg-white border-2 border-dashed border-gray-300 text-gray-500 font-semibold rounded-lg hover:border-blue-500 hover:text-blue-500 transition-colors"
             >
               + Log New Interaction
             </button>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-blue-100">
              <h3 className="font-bold text-lg mb-4">New Interaction</h3>
              <form onSubmit={handleSaveInteraction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Date</label>
                    <input 
                      type="date" required 
                      className="w-full border p-2 rounded"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Type</label>
                    <select 
                      className="w-full border p-2 rounded bg-white"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                      <option>Call</option>
                      <option>Email</option>
                      <option>Meeting</option>
                      <option>Conference</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase text-gray-500 font-bold mb-1">Notes</label>
                  <textarea 
                    required rows="3"
                    className="w-full border p-2 rounded"
                    placeholder="Discussed Q3 earnings..."
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
                  >
                    Save Interaction
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: Timeline */}
        <h2 className="text-xl font-bold text-gray-800 mb-6">Interaction History</h2>
        
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-200 before:opacity-50">
          
          {interactions.map((interaction) => (
            <div key={interaction.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              {/* Timeline Dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:static">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              
              {/* Content Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-gray-200 shadow-sm ml-14 md:ml-0">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <span className="font-bold text-gray-900">{interaction.type}</span>
                  <time className="font-caveat font-medium text-indigo-500">{interaction.date}</time>
                </div>
                <div className="text-gray-600 text-sm">
                  {interaction.notes}
                </div>
              </div>

            </div>
          ))}

          {interactions.length === 0 && (
            <p className="pl-14 text-gray-400 italic">No interactions logged yet.</p>
          )}

        </div>

      </div>
    </div>
  )
}