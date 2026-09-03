import * as XLSX from 'xlsx'
import type { TeacherStock } from '@/types'

export interface RawScheduleEntry {
  courseName: string
  teacherName: string
  time: string
  room: string
}

function text(value: unknown): string {
  return String(value ?? '').trim()
}

function normalize(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase()
}

function parseRows(rows: unknown[][]): RawScheduleEntry[] {
  if (rows.length === 0) return []
  const headers = rows[0].map((value) => normalize(text(value)))
  const findColumn = (names: string[]) => headers.findIndex((header) => names.some((name) => header.includes(name)))
  const courseIndex = findColumn(['课程', '科目', 'course'])
  const teacherIndex = findColumn(['教师', '老师', 'teacher'])
  const timeIndex = findColumn(['时间', '上课', 'time'])
  const roomIndex = findColumn(['地点', '教室', 'room'])
  if (courseIndex < 0 || teacherIndex < 0) return []
  return rows.slice(1).map((row) => ({
    courseName: text(row[courseIndex]),
    teacherName: text(row[teacherIndex]),
    time: timeIndex >= 0 ? text(row[timeIndex]) : '待补充',
    room: roomIndex >= 0 ? text(row[roomIndex]) : '待补充'
  })).filter((entry) => entry.courseName && entry.teacherName)
}

export function parseXlsx(buffer: ArrayBuffer): RawScheduleEntry[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return sheet ? parseRows(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })) : []
}

export function parseIcs(content: string): RawScheduleEntry[] {
  return content.split(/BEGIN:VEVENT/i).slice(1).map((block) => {
    const value = (key: string) => block.match(new RegExp(`(?:^|\\n)${key}[^:]*:(.*)`, 'i'))?.[1]?.trim() ?? ''
    return { courseName: value('SUMMARY'), teacherName: value('DESCRIPTION').replace(/^教师[:：]?/i, ''), time: value('DTSTART'), room: value('LOCATION') }
  }).filter((entry) => entry.courseName && entry.teacherName)
}

export function matchScheduleEntry(entry: RawScheduleEntry, stocks: TeacherStock[]): TeacherStock | undefined {
  const course = normalize(entry.courseName)
  const teacher = normalize(entry.teacherName)
  return stocks.find((stock) => normalize(stock.course).includes(course) || normalize(stock.name).includes(course) || normalize(stock.teacherName).includes(teacher))
}
