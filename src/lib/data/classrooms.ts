import schedulesData from "@/assets/files/schedules.json"

// Building data with coordinates for map positioning
export interface Building {
  id: string
  name: string
  code: string
  coordinates: { x: number; y: number }
  width: number
  height: number
}

// Classroom data
export interface Classroom {
  id: string
  name: string
  buildingId: string
  floor: string
}

// Schedule/booking data
export interface ClassSchedule {
  classroomId: string
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // "09:00"
  endTime: string // "10:30"
  courseName: string
  dates?: string[]
}

const dayMap: Record<string, number> = {
  "Sun": 0,
  "Mon": 1,
  "Tue": 2,
  "Wed": 3,
  "Thu": 4,
  "Fri": 5,
  "Sat": 6
}

// Map real building codes to existing map coordinates if possible
const buildingMetadata: Record<string, { coordinates: { x: number; y: number }; width: number; height: number }> = {
  "F10A": { coordinates: { x: 200, y: 180 }, width: 110, height: 60 }, // Law Building Annex -> Library spot
  "A02": { coordinates: { x: 80, y: 200 }, width: 80, height: 65 },  // Main Quad -> Arts spot
  "J12": { coordinates: { x: 120, y: 80 }, width: 100, height: 70 }, // School of IT -> Engineering spot
  "A28": { coordinates: { x: 280, y: 60 }, width: 90, height: 80 },  // Chemistry -> Science spot
  "H03": { coordinates: { x: 350, y: 160 }, width: 85, height: 70 }, // Wentworth -> Business spot
  "G01": { coordinates: { x: 220, y: 290 }, width: 95, height: 55 }, // Student Union -> Student Center spot
}

const processedBuildings: Building[] = []
const processedClassrooms: Classroom[] = []
const processedSchedules: ClassSchedule[] = []

const buildingIds = new Set<string>()

// Process rooms and buildings
Object.entries(schedulesData.rooms).forEach(([roomId, roomData]: [string, any]) => {
  const { meta, schedule } = roomData
  const buildingId = meta.building_code

  // Add building if not already added
  if (!buildingIds.has(buildingId)) {
    buildingIds.add(buildingId)
    const metadata = buildingMetadata[buildingId] || {
      coordinates: { x: -100, y: -100 }, // Off-map
      width: 0,
      height: 0
    }
    
    processedBuildings.push({
      id: buildingId,
      name: meta.building_name,
      code: buildingId,
      ...metadata
    })
  }

  // Add classroom
  processedClassrooms.push({
    id: roomId,
    name: meta.room_name,
    buildingId: buildingId,
    floor: meta.floor || "01"
  })

  // Add schedules
  Object.entries(schedule).forEach(([day, sessions]: [string, any]) => {
    const dayOfWeek = dayMap[day]
    if (dayOfWeek !== undefined) {
      sessions.forEach((session: any) => {
        processedSchedules.push({
          classroomId: roomId,
          dayOfWeek: dayOfWeek,
          startTime: session.start,
          endTime: session.end,
          courseName: session.course,
          dates: session.dates
        })
      })
    }
  })
})

export const buildings: Building[] = processedBuildings.sort((a, b) => a.name.localeCompare(b.name))
export const classrooms: Classroom[] = processedClassrooms
export const schedules: ClassSchedule[] = processedSchedules
