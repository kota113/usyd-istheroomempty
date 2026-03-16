import {useMemo, useState} from "react"
import {buildings, classrooms, type ClassSchedule} from "@/lib/data/classrooms"
import {formatTime, getClassroomSchedules, getTimeSlots, isClassroomAvailable} from "@/lib/utils/classroom-utils"
import {cn} from "@/lib/utils"
import {ChevronDown, ChevronRight} from "lucide-react"
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"

interface TimetableViewProps {
  selectedDate: Date
  selectedTime: string
  selectedBuildings: string[]
  isLoading?: boolean
}

export function TimetableView({ selectedDate, selectedTime, selectedBuildings, isLoading }: TimetableViewProps) {
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set(buildings.map(b => b.id)))

  const timeSlots = useMemo(() => {
    // Get time slots from 7:00 to 22:00 in 30-minute increments
    return getTimeSlots()
  }, [])

  const filteredBuildings = useMemo(() => {
    if (selectedBuildings.length === 0) return buildings
    return buildings.filter(b => selectedBuildings.includes(b.id))
  }, [selectedBuildings])

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded-lg w-full" />
        ))}
      </div>
    )
  }

  const dayOfWeek = selectedDate.getDay()

  const getScheduleForSlot = (roomSchedules: ClassSchedule[], time: string) => {
    return roomSchedules.find(s => {
      const slotMinutes = timeToMinutes(time)
      const startMinutes = timeToMinutes(s.startTime)
      const endMinutes = timeToMinutes(s.endTime)

      return slotMinutes >= startMinutes && slotMinutes < endMinutes
    })
  }

  const isSlotStart = (roomSchedules: ClassSchedule[], time: string) => {
    return roomSchedules.some(s => s.startTime === time)
  }

  const getSlotSpan = (roomSchedules: ClassSchedule[], time: string) => {
    const schedule = roomSchedules.find(s => s.startTime === time)
    if (!schedule) return 1

    const startMinutes = timeToMinutes(schedule.startTime)
    const endMinutes = timeToMinutes(schedule.endTime)
    const duration = endMinutes - startMinutes
    return Math.ceil(duration / 30)
  }

  const toggleBuilding = (buildingId: string) => {
    const newExpanded = new Set(expandedBuildings)
    if (newExpanded.has(buildingId)) {
      newExpanded.delete(buildingId)
    } else {
      newExpanded.add(buildingId)
    }
    setExpandedBuildings(newExpanded)
  }

  const currentTimeIndex = timeSlots.findIndex(t => t === selectedTime)

  return (
    <TooltipProvider>
      <div className="w-full hidden md:block">
        {/* Header with time slots - scrollable */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="flex sticky top-0 z-10 bg-background border-b border-border">
              <div className="w-48 flex-shrink-0 p-3 font-medium text-sm text-muted-foreground border-r border-border bg-muted sticky left-0 z-20">
                Room
              </div>
              <div className="flex-1 flex">
                {timeSlots.map((time, index) => (
                  <div
                    key={time}
                    className={cn(
                      "w-16 flex-shrink-0 p-2 text-center text-xs font-medium border-r border-border",
                      index === currentTimeIndex && "bg-primary/10 text-primary",
                      index % 2 === 0 ? "bg-muted/30" : "bg-background"
                    )}
                  >
                    {index % 2 === 0 ? formatTime(time) : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Building sections */}
        {filteredBuildings.map(building => {
          const buildingClassrooms = classrooms.filter(c => c.buildingId === building.id)
          const isExpanded = expandedBuildings.has(building.id)
          const availableCount = buildingClassrooms.filter(c =>
            isClassroomAvailable(c, selectedDate, selectedTime)
          ).length

          return (
            <div key={building.id} className="border-b border-border">
              {/* Building header - not scrollable */}
              <button
                onClick={() => toggleBuilding(building.id)}
                className="w-full flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-semibold text-sm">{building.name}</span>
                <span className="text-xs text-muted-foreground">({building.code})</span>
                <span className={cn(
                  "ml-auto text-xs px-2 py-0.5 rounded-full",
                  availableCount > 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                )}>
                  {availableCount} available now
                </span>
              </button>

              {/* Classroom rows - scrollable */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    {buildingClassrooms.map(classroom => {
                      const roomSchedules = getClassroomSchedules(classroom.id, dayOfWeek, selectedDate)

                      return (
                        <div key={classroom.id} className="flex border-t border-border/50">
                          {/* Room info */}
                          <div className="w-48 flex-shrink-0 p-3 border-r border-border bg-card sticky left-0 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                            <div className="font-medium text-sm">{classroom.name}</div>
                          </div>

                          {/* Time slots */}
                          <div className="flex-1 flex relative">
                            {timeSlots.map((time, index) => {
                              const schedule = getScheduleForSlot(roomSchedules, time)
                              const isStart = isSlotStart(roomSchedules, time)
                              const isAvailable = !schedule
                              const isCurrent = index === currentTimeIndex

                              // Skip rendering if this is part of a span but not the start
                              if (schedule && !isStart) {
                                return null
                              }

                              const span = isStart ? getSlotSpan(roomSchedules, time) : 1

                              return (
                                <div
                                  key={time}
                                  className={cn(
                                    "flex-shrink-0 border-r border-border/50 relative",
                                    isCurrent && "ring-2 ring-primary ring-inset z-[1]"
                                  )}
                                  style={{ width: `${span * 64}px` }}
                                >
                                  {isAvailable ? (
                                    <div className={cn(
                                      "h-full min-h-[48px] bg-emerald-50",
                                      isCurrent && "bg-emerald-100"
                                    )} />
                                  ) : schedule && isStart ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="h-full min-h-[48px] bg-rose-100 p-1 overflow-hidden cursor-default">
                                          <div className="text-[10px] font-medium text-rose-700 truncate leading-tight">
                                            {schedule.courseName}
                                          </div>
                                          <div className="text-[9px] text-rose-600 truncate">
                                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs">
                                        <p className="font-medium">{schedule.courseName}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Legend */}
        <div className="flex items-center gap-6 p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-200"/>
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded bg-rose-100 border border-rose-200"/>
            <span className="text-muted-foreground">Occupied</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded border-2 border-primary"/>
            <span className="text-muted-foreground">Selected time</span>
          </div>
        </div>
      </div>

      {/* Mobile vertical timetable */}
      <div className="md:hidden">
        {/* Building sections - mobile */}
        {filteredBuildings.map(building => {
          const buildingClassrooms = classrooms.filter(c => c.buildingId === building.id)
          const isExpanded = expandedBuildings.has(building.id)
          const availableCount = buildingClassrooms.filter(c =>
            isClassroomAvailable(c, selectedDate, selectedTime)
          ).length

          return (
            <div key={building.id} className="border-b border-border">
              {/* Building header */}
              <button
                onClick={() => toggleBuilding(building.id)}
                className="w-full flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground"/>
                )}
                <span className="font-semibold text-sm">{building.name}</span>
                <span className="text-xs text-muted-foreground">({building.code})</span>
                <span className={cn(
                  "ml-auto text-xs px-2 py-0.5 rounded-full",
                  availableCount > 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground"
                )}>
                  {availableCount} available now
                </span>
              </button>

              {/* Classroom stacks - vertical timeline */}
              {isExpanded && (
                <div className="px-2 pb-2">
                  {buildingClassrooms.map(classroom => {
                    const roomSchedules = getClassroomSchedules(classroom.id, dayOfWeek, selectedDate)

                    return (
                      <div key={classroom.id} className="border-t border-border/50">
                        <div className="px-3 py-2 bg-card">
                          <div className="font-medium text-sm">{classroom.name}</div>
                        </div>
                        <div className="pl-3 pr-2 py-2">
                          {timeSlots.map((time, index) => {
                            const schedule = getScheduleForSlot(roomSchedules, time)
                            const isStart = isSlotStart(roomSchedules, time)
                            const isAvailable = !schedule
                            const isCurrent = index === currentTimeIndex

                            if (schedule && !isStart) {
                              return null
                            }

                            const span = isStart ? getSlotSpan(roomSchedules, time) : 1

                            return (
                              <div
                                key={time}
                                className={cn(
                                  "w-full border-b border-border/50 relative",
                                  isAvailable ? "bg-emerald-50" : "bg-rose-100",
                                  isCurrent && "ring-2 ring-primary ring-inset z-[1]"
                                )}
                                style={{height: `${span * 28}px`}}
                              >
                                {!isAvailable && isStart ? (
                                  <div className="px-2 py-1 overflow-hidden">
                                    <div className="text-[11px] font-medium text-rose-700 truncate leading-tight">
                                      {schedule.courseName}
                                    </div>
                                    <div className="text-[10px] text-rose-600 truncate">
                                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Legend */}
        <div className="flex items-center gap-6 p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-200" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded bg-rose-100 border border-rose-200" />
            <span className="text-muted-foreground">Occupied</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded border-2 border-primary" />
            <span className="text-muted-foreground">Selected time</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}
