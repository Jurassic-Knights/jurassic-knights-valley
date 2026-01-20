# Update equipment entity JSON files with new image paths
# Run from project root

$entitiesDir = "src\entities\equipment"

# Process all JSON files
Get-ChildItem "$entitiesDir\*.json" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    $modified = $false
    
    # --- WEAPONS ---
    # Melee sword
    if ($content -match '"images/equipment/weapon_melee_sword_') {
        $content = $content -replace '"images/equipment/weapon_melee_sword_', '"images/equipment/melee/sword/weapon_melee_sword_'
        $modified = $true
    }
    # Melee knife
    if ($content -match '"images/equipment/weapon_melee_knife_') {
        $content = $content -replace '"images/equipment/weapon_melee_knife_', '"images/equipment/melee/knife/weapon_melee_knife_'
        $modified = $true
    }
    # Melee greatsword
    if ($content -match '"images/equipment/weapon_melee_greatsword_') {
        $content = $content -replace '"images/equipment/weapon_melee_greatsword_', '"images/equipment/melee/greatsword/weapon_melee_greatsword_'
        $modified = $true
    }
    # Melee axe
    if ($content -match '"images/equipment/weapon_melee_axe_') {
        $content = $content -replace '"images/equipment/weapon_melee_axe_', '"images/equipment/melee/axe/weapon_melee_axe_'
        $modified = $true
    }
    # Melee mace
    if ($content -match '"images/equipment/weapon_melee_mace_') {
        $content = $content -replace '"images/equipment/weapon_melee_mace_', '"images/equipment/melee/mace/weapon_melee_mace_'
        $modified = $true
    }
    
    # Ranged pistol
    if ($content -match '"images/equipment/weapon_ranged_pistol_') {
        $content = $content -replace '"images/equipment/weapon_ranged_pistol_', '"images/equipment/ranged/pistol/weapon_ranged_pistol_'
        $modified = $true
    }
    # Ranged rifle
    if ($content -match '"images/equipment/weapon_ranged_rifle_') {
        $content = $content -replace '"images/equipment/weapon_ranged_rifle_', '"images/equipment/ranged/rifle/weapon_ranged_rifle_'
        $modified = $true
    }
    # Ranged shotgun
    if ($content -match '"images/equipment/weapon_ranged_shotgun_') {
        $content = $content -replace '"images/equipment/weapon_ranged_shotgun_', '"images/equipment/ranged/shotgun/weapon_ranged_shotgun_'
        $modified = $true
    }
    # Ranged sniper (both formats)
    if ($content -match '"images/equipment/weapon_ranged_sniperrifle_') {
        $content = $content -replace '"images/equipment/weapon_ranged_sniperrifle_', '"images/equipment/ranged/sniper_rifle/weapon_ranged_sniper_rifle_'
        $modified = $true
    }
    if ($content -match '"images/equipment/weapon_ranged_sniper_rifle_') {
        $content = $content -replace '"images/equipment/weapon_ranged_sniper_rifle_', '"images/equipment/ranged/sniper_rifle/weapon_ranged_sniper_rifle_'
        $modified = $true
    }
    
    # Shield
    if ($content -match '"images/equipment/weapon_shield_') {
        $content = $content -replace '"images/equipment/weapon_shield_', '"images/equipment/shield/weapon_shield_'
        $modified = $true
    }
    
    # --- ARMOR ---
    if ($content -match '"images/equipment/head_') {
        $content = $content -replace '"images/equipment/head_', '"images/equipment/armor/head/head_'
        $modified = $true
    }
    if ($content -match '"images/equipment/chest_') {
        $content = $content -replace '"images/equipment/chest_', '"images/equipment/armor/chest/chest_'
        $modified = $true
    }
    if ($content -match '"images/equipment/hands_') {
        $content = $content -replace '"images/equipment/hands_', '"images/equipment/armor/hands/hands_'
        $modified = $true
    }
    if ($content -match '"images/equipment/legs_') {
        $content = $content -replace '"images/equipment/legs_', '"images/equipment/armor/legs/legs_'
        $modified = $true
    }
    if ($content -match '"images/equipment/feet_') {
        $content = $content -replace '"images/equipment/feet_', '"images/equipment/armor/feet/feet_'
        $modified = $true
    }
    
    # --- TOOLS ---
    if ($content -match '"images/equipment/tool_mining_') {
        $content = $content -replace '"images/equipment/tool_mining_', '"images/equipment/tools/mining/tool_mining_'
        $modified = $true
    }
    if ($content -match '"images/equipment/tool_woodcutting_') {
        $content = $content -replace '"images/equipment/tool_woodcutting_', '"images/equipment/tools/woodcutting/tool_woodcutting_'
        $modified = $true
    }
    if ($content -match '"images/equipment/tool_harvesting_') {
        $content = $content -replace '"images/equipment/tool_harvesting_', '"images/equipment/tools/harvesting/tool_harvesting_'
        $modified = $true
    }
    if ($content -match '"images/equipment/tool_fishing_') {
        $content = $content -replace '"images/equipment/tool_fishing_', '"images/equipment/tools/fishing/tool_fishing_'
        $modified = $true
    }
    
    if ($modified) {
        Set-Content $_.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($_.Name)"
    }
}

Write-Host "`nDone updating entity paths"
