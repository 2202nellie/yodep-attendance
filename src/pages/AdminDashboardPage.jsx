import { useEffect, useState } from 'react'
import { getAllUsers, getAllAttendanceForDate } from '../lib/db'
import { format } from 'date-fns'

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([])
  const [records, setRecords] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    async function load() {
      const [usersData, attendance] = await Promise.all([
        getAllUsers(),
        getAllAttendanceForDate(today),
      ])
      setUsers(usersData.filter(u => u.active))
      const map = {}
      attendance.forEach(r => { map[r.uid] = r })
      setRecords(map)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  )

  const inCount = filtered.filter(u => records[u.id]?.status === 'present' && !records[u.id]?.clockOut).length
  const outCount = filtered.filter(u => records[u.id]?.clockOut).length
  const absentCount = filtered.filter(u => records[u.id]?.status === 'absent').length
  const notInCount = filtered.filter(u => !records[u.id]).length

  function getStatus(uid) {
    const r = records[uid]
    if (!r) return { label: 'Not in', color: 'bg-slate-100 text-slate-500' }
    if (r.status === 'absent') return { label: 'Absent', color: 'bg-red-100 text-red-700', note: r.absenceReason }
    if (r.clockOut) return { label: 'Clocked out', color: 'bg-blue-100 text-blue-700', time: format(r.clockOut.toDate(), 'h:mm a') }
    if (r.clockIn) return { label: 'In office', color: 'bg-emerald-100 text-emerald-700', time: `since ${format(r.clockIn.toDate(), 'h:mm a')}` }
    return { label: 'Not in', color: 'bg-slate-100 text-slate-500' }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Admin Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">Live attendance — {format(new Date(), 'EEEE, d MMMM yyyy')}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 border-l-4 border-emerald-400">
          <p className="text-2xl font-bold text-emerald-600">{inCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">In office now</p>
        </div>
        <div className="card p-4 border-l-4 border-blue-400">
          <p className="text-2xl font-bold text-blue-600">{outCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Clocked out</p>
        </div>
        <div className="card p-4 border-l-4 border-red-400">
          <p className="text-2xl font-bold text-red-600">{absentCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">Absent today</p>
        </div>
        <div className="card p-4 border-l-4 border-slate-300">
          <p className="text-2xl font-bold text-slate-500">{notInCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">No record yet</p>
        </div>
      </div>

      {/* Staff list */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <h2 className="font-medium text-slate-700 flex-1">All staff</h2>
          <input
            type="search"
            className="input max-w-xs text-sm"
            placeholder="Search by name or dept…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Department</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Time / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => {
                const s = getStatus(u.id)
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.department}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.time || s.note || '—'}</td>
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
