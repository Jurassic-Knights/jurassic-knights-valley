import { h, renderToString } from '../domBuilder';
import { AssetItem, currentCategoryName, COMBAT_ROLES, WEAPON_TYPES, DINOSAUR_SPECIES, HERBIVORE_SPECIES, SAURIAN_SPECIES } from '../state';

export function buildRoleDropdownHtml(item: AssetItem, fileName: string): string {
    const isHumanOrSaurian = ['human', 'saurian'].includes(item.enemyType || '') || ['human', 'saurian'].includes(item.sourceFile || '');
    if (!isHumanOrSaurian) return '';

    const currentRole = item.role || 'medium';
    const roleDesc = currentRole === 'light' ? 'cloth/leather'
        : currentRole === 'medium' ? 'partial plate'
            : currentRole === 'heavy' ? 'full plate'
                : currentRole === 'utility' ? 'tool-focused'
                    : 'ornate/unique';

    const container = h('div', { className: 'asset-flex', style: 'margin:4px 0;' }, [
        h('span', { style: 'font-size:0.65rem; color:var(--text-dim);' }, ['🛡️ Role:']),
        h('select', {
            'data-action': 'update-field',
            'data-category': currentCategoryName,
            'data-file': fileName,
            'data-id': item.id,
            'data-field': 'role',
            'data-capture-value': 'true',
            className: 'asset-input'
        }, COMBAT_ROLES.map(role => h('option', { value: role, selected: role === currentRole }, [role]))),
        h('span', { style: 'font-size:0.6rem; color:#888;' }, [roleDesc])
    ]);

    return renderToString(container);
}

export function buildWeaponDropdownHtml(item: AssetItem, fileName: string): string {
    const isHumanOrSaurian = ['human', 'saurian'].includes(item.enemyType || '') || ['human', 'saurian'].includes(item.sourceFile || '');
    const attackType = (item.combat as { attackType?: string } | undefined)?.attackType || (item.stats as { attackType?: string } | undefined)?.attackType;


    if (!isHumanOrSaurian || !attackType) return '';

    const weapons = WEAPON_TYPES[attackType as string] || [];
    const currentWeapon = item.weaponType || '';

    const container = h('div', { style: 'margin:4px 0;' }, [
        h('label', { style: 'font-size:0.65rem; color:var(--text-dim);' }, ['⚔️ Weapon:']),
        h('select', {
            'data-action': 'update-weapon',
            'data-category': currentCategoryName,
            'data-file': fileName,
            'data-id': item.id,
            'data-capture-value': 'true',
            className: 'asset-input',
            style: 'margin-left:4px;'
        }, [
            h('option', { value: '' }, ['-- Select --']),
            ...weapons.map(w => h('option', { value: w, selected: w === currentWeapon }, [w.replace(/_/g, ' ')]))
        ])
    ]);

    return renderToString(container);
}

export function buildGenderBodyTypeHtml(item: AssetItem, fileName: string): string {
    const isHumanEnemy = item.enemyType === 'human' || item.sourceFile === 'human' || (item.id && item.id.includes('human'));
    const isNPC = item.type === 'merchant' || item.category === 'merchant' || item.sourceCategory === 'npcs';

    if (!isHumanEnemy && !isNPC) return '';

    const currentGender = item.gender || 'male';
    const currentBodyType = item.bodyType || 'medium';
    const bodyTypes = ['medium', 'skinny', 'fat', 'muscle'];

    const container = h('div', { style: 'margin:4px 0; display:flex; gap:6px; flex-wrap:wrap; align-items:center;' }, [
        h('div', { style: 'display:flex; gap:2px; align-items:center;' }, [
            h('span', { style: 'font-size:0.65rem; color:var(--text-dim);' }, ['👤 Gender:']),
            h('button', {
                'data-action': 'update-field',
                'data-category': currentCategoryName,
                'data-file': fileName,
                'data-id': item.id,
                'data-field': 'gender',
                'data-value': 'male',
                style: `padding:3px 8px; font-size:0.65rem; background:${currentGender === 'male' ? '#2196f3' : '#333'}; border:none; border-radius:4px; cursor:pointer; color:white;`
            }, ['♂ Male']),
            h('button', {
                'data-action': 'update-field',
                'data-category': currentCategoryName,
                'data-file': fileName,
                'data-id': item.id,
                'data-field': 'gender',
                'data-value': 'female',
                style: `padding:3px 8px; font-size:0.65rem; background:${currentGender === 'female' ? '#e91e63' : '#333'}; border:none; border-radius:4px; cursor:pointer; color:white;`
            }, ['♀ Female'])
        ]),
        h('div', { className: 'asset-flex' }, [
            h('span', { style: 'font-size:0.65rem; color:var(--text-dim);' }, ['🏋️ Body:']),
            h('select', {
                'data-action': 'update-field',
                'data-category': currentCategoryName,
                'data-file': fileName,
                'data-id': item.id,
                'data-field': 'bodyType',
                'data-capture-value': 'true',
                className: 'asset-input'
            }, bodyTypes.map(bt => h('option', { value: bt, selected: bt === currentBodyType }, [bt])))
        ])
    ]);

    return renderToString(container);
}

export function buildSpeciesDropdownHtml(item: AssetItem, fileName: string): string {
    const sourceFile = item.sourceFile || '';
    if (!['dinosaur', 'saurian', 'herbivore'].includes(sourceFile)) return '';

    let speciesList: string[] = [];
    if (sourceFile === 'dinosaur') speciesList = DINOSAUR_SPECIES;
    else if (sourceFile === 'herbivore') speciesList = HERBIVORE_SPECIES;
    else if (sourceFile === 'saurian') speciesList = SAURIAN_SPECIES;

    const currentSpecies = item.species || '';

    const container = h('div', { className: 'asset-flex', style: 'margin:4px 0;' }, [
        h('select', {
            'data-action': 'update-field',
            'data-category': currentCategoryName,
            'data-file': fileName,
            'data-id': item.id,
            'data-field': 'species',
            'data-capture-value': 'true',
            className: 'asset-input'
        }, [
            h('option', { value: '' }, ['-- Select Species --']),
            ...speciesList.map(s => h('option', { value: s, selected: s === currentSpecies }, [s]))
        ])
    ]);

    return renderToString(container);
}
