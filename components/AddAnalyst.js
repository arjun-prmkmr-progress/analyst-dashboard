import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AddAnalyst({ onAnalystAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    firm: '',
    tier: 'Tier 1', // Default selection
    last_contact_date: '',
    sentiment_score: 5 // Default value
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('analysts')
      .insert([formData])

    setLoading(false)

    if (error) {
      console.error(error)
      alert('Error inserting data')
    } else {
      // Reset form
      setFormData({
        name: '',
        firm: '',
        tier: 'Tier 1',
        last_contact_date: '',
        sentiment_score: 5
      })
      if (onAnalystAdded) onAnalystAdded()
    }
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Analyst</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Name */}
        <div className="col-span-1">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Name</label>
          <input
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Smith"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Firm */}
        <div className="col-span-1">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Firm</label>
          <input
            required
            name="firm"
            value={formData.firm}
            onChange={handleChange}
            placeholder="Goldman Sachs"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Tier (Dropdown) */}
        <div className="col-span-1">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tier</label>
          <select
            name="tier"
            value={formData.tier}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="Tier 1">Tier 1</option>
            <option value="Tier 2">Tier 2</option>
            <option value="Tier 3">Tier 3</option>
          </select>
        </div>

        {/* Last Contact Date */}
        <div className="col-span-1">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Last Contact</label>
          <input
            type="date"
            name="last_contact_date"
            value={formData.last_contact_date}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Sentiment Score */}
        <div className="col-span-1">
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Sentiment (1-10)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            name="sentiment_score"
            value={formData.sentiment_score}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Submit Button */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end mt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors"
          >
            {loading ? 'Saving...' : 'Save Analyst'}
          </button>
        </div>

      </form>
    </div>
  )
}