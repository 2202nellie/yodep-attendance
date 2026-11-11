import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { applyLeave, getUserLeaves } from '../lib/db'
import { format } from 'date-fns'

const LEAVE_TYPES = ['Annual leave', 'Sick leave', 'Unpaid leave', 'Compassionate leave', 'Maternity/Paternity leave']

const statusBadge = {
  pending: 'badge-pending',
  approved: 'badge-present',
  rejected: 'badge-absent',
}

export default function LeavePage() {
  const { user, profile } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')

  const [form, setForm] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
  })

  useEffect(() => {
    loadLeaves()
  }, [user])

  async function loadLeaves() {
    if (!user) return
    const data = await getUserLeaves(user.uid)
    setLeaves(data)
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await applyLeave(user.uid, profile.name, profile.department, form)
      setMsg('Leave application submitted.')
      setShowForm(false)
      setForm({ type: '', startDate: '', endDate: '', reason: '' })
      await loadLeaves()
    } catch {
      setMsg('Could not submit. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Leave</h1>
          <p className="text-sm text-slate-400 mt-0.5">Apply for and track your leave requests</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Apply for leave'}
        </button>
      </div>

      {msg && <p className="text-sm text-emerald-700 bg-emerald-50 px-4 py-3 rounded-lg">{msg}</p>}

      {/* Application form */}
      {showForm && (
        <div className="card p-5">
          <h2 className="font-medium text-slate-800 mb-4">New leave application</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Leave type</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
                <option value="">Select type…</option>
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start date</label>
                <input type="date" className="input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div>
                <label className="label">End date</label>
                <input type="date" className="input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} min={form.startDate} required />
              </div>
            </div>
            <div>
              <label className="label">Reason</label>
              <textarea className="input resize-none" rows={3} placeholder="Briefly describe the reason for your leave…" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Submitting…' : 'Submit application'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Leave history */}
      {leaves.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <p>No leave applications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map(l => (
            <div key={l.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={statusBadge[l.status] || 'badge-pending'}>{l.status}</span>
                    <span className="text-sm font-medium text-slate-700">{l.type}</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {format(new Date(l.startDate), 'd MMM yyyy')} — {format(new Date(l.endDate), 'd MMM yyyy')}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{l.reason}</p>
                  {l.reviewNote && (
                    <p className="text-xs text-slate-500 mt-1 italic">HR note: {l.reviewNote}</p>
                  )}
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0">
                  {l.createdAt ? format(l.createdAt.toDate(), 'd MMM') : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
