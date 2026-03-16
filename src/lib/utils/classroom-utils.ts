import {
  type Building,
  buildings,
  type Classroom,
  classrooms,
  type ClassSchedule,
  schedules
} from "@/lib/data/classrooms"

export interface AvailableClassroom extends Classroom {
  building: Building
  availableUntil: string | null
  nextClass: string | null
  isAvailable: boolean
}

// Convert time string to minutes for comparison
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

// Index schedules by classroomId and dayOfWeek for faster lookup
const scheduleIndex: Record<string, Record<number, ClassSchedule[]>> = {}

schedules.forEach((s) => {
  if (!scheduleIndex[s.classroomId]) {
    scheduleIndex[s.classroomId] = {}
  }
  if (!scheduleIndex[s.classroomId][s.dayOfWeek]) {
    scheduleIndex[s.classroomId][s.dayOfWeek] = []
  }
  scheduleIndex[s.classroomId][s.dayOfWeek].push(s)
})

// Check if a classroom is available at a specific date and time
export function isClassroomAvailable(
  classroom: Classroom,
  date: Date,
  time: string
): boolean {
  const dayOfWeek = date.getDay()
  const timeInMinutes = timeToMinutes(time)
  const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`

  const classroomSchedules = scheduleIndex[classroom.id]?.[dayOfWeek] || []

  for (const schedule of classroomSchedules) {
    // If the schedule has specific dates, check if it applies to today
    if (schedule.dates && !schedule.dates.includes(dateStr)) {
      continue
    }

    const startMinutes = timeToMinutes(schedule.startTime)
    const endMinutes = timeToMinutes(schedule.endTime)

    if (timeInMinutes >= startMinutes && timeInMinutes < endMinutes) {
      return false
    }
  }

  return true
}

// Get schedules for a classroom on a specific day
export function getClassroomSchedules(
  classroomId: string,
  dayOfWeek: number,
  date?: Date
): ClassSchedule[] {
  const dateStr = date ? `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}` : null
  
  return (scheduleIndex[classroomId]?.[dayOfWeek] || [])
    .filter((s) => !dateStr || !s.dates || s.dates.includes(dateStr))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
}

// Get next class time and name for a classroom
function getNextClassInfo(
  classroom: Classroom,
  date: Date,
  currentTime: string
): { availableUntil: string | null; nextClass: string | null } {
  const dayOfWeek = date.getDay()
  const currentMinutes = timeToMinutes(currentTime)

  const todaySchedules = getClassroomSchedules(classroom.id, dayOfWeek, date)

  for (const schedule of todaySchedules) {
    const startMinutes = timeToMinutes(schedule.startTime)
    if (startMinutes > currentMinutes) {
      return {
        availableUntil: schedule.startTime,
        nextClass: schedule.courseName,
      }
    }
  }

  return {
    availableUntil: null, // Available for the rest of the day
    nextClass: null,
  }
}

// Get all available classrooms at a specific date and time
export function getAvailableClassrooms(
  date: Date,
  time: string,
  buildingIds?: string[]
): AvailableClassroom[] {
  let filteredClassrooms = classrooms

  if (buildingIds && buildingIds.length > 0) {
    filteredClassrooms = classrooms.filter((c) =>
      buildingIds.includes(c.buildingId)
    )
  }

  const available: AvailableClassroom[] = []

  for (const classroom of filteredClassrooms) {
    if (isClassroomAvailable(classroom, date, time)) {
      const building = buildings.find((b) => b.id === classroom.buildingId)!
      const { availableUntil, nextClass } = getNextClassInfo(
        classroom,
        date,
        time
      )

      available.push({
        ...classroom,
        building,
        availableUntil,
        nextClass,
        isAvailable: true,
      })
    }
  }

  return available.sort((a, b) => {
    // Sort by building name, then by room name
    if (a.building.name !== b.building.name) {
      return a.building.name.localeCompare(b.building.name)
    }
    return a.name.localeCompare(b.name)
  })
}

// Get all classrooms with their availability status
export function getAllClassroomsWithStatus(
  date: Date,
  time: string,
  buildingIds?: string[]
): AvailableClassroom[] {
  let filteredClassrooms = classrooms

  if (buildingIds && buildingIds.length > 0) {
    filteredClassrooms = classrooms.filter((c) =>
      buildingIds.includes(c.buildingId)
    )
  }

  const result: AvailableClassroom[] = []

  for (const classroom of filteredClassrooms) {
    const building = buildings.find((b) => b.id === classroom.buildingId)!
    const available = isClassroomAvailable(classroom, date, time)
    const {availableUntil, nextClass} = available
      ? getNextClassInfo(classroom, date, time)
      : {availableUntil: null, nextClass: null}

    result.push({
      ...classroom,
      building,
      availableUntil,
      nextClass,
      isAvailable: available,
    })
  }

  return result.sort((a, b) => {
    // Available rooms first, then by building name, then by room name
    if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1
    if (a.building.name !== b.building.name) {
      return a.building.name.localeCompare(b.building.name)
    }
    return a.name.localeCompare(b.name)
  })
}

// Get count of available rooms per building
export function getAvailableCountByBuilding(
  date: Date,
  time: string
): Map<string, number> {
  const counts = new Map<string, number>()

  for (const building of buildings) {
    counts.set(building.id, 0)
  }

  for (const classroom of classrooms) {
    if (isClassroomAvailable(classroom, date, time)) {
      const current = counts.get(classroom.buildingId) || 0
      counts.set(classroom.buildingId, current + 1)
    }
  }

  return counts
}

// Format floor code for display
export function formatFloor(floor: string): string {
  const upper = floor.toUpperCase()
  if (upper === "LG") return "Lower Ground"
  if (upper === "GR" || upper === "00") return "Ground Floor"
  if (upper === "B1") return "Basement 1"
  if (upper === "B2") return "Basement 2"
  const num = parseInt(floor, 10)
  if (!isNaN(num)) {
    if (num === 1) return "1st Floor"
    if (num === 2) return "2nd Floor"
    if (num === 3) return "3rd Floor"
    return `${num}th Floor`
  }
  return `Floor ${floor}`
}

// Format time for display
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number)
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
}

// Get time slots for the day
export function getTimeSlots(): string[] {
  const slots: string[] = []
  for (let hour = 7; hour <= 22; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`)
    if (hour < 22) {
      slots.push(`${hour.toString().padStart(2, "0")}:30`)
    }
  }
  return slots
}

// Get current time rounded to nearest 30 minutes
export function getCurrentTimeSlot(): string {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const roundedMinutes = minutes < 30 ? 0 : 30
  return `${hours.toString().padStart(2, "0")}:${roundedMinutes.toString().padStart(2, "0")}`
}
