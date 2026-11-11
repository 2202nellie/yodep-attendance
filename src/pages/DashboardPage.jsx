import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getTodayRecord, getUserAttendance, getUserLeaves, getWeekRange } from '../lib/db'
import { format } from 'date-fns'

function StatCard({ label, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color].split(' ')[1]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [todayRecord, setTodayRecord] = useState(null)
  const [weekRecords, setWeekRecords] = useState([])
  const [pendingLeaves, setPendingLeaves] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const [rec, leaves] = await Promise.all([
        getTodayRecord(user.uid),
        getUserLeaves(user.uid),
      ])
      setTodayRecord(rec)
      setPendingLeaves(leaves.filter(l => l.status === 'pending').length)

      const { start, end } = getWeekRange()
      const week = await getUserAttendance(user.uid, start, end)
      setWeekRecords(week)
      setLoading(false)
    }
    load()
  }, [user])

  const today = format(new Date(), 'EEEE, d MMMM yyyy')
  const presentDays = weekRecords.filter(r => r.status === 'present').length
  const absentDays = weekRecords.filter(r => r.status === 'absent').length
  const totalHours = weekRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0)

  const statusColor = !todayRecord ? 'amber' : todayRecord.status === 'present' ? 'green' : 'red'
  const statusLabel = !todayRecord
    ? 'Not clocked in yet'
    : todayRecord.status === 'present'
      ? todayRecord.clockOut
        ? `Clocked out at ${format(todayRecord.clockOut.toDate(), 'h:mm a')}`
        : `Clocked in at ${format(todayRecord.clockIn.toDate(), 'h:mm a')}`
      : 'Marked absent'

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {profile?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-slate-400 mt-0.5">{today}</p>
      </div>

      {/* Today status */}
      <div className={`card p-5 border-l-4 ${statusColor === 'green' ? 'border-emerald-500' : statusColor === 'red' ? 'border-red-500' : 'border-amber-400'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Today</p>
            <p className="text-lg font-semibold text-slate-800 mt-0.5">{statusLabel}</p>
          </div>
          <Link to="/clock" className="btn-primary text-sm">
            {!todayRecord ? 'Clock In' : !todayRecord.clockOut ? 'Clock Out' : 'View'}
          </Link>
        </div>
      </div>

      {/* This week stats */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">This week</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Days present" value={presentDays} color="green" />
          <StatCard label="Days absent" value={absentDays} color={absentDays > 0 ? 'red' : 'brand'} />
          <StatCard label="Hours worked" value={`${totalHours.toFixed(1)}h`} color="brand" />
          <StatCard label="Leave pending" value={pendingLeaves} color={pendingLeaves > 0 ? 'amber' : 'brand'} />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/clock" className="card p-4 hover:border-brand-200 hover:shadow-md transition-all group">
            <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-brand-100 transition-colors">
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="font-medium text-slate-800">Clock In / Out</p>
            <p className="text-xs text-slate-400 mt-0.5">Record your attendance</p>
          </Link>
          <Link to="/leave" className="card p-4 hover:border-brand-200 hover:shadow-md transition-all group">
            <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-brand-100 transition-colors">
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <p className="font-medium text-slate-800">Apply for Leave</p>
            <p className="text-xs text-slate-400 mt-0.5">Submit a leave request</p>
          </Link>
          <Link to="/reports" className="card p-4 hover:border-brand-200 hover:shadow-md transition-all group">
            <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-brand-100 transition-colors">
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <p className="font-medium text-slate-800">My Reports</p>
            <p className="text-xs text-slate-400 mt-0.5">Weekly, monthly, yearly</p>
          </Link>
        </div>
      </div>

      {/* Recent attendance */}
      {weekRecords.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">This week's records</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Clock In</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Clock Out</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Hours</th>
                  <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {weekRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-700">{format(new Date(r.date), 'EEE, d MMM')}</td>
                    <td className="px-4 py-3 text-slate-600">{r.clockIn ? format(r.clockIn.toDate(), 'h:mm a') : '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.clockOut ? format(r.clockOut.toDate(), 'h:mm a') : '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{r.totalHours ? `${r.totalHours}h` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={r.status === 'present' ? 'badge-present' : 'badge-absent'}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
