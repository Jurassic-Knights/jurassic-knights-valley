
$assets = @(
    "bg_base_grasslands_01_dense",
    "bg_base_grasslands_02_dead",
    "bg_base_grasslands_03_mud",
    "bg_base_grasslands_04_rocky",
    "bg_base_tundra_01_snow",
    "bg_base_tundra_02_permafrost",
    "bg_base_tundra_03_ice",
    "bg_base_tundra_04_rocky",
    "bg_base_desert_01_dunes",
    "bg_base_desert_02_clay",
    "bg_base_desert_03_gravel",
    "bg_base_desert_04_rocky",
    "bg_base_badlands_01_red_clay",
    "bg_base_badlands_02_volcanic",
    "bg_base_badlands_03_vents",
    "bg_base_badlands_04_jagged",
    "bg_base_global_01_dirt",
    "bg_base_global_02_cobblestone",
    "bg_base_global_03_gravel_path",
    "bg_base_global_04_cave_floor"
)

$targetDir = "src/entities/ground"
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

foreach ($id in $assets) {
    # Extract biome from id (e.g. bg_base_grasslands_01_dense -> grasslands)
    $parts = $id -split "_"
    if ($parts[2] -eq "global") {
        $biome = "all"
    } else {
        $biome = $parts[2]
    }
    
    # Extract name (friendly)
    $nameParts = $parts[2..($parts.Length-1)]
    $name = ($nameParts -join " ") -replace "base ", ""
    $name = (Get-Culture).TextInfo.ToTitleCase($name)

    # Determine file path based on ID mapping
    # Assuming files are in assets/images/ground/[short_name].png
    # But my previous move command renamed them to match ID logic partly?
    # Let's check the task boundary from before:
    # Dest: assets/images/ground/bg_grasslands_01_dense.png (Wait, not bg_base_...)
    # The file names I moved to were like `bg_grasslands_01_dense.png`.
    # But the ID key in AssetManifest is `bg_base_grasslands_01_dense`.
    
    # Entity ID: bg_base_grasslands_01_dense
    # File Path: assets/images/ground/bg_grasslands_01_dense.png
    
    # Need to construct the cleaner path string
    # Remove 'base_' from ID to get filename?
    # bg_base_grasslands_01_dense -> bg_grasslands_01_dense
    $filename = $id -replace "bg_base_", "bg_"

    $content = @"
/**
 * Entity: $id
 * Auto-generated.
 */
import type { EnvironmentEntity } from '@types/entities';

export default {
    id: '$id',
    name: '$name',
    sourceCategory: 'ground',
    sourceFile: 'ground',
    status: 'pending',
    files: {
        original: 'assets/images/ground/$filename.png',
        clean: 'assets/images/ground/$filename.png'
    },
    type: 'ground_texture',
    biome: '$biome',
    display: {
        sizeScale: 1,
        width: 128,
        height: 128
    }
} satisfies EnvironmentEntity;
"@

    $outFile = Join-Path $targetDir "$id.ts"
    Set-Content -Path $outFile -Value $content
    Write-Host "Created $outFile"
}
