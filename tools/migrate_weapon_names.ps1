# Weapon Naming Migration Script
# Run from project root: powershell -File tools/migrate_weapon_names.ps1

$projectRoot = $PSScriptRoot + "\.."
$entityPath = "$projectRoot\src\entities\equipment"
$imagePath = "$projectRoot\assets\images\equipment"
$manifestPath = "$projectRoot\src\entities\manifest.json"

# Define the migration map (old -> new)
# Avoiding conflicts with existing files
$migrationMap = @{
    # Melee weapons
    "weapon_melee_t1_01" = "weapon_melee_knife_t1_01"  # knife, no conflict
    "weapon_melee_t1_02" = "weapon_melee_sword_t1_01"  # sword, no conflict at t1
    "weapon_melee_t1_03" = "weapon_melee_sword_t1_02"  # sword, no conflict at t1
    "weapon_melee_t2_01" = "weapon_melee_sword_t2_04"  # sword, existing: 01-03, use 04
    "weapon_melee_t2_02" = "weapon_melee_sword_t2_05"  # sword, use 05
    "weapon_melee_t2_03" = "weapon_melee_sword_t2_06"  # sword, use 06
    "weapon_melee_t2_04" = "weapon_melee_sword_t2_07"  # sword, use 07
    "weapon_melee_t3_01" = "weapon_melee_knife_t3_02"  # knife, existing: 01, use 02
    "weapon_melee_t3_02" = "weapon_melee_sword_t3_01"  # sword, no conflict at t3
    "weapon_melee_t4_01" = "weapon_melee_sword_t4_01"  # sword, no conflict at t4
    
    # Ranged weapons
    "weapon_ranged_t1_01" = "weapon_ranged_pistol_t1_02"  # pistol, existing: 01, use 02
    "weapon_ranged_t2_01" = "weapon_ranged_pistol_t2_03"  # pistol, existing: 01-02, use 03
    "weapon_ranged_t2_02" = "weapon_ranged_pistol_t2_04"  # pistol, use 04
    "weapon_ranged_t2_03" = "weapon_ranged_rifle_t2_03"   # rifle, existing: 01-02, use 03
    "weapon_ranged_t2_04" = "weapon_ranged_rifle_t2_04"   # rifle, use 04
    "weapon_ranged_t3_01" = "weapon_ranged_pistol_t3_03"  # pistol, existing: 01-02, use 03
    "weapon_ranged_t3_02" = "weapon_ranged_pistol_t3_04"  # pistol, use 04
    "weapon_ranged_t3_03" = "weapon_ranged_sniperrifle_t3_01"  # sniper_rifle -> sniperrifle
    "weapon_ranged_t3_04" = "weapon_ranged_shotgun_t3_02"  # shotgun, existing: 01, use 02
    "weapon_ranged_t4_01" = "weapon_ranged_rifle_t4_01"   # rifle, no conflict at t4
}

# Also update sniper_rifle files
$sniperRifleRenames = @{
    "weapon_ranged_sniper_rifle_t4_01" = "weapon_ranged_sniperrifle_t4_01"
    "signature_ranged_sniper_rifle_t4_01" = "signature_ranged_sniperrifle_t4_01"
}

Write-Host "=== Weapon Naming Migration ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Migrate legacy weapon files
Write-Host "Step 1: Migrating legacy weapon files..." -ForegroundColor Yellow
foreach ($old in $migrationMap.Keys) {
    $new = $migrationMap[$old]
    $oldJsonPath = "$entityPath\$old.json"
    $newJsonPath = "$entityPath\$new.json"
    
    if (Test-Path $oldJsonPath) {
        # Read and update JSON content
        $content = Get-Content $oldJsonPath -Raw | ConvertFrom-Json
        $content.id = $new
        $content.sprite = $new
        
        # Update image paths if they exist
        if ($content.images) {
            if ($content.images.original) {
                $content.images.original = $content.images.original -replace $old, $new
            }
            if ($content.images.clean) {
                $content.images.clean = $content.images.clean -replace $old, $new
            }
        }
        
        # Save to new file
        $content | ConvertTo-Json -Depth 10 | Set-Content $newJsonPath -Encoding UTF8
        Write-Host "  Created: $new.json (from $old)" -ForegroundColor Green
        
        # Remove old file
        Remove-Item $oldJsonPath
        Write-Host "  Deleted: $old.json" -ForegroundColor DarkGray
    } else {
        Write-Host "  Skipped: $old.json (not found)" -ForegroundColor DarkYellow
    }
}

# Step 2: Migrate sniper_rifle files
Write-Host ""
Write-Host "Step 2: Migrating sniper_rifle files..." -ForegroundColor Yellow
foreach ($old in $sniperRifleRenames.Keys) {
    $new = $sniperRifleRenames[$old]
    $oldJsonPath = "$entityPath\$old.json"
    $newJsonPath = "$entityPath\$new.json"
    
    if (Test-Path $oldJsonPath) {
        $content = Get-Content $oldJsonPath -Raw | ConvertFrom-Json
        $content.id = $new
        $content.sprite = $new
        $content.weaponSubtype = "sniperrifle"
        
        if ($content.images) {
            if ($content.images.original) {
                $content.images.original = $content.images.original -replace "sniper_rifle", "sniperrifle"
            }
            if ($content.images.clean) {
                $content.images.clean = $content.images.clean -replace "sniper_rifle", "sniperrifle"
            }
        }
        
        $content | ConvertTo-Json -Depth 10 | Set-Content $newJsonPath -Encoding UTF8
        Write-Host "  Created: $new.json" -ForegroundColor Green
        
        Remove-Item $oldJsonPath
        Write-Host "  Deleted: $old.json" -ForegroundColor DarkGray
    }
}

# Step 3: Rename image files
Write-Host ""
Write-Host "Step 3: Renaming image files..." -ForegroundColor Yellow
foreach ($old in $migrationMap.Keys) {
    $new = $migrationMap[$old]
    
    foreach ($suffix in @("_original.png", "_clean.png")) {
        $oldImgPath = "$imagePath\$old$suffix"
        $newImgPath = "$imagePath\$new$suffix"
        
        if (Test-Path $oldImgPath) {
            Move-Item $oldImgPath $newImgPath -Force
            Write-Host "  Renamed: $old$suffix -> $new$suffix" -ForegroundColor Green
        }
    }
}

# Rename sniper_rifle images
foreach ($old in $sniperRifleRenames.Keys) {
    $new = $sniperRifleRenames[$old]
    foreach ($suffix in @("_original.png", "_clean.png")) {
        $oldImgPath = "$imagePath\$old$suffix"
        $newImgPath = "$imagePath\$new$suffix"
        if (Test-Path $oldImgPath) {
            Move-Item $oldImgPath $newImgPath -Force
            Write-Host "  Renamed: $old$suffix -> $new$suffix" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "=== Migration Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "MANUAL STEPS REQUIRED:" -ForegroundColor Yellow
Write-Host "1. Update manifest.json to include new IDs and remove old IDs" -ForegroundColor White
Write-Host "2. Update code references in HeroDefaults.js, WeaponRenderer.js, HeroRenderer.js" -ForegroundColor White
Write-Host "3. Update any sniper_rifle weaponSubtype references to sniperrifle" -ForegroundColor White
