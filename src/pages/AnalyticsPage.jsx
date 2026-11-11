import { useEffect, useState } from 'react'
import { getAllUsers, getAllAttendanceRange, getMonthRange, getAllLeaves } from '../lib/db'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { format, eachDayOfInterval, parseISO, isWeekend, startOfMonth, subMonths } from 'date-fns'

const COLORS = ['#3474f8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function AnalyticsPage() {
  const [users, setUsers] = useState([])
  const [records, setRecords] = useState([])
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Load 6 months of data
      const sixMonthsAgo = format(subMonths(new Date(), 6), 'yyyy-MM-dd')
      const today = format(new Date(), 'yyyy-MM-dd')
      const [usersData, attendance, leavesData] = await Promise.all([
        getAllUsers(),
        getAllAttendanceRange(sixMonthsAgo, today),
        getAllLeaves(),
      ])
      setUsers(usersData.filter(u => u.active))
      setRecords(attendance)
      setLeaves(leavesData)
      setLoading(false)
    }
    load()
  }, [])

  // Monthly attendance rate (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i)
    const monthStr = format(d, 'yyyy-MM')
    const monthLabel = format(d, 'MMM')
    const monthRecords = records.filter(r => r.date.startsWith(monthStr))
    const present = monthRecords.filter(r => r.status === 'present').length
    const absent = monthRecords.filter(r => r.status === 'absent').length
    const total = present + absent
    const rate = total > 0 ? Math.round((present / total) * 100) : 0
    return { month: monthLabel, rate, present, absent }
  })

  // Day-of-week absence pattern
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const dayData = dayNames.map((day, i) => {
    const count = records.filter(r => {
      if (r.status !== 'absent') return false
      const d = new Date(r.date)
      return d.getDay() === i + 1
    }).length
    return { day, absences: count }
  })

  // Department attendance rate
  const deptData = []
  const depts = [...new Set(users.map(u => u.department))]
  depts.forEach(dept => {
    const deptUsers = users.filter(u => u.department === dept).map(u => u.id)
    const deptRecords = records.filter(r => deptUsers.includes(r.uid))
    const present = deptRecords.filter(r => r.status === 'present').length
    const total = deptRecords.length
    const rate = total > 0 ? Math.round((present / total) * 100) : 0
    deptData.push({ dept, rate })
  })

  // Leave type breakdown
  const leaveTypes = {}
  leaves.filter(l => l.status === 'approved').forEach(l => {
    leaveTypes[l.type] = (leaveTypes[l.type] || 0) + 1
  })
  const leaveData = Object.entries(leaveTypes).map(([name, value]) => ({ name, value }))

  // Summary numbers
  const totalPresent = records.filter(r => r.status === 'present').length
  const totalAbsent = records.filter(r => r.status === 'absent').length
  const overallRate = totalPresent + totalAbsent > 0
    ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-400 mt-0.5">Organisation-wide attendance patterns — last 6 months</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-sm text-slate-500">Overall attendance</p>
          <p className="text-2xl font-bold text-brand-600 mt-1">{overallRate}%</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Active employees</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{users.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Total absences</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{totalAbsent}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Pending leaves</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{pendingLeaves}</p>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="card p-5">
        <h2 className="font-medium text-slate-700 mb-4">Monthly attendance rate</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip formatter={(v) => [`${v}%`, 'Rate']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Line type="monotone" dataKey="rate" stroke="#3474f8" strokeWidth={2.5} dot={{ r: 4, fill: '#3474f8' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Day of week absences */}
        <div className="card p-5">
          <h2 className="font-medium text-slate-700 mb-4">Absences by day of week</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="absences" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leave type breakdown */}
        <div className="card p-5">
          <h2 className="font-medium text-slate-700 mb-4">Approved leave types</h2>
          {leaveData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-300 text-sm">No approved leaves yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={leaveData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {leaveData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Department rates */}
      {deptData.length > 0 && (
        <div className="card p-5">
          <h2 className="font-medium text-slate-700 mb-4">Attendance rate by department</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="dept" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v}%`, 'Rate']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="rate" fill="#3474f8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
