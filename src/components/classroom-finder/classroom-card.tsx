import {Clock, MapPin} from "lucide-react"
import {Card, CardContent, CardHeader} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {cn} from "@/lib/utils"
import {type AvailableClassroom, formatFloor, formatTime} from "@/lib/utils/classroom-utils"

interface ClassroomCardProps {
  classroom: AvailableClassroom
  className?: string
}

export function ClassroomCard({ classroom, className }: ClassroomCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              {classroom.building.code} {classroom.name}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              {classroom.building.name} - {formatFloor(classroom.floor)}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              classroom.isAvailable
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            )}
          >
            {classroom.isAvailable ? "Available" : "Occupied"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {classroom.isAvailable && (
          <div className="flex items-center gap-4 text-sm">
            {classroom.availableUntil ? (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4"/>
                <span>Until {formatTime(classroom.availableUntil)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-600">
                <Clock className="h-4 w-4"/>
                <span>Rest of day</span>
              </div>
            )}
          </div>
        )}

        {classroom.nextClass && (
          <p className="text-xs text-muted-foreground">
            Next: {classroom.nextClass}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
