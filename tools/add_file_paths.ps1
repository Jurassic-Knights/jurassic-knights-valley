# Script to add file paths to JSON entries based on existing images
# Scans asset folders and adds "files" property to matching JSON entries

$basePath = "c:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley"

# Define mappings from JSON folders to image folders
$mappings = @(
    @{ JsonPath = "tools/enemies/dinosaur.json"; ImageFolder = "assets/images/enemies"; Prefix = "dinosaur_" },
    @{ JsonPath = "tools/enemies/herbivore.json"; ImageFolder = "assets/images/enemies"; Prefix = "herbivore_" },
    @{ JsonPath = "tools/enemies/human.json"; ImageFolder = "assets/images/enemies"; Prefix = "human_" },
    @{ JsonPath = "tools/enemies/saurian.json"; ImageFolder = "assets/images/enemies"; Prefix = "saurian_" },
    @{ JsonPath = "tools/items/bone.json"; ImageFolder = "assets/images/items"; Prefix = "bone_" },
    @{ JsonPath = "tools/items/leather.json"; ImageFolder = "assets/images/items"; Prefix = "leather_" },
    @{ JsonPath = "tools/items/mechanical.json"; ImageFolder = "assets/images/items"; Prefix = "mechanical_" },
    @{ JsonPath = "tools/items/metal.json"; ImageFolder = "assets/images/items"; Prefix = "metal_" },
    @{ JsonPath = "tools/items/wood.json"; ImageFolder = "assets/images/items"; Prefix = "wood_" },
    @{ JsonPath = "tools/resources/food.json"; ImageFolder = "assets/images/resources"; Prefix = "food_" },
    @{ JsonPath = "tools/resources/minerals.json"; ImageFolder = "assets/images/resources"; Prefix = "minerals_" },
    @{ JsonPath = "tools/resources/salvage.json"; ImageFolder = "assets/images/resources"; Prefix = "salvage_" },
    @{ JsonPath = "tools/resources/scraps.json"; ImageFolder = "assets/images/resources"; Prefix = "scraps_" }
)

foreach ($mapping in $mappings) {
    $jsonFile = Join-Path $basePath $mapping.JsonPath
    $imageFolder = Join-Path $basePath $mapping.ImageFolder
    
    if (-not (Test-Path $jsonFile)) {
        Write-Host "Skipping $($mapping.JsonPath) - not found"
        continue
    }
    
    Write-Host "Processing $($mapping.JsonPath)..."
    
    # Load JSON
    $json = Get-Content $jsonFile -Raw | ConvertFrom-Json
    $modified = $false
    
    foreach ($item in $json) {
        $id = $item.id
        if (-not $id) { continue }
        
        # Check for original image
        $originalFile = Join-Path $imageFolder "${id}_original.png"
        $cleanFile = Join-Path $imageFolder "${id}_clean.png"
        
        if (Test-Path $originalFile) {
            # Create files object if it doesn't exist
            if (-not $item.PSObject.Properties['files']) {
                $item | Add-Member -NotePropertyName 'files' -NotePropertyValue @{}
            }
            
            # Add paths (relative to assets folder as expected by dashboard)
            $relativePath = $mapping.ImageFolder.Replace("assets/images/", "")
            $item.files.original = "$($mapping.ImageFolder)/${id}_original.png"
            
            if (Test-Path $cleanFile) {
                $item.files.clean = "$($mapping.ImageFolder)/${id}_clean.png"
            }
            
            $modified = $true
            Write-Host "  Added paths for $id"
        }
    }
    
    if ($modified) {
        # Save JSON back
        $json | ConvertTo-Json -Depth 10 | Set-Content $jsonFile -Encoding UTF8
        Write-Host "  Saved $($mapping.JsonPath)"
    }
}

Write-Host "Done!"
