import {useState} from "react"
import {buildings} from "@/lib/data/classrooms"
import {type AvailableClassroom, formatFloor, formatTime} from "@/lib/utils/classroom-utils"
import {cn} from "@/lib/utils"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Clock, X} from "lucide-react"

interface CampusMapProps {
  availableClassrooms: AvailableClassroom[]
  availableCounts: Map<string, number>
  selectedBuildings: string[]
  onBuildingClick: (buildingId: string) => void
}

export function CampusMap({
  availableClassrooms,
  availableCounts,
  selectedBuildings,
}: CampusMapProps) {
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null)
  const [selectedBuildingForDetails, setSelectedBuildingForDetails] = useState<string | null>(null)

  const getBuildingColor = (buildingId: string) => {
    const count = availableCounts.get(buildingId) || 0
    const isSelected = selectedBuildings.length === 0 || selectedBuildings.includes(buildingId)
    
    if (!isSelected) {
      return "fill-muted stroke-border"
    }
    
    if (count === 0) {
      return "fill-red-100 stroke-red-300"
    }
    if (count <= 2) {
      return "fill-amber-100 stroke-amber-300"
    }
    return "fill-emerald-100 stroke-emerald-300"
  }

  const buildingClassrooms = selectedBuildingForDetails
    ? availableClassrooms.filter((c) => c.buildingId === selectedBuildingForDetails)
    : []

  const selectedBuildingData = selectedBuildingForDetails
    ? buildings.find((b) => b.id === selectedBuildingForDetails)
    : null

  return (
    <div className="flex gap-4 h-full">
      {/* Map */}
      <div className="flex-1 relative bg-slate-50 rounded-lg border border-border overflow-hidden">
        <svg
          viewBox="0 0 500 400"
          className="w-full h-full"
          style={{ minHeight: "400px" }}
        >
          {/* Background elements - paths, grass areas */}
          <defs>
            <pattern id="grass" patternUnits="userSpaceOnUse" width="20" height="20">
              <rect width="20" height="20" fill="#e8f5e9" />
              <circle cx="5" cy="5" r="1" fill="#c8e6c9" />
              <circle cx="15" cy="15" r="1" fill="#c8e6c9" />
            </pattern>
          </defs>
          
          {/* Campus background */}
          <rect x="0" y="0" width="500" height="400" fill="url(#grass)" />
          
          {/* Paths */}
          <path
            d="M 0 200 L 500 200"
            stroke="#d1d5db"
            strokeWidth="8"
            fill="none"
          />
          <path
            d="M 200 0 L 200 400"
            stroke="#d1d5db"
            strokeWidth="8"
            fill="none"
          />
          <path
            d="M 350 100 L 350 300"
            stroke="#d1d5db"
            strokeWidth="6"
            fill="none"
          />

          {/* Buildings */}
          {buildings.filter(b => b.width > 0).map((building) => {
            const count = availableCounts.get(building.id) || 0
            const isHovered = hoveredBuilding === building.id
            const isSelected = selectedBuildingForDetails === building.id
            
            return (
              <g
                key={building.id}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredBuilding(building.id)}
                onMouseLeave={() => setHoveredBuilding(null)}
                onClick={() => setSelectedBuildingForDetails(
                  selectedBuildingForDetails === building.id ? null : building.id
                )}
              >
                <rect
                  x={building.coordinates.x}
                  y={building.coordinates.y}
                  width={building.width}
                  height={building.height}
                  rx="4"
                  className={cn(
                    getBuildingColor(building.id),
                    "transition-all duration-200",
                    isHovered && "stroke-primary stroke-2",
                    isSelected && "stroke-primary stroke-2"
                  )}
                  style={{
                    transform: isHovered ? "scale(1.02)" : "scale(1)",
                    transformOrigin: `${building.coordinates.x + building.width / 2}px ${building.coordinates.y + building.height / 2}px`,
                  }}
                />
                
                {/* Building label */}
                <text
                  x={building.coordinates.x + building.width / 2}
                  y={building.coordinates.y + building.height / 2 - 8}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-slate-700 pointer-events-none"
                >
                  {building.code}
                </text>
                
                {/* Room count badge */}
                <text
                  x={building.coordinates.x + building.width / 2}
                  y={building.coordinates.y + building.height / 2 + 8}
                  textAnchor="middle"
                  className={cn(
                    "text-xs pointer-events-none",
                    count > 0 ? "fill-emerald-700" : "fill-red-700"
                  )}
                >
                  {count} {count === 1 ? "room" : "rooms"}
                </text>
              </g>
            )
          })}

          {/* Tooltip */}
          {hoveredBuilding && !selectedBuildingForDetails && (
            <g>
              {(() => {
                const building = buildings.find((b) => b.id === hoveredBuilding)!
                const tooltipX = building.coordinates.x + building.width / 2
                const tooltipY = building.coordinates.y - 10
                
                return (
                  <>
                    <rect
                      x={tooltipX - 70}
                      y={tooltipY - 35}
                      width="140"
                      height="30"
                      rx="4"
                      fill="white"
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      className="drop-shadow-sm"
                    />
                    <text
                      x={tooltipX}
                      y={tooltipY - 15}
                      textAnchor="middle"
                      className="text-xs fill-slate-800"
                    >
                      {building.name}
                    </text>
                  </>
                )
              })()}
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg border border-border p-3 text-xs">
          <p className="font-medium mb-2">Availability</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
              <span>3+ rooms</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
              <span>1-2 rooms</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
              <span>No rooms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Building Details Panel */}
      {selectedBuildingForDetails && selectedBuildingData && (
        <Card className="w-80 flex-shrink-0 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  {selectedBuildingData.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {buildingClassrooms.length} room{buildingClassrooms.length !== 1 ? "s" : ""} available
                </p>
              </div>
              <button
                onClick={() => setSelectedBuildingForDetails(null)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-80">
            {buildingClassrooms.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No available rooms in this building at the selected time.
              </p>
            ) : (
              <div className="space-y-3">
                {buildingClassrooms.map((classroom) => (
                  <div
                    key={classroom.id}
                    className="p-3 bg-muted/50 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {classroom.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-emerald-50 text-emerald-700"
                      >
                        {formatFloor(classroom.floor)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {classroom.availableUntil
                          ? `Until ${formatTime(classroom.availableUntil)}`
                          : "Rest of day"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
