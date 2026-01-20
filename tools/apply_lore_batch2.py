"""
Pre-generated unique lore descriptions for BOSSES and NPCs.
Each description is 3 paragraphs, head-to-toe, following medieval+WWI aesthetic.
"""
import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTITIES_DIR = os.path.join(BASE_DIR, 'src', 'entities')

LORE_DATA = {
    # ==================== BOSSES - DINOSAURS ====================
    "boss_dinosaur_t1_01": """The Pack Leader commands through presence alone - this Velociraptor has fought its way to dominance through dozens of lethal challenges. Its head is scarred from countless territorial disputes, one eye clouded from an old wound that only makes its gaze more unsettling. The crest of feathers is matted with trophies from previous kills.

Light leather strapping marks this war-beast's domestication, but the minimal barding does nothing to diminish its feral majesty. Olive and brown coloring provides natural camouflage, though the prominent scars make identification easy. A brass collar bears the handler's regiment - those who have survived working with this creature.

Those powerful hind legs have chased down fleeing soldiers across miles of grassland, the killing claws on each foot worn sharp from constant use. The tail sweeps low during pack coordination, signaling attack formations to lesser raptors. When the Pack Leader calls, its pack moves as one lethal unit.""",

    "boss_dinosaur_t1_02": """The Nest Guardian has protected its territory so long that its twin crests have grown massive, flushing bright with rage at any intrusion. This Dilophosaurus has killed more soldiers than most artillery batteries, the ground around its nesting site littered with sun-bleached bones. Those amber eyes hold ancient patience and sudden violence.

Minimal leather strapping suggests past domestication attempts, but the creature now serves only instinct. Olive-tan hide shows lighter patches where old wounds healed, each scar a defeated challenger. The throat sac still carries venom glands that the creature deploys with terrifying accuracy against any who approach.

Heavy-clawed feet have worn paths into the grassland soil from years of territorial patrol. The powerful tail sweeps constantly, knocking aside vegetation to maintain clear sight lines. This creature has established its domain and will accept no challengers - military or otherwise.""",

    "boss_dinosaur_t2_01": """The Territorial Alpha has claimed miles of frozen tundra as its personal hunting ground. This massive Carnotaurus has grown fat on military supply convoys and their defenders, learning that human settlements mean easy prey. Those horned brows lower over eyes that radiate predatory confidence born from years of unchallenged dominance.

Bronze-plated barding covers its muscular frame, the armor appearing to have been scavenged from defeated military expeditions and fitted by some unknown process. White-grey scales show through gaps in the armor, camouflage developed for ambush strikes from snowdrifts. Frost crystals cling to the metal plates, adding to its fearsome appearance.

Those powerful legs have charged through blizzards to catch fleeing prey, each three-toed foot spreading wide on ice and snow. The short arms are vestigial but the tail provides devastating counterbalance for the ramming attacks this creature favors. The Territorial Alpha has never lost a confrontation in its domain.""",

    "boss_dinosaur_t2_02": """The Pack Alpha represents the pinnacle of Utahraptor evolution - larger, smarter, more vicious than any of its pack. This creature leads through demonstrated superiority, regularly killing challengers to reinforce hierarchy. Its feathered crest is decorated with the remains of previous rivals.

Bronze-reinforced leather barding covers a lithe muscular frame, the armor battered but functional from countless engagements. White-grey and pale brown coloring provides winter camouflage, though the creature's confidence means it rarely relies on stealth. Silver buckles gleam against frost-covered straps.

The killing claws on those digitigrade feet are legendary among tundra soldiers - each curved blade longer than a cavalryman's knife. The Pack Alpha coordinates attacks across its hunting territory, appearing to anticipate military movements before they occur. This creature hunts with strategy, not just instinct.""",

    "boss_dinosaur_t3_01": """The Desert Tyrant has established domain over the scorched dunes through methodical elimination of all competition. This ancient Allosaurus carries scars from a lifetime of supremacy, each mark a lesson taught to lesser predators. Those calculating eyes have watched military campaigns come and go while it endures.

Iron war-barding covers vital areas of its sand-colored hide, the armor inlaid with bronze patterns that seem almost ceremonial. Sun-bleached leather straps have been reinforced multiple times, the creature's handlers long since consumed. Campaign markers from a dozen regiments adorn the armor - trophies from defeated expeditions.

Massive three-clawed feet leave impressions in desert sand that soldiers have learned to avoid. The killing claw on each foot has been sharpened against rock to razor keenness. When the Desert Tyrant hunts, nothing in its territory survives.""",

    "boss_dinosaur_t3_02": """The Desert Stalker has perfected the ambush - a second Allosaurus apex predator that has carved territory adjacent to the Tyrant's domain. This creature favors cunning over direct confrontation, disappearing into sandstorms to strike when targets are most vulnerable. Its tracking capabilities border on supernatural.

Iron barding covers its lean frame, the armor designed for mobility rather than direct combat. Sand and tan patterns have been painted over natural coloring, suggesting either intelligence or handlers who understood camouflage. Bronze clasps secure armor that rattles in warning just before attacks.

Swift legs carry this creature in bursts of terrifying speed, closing distance before prey can react. The long tail sweeps to maintain balance during direction changes that would topple lesser predators. The Desert Stalker doesn't hunt for food alone - it seems to enjoy the chase.""",

    "boss_dinosaur_t4_01": """Frost Raptor earned its name through winter campaigns that left regiments frozen in their tents, silent kills discovered only when reinforcements arrived. This unprecedented Velociraptor has grown beyond any normal specimen's size, fed on rich military rations and the soldiers who carried them. Its intelligence seems almost human.

Ornate steel plate barding covers its massive frame, the armor engraved with patterns that suggest cultural significance beyond simple military marking. Despite the badlands deployment, frost clings to its pale grey feathers - whether natural or affected, soldiers debate endlessly. Iron clasps secure armor that has deflected close-range fire.

Those killing claws have learned to exploit gaps in plate armor, targeting joints and seams with surgical precision. The creature coordinates with lesser raptors through calls and signals that military analysts have failed to decode. Frost Raptor doesn't just lead a pack - it commands an army.""",

    "boss_dinosaur_t4_02": """The Tyrannosaur Matriarch represents the absolute apex of dinosaur evolution - a female Tyrannosaurus Rex of unprecedented size who has dominated badlands territory for decades. Her massive skull rises higher than most fortifications, jaws capable of crushing vehicles as easily as bones. The intelligence behind those ancient eyes has witnessed the rise and fall of military campaigns.

Ornate steel barding covers her colossal form, the armor plates so large they were forged as fortification gates and repurposed. Charcoal grey and rust coloring blends with volcanic terrain, though something this massive can hardly hide. Iron bands reinforce natural armor plates, creating defense that shrugs off artillery.

Those pillar-like legs shake the ground with each step, the footfall weight cracking volcanic basalt. The massive tail could demolish structures with casual sweeps. The Tyrannosaur Matriarch has claimed this territory, and no force yet deployed has succeeded in contesting that claim.""",

    "boss_dinosaur_t4_03": """The Roost Patriarch rules badlands waterways from a position of absolute dominance. This colossal Spinosaurus has grown to unprecedented proportions, the sail on its back visible for miles through volcanic haze. Those crocodilian jaws have ended more naval expeditions than any enemy fleet. The creature seems ancient, witnessing civilizations from its eternal river domain.

Steel plate barding reinforced with iron bands covers its elongated body, the armor patterns suggesting decades of accumulated military trophies. Charcoal grey scales are streaked with rust-red natural markings that glow eerily in volcanic twilight. The sail has been fitted with iron bands that double as territorial display and weapon.

The massive tail propels this creature through volcanic rivers with deceptive speed, emerging for devastating ambush strikes. Those clawed forelimbs can pin war-boats to riverbanks while the jaws finish crews. The Roost Patriarch has patrolled these waters for longer than living memory records.""",

    # ==================== BOSSES - HERBIVORES ====================
    "boss_herbivore_t4_01": """This Diplodocus is a living mountain rising from the volcanic plain, its impossibly long neck stretching toward ash-choked skies. The head at that neck's end is small but ancient, eyes that have watched badlands form over geological time. Its peaceful demeanor belies the devastation it causes simply by existing in a space.

No armor adorns this colossal creature - none could be forged at sufficient scale. The ash-grey hide blends with volcanic terrain, darker patches where minerals have stained the skin over decades. Its natural coloring adapted through generations of badlands existence.

Those column-like legs could crush fortifications simply by walking through them. The whip-like tail spans longer than most structures, capable of clearing entire formations with a single sweep. This ancient giant asks only to be left alone - and punishes intrusion with extinction-level force.""",

    "boss_herbivore_t4_02": """The Argentinosaurus dominates the skyline even among badlands volcanos, a creature of such scale that its movements alter local weather patterns. Its small head rises and falls with each thunderous breath, each exhalation a cloud visible for miles. The ancient eyes have witnessed more than human history records.

Pure wild nature defines this creature - no armor, no barding, just millions of years of evolution reaching peak form. Deep grey hide is mottled with volcanic ash that has become part of its permanent coloring. Black patches trace ancestral patterns unique to this individual.

Four legs like living pillars support incalculable tonnage, each footfall registering on seismic equipment miles distant. The massive tail sweeps slowly but with unstoppable force, clearing everything in its arc. To encounter this creature is to face a natural disaster with eyes.""",

    # ==================== BOSSES - HUMANS ====================
    "boss_human_t1_01": """The Squad Leader's stahlhelm rises above a face completely obscured by a welded combat mask, identity erased in service to command. Those unseen eyes have watched recruits become veterans under fire, learning who survives and who doesn't through harsh experience. The mask's speech grille echoes orders with metallic authority.

Ornate commander armor distinguishes this special-role officer from the grunts - gilded brass epaulettes over an olive drab wool coat, the fabric immaculate despite trench conditions. A decorated tabard bears unit insignia and campaign honors. Tool belts and equipment pouches mark preparation for any tactical situation.

Polished boots splash through the mud that cakes everything and everyone else. A service revolver gleams from a leather holster, its ivory grip carved with rank markings. This officer leads from the front, earning loyalty through shared danger rather than mere authority.""",

    "boss_human_t1_02": """The Frontline Captain's helmet has been reinforced with additional iron plating, the face guard welded into an expressionless mask that reveals nothing. The additional armor weight speaks to this officer's preference for direct confrontation over strategic distance. Heat from the forge that modified this helmet left permanent scorch marks.

Full plate armor covers a powerful frame beneath an olive drab tabard stained with the evidence of close combat. Iron plates overlap at shoulders and chest, secured by brown leather straps reinforced for the stresses of hand-to-hand fighting. The heavy-role designation shows in every pound of protection.

Iron-shod boots are designed for stability in the chaos of melee combat. A pistol provides ranged option, but the scratched and dented state of the armor plates tells the true story - this Captain prefers to meet enemies face to face, or rather mask to face.""",

    "boss_human_t2_01": """The Battalion Commander issues orders from behind a face plate lined internally with fur against the killing tundra cold. That insulated mask has witnessed battalion-level operations across frozen wastelands, the strategic mind behind it responsible for victories measured in miles of territory. Frost crystals decorate the helmet's exterior.

Ornate commander armor gleams with silver trim over a white-grey fur-lined coat, the luxury materials denoting high rank. A pale leather cape flows from gilded shoulder guards, the fabric embroidered with campaign honors. Tool belts carry strategic equipment - maps, compasses, signal devices.

Insulated boots leave commanding footprints in snow as this officer surveys the frozen battlefield. A mechanical crossbow serves as personal weapon - quiet for covert operations, deadly accurate in trained hands. This special-role commander plans victories before the first shot fires.""",

    "boss_human_t2_02": """The Frost Sergeant's helmet shows the dents and scratches of frontline leadership, the welded face guard frost-rimed from eternal tundra exposure. Those unseen eyes have led squads through conditions that killed the unprepared, earning command through frozen hell. The metal mask reflects the cold within.

Commander armor modified for tundra conditions covers a sturdy frame - silver-trimmed plates over white-grey fur-lined padding. Pale leather straps secure the layered protection against a body kept warm through constant movement. A decorated cape bears kill markers rather than campaign ribbons.

Heavy insulated boots are designed for leading charges across frozen ground. A mechanical crossbow hangs from a specially designed harness, the weapon ready for immediate deployment. This Frost Sergeant earned rank through demonstrated lethality, not political connection.""",

    "boss_human_t3_01": """The Desert General's helmet rises to a ceremonial point, the welded iron mask below bearing engravings that tell of campaigns across the scorched dunes. That expressionless face has delivered orders that reshaped desert warfare, the tactical mind behind it responsible for doctrines still studied. Sand has permanently etched the metal surface.

Full plate armor bears the weight of command - heavy bronze plates over a sand-colored tabard stained with the evidence of leadership from the front. Sun-bleached leather secures overlapping protection designed for the heaviest combat. The heavy-role designation reflects this commander's aggressive doctrine.

Reinforced boots have left footprints across every major desert engagement of the past decade. A combat shotgun provides devastating close-range capability, the weapon engraved with unit honors. This General believes leaders should share every danger their troops face.""",

    "boss_human_t3_02": """The Sand Viper's helmet is configured for maximum anonymity - a cloth-wrapped exterior over welded face guard, revealing nothing of the identity within. This assassin-turned-officer earned command through demonstrated lethality against impossible targets. The mask's narrow eye slits give nothing away.

Commander armor designed for mobility rather than protection covers a lean frame - sand-tan plates strategically positioned over a lightweight coat. Bronze clasps secure the minimal armor precisely, each piece placed to maximize the machine gun's effectiveness. The special-role designation marks unconventional warfare specialty.

Desert-adapted boots leave whisper-soft tracks in sand, a lifetime of stalking habits unchanged by rank. That machine gun provides overwhelming firepower for a single operator, the weapon responsible for ambushes that devastated enemy command structures. The Sand Viper strikes and vanishes.""",

    "boss_human_t4_01": """The Feldwebel's helmet bears the ornate iron mask of badlands command, the face engraved with unit citations and kill tallies that would fill books. Those unseen eyes have witnessed every horror the volcanic hellscape produces and mastered each one. The mask's expression is stern authority frozen in metal.

Elite commander armor announces status before rank insignia appears - gilded iron plates over a charcoal grey tunic, the fabric somehow pristine despite badlands conditions. A decorated cape flows from shoulder guards that bear campaign honors from three theaters of war. Every piece of equipment reflects decades of service.

Heavy boots have marched across every terrain the badlands offer, from volcanic glass to ash dunes. That machine gun has held positions against impossible odds, the weapon itself bearing decorations for distinguished service. The Feldwebel defines what special-role command means in this theater.""",

    "boss_human_t4_02": """The Leutnant's helmet has been customized for precision operations - narrow eye slits fitted with optical enhancement, the face guard smooth and featureless. This sniper-commander has eliminated high-value targets across every biome, earning the all-theater deployment that fears no environment. The mask's anonymity is their most valuable weapon.

Ornate commander armor balances protection and mobility - gilded plates positioned to protect vital areas while allowing the steady positioning required for long-range elimination. A charcoal grey cloak provides concealment while lying in wait. The special-role designation marks this officer as strategic asset.

Soft-soled boots designed for silent movement through any terrain make no sound on volcanic rock. That scoped sniper rifle has ended enemy officers, war-beast handlers, and other priority targets from distances they believed safe. The Leutnant is dispatched when conventional solutions fail.""",

    "boss_human_t4_03": """The War General's helmet rises like a crown of iron, the welded mask below bearing campaign markings from more wars than most soldiers know exist. Those eyes behind the mask have commanded armies, shaped doctrine, and buried more enemies than the volcanic ash they stand upon. The mask's stern expression reflects proven lethality.

Full plate armor marks this as the heaviest commander role - layered iron plates that could shrug off close-range fire, worn without apparent effort. A charcoal grey cape flows from shoulder guards broad as fortification merlons. Decorations and campaign honors cover every available surface, each earned through victory.

Iron boots have led charges that broke enemy formations across these badlands. A longsword - chosen over modern weapons - speaks to a commander who believes in demonstrating personal courage. The War General has earned every rank through proved devastating effectiveness in the worst conditions warfare offers.""",

    # ==================== BOSSES - SAURIANS ====================
    "boss_saurian_t1_01": """The Scout Captain's Gallimimus head rises tall on an elongated neck, those keen eyes scanning far beyond normal saurian range. This creature has led reconnaissance operations across grassland territories, learning patrol patterns and response times through years of observation. The small head tilts with constant calculation.

Ornate leather armor marks command status among the saurian ranks, gilded brass studs decorating a harness designed for the creature's unusual proportions. Olive drab cloth falls from the shoulders, approximating the capes that human officers favor. Tool pouches contain maps and communication equipment.

Those impossibly long legs carry this officer across terrain faster than cavalry pursuit. The exposed clawed feet spread naturally for balance during high-speed direction changes. Despite being armed with only a flanged mace, this Scout Captain's true weapon is information - coordinating strikes based on intelligence no human scout could gather.""",

    "boss_saurian_t1_02": """The Claw Sergeant's Deinonychus heritage shows in every predatory movement, the killing claw on each foot clicking against ground with barely restrained violence. Those slitted eyes hold both intelligence and hunger in unsettling balance. The small head tilts as it assesses threat levels with military precision overlaying apex predator instinct.

Light armor marks this creature as a strike specialist - gilded leather straps crossing a lean muscular frame designed for combat, not display. Olive-brown feathers bristle through gaps in the harness. A commander's token hangs from the leather, marking earned rather than given rank.

Those powerful legs coil with spring-loaded tension, ready to launch devastating attacks at any provocation. A military knife augments those natural killing claws, though the combination seems redundant. The Claw Sergeant leads from the front, demonstrating techniques before ordering troops to execute them.""",

    "boss_saurian_t2_01": """The Frost Raider's Utahraptor frame is massive even for the species, the creature having fed well on military supplies and their defenders across tundra campaigns. Intelligent eyes gleam from beneath a fur-lined hood custom-fitted for the elongated skull. The feathered crest is streaked with grey and white winter camouflage.

Commander armor covers a powerfully muscled torso - silver-trimmed plates over white-grey fur that blends with tundra conditions. Pale leather straps secure the armor against movement that would dislodge lesser fittings. The ornate nature of the armor announces special-role status to friend and enemy alike.

The killing claws on those massive feet have shattered ice and soldiers with equal ease. A reinforced steel pike grants reach against enemies who try to stay beyond those natural weapons. This Frost Raider leads ambushes from blizzard cover, appearing and vanishing like winter itself.""",

    "boss_saurian_t2_02": """The Ice Stalker's Baryonyx crocodilian snout emerges from darkness and storm with patient menace, those cold eyes ancient as frozen tundra. This ambush predator has learned to use military tactics to enhance natural hunting behavior. The long jaws remain closed through discipline, but rows of conical teeth gleam with promised violence.

Pale armor covers the elongated body, silver-trimmed plates fitted for the creature's unusual proportions. Fur-lined pale leather straps disappear beneath overlapping protection designed for tundra conditions. A commander's cloak covers the creature's back, disguising its true size until too late.

Massive clawed forelimbs are fitted with iron blade extensions, augmenting natural weapons with military engineering. Those heavy legs move with impossible silence through frozen terrain. The Ice Stalker has perfected the ambush - targets vanish without alarm, discovered only when search parties find the remains.""",

    "boss_saurian_t3_01": """The Dune Warlord's Carnotaurus face radiates command presence, those distinctive horns filed to wicked points that have gored generals and war-beasts alike. The compact skull designed for ramming is also suited for inspiring terror. Those eyes have watched saurian forces conquer territory across the scorched dunes.

Elaborate bronze armor announces warlord status, layered plates bearing battle damage that only enhanced the reputation of the creature wearing them. A sand-colored cape flows from gilded shoulder guards, the fabric embroidered with unit honors and kill tallies. Every piece of armor tells a story of violence.

Those powerful legs have charged through enemy formations, the exposed clawed feet tearing through sand and soldiers with equal ease. A massive war hammer swings from one clawed hand, the weapon sized for a creature that towers over human soldiers. The Dune Warlord leads by example - devastating example.""",

    "boss_saurian_t3_02": """The Sand Crusher presents that signature domed skull with aggressive intent, the bone thickened through a lifetime of devastating headbutt attacks. This Pachycephalosaurus saurian has risen to command through demonstrated superiority in the most direct possible way. Those small eyes hold single-minded determination.

Bronze commander armor allows full mobility for charging attacks while providing status markers appropriate to rank. Sun-bleached leather straps secure the minimal protection, prioritizing the creature's natural weapon over defensive capability. A decorated cape flows backward during charges, adding to the spectacle.

Heavy digitigrade legs coil with explosive power, the exposed clawed feet gripping sand for maximum acceleration. A war hammer provides backup for when the skull-ram fails to end combat, though that happens rarely. The Sand Crusher has never lost a challenge battle - survival demands more cunning opponents avoid direct confrontation.""",

    "boss_saurian_t4_01": """The T-Rex General is the most terrifying sight the badlands produce - a Tyrannosaurus Rex saurian of unprecedented size, standing upright in command armor that would require its own wagon to transport. That massive skull could swallow soldiers whole, yet those intelligent eyes hold strategic rather than merely predatory calculation. The tiny arms are hidden beneath shoulder armor, their vestigial nature irrelevant beside such overwhelming power.

Ornate command armor covers a body that dwarfs human structures - gilded iron plates the size of carriage doors, secured by chains rather than straps. A charcoal grey cape flows from shoulder guards that could shelter squads beneath their bulk. Campaign honors and kill markers cover every available surface, each representing destroyed units rather than individuals.

Those pillar-like legs end in exposed clawed feet that can crack volcanic basalt with casual steps. A longsword sized for this titan serves as both weapon and symbol of command, the blade longer than most polearms. The T-Rex General commands saurian forces across the badlands - and nothing has successfully challenged that authority.""",

    "boss_saurian_t4_02": """The Spinosaurus Commander rises from volcanic rivers like emerging nightmare, that sail breaking the surface before the rest of the massive body reveals itself. The crocodilian jaws are filled with teeth designed for gripping prey that never escapes, while the eyes hold strategic intelligence rare even among saurian commanders. Water streams from iron-banded armor as the creature ascends to dry land.

Heavy plate armor covers the elongated body, designed for amphibious transition without compromising protection. Iron bands reinforce natural armor across the sail, transforming the intimidation display into actual defense. Charcoal grey coloring blends with volcanic rock when not submerged.

That massive tail propels the creature through water with deceptive speed, while heavy clawed limbs carry it with equal effectiveness on land. A heavy machine gun seems almost comical in those massive clawed hands, yet the creature wields it with trained precision. The Spinosaurus Commander controls both waterways and shores throughout the badlands.""",

    # ==================== NPCs ====================
    "npc_merchant_01": """This merchant's face remains hidden behind dust-caked goggles and a cloth wrap that filters the ever-present stone dust of the quarry regions. Whatever expression lies beneath has long since become irrelevant to trade negotiations - only the quality of goods and fairness of prices matter here. The voice emerges muffled but surprisingly warm.

Practical olive drab traveling clothes bear the heavy wear of countless miles across trade routes. Brown leather pouches hang from every available strap and belt, each labeled with merchant's codes only the initiated can read. A brass-studded leather vest provides minimal protection against both weapons and the elements.

Sturdy traveling boots are caked with the distinctive grey mud of quarry roads, the soles worn thin from endless walking between customer bases. A service revolver rides in a leather holster - self-defense in lawless regions. This merchant has supplied soldiers and civilians alike, trading with anyone whose coin proves genuine.""",

    "npc_merchant_02": """The traveling merchant's identity disappears behind a stahlhelm and face wrap that have seen every territory the conflict touches. Those hidden eyes have assessed the value of goods from battlefield salvage to rare materials with equal professionalism. The voice carries the practiced neutrality of someone who trades with all sides.

Weathered olive drab wool covers a wiry frame built for endurance travel between military encampments. Multiple belt pouches contain samples and trade goods, the leather darkened from years of handling. Brown leather suspenders cross the chest, supporting tool loops and additional carrying capacity.

Well-worn boots have walked trade routes through every biome, the leather maintained despite visible repairs. A holstered pistol provides necessary deterrence in dangerous territories. This merchant appears wherever soldiers gather, offering supplies that official channels cannot or will not provide.""",

    "npc_merchant_03": """Behind the protective mask and hood lies a merchant who learned early that anonymity aids survival in war zones. The covering reveals nothing of age, gender, or origin - only the quality of goods matters in trade. Gestures and inventory communicate what words cannot.

Traveling clothes of olive drab wool bear patches from multiple military forces, salvaged materials incorporated into practical attire. Brown leather satchels and belt pouches organize inventory with merchant's precision. A sturdy vest provides moderate protection appropriate for exposed travel.

Boots show the distinctive wear patterns of long-distance trading, repaired multiple times rather than replaced. A concealed weapon provides security when diplomacy fails. This merchant moves between conflict zones with apparent immunity, serving all sides without judgment.""",

    "npc_merchant_04": """The merchant's protective gear speaks to specialized trade in volatile materials - reinforced goggles, double-filtered mask, and gloves that have survived chemical exposure. This trader deals in the dangerous commodities that military operations require but official supply chains avoid. The hands remain steady despite handling substances that could kill a careless person.

Heavy-duty olive drab coveralls bear chemical stains and repair patches from decades of hazardous trading. Brown leather pouches are lined with protective materials to contain volatile goods. Tool belts carry specialized handling equipment alongside standard merchant's wares.

Reinforced boots rise above the ankle, protecting against spills and hostile terrain alike. Multiple sidearms suggest this merchant has faced dangers beyond typical banditry. This supplier provides the materials that make modern warfare possible, for the right price.""",

    "npc_merchant_05": """This merchant has adapted to serving military clientele so thoroughly that their attire resembles a quartermaster more than civilian trader. The face remains covered in military fashion, a welded mask below a standard helmet creating perfect anonymity. Whether former soldier or careful mimic, the effect aids trusted commerce.

Military-style olive drab tunic is augmented with brass buttons and unit patches from a dozen regiments - all purchased decorations identifying customers rather than service. Brown leather ammunition pouches have been repurposed for carrying trade goods sized for immediate sale. The effect suggests officially sanctioned supply.

Standard-issue boots complete the quasi-military appearance, their regulation polish maintained despite trading rather than marching. A holstered pistol is purely regulation specification. This merchant has found that appearing official opens doors that would close to obvious civilians.""",

    "npc_merchant_06": """The wandering trader's face covering incorporates breathing apparatus that suggests specialization in regions where air itself becomes dangerous. Volcanic ash, chemical remnants, biological threats - this merchant goes where others cannot or will not. The gear has saved their life multiple times.

Reinforced olive drab traveling wear bears the burns, tears, and stains of trading through the worst terrain warfare produces. Brown leather pouches are treated against environmental hazards, protecting valuable inventory from contamination. Heavy tool belts carry survival gear alongside trading stock.

Sealed boots protect against both terrain and atmospheric hazards, the specialized footwear essential for this merchant's preferred territories. Multiple weapons suggest frequent encounters with threats beyond simple banditry. This trader serves as lifeline to isolated outposts that other merchants refuse to visit.""",

    "npc_merchant_07": """This merchant has traded so long across conflict zones that their equipment has become a patchwork of every culture and faction the wars have touched. The face covering incorporates elements from multiple military traditions, creating protective anonymity through aggregated salvage. Each piece has a story.

Clothing layers represent seasons of trading - olive wool over desert linen over tundra fur, all worn simultaneously and modified constantly. Brown leather pouches bear stitching in multiple styles, repaired by countless hands across trade routes. Brass fittings from different forges mark this as a traveling museum.

Boots have been resoled so many times that nothing original remains, yet they carry this merchant through all terrain without complaint. An assortment of weapons suggests gifts and payments accepted across dozens of territories. This trader has become part of the landscape, a permanent feature serving any who can pay.""",

    "npc_merchant_08": """The relic collector's protective gear is deliberately archaic, styled after pre-war traditions that mark this trader as specialist in antiques and rare materials. The mask is brass and leather in patterns that precede modern military standardization. Gloved hands have handled artifacts worth more than military payrolls.

Ancient-styled olive robes cover modern protective equipment beneath, the contrast representing the trader's specialty bridging eras. Leather pouches are designed for careful transport of fragile or valuable items, cushioned against the travel that would break lesser containers. Every piece of equipment prioritizes preservation over protection.

Soft-soled boots prevent vibration that might damage delicate cargo, though they serve poorly on rough terrain. A holstered revolver is practical concession to modern dangers. This merchant deals in history itself - artifacts, documents, and treasures that both sides of the conflict desperately seek.""",
}


def update_entities_with_lore():
    """Update entity JSON files with pre-generated lore."""
    updated = 0
    
    for entity_id, lore in LORE_DATA.items():
        # Determine category from ID
        if entity_id.startswith('enemy_'):
            category = 'enemies'
        elif entity_id.startswith('boss_'):
            category = 'bosses'
        elif entity_id.startswith('npc_'):
            category = 'npcs'
        else:
            print(f"Unknown category for {entity_id}")
            continue
        
        filepath = os.path.join(ENTITIES_DIR, category, f"{entity_id}.json")
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            entity = json.load(f)
        
        entity['description'] = lore.strip()
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(entity, f, indent=4)
        
        print(f"Updated {entity_id}")
        updated += 1
    
    return updated


if __name__ == '__main__':
    print("=== Applying Pre-Generated Lore (Bosses + NPCs) ===\n")
    count = update_entities_with_lore()
    print(f"\n=== Done! Updated {count} entities ===")
