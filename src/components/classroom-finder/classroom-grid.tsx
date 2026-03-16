import {useMemo} from "react"
import {ClassroomCard} from "./classroom-card"
import {type AvailableClassroom, formatFloor} from "@/lib/utils/classroom-utils"
import {Building2} from "lucide-react"

interface ClassroomGridProps {
  classrooms: AvailableClassroom[]
  selectedBuildings: string[]
  isLoading?: boolean
}

export function ClassroomGrid({classrooms, selectedBuildings, isLoading}: ClassroomGridProps) {
  const singleBuilding = selectedBuildings.length === 1

  const floorGroups = useMemo(() => {
    if (!singleBuilding) return null
    const groups = new Map<string, AvailableClassroom[]>()
    for (const c of classrooms) {
      const key = c.floor
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(c)
    }
    // Sort floors naturally
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, {numeric: true}))
  }, [classrooms, singleBuilding])

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (classrooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          No available rooms found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try adjusting your search filters or selecting a different time slot to find available classrooms.
        </p>
      </div>
    )
  }

  if (singleBuilding && floorGroups) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          {classrooms.length} room{classrooms.length !== 1 ? "s" : ""} found
        </p>
        {floorGroups.map(([floor, rooms]) => (
          <div key={floor} className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">
              {formatFloor(floor)}
              <span className="ml-2 text-muted-foreground font-normal">
                ({rooms.length} room{rooms.length !== 1 ? "s" : ""})
              </span>
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((classroom) => (
                <ClassroomCard key={classroom.id} classroom={classroom}/>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {classrooms.length} room{classrooms.length !== 1 ? "s" : ""} found
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classrooms.map((classroom) => (
          <ClassroomCard key={classroom.id} classroom={classroom} />
        ))}
      </div>
    </div>
  )
}
