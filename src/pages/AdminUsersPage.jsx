import { useEffect, useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { getAllUsers, createUser, updateUser } from '../lib/db'

const DEPARTMENTS = ['HR', 'IT', 'Finance', 'Operations', 'Administration', 'Legal', 'Communications', 'Planning']
const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr', label: 'HR Admin' },
  { value: 'it', label: 'IT Admin' },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')

  const [form, setForm] = useState({
    name: '', email: '', password: '', department: '', role: 'employee'
  })

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const data = await getAllUsers()
    setUsers(data)
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    setMsg('')
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await createUser(cred.user.uid, {
        name: form.name,
        email: form.email,
        department: form.department,
        role: form.role,
      })
      setMsg(`${form.name} added successfully.`)
      setForm({ name: '', email: '', password: '', department: '', role: 'employee' })
      setShowForm(false)
      await loadUsers()
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setMsg('That email address is already in use.')
      } else {
        setMsg('Could not create user. ' + err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(uid, current) {
    await updateUser(uid, { active: !current })
    await loadUsers()
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Manage Users</h1>
          <p className="text-sm text-slate-400 mt-0.5">{users.filter(u => u.active).length} active employees</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add employee'}
        </button>
      </div>

      {msg && (
        <p className={`text-sm px-4 py-3 rounded-lg ${msg.includes('successfully') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {msg}
        </p>
      )}

      {showForm && (
        <div className="card p-5">
          <h2 className="font-medium text-slate-800 mb-4">New employee</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full name</label>
                <input type="text" className="input" placeholder="Chisomo Banda" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="label">Email address</label>
                <input type="email" className="input" placeholder="chisomo@yodep.gov.mw" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div>
                <label className="label">Temporary password</label>
                <input type="password" className="input" placeholder="At least 6 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
              </div>
              <div>
                <label className="label">Department</label>
                <select className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})} required>
                  <option value="">Select department…</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Creating…' : 'Create account'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <h2 className="font-medium text-slate-700 flex-1">All employees</h2>
          <input type="search" className="input max-w-xs text-sm" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Department</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => (
                <tr key={u.id} className={`hover:bg-slate-50/50 ${!u.active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-700">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3 text-slate-500">{u.department}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-slate-600">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={u.active ? 'badge-present' : 'badge-absent'}>{u.active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleActive(u.id, u.active)}
                      className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {u.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
