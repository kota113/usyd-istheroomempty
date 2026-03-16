import {useState} from "react"
import {Building2, CalendarIcon, ChevronDown, ChevronUp, Clock, Search as SearchIcon} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Calendar} from "@/components/ui/calendar"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Checkbox} from "@/components/ui/checkbox"
import {Label} from "@/components/ui/label"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Input} from "@/components/ui/input"
import {cn} from "@/lib/utils"
import {format} from "date-fns"
import {buildings} from "@/lib/data/classrooms"
import {formatTime, getTimeSlots} from "@/lib/utils/classroom-utils"

interface FilterSidebarProps {
  selectedDate: Date | null
  selectedTime: string | null
  selectedBuildings: string[]
  onDateChange: (date: Date) => void
  onTimeChange: (time: string) => void
  onBuildingsChange: (buildings: string[]) => void
  showOnlyAvailable: boolean
  onShowOnlyAvailableChange: (checked: boolean) => void
  className?: string
}

export function FilterSidebar({
  selectedDate,
  selectedTime,
  selectedBuildings,
  onDateChange,
  onTimeChange,
  onBuildingsChange,
                                showOnlyAvailable,
                                onShowOnlyAvailableChange,
  className,
}: FilterSidebarProps) {
  const [buildingsExpanded, setBuildingsExpanded] = useState(true)
  const [buildingSearch, setBuildingSearch] = useState("")
  const timeSlots = getTimeSlots()

  const filteredBuildings = buildings.filter((b) =>
    b.name.toLowerCase().includes(buildingSearch.toLowerCase()) ||
    b.code.toLowerCase().includes(buildingSearch.toLowerCase())
  )

  const toggleBuilding = (buildingId: string) => {
    if (selectedBuildings.includes(buildingId)) {
      onBuildingsChange(selectedBuildings.filter((id) => id !== buildingId))
    } else {
      onBuildingsChange([...selectedBuildings, buildingId])
    }
  }

  const selectAllBuildings = () => {
    onBuildingsChange(filteredBuildings.map((b) => b.id))
  }

  const clearAllBuildings = () => {
    onBuildingsChange([])
  }

  return (
    <aside className={cn("flex flex-col gap-6 p-6 bg-card border-r border-border", className)}>
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Find Empty Rooms</h2>
        <p className="text-sm text-muted-foreground">Select date, time, and building to search</p>
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          Date
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate ?? undefined}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Picker */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Time
        </Label>
        <Select value={selectedTime ?? ""} onValueChange={onTimeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent>
            {timeSlots.map((slot) => (
              <SelectItem key={slot} value={slot}>
                {formatTime(slot)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Show only available toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="show-available-toggle"
          checked={showOnlyAvailable}
          onCheckedChange={(checked) => onShowOnlyAvailableChange(!!checked)}
        />
        <Label htmlFor="show-available-toggle" className="text-sm font-medium cursor-pointer">
          Show only available
        </Label>
      </div>

      {/* Building Filter */}
      <div className="space-y-2">
        <button
          onClick={() => setBuildingsExpanded(!buildingsExpanded)}
          className="flex items-center justify-between w-full text-sm font-medium"
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Buildings
          </span>
          {buildingsExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {buildingsExpanded && (
          <div className="space-y-3 pt-2">
            <div className="relative">
              <Input
                value={buildingSearch}
                onChange={(e) => setBuildingSearch(e.target.value)}
                placeholder="Search buildings by name or code"
                className="pl-8 h-9"
              />
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllBuildings}
                className="text-xs h-7 px-2"
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllBuildings}
                className="text-xs h-7 px-2"
              >
                Clear
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredBuildings.length === 0 && (
                <p className="text-xs text-muted-foreground">No buildings match your search.</p>
              )}
              {filteredBuildings.map((building) => (
                <div key={building.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={building.id}
                    checked={selectedBuildings.includes(building.id)}
                    onCheckedChange={() => toggleBuilding(building.id)}
                  />
                  <Label
                    htmlFor={building.id}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    <span className="font-medium text-muted-foreground mr-1">
                      {building.code}
                    </span>
                    {building.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </aside>
  )
}
