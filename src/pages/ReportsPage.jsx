import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getUserAttendance, getWeekRange, getMonthRange, getYearRange } from '../lib/db'
import { format, eachDayOfInterval, parseISO, isWeekend } from 'date-fns'

const PERIODS = [
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
]

export default function ReportsPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('month')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(null)

  useEffect(() => {
    loadRecords()
  }, [user, period])

  async function loadRecords() {
    if (!user) return
    setLoading(true)
    const r = period === 'week' ? getWeekRange() : period === 'month' ? getMonthRange() : getYearRange()
    setRange(r)
    const data = await getUserAttendance(user.uid, r.start, r.end)
    setRecords(data)
    setLoading(false)
  }

  // Build a full calendar of working days (Mon-Fri) for the period
  const workingDays = range
    ? eachDayOfInterval({ start: parseISO(range.start), end: parseISO(range.end) })
        .filter(d => !isWeekend(d) && parseISO(format(d, 'yyyy-MM-dd')) <= new Date())
    : []

  const recordMap = {}
  records.forEach(r => { recordMap[r.date] = r })

  const presentCount = workingDays.filter(d => recordMap[format(d, 'yyyy-MM-dd')]?.status === 'present').length
  const absentCount = workingDays.filter(d => {
    const rec = recordMap[format(d, 'yyyy-MM-dd')]
    return rec?.status === 'absent'
  }).length
  const noRecordCount = workingDays.filter(d => !recordMap[format(d, 'yyyy-MM-dd')]).length
  const totalHours = records.reduce((s, r) => s + (r.totalHours || 0), 0)

  function exportCSV() {
    const rows = [['Date', 'Clock In', 'Clock Out', 'Total Hours', 'Status', 'Absence Reason']]
    workingDays.forEach(d => {
      const dateStr = format(d, 'yyyy-MM-dd')
      const r = recordMap[dateStr]
      rows.push([
        format(d, 'd MMM yyyy'),
        r?.clockIn ? format(r.clockIn.toDate(), 'HH:mm') : '',
        r?.clockOut ? format(r.clockOut.toDate(), 'HH:mm') : '',
        r?.totalHours || '',
        r?.status || 'no record',
        r?.absenceReason || '',
      ])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">My Reports</h1>
          <p className="text-sm text-slate-400 mt-0.5">Your attendance history</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 gap-0.5">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === p.key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="btn-secondary text-sm">Export CSV</button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Days present</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{absentCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Days absent</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-500">{noRecordCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">No record</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand-600">{totalHours.toFixed(1)}h</p>
          <p className="text-xs text-slate-400 mt-0.5">Total hours</p>
        </div>
      </div>

      {/* Records table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Clock In</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Clock Out</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Hours</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {workingDays.map(d => {
                const dateStr = format(d, 'yyyy-MM-dd')
                const r = recordMap[dateStr]
                return (
                  <tr key={dateStr} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-medium text-slate-700">{format(d, 'EEE, d MMM')}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r?.clockIn ? format(r.clockIn.toDate(), 'h:mm a') : '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r?.clockOut ? format(r.clockOut.toDate(), 'h:mm a') : '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{r?.totalHours ? `${r.totalHours}h` : '—'}</td>
                    <td className="px-4 py-2.5">
                      {!r ? (
                        <span className="text-slate-300 text-xs">—</span>
                      ) : r.status === 'present' ? (
                        <span className="badge-present">Present</span>
                      ) : (
                        <span className="badge-absent">Absent</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs max-w-xs truncate">{r?.absenceReason || ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
