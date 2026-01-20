"""
Pre-generated unique lore descriptions for all entities.
Each description is 3 paragraphs, head-to-toe, following medieval+WWI aesthetic.
"""
import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTITIES_DIR = os.path.join(BASE_DIR, 'src', 'entities')

# AI-generated unique lore for each entity
LORE_DATA = {
    # ==================== ENEMIES - DINOSAURS ====================
    "enemy_dinosaur_t1_01": """The Compsognathus darts through the underbrush with lightning speed, its small reptilian head constantly scanning for prey. Beady yellow eyes gleam beneath a light leather muzzle harness that bears a unit tag stamped in brass. Rows of needle-like teeth flash when it hisses warnings to packmates.

Fitted with minimal combat gear - just thin leather straps around its narrow chest that hold a signal flare pouch. The olive-green scales blend seamlessly with the grassland vegetation, with darker striping along its spine. A small brass bell dangles from its harness, used by handlers to track the pack.

Its wiry legs carry it at incredible speeds across open terrain, leaving three-toed prints in the mud. The long tail provides balance during sharp turns while hunting. Despite its diminutive size, a pack of these creatures can overwhelm unprepared soldiers in moments.""",

    "enemy_dinosaur_t1_02": """The Dilophosaurus holds its head high, twin crests rising like a crown of bone above its skull. Its eyes are cold amber, pupils narrowing to slits as it assesses threats. The distinctive double ridges are often painted with unit markers in faded brown and tan war paint.

Light leather barding covers its shoulders and neck, reinforced with brass studs to deflect glancing blows. The olive-brown hide shows faint striping that helps it vanish into tall grass. A collar fitted with iron spikes protects its throat while making the creature appear more fearsome.

Powerful hind legs end in curved killing claws, designed for slashing and pinning prey. The long tail sweeps low behind it, counterbalancing its forward-leaning posture. Handlers know to approach only from the side - a frontal approach often ends with venomous spit to the face.""",

    "enemy_dinosaur_t1_03": """The Oviraptor's beaked head tilts with unsettling intelligence, its crest bobbing as it processes its surroundings. Dark eyes study everything with a calculating gaze that betrays surprising cunning. The parrot-like beak can crush bone as easily as it cracks eggs.

A simple leather harness wraps around its chest and shoulders, bearing small pouches for carrying messages or pilfered supplies. Its feathered body displays mottled brown and olive tones perfect for grassland camouflage. The arms end in grasping claws capable of manipulating objects with surprising dexterity.

Swift digitigrade legs allow rapid movement through camp perimeters where it often raids supply lines. Its long feathered tail fans out for balance when sprinting. Military handlers use these creatures as messengers and scouts, though guarding supplies from them proves challenging.""",

    "enemy_dinosaur_t1_04": """The Gallimimus stands alert on long legs, its ostrich-like silhouette breaking the grassland horizon. A small head on an elongated neck swivels constantly, large eyes providing exceptional peripheral vision. The toothless beak snaps nervously at flies while remaining watchful.

Minimal tack adorns this creature - just a light leather saddle and brass-studded bridle for the rare occasions it carries riders or messages. Its tan and cream coloring matches dried grass perfectly, with subtle darker freckling along the back. A unit brand marks its left flank, identifying its regiment.

Those impossibly long legs can outpace cavalry horses over open ground, three-toed feet churning through mud and grass alike. The stiff tail streams behind during sprints, providing balance at high speeds. Handlers value these creatures primarily for reconnaissance and swift messenger duties.""",

    "enemy_dinosaur_t2_01": """The Pachycephalosaurus lowers its massive domed skull, bone thickened by years of territorial combat. Small intelligent eyes peer out from beneath the reinforced cranium, calculating attack angles. Horns and bony nodules ring the back of its skull like a crown of combat medals.

Bronze-plated barding covers its shoulders and chest, fitted precisely to allow the creature's signature ramming attacks. The white-grey hide is marked with darker patches that break up its silhouette against tundra snows. Pale leather straps secure the armor while fur-lined padding prevents frostbite at the contact points.

Thick muscular legs end in sturdy feet designed for stable charges over frozen ground. The heavy tail provides counterbalance when it lowers its head for devastating headbutt attacks. Veterans know to dive aside when this creature begins its charge - its skull can dent tank armor.""",

    "enemy_dinosaur_t2_02": """Stalker earned its name through whispered stories of soldiers who vanished from their posts without a sound. The Baryonyx's elongated crocodilian snout is filled with conical teeth designed for gripping rather than tearing. Its eyes hold the patient gaze of an ambush predator accustomed to waiting hours for the perfect strike.

Bronze armor plates cover the beast's back and flanks, silver clasps securing the barding against its grey-white hide. A pale leather muzzle keeps its jaws closed until handlers release it for combat. The creature's clawed forearms are unusually large and powerful, capable of swiping through tent canvas or flesh with equal ease.

It moves with eerie silence for a creature its size, each footfall placed with predatory precision. The heavy tail drags low, steadying its movements through frozen marshlands where it prefers to hunt. Ice and snow cling to its hide as it emerges from ambush positions, a living nightmare from the tundra mist.""",

    "enemy_dinosaur_t2_03": """The Pachyrhinosaurus presents a face like a battering ram, its ornate bony boss replacing the typical ceratopsian horn. Massive frill fans backward from its skull, edges decorated with smaller horns like the crenellations of a fortress. Its eyes are small but fierce, set deep beneath protective bone ridges.

Silver-trimmed bronze barding wraps its stocky body, the armor designed to complement rather than hinder its natural defenses. Fur-lined pale leather straps secure plates over its shoulders and flanks. The white-grey hide is decorated with dark geometric markings - natural camouflage enhanced by unit insignia painted in ash.

Four pillar-like legs support several tons of bone, muscle, and armor plating. The short tail is unarmored to preserve mobility when the beast pivots for charges. Commanders deploy these creatures as living siege engines, perfect for breaking through fortified positions.""",

    "enemy_dinosaur_t2_04": """The Therizinosaurus rises to its full towering height, arms spread wide to display claws that would shame any sword. Its small head seems almost comically undersized atop the long neck, but those beady eyes miss nothing. A rounded beak suggests herbivorous origins, though the creature's temperament is anything but peaceful.

Bronze-reinforced pale leather covers its torso and upper legs, the armor specially designed to accommodate its unusual proportions. Fur-lined straps prevent the metal from freezing to its white-grey feathered hide. Silver buckles secure the barding while leaving its devastating forelimbs completely unrestricted.

Those nightmarish claws - each longer than a cavalryman's saber - can disembowel an armored horse with a single swipe. Its legs are powerful enough to support the creature's bulk while delivering surprisingly swift attacks. Handlers approach only from behind, and even then with extreme caution and a handler's pole.""",

    "enemy_dinosaur_t2_05": """This grassland-deployed Oviraptor bears the weathered look of a creature that survived multiple campaigns. Its feathered crest is torn in places, old scars crossing its beaked face. Those dark calculating eyes have witnessed the worst of trench warfare and adapted accordingly.

Military-grade bronze studs reinforce the leather harness crossing its chest and shoulders. Olive and brown feathers bristle above the barding, providing excellent concealment in tall grass. Multiple message pouches hang from brass rings, marking this creature as a veteran courier trusted with important dispatches.

Battle-hardened leg muscles carry the creature swiftly through no-man's-land under cover of darkness. Its taloned feet grip mud and debris with experienced surety. The long feathered tail shows singe marks from close encounters with artillery - yet the creature remains in active service.""",

    "enemy_dinosaur_t3_01": """The Carnotaurus presents a face of pure nightmare - stubby horns jutting above blazing eyes, jaws filled with serrated teeth designed for one purpose. Its skull is compact and dense, built for delivering devastating headbutts before those jaws close for the kill. Scarred hide testifies to victories in countless territorial disputes.

Iron war-barding plates overlap across its muscular body, bronze highlights marking it as a desert-theater beast. Sand-tan leather straps secure the armor against sun-bleached scales that range from dusty cream to burnt bronze. The chest plate bears a unit emblem acid-etched into the metal.

Tiny vestigial arms are worthless for grasping but the legs more than compensate - thick columns of muscle driving the creature at terrifying speeds. The heavy tail swings for balance as it corners, kicking up clouds of desert sand. Veteran soldiers know that once a Carnotaurus locks onto a target, only death stops its charge.""",

    "enemy_dinosaur_t3_02": """Razorclaw, as the handlers named this Allosaurus veteran, carries three parallel scars across its muzzle from prey that almost escaped. Its eyes hold the cold patience of an apex predator that has learned to wait for the perfect moment. The massive skull ends in jaws that can crush bone and sever limbs with a single bite.

Iron plate barding covers its sides and back, the metal showing dents and scratches from previous engagements. Sun-bleached leather straps are reinforced with bronze clasps, securing the armor to its sand-colored hide. Desert camouflage patterns have been painted across exposed scales in tan and pale brown.

Each step plants a three-toed foot with deliberate weight, the killing claw on each foot curved like a cavalry saber. The long tail sweeps the sand behind it, erasing its tracks from recent kills. This creature hunts by strategy, not just instinct - a fact that makes it far more dangerous than its feral cousins.""",

    "enemy_dinosaur_t3_03": """The Ankylosaurus presents an impenetrable fortress of bone and iron, natural armor studded with additional military plating. Its small head is heavily armored, tiny eyes barely visible between protective ridges. The only exposed vulnerability is the soft underbelly that the creature guards with territorial ferocity.

Iron plates have been bolted directly onto its natural armor, creating redundant protection that shrugs off rifle fire. Bronze-colored spines jut from the barding at irregular angles, echoing the creature's natural nodules. Tan leather straps disappear beneath overlapping plates, visible only at the joints where movement demands flexibility.

Those four sturdy legs are short but incredibly powerful, supporting tons of armored bulk. But the true weapon lies at the tail's end - a massive club of solid bone, now reinforced with an iron cap. One swing can demolish fortifications, crush vehicle tracks, or pulverize anyone foolish enough to approach from behind.""",

    "enemy_dinosaur_t3_04": """The Bull Triceratops earned its name through sheer aggression, three horns presented forward in constant challenge. Its massive bony frill fans backward like a shield wall, edges reinforced with iron bands. Eyes of deep amber burn with territorial fury, tracking any movement as potential threat.

Iron war-barding covers its barrel-shaped body in overlapping plates that clatter with each heavy step. Sun-bleached leather harness straps are thick as a soldier's belt, studded with bronze rings for attaching supply chains. The sand-colored hide beneath the armor shows old wounds - pale scar tissue from battles with rival bulls.

Pillar-like legs end in feet that leave dinner-plate impressions in desert sand. The short tail is unarmored for mobility when the creature pivots during charges. Nothing short of artillery stops this beast once it lowers those horns and breaks into a thundering charge.""",

    "enemy_dinosaur_t4_01": """The Alpha Raptor stands apart from lesser Utahraptors - larger, older, covered in battle scars that lesser creatures could not have survived. Its head rises and falls with each heavy breath, calculating eyes processing threat assessments with unsettling intelligence. The killing claws on each foot have been sharpened to razor keenness by handlers who fear the creature they maintain.

Ornate steel plate barding wraps this apex predator's body, each piece engraved with kill tallies and unit honors. Blackened leather straps secured with iron buckles hold the armor firm against its charcoal-grey hide. Rust-red streaks natural to badlands Utahraptors are visible between armor plates, resembling dried blood.

Those powerful legs can propel the creature thirty feet in a single leap, clawed feet extending forward for devastating landing strikes. The stiff tail provides balance during complex aerial attacks that leave targets shredded. Handlers say this creature doesn't follow commands - it simply agrees to hunt the same prey as its masters, for now.""",

    "enemy_dinosaur_t4_02": """The Apex Hunter materializes from volcanic ash like a nightmare given flesh, its Giganotosaurus bulk blocking out the smoke-filtered sun. That massive skull holds jaws designed to shear through anything organic, while intelligent eyes assess prey with patience that belies the creature's violence. Scars crisscross its hide where previous challenges failed.

Steel plate armor covers its most vital areas - chest, shoulders, and the sides of that massive neck. Blackened leather and iron chain connect the plates, jangling with each earthshaking footstep. The charred grey and rust coloring of its natural hide blends seamlessly with badlands terrain, making something impossibly huge somehow disappear into the hellscape.

Each tree-trunk leg ends in clawed feet that leave craters in volcanic soil. The tail sweeps behind it like a dreadnought's rudder, capable of shattering wooden structures with casual swings. Only the most desperate or foolish engage this creature - it is deployed as a weapon of last resort, impossible to control once its blood rises.""",

    "enemy_dinosaur_t4_03": """The Spined Terror is aptly named - a Spinosaurus of legendary size, the sail on its back rising like a war banner visible for miles. Its crocodilian jaws stretch impossibly wide, revealing rows of teeth designed for gripping prey that never escapes. Those ancient eyes have watched civilizations rise and fall from badlands riverways.

Ornate steel barding wraps its elongated body, the armor inlaid with iron patterns mimicking the creature's natural sail. Blackened leather straps cross beneath its belly, secured with reinforced buckles that took three smiths to forge. The charcoal-grey hide is streaked with rust-red markings that glow eerily in volcanic light.

The long powerful tail is fitted with iron bands, transforming it from a swimming appendage into a siege weapon. Massive clawed forelimbs can pin soldiers to the ground while those devastating jaws finish the work. This creature fears nothing - it has outlived every threat the badlands produced, and it knows it.""",

    # ==================== ENEMIES - HERBIVORES ====================
    "enemy_herbivore_t1_01": """The Iguanodon raises its head from grazing, jaws working methodically on tough grassland vegetation. Its eyes are large and watchful, constantly scanning the horizon for threats while maintaining that deceptively calm demeanor. The distinctive thumb spike curves outward from each hand like a natural dagger.

No armor adorns this creature - just the natural olive-brown hide that blends perfectly with the grassland environment. Darker stripes run down its back, the pattern unique to each individual like fingerprints. The belly shows lighter cream coloring where it presses against cool morning grass.

Strong hind legs support most of its bulk, though it can drop to all fours for faster travel. The heavy tail counterbalances its body when rearing up to reach higher foliage or defend against predators. Peaceful by nature, but those thumb spikes have disemboweled more than one overconfident hunter.""",

    "enemy_herbivore_t1_02": """The Parasaurolophus's curved cranial crest catches the wind, producing low resonant calls that carry across the grassland plains. Its duck-billed face appears almost gentle, those large eyes holding an expression soldiers often mistake for domestication. The crest is hollow, used for communication with the herd and temperature regulation.

Natural coloring runs from earthy brown along the back to lighter tan on the flanks and belly. Mottled grey patches help break up its silhouette when standing among rocks and scrub vegetation. No equipment or barding - just pure wild dinosaur living as it has for millions of years.

Long powerful legs can carry this creature at speeds rivaling cavalry horses when threatened. The tail sweeps low for balance during sprints across open ground. Groups of these creatures communicate danger through their crest-calls, making approaching one silently nearly impossible - the alarm will spread for miles.""",

    "enemy_herbivore_t1_03": """The Maiasaura moves with maternal caution, always aware of the young that often travel in its herd's center. Its face is gentle for a dinosaur, the beak designed for stripping leaves rather than combat. Watchful eyes track movement not with predatory intent but protective concern.

The hide displays dappled patterns of brown and olive, with lighter undersides that help regulate body temperature. Natural camouflage developed over millions of years makes the creature difficult to spot when it holds still among vegetation. Its skin is leathery and tough, providing modest protection without artificial armor.

Sturdy legs support a body built for endurance rather than speed, though it can surprise predators with quick bursts of movement. The tail is held stiff for balance while grazing. Known as a "good mother lizard," this creature will defend its young with shocking ferocity, using its bulk to crush threats.""",

    "enemy_herbivore_t2_01": """The Stegosaurus presents a profile unmistakable even at distance - those alternating dorsal plates rising like a fortress's serrated walls. Its small head hangs low, beaked mouth designed for low-growing vegetation. The eyes appear dull, but underestimating this creature's awareness proves fatal.

White-grey natural coloring helps the creature blend into tundra snowfields and frost-covered rocks. The famous back plates show pale cream coloring that flush pink when the creature heats them in anger. No armor is needed - nature provided ample protection through those plates and the tail's deadly weaponry.

Heavy legs support the creature's considerable bulk, each footfall breaking through ice crusts. The tail holds the true threat - four long spikes that can impale an armored soldier and fling the body aside. Herders call this the "thagomizer" and give the rear end wide berth at all times.""",

    "enemy_herbivore_t2_02": """The Styracosaurus presents a crown of horns that would shame any king - six long spikes projecting backward from its frill, with a central nose horn for focused attacks. Its eyes peer out from beneath the bone fortress of its face, calculating threat levels with surprising intelligence. Battle scars on its frill mark previous territorial victories.

Silvery-grey hide covers this tundra-adapted creature, darker patches providing camouflage against rocky outcroppings. Cream-colored markings trace along the frill edges where the horns emerge. Nature's own armor plates make additional barding redundant - the skull alone could deflect rifle rounds.

Four sturdy legs support the heavy skull assembly, each step deliberate and steady on frozen ground. The short tail switches with agitation when the creature feels threatened. Approached from the front, those horns will charge; the flanks offer the only safe angle, and even that remains questionable.""",

    "enemy_herbivore_t2_03": """This Pachycephalosaurus grazing in tundra fields shows none of the military modifications of its war-trained cousins. The domed skull evolved naturally through millions of years of headbutting contests. Small horns and bumps ring the dome's edge, creating a face only evolution could design.

The light grey and white hide provides natural camouflage in snowy environments, darker patches breaking up its outline. Pale brown markings trace along its flanks and disappear toward the cream-colored belly. Its skin is tough and leathery, adapted to freezing temperatures without artificial protection.

Powerful hind legs can propel this creature into devastating ramming attacks when it feels threatened. The thick tail provides counterbalance when it charges, head lowered like a living battering ram. Soldiers learn to watch for the warning stance - body lowered, head angled, feet pawing the frozen ground.""",

    "enemy_herbivore_t3_01": """The Triceratops stands like a living siege engine, three horns sweeping forward in eternal challenge. Its massive bony frill fans backward, edges serrated with smaller hornlets. Those eyes hold ancient patience, waiting for threats to prove themselves before responding with overwhelming force.

Sun-bleached scales range from sandy tan to dusty cream, the coloring developed over generations of desert adaptation. Darker patterns trace the frill's surface like war paint, though entirely natural. No armor needed - that skull could punch through fortified walls without assistance.

Pillar-like legs support several tons of bone and muscle, each footfall leaving deep impressions in desert sand. The short tail is deceptively dangerous, capable of sweeping legs from under approaching threats. This is the creature wise soldiers walk around, not toward - a lesson that requires only one demonstration to learn.""",

    "enemy_herbivore_t3_02": """The Brachiosaurus's head rises impossibly high, that long neck reaching toward desert clouds like a living watchtower. From such heights it surveys miles of territory, those large eyes missing nothing that moves below. The small head seems almost delicate atop such a massively muscled neck.

Light tan hide stretches over its towering frame, stripes of darker brown running vertically down its flanks. The coloring evolved for hiding among desert rock formations, though hiding something this enormous requires perfect stillness. Its skin is tough and thick, natural armor against the biting desert sun.

Those column-like legs sink deep into sand under the creature's immense weight. The long tail can sweep a clearing in seconds, demolishing anything nearby with casual swings. This gentle giant ignores most threats simply because nothing can reach its vital areas - a living lesson in the advantages of sheer size.""",

    "enemy_herbivore_t3_03": """The Charging Bull Styracosaurus carries scars across its spectacular frill from territorial battles that shaped its aggressive temperament. Every one of those frill spikes has drawn blood, and the central horn shows chips from impacts against bone and stone alike. Its eyes burn with perpetual challenge.

Sandy coloring helps this creature vanish against desert rock formations, tan hide striped with faded cream patterns. The frill shows sun-bleached bone where scales have worn thin from years of combat. This is pure wild dinosaur, untamed and untamable, surviving through aggression alone.

Powerful legs have driven this creature through countless charges, muscles like coiled springs beneath sand-colored hide. The short tail twitches constantly, broadcasting its state of agitation to any observant creature. Approaching this particular individual triggers immediate charge response - it learned long ago that offense is the best defense.""",

    "enemy_herbivore_t4_01": """The Titan lives up to its name - an Argentinosaurus of unimaginable scale, each footfall sending tremors through the volcanic soil. Its impossibly long neck rises from shoulders broad as barracks buildings, head disappearing into badlands smog. The eyes are patient, ancient, seeing threats as temporary inconveniences.

Dark mottled grey hide covers its mountainous body, volcanic ash settling into wrinkles and folds to complete its camouflage. Black patches along its back and flanks help it blend with basalt formations. Its skin is inches thick, natural armor that shrugs off most weapons without conscious attention.

Legs like pillars of living granite support incalculable tonnage, each step irreversible once begun. The whip-like tail can shatter structures and crush vehicles with casual sweeps. This creature fears nothing because nothing can threaten it - only time and disease concern something that measures lifespan in centuries.""",

    "enemy_herbivore_t4_02": """The Armored Fury presents Ankylosaurus armor evolved to badlands extremes - every plate thickened, every spike lengthened, the tail club grown to battering-ram proportions. Its small head barely peeks from between shoulder armor, eyes glittering with hard-won survival wisdom. This individual has outlived countless predators.

Ash grey and mottled black hide provides perfect badlands camouflage, darker where volcanic dust has settled into crevices. Natural spikes along its flanks are stained with rust-colored mineral deposits. The bony plates overlap seamlessly, creating an impenetrable shell that predators have failed to breach for decades.

Those four sturdy legs carry a walking fortress across any terrain, the footstep weight cracking solidite stone. The massive tail club could demolish fortified positions - and has, according to soldiers who observed this creature defending its territory. Approaching triggers an immediate tail-swing that doesn't distinguish between predator and person.""",

    "enemy_herbivore_t4_03": """The Horn Lord is a Triceratops of such size and age that even apex predators give it wide berth. Its three horns have shattered countless challengers, the brow horns worn to wicked points through years of combat. The frill is scarred and chipped, each mark a story of survival against impossible odds.

Deep grey hide shows the smoky coloring of a lifetime in volcanic territory, rust-brown patches where mineral springs have stained its scales. The eyes hold something approaching wisdom, patience learned through watching predators rise and fall while it endures. Its skull alone weighs more than an armored soldier.

Those legs have carried this creature through volcanic eruptions, predator attacks, and natural disasters beyond counting. The short tail twitches with eternal readiness, the body tensed for charges that still occur despite its advanced age. This is what evolution produces when given millions of years - perfected defense.""",

    # ==================== ENEMIES - HUMANS ====================
    "enemy_human_t1_01": """The Conscript's face is hidden behind a standard-issue stahlhelm with a canvas face covering, more to preserve anonymity than provide protection. Through the narrow eye slit, a young man's terrified eyes dart across no-man's land. Dog tags jingle against his chest with every frightened breath.

Brown leather suspenders cross over an olive drab wool tunic that shows signs of hasty tailoring - standard conscription attire. Brass buttons are already losing their polish after just weeks of trench life. A simple brass-studded leather vest offers minimal torso protection, more psychological comfort than actual armor.

Standard-issue boots squelch in trench mud, the leather already cracking from exposure. A service revolver hangs from a worn brown belt, the grip showing where nervous hands have worn the leather smooth. This soldier's inexperience shows in every movement - the perfect target for veteran enemies.""",

    "enemy_human_t1_02": """The Rifleman peers through a stahlhelm's modified eye-slot, the face guard welded shut for maximum facial protection as mandated by command. Only the chin remains barely visible beneath the metal, stubbled and tense. The helmet bears a squad number painted in fading white.

A lightweight leather jerkin covers the olive drab wool shirt beneath, chosen for mobility over protection. Sand-colored stitching repairs a tear near the shoulder - evidence of a previous near-miss. Simple cloth wraps around the forearms protect against gas exposure and brush cuts.

Lightweight leather boots enable quick movement through grassland terrain, though they provide poor protection against trench foot. A pistol gleams from a hip holster, its brass fittings polished despite field conditions. As a light role soldier, this conscript favors speed over staying power - hit, run, survive.""",

    "enemy_human_t1_03": """The Trench Knight carries the medieval heritage in his very stance - steady, grounded, sword arm relaxed but ready. His stahlhelm has been modified with a welded face guard reminiscent of crusader helms, only the darkness of the eye slits revealing humanity within. Breathing echoes metallically inside.

Brass pauldrons protect the shoulders over an olive drab wool coat reinforced with chainmail patches at critical points. Brown leather gloves are thick enough to grip a blade without risk of cutting, the fingers worn smooth from constant sword work. A tabard bearing squad insignia hangs over the torso armor.

Iron-shod boots grip trench duckboards with steady confidence as he advances through the line. A cavalry sabre hangs from his hip in a worn leather scabbard, the guard showing nicks from deflecting enemy blades. This soldier chose tradition over technology - and the blade has kept him alive thus far.""",

    "enemy_human_t2_01": """The Sturmtruppen's face is completely obscured by a fur-lined hood pulled over a steel helmet with full face guard. Ice crystals cling to the fabric where breath has frozen, creating a mask of perpetual winter. Only the faint steam of exhalation proves anything lives within that cocoon of pale fur.

Practical utility gear covers a white-grey fur-lined coat - pouches, tool belts, and bandoliers of ammunition organized for rapid access. A pale leather vest reinforced with silver buckles sits over the coat, not for armor but for carrying additional equipment. Every piece of kit serves a purpose in tundra operations.

Insulated boots leave barely any impression in the snow, the soles designed for silent movement across frozen terrain. A bolt-action rifle with bayonet hangs from a leather sling, the metal parts wrapped in cloth to prevent skin adhesion in extreme cold. This soldier moves like a ghost through blizzards, striking from whiteout conditions.""",

    "enemy_human_t2_02": """The Crossbowman's helmet features a distinctive fur-lined hood that falls to the shoulders, the steel face plate lined with pale leather for warmth. The tundra has no mercy for exposed flesh, so every inch remains covered. Goggles with smoked lenses protect against snow blindness.

A fur-lined white-grey coat shows practical modifications - leather patches at the elbows from hours of sniping positions, pale leather pouches for crossbow bolts arranged for quick access. Silver-clasped straps secure everything tight against the body to prevent sound or snag. Chemical hand warmers pack into special glove compartments.

Thick wool trousers disappear into pale leather boots reinforced for warmth rather than combat. A pistol rides in a leather holster for backup, its metal wrapped in cloth to prevent freeze. But the real weapon is the mechanical crossbow - modern mechanisms married to medieval design, silent and deadly from distance.""",

    "enemy_human_t2_03": """The Halberdier's helmet rises to a slight point, the medieval influence clear even with the fur lining around the face guard required for tundra deployment. Complete facial concealment gives no hint of the soldier's identity. Frost accumulates on eye lenses that need constant clearing.

A white-grey fur-lined coat conceals partial plate armor beneath - silver-colored pauldrons visible at the shoulders where the coat falls open during movement. Pale leather straps secure a reinforced cuirass that protects the torso from polearm counterattacks. Tool pouches line the belt for field maintenance.

Heavy boots crunch through snowpack with each patrolling step, the insulated soles designed for long hours of stationary duty. A steel-headed halberd rises above the shoulder, its shaft wrapped in leather against the cold. This soldier holds chokepoints with that polearm - a single halberdier can hold a frozen pass against many.""",

    "enemy_human_t3_01": """The Machine Gunner known only by his weapon conceals everything behind a cloth-wrapped helmet fitted with smoked goggles and respirator mask. The desert heat requires protection from sun and sand alike; this soldier could be anyone beneath those layers. Only the eyes are visible - and they are exhausted.

A sand tan linen coat covers multiple ammunition belts crossing the chest and back, the weight substantial but necessary. Sun-bleached leather pouches carry additional magazines and repair tools for the weapon that defines this soldier's role. A bronze-clasped vest offers some protection without adding deadly weight.

Canvas trousers reinforced at the knees cover desert-adapted boots that breathe while protecting from scorching sand. The scoped marksman rifle seems at odds with the "machine gunner" designation - evidence of tactical adaptability. This utility role soldier provides suppressive fire from elevated positions, a one-person threat.""",

    "enemy_human_t3_02": """The Flametrooper is a walking nightmare, identity erased behind an iron-reinforced desert helmet and full respirator mask designed to survive their own weapon's backwash. The mask's lenses reflect firelight even when no flames burn. Heavy breathing echoes from within like a bellows.

A heavy sand tan linen coat is reinforced with overlapping bronze plates across chest and shoulders, designed to survive the heat of close combat with fire. Thick sun-bleached leather gloves extend past the elbows, protecting arms that handle liquid flame. A tank backpack containing pressurized accelerant adds bulk and danger.

Weighted boots provide stability for the recoil of the flamethrower, the boots reinforced with bronze toe caps. A bolt-action rifle serves as backup weapon when fuel runs empty. But the monster strapped to his back is the real threat - pressurized death that reduces trenches to crematoriums in seconds.""",

    "enemy_human_t3_03": """The Field Medic's helmet bears the traditional cross symbol, though the face beneath remains covered by a cloth-wrapped mask and desert goggles. The covered face serves dual purpose - anonymity and protection from biological threats encountered while treating the wounded. Steady hands speak of experience.

A practical sand tan coat holds more medical supplies than weaponry - pouches of bandages, surgical tools, and chemical treatments covering the torso. Sun-bleached leather straps secure the kit tightly, labeled tabs identifying contents by touch. The utility role demands organization above all else.

Desert boots show wear from countless casualties rushed across burning sand - this medic runs toward danger while others flee. A scoped rifle provides protection while crossing no-man's-land to reach the wounded. Utility role or not, this soldier has likely saved more lives than any fighter - and ended a few threatening patients.""",

    "enemy_human_t4_01": """The Assault Trooper's gilded helmet rises to a ceremonial point, the iron mask beneath engraved with rank insignia reserved for elite specialists. A respirator system filters volcanic ash while allowing commanding voice projection. Whatever face lies beneath has seen the worst of the badlands and emerged victorious.

Ornate commander armor covers this male soldier's muscular build - gilded iron plates with a charcoal grey tabard bearing unit honors. Blackened leather straps secure the overlapping plates, each buckle stamped with campaign medals. The cape that flows from his shoulders is singed at the edges from close encounters with volcanic vents.

Steel-reinforced boots leave commanding impressions in ash and basite alike. A bolt-action rifle with custom engravings serves as primary weapon, its stock carved with personal kill tallies. This elite specialist leads from the front, armor designed to inspire as much as protect.""",

    "enemy_human_t4_02": """Stormbreaker earned her name through actions that shattered enemy offensives across badlands fronts. Her studded iron face mask bears scratch marks from shrapnel that failed to penetrate. The steel helmet sits slightly askew with confident swagger - the mark of a soldier who fears nothing.

This female soldier of medium build wears brass pauldrons and chainmail over a charcoal grey battle coat, the armor practical rather than ornate. Blackened leather ammunition belts cross her chest, feeding the weapon that defines her reputation. Every piece of kit is positioned for the demands of sustained suppressive fire.

Heavy boots are braced against the constant weight of her machine gun, legs steady beneath the burden they carry. That heavy machine gun with its ammunition belt has broken more charges than any artillery battery. Stormbreaker doesn't defend positions - she renders enemy advance impossible.""",

    "enemy_human_t4_03": """The War Veteran's helmet conceals a face that has seen every horror warfare offers - the iron mask welded shut, never to be removed. Whatever visage remains beneath is the soldier's secret alone. Only the weary set of the shoulders reveals the weight of countless campaigns behind that armor.

This male soldier's broad, heavy-set build is covered in ornate commander armor - gilded iron plates worn smooth by years of use rather than polished for parade. A charcoal grey cape hangs from his shoulders, edges burnt and torn but never replaced. Multiple campaign medals line the chest, most from wars younger soldiers have only read about.

Heavy boots have marched across every terrain the world offers, the soles replaced countless times on the same trusted frames. A trench shotgun serves as his weapon of choice - devastating at close range, requiring minimal ammunition in extended deployments. This elite specialist has nothing left to prove, only a job to complete.""",

    # ==================== ENEMIES - SAURIANS ====================
    "enemy_saurian_t1_01": """The Velociraptor Rider stands barely five feet tall, but the intelligent gleam in those slitted reptilian eyes commands attention. A leather muzzle covers the snout in standard fashion, brass buckles securing it behind the feathered crest. The small head tilts with constant predatory assessment of surrounding threats.

Minimal leather armor straps across the scaled chest, just enough to hold a unit identification patch. Olive and brown scales show through the gaps in the tan leather vest, natural camouflage augmented by military positioning. A simple olive drab cloth cape falls from the shoulders, torn ragged at the edges from fast movement.

Powerful digitigrade legs end in exposed three-toed feet, each toe tipped with a curved claw that clicks on stone surfaces. A flanged mace hangs from a leather belt too small for human waists. The creature moves with predatory grace, the exposed clawed feet spreading naturally for balance - boots would cripple its natural advantages.""",

    "enemy_saurian_t1_02": """The Oviraptor Scout's beaked face tilts in assessment, the crest atop its head decorated with unit markings painted in fading olive drab. Those calculating eyes miss nothing - the species' natural intelligence paired with military training creates exceptional reconnaissance capability. A muzzle restraint dangles unused around its neck; this one has earned trust.

A lightweight brown leather harness crisscrosses its feathered torso, pouches containing message capsules and trail markers. Simple brass rings allow attachment of additional equipment as missions demand. The olive-brown feathers bristle through gaps in the harness, providing natural camouflage for scouting duties.

Swift digitigrade legs carry this creature silently through undergrowth, the exposed clawed feet placed with deliberate precision. Grasping hands clutch a flanged mace as backup weapon, though those natural talons serve equally well. This light-role soldier moves like smoke through grassland terrain, seeing everything and remaining unseen.""",

    "enemy_saurian_t1_03": """The Triceratops Shieldbearer stands massive even for a saurian, the triple-horned face rising nearly seven feet from the ground. Those horns are natural weapons that render additional ones almost redundant. The bony frill fans backward, edges decorated with unit insignia in olive drab paint.

A utility harness wraps around the barrel-shaped torso, pouches and tool belts organized for quick access between physical deployments. Brown leather straps reinforce natural armor plates along the shoulders. A massive shield - sized for the creature's bulk - hangs from the back when not deployed.

Pillar-like legs end in heavy three-toed feet, the exposed claws leaving deep impressions in grassland soil. A cavalry saber remains sheathed at the hip, almost comically small compared to those natural horns. This creature holds positions through sheer immovability, the shield wall given reptilian form.""",

    "enemy_saurian_t2_01": """The Deinonychus Lancer presents a terrifying fusion of intelligence and killing instinct. The saurian's head is longer and narrower than lesser raptors, those slitted eyes holding tactical patience. A fur-lined hood protects the creature's cold-blood from tundra temperatures, brass clasps securing it beneath the jaw.

Light armor straps across a lithe body covered in grey-white feathers, the pale coloring developed for tundra concealment. Silver buckles gleam against pale leather that has been oiled against frost damage. The minimal protection allows full range of motion for the lancer's signature leaping attacks.

Those powerful legs end in the killing claws that define raptor-kind, each exposed foot spreading naturally on frozen ground for traction. A flanged mace hangs ready for opponents beyond claw-reach. This light-role soldier strikes from above, using natural leaping ability to clear obstacles and defenders alike.""",

    "enemy_saurian_t2_02": """The Parasaurolophus Herald stands out through the resonating crest rising from its skull - a natural communication device that coordinates saurian units across battlefields. Those duck-billed jaws hang open slightly, ready to project commanding calls. Pale grey scales show beneath the winter uniform.

A white-grey fur-lined coat wraps around this creature's torso, modified to accommodate its unusual proportions. Silver clasps secure pale leather ammunition pouches to the harness. The outfit prioritizes warmth over protection - this creature's role is communication, not direct combat.

Long legs end in three-toed exposed feet planted firmly in snow, the natural cold-blood requiring frequent movement to maintain battlefield effectiveness. A service revolver in a pale leather holster provides self-defense capability. The Herald's true weapon is its crest-call, coordinating assaults across miles of frozen wasteland.""",

    "enemy_saurian_t2_03": """The Pachycephalosaurus Charger presents that signature domed skull forward, the bone thickened through evolution for exactly one purpose - devastating first strikes. Those small eyes hold single-minded determination. A fur-lined hood covers the skull between charges, preserving core temperature.

Light pale leather armor allows full mobility for the charging maneuvers that define this creature's tactics. Silver-buckled straps secure the minimal protection tightly to prevent any resistance during impact. White-grey coloring helps the creature disappear against snowfields before launching its assault.

Powerful digitigrade legs spring from thick haunches, the exposed clawed feet gripping frozen ground for explosive acceleration. A flanged mace serves as backup, though the skull-ram rarely leaves survivors requiring follow-up. This light-role soldier is a living missile, launched at enemy formations with devastating results.""",

    "enemy_saurian_t3_01": """The Allosaurus Gunner towers over human soldiers, that massive predatory head rising nearly eight feet from the desert sand. Intelligence and instinct wage visible war behind those slitted eyes - the military training overlaying but never replacing the apex predator nature. Heavy jaws remain closed out of military discipline, not inability to use them.

Heavy bronze barding covers the creature's upper body, the armor plates sized for a creature that could crush vehicles between its jaws. Sun-bleached leather straps secured with bronze clasps hold the chest plate firm. A sand-colored tabard bearing unit insignia hangs from the shoulder armor.

Those pillar-like legs end in heavy exposed clawed feet, each step shaking the sand with barely-contained power. A bolt-action rifle seems almost comically small in those clawed hands, yet the creature fires with disturbing accuracy. Heavy-role soldiers like this provide both fire support and terrifying melee capability.""",

    "enemy_saurian_t3_02": """The Stegosaurus Heavy moves like a walking fortress, those distinctive back plates rising even higher than the creature's head. Each plate has been reinforced with bronze banding, transforming natural protection into military armor. The small head swings low, eyes tracking threats while the body presents maximum armored surface.

Heavy bronze armor supplements the natural plating, chest and shoulders covered by additional protection layered over already-impressive scales. Sun-bleached leather harness straps disappear beneath overlapping plates. The sand-colored hide is mottled with darker patches that help the creature blend with desert rock formations.

The heavy tail with its quartet of thagomizer spikes is fitted with bronze caps, transforming natural weapons into siege armaments. An oversized halberd grants reach to complement those tail spikes. Those exposed clawed feet plant firmly in sand, anchoring the creature for sweeping attacks that demolish formations.""",

    "enemy_saurian_t3_03": """The Ankylosaurus Siege presents an impenetrable wall of bone and bronze, the natural armor studded with military reinforcement until distinguishing between evolved and manufactured protection becomes impossible. That small armored head barely peeks from between shoulder plates, eyes glittering with unexpected intelligence.

Bronze plates bolt directly to natural armor, creating redundant protection that shrugs off rifle fire without acknowledgment. Sun-bleached leather straps mark the only visible gaps in the carapace. Tool pouches hang from the harness for this utility-role soldier's siege engineering duties - it breaks walls, then repairs them.

Four sturdy legs support the mobile fortress, exposed clawed feet spreading under immense weight. A trench shotgun provides surprising ranged capability for a creature designed for demolition. That massive tail club, capped in bronze, has breached more fortifications than any artillery battery in the theater.""",

    "enemy_saurian_t3_04": """The Carnotaurus Striker emerges from badlands ash clouds like a predator from nightmare, those distinctive horns rising above blazing eyes. The charcoal-grey scales blend seamlessly with volcanic terrain, making the creature nearly invisible until it's far too late. A utility harness marks its specialized role.

Bronze-reinforced blackened leather covers critical points on this leaner saurian frame - chest, shoulders, and forearms. Iron clasps secure the armor tightly for the high-speed assaults the species favors. A charcoal cape flows behind during charges, making the creature appear even larger than its considerable size.

Those powerful legs end in exposed clawed feet that grip volcanic rock with natural adaptation, launching the creature in terrifying bursts of speed. A lance sized for the creature's reach allows striking before opponents can react. This utility-role striker hits flanks and command positions, disappearing into ash clouds before retaliation arrives.""",

    "enemy_saurian_t4_01": """The Raptor Elite represents the pinnacle of saurian military evolution - a Velociraptor grown to unprecedented size, trained to unprecedented discipline, equipped to unprecedented standards. Those intelligent eyes hold both predatory instinct and tactical analysis in perfect balance. The feathered crest is dyed with rank markings in charcoal and rust.

Brass pauldrons and chainmail cover a muscular torso beneath the charcoal grey combat coat, the armor fitted precisely for the medium-role soldier's balance of protection and mobility. Blackened leather straps secure each piece with minimal noise. Iron clasps bear the worn polish of countless campaigns.

Powerful digitigrade legs end in those famous killing claws, each exposed foot spreading naturally for combat balance. A lance of unusual length grants reach against larger opponents while those claws handle anyone foolish enough to close. This medium-role soldier adapts to any tactical situation - the definition of elite.""",

    "enemy_saurian_t4_02": """The Rex Commander fills every inch of available space, the Tyrannosaurus physique towering over human and saurian alike. Those massive jaws remain closed through iron discipline, but every soldier knows what those teeth could accomplish. The small arms are barely visible beneath heavy shoulder armor, vestigial but still tipped with claws.

Full plate armor covers this heavy-role soldier's enormous frame - layered iron plates with a charcoal grey tabard bearing high command insignia. Blackened leather straps thick as a man's arm secure the tremendous weight of protection. A cape flows from shoulder guards that could shelter squads beneath their bulk.

Those pillar-like legs end in exposed clawed feet that crack volcanic stone with each earth-shaking step. A war hammer sized for these proportions could demolish fortifications - or the defenders within them. This heavy-role soldier doesn't just hold lines; the Rex Commander is the line, unmovable and unstoppable.""",

    "enemy_saurian_t4_03": """The Spino Warlord combines the most dangerous aspects of apex predator and seasoned commander. That crocodilian snout stretches impossibly far, teeth designed for gripping prey that never escapes. The sail rising from its back has been decorated with campaign honors and kill markers painted in charcoal and rust.

Brass-detailed chainmail covers the elongated torso beneath a charcoal battle coat, the armor adapted for the Spinosaurus's unusual proportions. Blackened leather straps cross beneath the belly where the coat cannot cover. Medium-role armor provides protection while allowing this commander's signature devastating lunge attacks.

The powerful tail is fitted with iron bands, transforming the swimming appendage into a siege weapon. Those exposed clawed feet spread wide on volcanic terrain, each footstep calculated for combat positioning. A massive war hammer serves as weapon and status symbol alike. This medium-role commander earned every honor through personal kill count.""",

    # ==================== BOSSES - will continue in next batch ====================
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
    print("=== Applying Pre-Generated Lore ===\n")
    count = update_entities_with_lore()
    print(f"\n=== Done! Updated {count} entities ===")
