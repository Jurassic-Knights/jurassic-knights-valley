# Weapon Rename Script
# Run from project root: powershell -ExecutionPolicy Bypass -File tools/rename_weapons.ps1

$projectRoot = Split-Path -Parent $PSScriptRoot
$equipmentDir = "$projectRoot\src\entities\equipment"
$manifestPath = "$projectRoot\src\entities\manifest.json"

# Define the mapping: old_id -> { new_id, weaponType, gripType }
$weaponMapping = @{
    # MELEE
    "weapon_t1_01" = @{ newId = "weapon_melee_t1_01"; weaponType = "melee"; gripType = "1-hand" }  # Trench Knife
    "weapon_t1_02" = @{ newId = "weapon_melee_t1_02"; weaponType = "melee"; gripType = "2-hand" }  # Billhook
    "weapon_t1_03" = @{ newId = "weapon_melee_t1_03"; weaponType = "melee"; gripType = "2-hand" }  # Entrenching Tool
    "weapon_t2_01" = @{ newId = "weapon_melee_t2_01"; weaponType = "melee"; gripType = "1-hand" }  # Cavalry Sabre
    "weapon_t2_02" = @{ newId = "weapon_melee_t2_02"; weaponType = "melee"; gripType = "1-hand" }  # Falchion
    "weapon_t2_03" = @{ newId = "weapon_melee_t2_03"; weaponType = "melee"; gripType = "1-hand" }  # Kopis
    "weapon_t2_04" = @{ newId = "weapon_melee_t2_04"; weaponType = "melee"; gripType = "1-hand" }  # Trench Mace
    "weapon_t3_01" = @{ newId = "weapon_melee_t3_01"; weaponType = "melee"; gripType = "1-hand" }  # Punch Dagger
    "weapon_t3_02" = @{ newId = "weapon_melee_t3_02"; weaponType = "melee"; gripType = "2-hand" }  # Claymore
    "weapon_t4_01" = @{ newId = "weapon_melee_t4_01"; weaponType = "melee"; gripType = "2-hand" }  # Kriegsmesser
    
    # RANGED
    "weapon_t1_04" = @{ newId = "weapon_ranged_t1_01"; weaponType = "ranged"; gripType = "1-hand" }  # Nagant Revolver
    "weapon_t2_05" = @{ newId = "weapon_ranged_t2_01"; weaponType = "ranged"; gripType = "1-hand" }  # Webley Revolver
    "weapon_t2_06" = @{ newId = "weapon_ranged_t2_02"; weaponType = "ranged"; gripType = "1-hand" }  # Luger P08
    "weapon_t2_07" = @{ newId = "weapon_ranged_t2_03"; weaponType = "ranged"; gripType = "2-hand" }  # Lee-Enfield
    "weapon_t2_08" = @{ newId = "weapon_ranged_t2_04"; weaponType = "ranged"; gripType = "2-hand" }  # Gewehr 98
    "weapon_t3_03" = @{ newId = "weapon_ranged_t3_01"; weaponType = "ranged"; gripType = "1-hand" }  # Colt M1911
    "weapon_t3_04" = @{ newId = "weapon_ranged_t3_02"; weaponType = "ranged"; gripType = "1-hand" }  # Mauser C96
    "weapon_t3_05" = @{ newId = "weapon_ranged_t3_03"; weaponType = "ranged"; gripType = "2-hand" }  # M1903 Springfield
    "weapon_t3_06" = @{ newId = "weapon_ranged_t3_04"; weaponType = "ranged"; gripType = "2-hand" }  # Winchester M1897
    "weapon_t4_02" = @{ newId = "weapon_ranged_t4_01"; weaponType = "ranged"; gripType = "2-hand" }  # Anti-Materiel Rifle
    
    # SHIELD
    "weapon_t1_05" = @{ newId = "weapon_shield_t1_01"; weaponType = "shield"; gripType = "1-hand" }  # Heater Shield
    "weapon_t2_09" = @{ newId = "weapon_shield_t2_01"; weaponType = "shield"; gripType = "1-hand" }  # Kite Shield
    "weapon_t3_07" = @{ newId = "weapon_shield_t3_01"; weaponType = "shield"; gripType = "2-hand" }  # Tower Shield
}

Write-Host "=== Weapon Rename Script ===" -ForegroundColor Cyan

# Step 1: Update JSON files and rename
foreach ($oldId in $weaponMapping.Keys) {
    $mapping = $weaponMapping[$oldId]
    $newId = $mapping.newId
    $weaponType = $mapping.weaponType
    $gripType = $mapping.gripType
    
    $oldFile = "$equipmentDir\$oldId.json"
    $newFile = "$equipmentDir\$newId.json"
    
    if (Test-Path $oldFile) {
        Write-Host "Processing: $oldId -> $newId" -ForegroundColor Yellow
        
        # Read JSON
        $json = Get-Content $oldFile -Raw | ConvertFrom-Json
        
        # Update fields
        $json.id = $newId
        $json.sprite = $newId
        $json.weaponType = $weaponType
        $json.gripType = $gripType
        
        # Update file paths
        if ($json.files.original) {
            $json.files.original = $json.files.original -replace $oldId, $newId
        }
        
        # Write to new file
        $json | ConvertTo-Json -Depth 10 | Set-Content $newFile -Encoding UTF8
        
        # Delete old file (if different name)
        if ($oldFile -ne $newFile) {
            Remove-Item $oldFile
        }
        
        Write-Host "  Created: $newFile" -ForegroundColor Green
    } else {
        Write-Host "  SKIP: $oldFile not found" -ForegroundColor Red
    }
}

# Step 2: Update manifest.json
Write-Host "`nUpdating manifest.json..." -ForegroundColor Cyan
$manifest = Get-Content $manifestPath -Raw
foreach ($oldId in $weaponMapping.Keys) {
    $newId = $weaponMapping[$oldId].newId
    $manifest = $manifest -replace "`"$oldId`"", "`"$newId`""
}
$manifest | Set-Content $manifestPath -Encoding UTF8
Write-Host "  Manifest updated" -ForegroundColor Green

Write-Host "`n=== Done! ===" -ForegroundColor Cyan
Write-Host "Renamed $($weaponMapping.Count) weapons" -ForegroundColor Green
