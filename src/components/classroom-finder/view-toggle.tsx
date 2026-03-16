import {Calendar, LayoutGrid} from "lucide-react"
import {Button} from "@/components/ui/button"
import {cn} from "@/lib/utils"

export type ViewMode = "grid" | "timetable"

interface ViewToggleProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  className?: string
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted rounded-lg", className)}>
      <Button
        variant={view === "grid" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("grid")}
        className={cn(
          "gap-2",
          view === "grid" && "bg-background shadow-sm"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        Grid
      </Button>
      <Button
        variant={view === "timetable" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("timetable")}
        className={cn(
          "gap-2",
          view === "timetable" && "bg-background shadow-sm"
        )}
      >
        <Calendar className="h-4 w-4" />
        Timetable
      </Button>
    </div>
  )
}
