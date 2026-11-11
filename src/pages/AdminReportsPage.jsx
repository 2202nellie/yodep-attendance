import { useEffect, useState } from 'react'
import { getAllUsers, getAllAttendanceRange, getWeekRange, getMonthRange, getYearRange } from '../lib/db'
import { format, eachDayOfInterval, parseISO, isWeekend } from 'date-fns'

const PERIODS = [
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
]

export default function AdminReportsPage() {
  const [users, setUsers] = useState([])
  const [records, setRecords] = useState([])
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [range, setRange] = useState(null)

  useEffect(() => {
    loadData()
  }, [period])

  async function loadData() {
    setLoading(true)
    const r = period === 'week' ? getWeekRange() : period === 'month' ? getMonthRange() : getYearRange()
    setRange(r)
    const [usersData, attendance] = await Promise.all([
      getAllUsers(),
      getAllAttendanceRange(r.start, r.end),
    ])
    setUsers(usersData.filter(u => u.active))
    setRecords(attendance)
    setLoading(false)
  }

  const workingDayCount = range
    ? eachDayOfInterval({ start: parseISO(range.start), end: parseISO(range.end) })
        .filter(d => !isWeekend(d) && parseISO(format(d, 'yyyy-MM-dd')) <= new Date()).length
    : 0

  function userSummary(uid) {
    const userRecords = records.filter(r => r.uid === uid)
    const present = userRecords.filter(r => r.status === 'present').length
    const absent = userRecords.filter(r => r.status === 'absent').length
    const hours = userRecords.reduce((s, r) => s + (r.totalHours || 0), 0)
    const rate = workingDayCount > 0 ? Math.round((present / workingDayCount) * 100) : 0
    return { present, absent, hours: hours.toFixed(1), rate }
  }

  function exportCSV() {
    const rows = [['Name', 'Department', 'Days Present', 'Days Absent', 'Total Hours', 'Attendance Rate']]
    users.forEach(u => {
      const s = userSummary(u.id)
      rows.push([u.name, u.department, s.present, s.absent, s.hours, `${s.rate}%`])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `all-staff-attendance-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">All Staff Reports</h1>
          <p className="text-sm text-slate-400 mt-0.5">{workingDayCount} working days in period</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <h2 className="font-medium text-slate-700 flex-1">Summary by employee</h2>
          <input type="search" className="input max-w-xs text-sm" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Employee</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Department</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Present</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Absent</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Hours</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => {
                const s = userSummary(u.id)
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.department}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">{s.present}</td>
                    <td className="px-4 py-3 text-red-500 font-medium">{s.absent}</td>
                    <td className="px-4 py-3 text-slate-600">{s.hours}h</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-20">
                          <div
                            className={`h-1.5 rounded-full ${s.rate >= 80 ? 'bg-emerald-500' : s.rate >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${s.rate}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{s.rate}%</span>
                      </div>
                    </td>
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
