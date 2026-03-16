import {useEffect, useMemo, useState} from "react"
import {FilterSidebar} from "@/components/classroom-finder/filter-sidebar"
import {ClassroomGrid} from "@/components/classroom-finder/classroom-grid"
import {TimetableView} from "@/components/classroom-finder/timetable-view"
import {type ViewMode, ViewToggle} from "@/components/classroom-finder/view-toggle"
import {
  type AvailableClassroom,
  getAllClassroomsWithStatus,
  getAvailableClassrooms,
  getCurrentTimeSlot
} from "@/lib/utils/classroom-utils"
import {GraduationCap, Menu, Search, X} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Checkbox} from "@/components/ui/checkbox"
import {Label} from "@/components/ui/label"
import {cn} from "@/lib/utils"
import {Input} from "@/components/ui/input"

export default function ClassroomFinderPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(getCurrentTimeSlot())
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([])
  const [view, setView] = useState<ViewMode>("grid")
  const [availableClassrooms, setAvailableClassrooms] = useState<AvailableClassroom[]>([])
  const [allClassrooms, setAllClassrooms] = useState<AvailableClassroom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [classroomSearch, setClassroomSearch] = useState("")

  // Search classrooms whenever date/time/buildings change
  useEffect(() => {
    if (selectedDate && selectedTime) {
      setTimeout(() => {
        const buildingFilter = selectedBuildings.length > 0 ? selectedBuildings : undefined
        const available = getAvailableClassrooms(selectedDate, selectedTime, buildingFilter)
        const all = getAllClassroomsWithStatus(selectedDate, selectedTime, buildingFilter)
        setAvailableClassrooms(available)
        setAllClassrooms(all)
        setIsLoading(false)
      }, 300)
    }
  }, [selectedDate, selectedTime, selectedBuildings])

  // Choose which classrooms to display based on toggle
  const displayedClassrooms = showOnlyAvailable ? availableClassrooms : allClassrooms

  // Filter classrooms by search term
  const filteredClassrooms = useMemo(() => {
    if (!classroomSearch.trim()) return displayedClassrooms
    const term = classroomSearch.toLowerCase().trim()
    return displayedClassrooms.filter((c) =>
      c.id.toLowerCase().includes(term) ||
      c.building.name.toLowerCase().includes(term) ||
      c.building.code.toLowerCase().includes(term)
    )
  }, [displayedClassrooms, classroomSearch])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Classroom Finder</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Find empty classrooms on campus
              </p>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Desktop classroom search & view toggle */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input
                placeholder="Search classrooms..."
                value={classroomSearch}
                onChange={(e) => setClassroomSearch(e.target.value)}
                className="pl-9 w-64 h-9"
              />
            </div>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <FilterSidebar
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          selectedBuildings={selectedBuildings}
          onDateChange={setSelectedDate}
          onTimeChange={setSelectedTime}
          onBuildingsChange={setSelectedBuildings}
          showOnlyAvailable={showOnlyAvailable}
          onShowOnlyAvailableChange={setShowOnlyAvailable}
          className={cn(
            "w-72 shrink-0",
            "fixed inset-y-0 left-0 z-50 pt-16 lg:pt-0 lg:relative lg:z-auto",
            "transition-transform duration-200 lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        />

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile toolbar */}
          <div className="flex flex-col gap-2 p-4 border-b border-border lg:hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 shrink-0">
                <Checkbox
                  id="search-toggle-mobile"
                  checked={showOnlyAvailable}
                  onCheckedChange={(checked) => setShowOnlyAvailable(!!checked)}
                />
                <Label htmlFor="search-toggle-mobile" className="text-sm font-medium cursor-pointer">
                  Show only available
                </Label>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {!isLoading
                  ? `${filteredClassrooms.length} room${filteredClassrooms.length !== 1 ? "s" : ""} found`
                  : ""}
              </p>
              <ViewToggle view={view} onViewChange={setView}/>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input
                placeholder="Search classrooms..."
                value={classroomSearch}
                onChange={(e) => setClassroomSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-auto p-4 lg:p-6">
            {view === "grid" ? (
              <ClassroomGrid classrooms={filteredClassrooms} selectedBuildings={selectedBuildings}
                             isLoading={isLoading}/>
            ) : (
              <TimetableView
                selectedDate={selectedDate!}
                selectedTime={selectedTime!}
                selectedBuildings={selectedBuildings}
                isLoading={isLoading}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
