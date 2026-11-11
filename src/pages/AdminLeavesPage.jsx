import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getAllLeaves, reviewLeave } from '../lib/db'
import { format } from 'date-fns'

export default function AdminLeavesPage() {
  const { profile } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [reviewing, setReviewing] = useState(null)
  const [reviewNote, setReviewNote] = useState('')
  const [acting, setActing] = useState(false)

  useEffect(() => {
    loadLeaves()
  }, [])

  async function loadLeaves() {
    const data = await getAllLeaves()
    setLeaves(data)
    setLoading(false)
  }

  async function handleReview(leaveId, status) {
    setActing(true)
    try {
      await reviewLeave(leaveId, status, reviewNote, profile.name)
      setReviewing(null)
      setReviewNote('')
      await loadLeaves()
    } catch {
      alert('Could not update leave status.')
    } finally {
      setActing(false)
    }
  }

  const filtered = leaves.filter(l => filter === 'all' ? true : l.status === filter)

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Leave Approvals</h1>
        <p className="text-sm text-slate-400 mt-0.5">Review and act on leave applications</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-0.5 w-fit">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {f}
            {f !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({leaves.filter(l => l.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">No {filter} applications.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(l => (
            <div key={l.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center">
                      {l.userName?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-800">{l.userName}</span>
                    <span className="text-slate-400 text-xs">{l.department}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">{l.type}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {format(new Date(l.startDate), 'd MMM yyyy')} — {format(new Date(l.endDate), 'd MMM yyyy')}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{l.reason}</p>
                  {l.reviewNote && (
                    <p className="text-xs text-slate-400 mt-1 italic">Review note: {l.reviewNote}</p>
                  )}
                  {l.reviewedBy && (
                    <p className="text-xs text-slate-400 mt-0.5">Reviewed by {l.reviewedBy}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={
                    l.status === 'pending' ? 'badge-pending' :
                    l.status === 'approved' ? 'badge-present' : 'badge-absent'
                  }>
                    {l.status}
                  </span>
                  {l.status === 'pending' && (
                    <button
                      onClick={() => setReviewing(reviewing === l.id ? null : l.id)}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>

              {reviewing === l.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="label">Review note (optional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Leave a note for the employee…"
                      value={reviewNote}
                      onChange={e => setReviewNote(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(l.id, 'approved')}
                      disabled={acting}
                      className="btn-primary text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(l.id, 'rejected')}
                      disabled={acting}
                      className="btn-danger text-sm"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setReviewing(null)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
