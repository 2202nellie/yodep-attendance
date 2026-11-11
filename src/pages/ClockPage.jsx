import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getTodayRecord, clockIn, clockOut, markAbsent } from '../lib/db'
import { format } from 'date-fns'

const ABSENCE_REASONS = [
  'Sick leave',
  'Family emergency',
  'Personal reasons',
  'Travel',
  'Other',
]

export default function ClockPage() {
  const { user, profile } = useAuth()
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [now, setNow] = useState(new Date())
  const [showAbsent, setShowAbsent] = useState(false)
  const [absenceReason, setAbsenceReason] = useState('')
  const [absenceNote, setAbsenceNote] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadRecord()
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [user])

  async function loadRecord() {
    if (!user) return
    const r = await getTodayRecord(user.uid)
    setRecord(r)
    setLoading(false)
  }

  async function handleClockIn() {
    setActing(true)
    try {
      await clockIn(user.uid, profile.name, profile.department)
      setMsg('Clocked in successfully.')
      await loadRecord()
    } catch (e) {
      setMsg('Something went wrong. Please try again.')
    } finally {
      setActing(false)
    }
  }

  async function handleClockOut() {
    setActing(true)
    try {
      await clockOut(user.uid)
      setMsg('Clocked out successfully.')
      await loadRecord()
    } catch (e) {
      setMsg('Something went wrong. Please try again.')
    } finally {
      setActing(false)
    }
  }

  async function handleMarkAbsent() {
    if (!absenceReason) return
    setActing(true)
    const reason = absenceNote ? `${absenceReason}: ${absenceNote}` : absenceReason
    try {
      await markAbsent(user.uid, profile.name, profile.department, reason)
      setMsg('Absence recorded.')
      setShowAbsent(false)
      await loadRecord()
    } catch {
      setMsg('Something went wrong.')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>

  const isClockedIn = record?.clockIn && !record?.clockOut
  const isClockedOut = record?.clockIn && record?.clockOut
  const isAbsent = record?.status === 'absent'

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Clock In / Out</h1>
        <p className="text-sm text-slate-400 mt-0.5">{format(now, 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Clock display */}
      <div className="card p-8 text-center">
        <p className="text-5xl font-bold text-slate-800 tabular-nums tracking-tight">
          {format(now, 'HH:mm')}
        </p>
        <p className="text-slate-400 text-sm mt-1">{format(now, 'ss')}s</p>
      </div>

      {/* Status + actions */}
      <div className="card p-5 space-y-4">
        {!record && (
          <>
            <p className="text-slate-600 text-sm">You have not clocked in today.</p>
            <div className="flex gap-3">
              <button onClick={handleClockIn} disabled={acting} className="btn-primary flex-1">
                {acting ? 'Recording…' : 'Clock In'}
              </button>
              <button onClick={() => setShowAbsent(true)} className="btn-secondary flex-1">
                Mark Absent
              </button>
            </div>
          </>
        )}

        {isClockedIn && (
          <>
            <div className="flex items-center gap-3">
              <span className="badge-present">Present</span>
              <span className="text-sm text-slate-600">
                Clocked in at <strong>{format(record.clockIn.toDate(), 'h:mm a')}</strong>
              </span>
            </div>
            <button onClick={handleClockOut} disabled={acting} className="btn-primary w-full">
              {acting ? 'Recording…' : 'Clock Out'}
            </button>
          </>
        )}

        {isClockedOut && (
          <div className="space-y-2">
            <span className="badge-present">Complete</span>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="text-center">
                <p className="text-xs text-slate-400">Clock In</p>
                <p className="font-semibold text-slate-700">{format(record.clockIn.toDate(), 'h:mm a')}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Clock Out</p>
                <p className="font-semibold text-slate-700">{format(record.clockOut.toDate(), 'h:mm a')}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Total</p>
                <p className="font-semibold text-slate-700">{record.totalHours}h</p>
              </div>
            </div>
          </div>
        )}

        {isAbsent && (
          <div className="space-y-1">
            <span className="badge-absent">Absent</span>
            <p className="text-sm text-slate-600 mt-2">
              Reason: <span className="font-medium">{record.absenceReason}</span>
            </p>
          </div>
        )}
      </div>

      {/* Absent form */}
      {showAbsent && (
        <div className="card p-5 space-y-4 border-amber-200">
          <h2 className="font-medium text-slate-800">Record absence</h2>
          <div>
            <label className="label">Reason</label>
            <select className="input" value={absenceReason} onChange={e => setAbsenceReason(e.target.value)}>
              <option value="">Select a reason…</option>
              {ABSENCE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Additional note (optional)</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Any further details…"
              value={absenceNote}
              onChange={e => setAbsenceNote(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleMarkAbsent} disabled={acting || !absenceReason} className="btn-primary flex-1">
              {acting ? 'Saving…' : 'Submit'}
            </button>
            <button onClick={() => setShowAbsent(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      )}

      {msg && (
        <p className="text-sm text-emerald-700 bg-emerald-50 px-4 py-3 rounded-lg">{msg}</p>
      )}
    </div>
  )
}
