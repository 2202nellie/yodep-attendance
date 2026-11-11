import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
  query, where, orderBy, Timestamp, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

// ── Users ──────────────────────────────────────────────────────────────────

export async function getUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function getAllUsers() {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('name')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createUser(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    active: true,
    createdAt: serverTimestamp(),
  })
}

export async function updateUser(uid, data) {
  await updateDoc(doc(db, 'users', uid), data)
}

// ── Attendance Records ─────────────────────────────────────────────────────

// Returns today's record for a user, or null
export async function getTodayRecord(uid) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const snap = await getDoc(doc(db, 'attendance', `${uid}_${today}`))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function clockIn(uid, userName, department) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const id = `${uid}_${today}`
  const now = Timestamp.now()
  await setDoc(doc(db, 'attendance', id), {
    uid,
    userName,
    department,
    date: today,
    clockIn: now,
    clockOut: null,
    status: 'present',
    totalHours: null,
    absenceReason: null,
    updatedAt: now,
  })
  return id
}

export async function clockOut(uid) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const id = `${uid}_${today}`
  const now = Timestamp.now()
  const snap = await getDoc(doc(db, 'attendance', id))
  if (!snap.exists()) return

  const clockInTime = snap.data().clockIn.toDate()
  const clockOutTime = now.toDate()
  const totalHours = ((clockOutTime - clockInTime) / (1000 * 60 * 60)).toFixed(2)

  await updateDoc(doc(db, 'attendance', id), {
    clockOut: now,
    totalHours: parseFloat(totalHours),
    updatedAt: now,
  })
}

export async function markAbsent(uid, userName, department, reason) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const id = `${uid}_${today}`
  const now = Timestamp.now()
  await setDoc(doc(db, 'attendance', id), {
    uid,
    userName,
    department,
    date: today,
    clockIn: null,
    clockOut: null,
    status: 'absent',
    totalHours: 0,
    absenceReason: reason,
    updatedAt: now,
  }, { merge: true })
}

export async function getUserAttendance(uid, startDate, endDate) {
  const q = query(
    collection(db, 'attendance'),
    where('uid', '==', uid),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getAllAttendanceForDate(date) {
  const q = query(collection(db, 'attendance'), where('date', '==', date))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getAllAttendanceRange(startDate, endDate) {
  const q = query(
    collection(db, 'attendance'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Leave Applications ─────────────────────────────────────────────────────

export async function applyLeave(uid, userName, department, data) {
  await addDoc(collection(db, 'leaves'), {
    uid,
    userName,
    department,
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
    reviewedBy: null,
    reviewNote: null,
    reviewedAt: null,
  })
}

export async function getUserLeaves(uid) {
  const q = query(collection(db, 'leaves'), where('uid', '==', uid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getAllLeaves() {
  const q = query(collection(db, 'leaves'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function reviewLeave(leaveId, status, reviewNote, reviewerName) {
  await updateDoc(doc(db, 'leaves', leaveId), {
    status,
    reviewNote,
    reviewedBy: reviewerName,
    reviewedAt: serverTimestamp(),
  })
}

// ── Date range helpers ─────────────────────────────────────────────────────

export function getWeekRange(date = new Date()) {
  return {
    start: format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  }
}

export function getMonthRange(date = new Date()) {
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

export function getYearRange(date = new Date()) {
  return {
    start: format(startOfYear(date), 'yyyy-MM-dd'),
    end: format(endOfYear(date), 'yyyy-MM-dd'),
  }
}
