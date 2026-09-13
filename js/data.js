/* REHEVANE data.js — world-building, classes, items, characters, quests, dialogue.
   Continents/factions/history feed the codex + NPC barks. Dialogue trees drive flags/romance. */
var RHE = window.RHE || {};
RHE.CLASSES = {
  berserker:{name:"Berserker",desc:"+HP, heavy cleaves. Rage: +damage when hurt; kills restore life. Weak vs magic.",hp:130,mp:30,atk:16,def:6,mag:4,spd:3.1,skill:{name:"Rage Cleave",cost:0,cd:6,desc:"360° heavy slash, +50% if HP<50%"}},
  archer:{name:"Archer (Ranger)",desc:"Fast, crits, dodge-roll skill. Fragile up close.",hp:95,mp:40,atk:12,def:4,mag:6,spd:3.7,skill:{name:"Triple Volley",cost:10,cd:5,desc:"Fires 3 piercing arrows"}},
  pyromancer:{name:"Pyromancer",desc:"Hurls igniting firebolts; Ember Burst nova. Powerful but fragile.",hp:80,mp:90,atk:6,def:3,mag:18,spd:3.0,skill:{name:"Ember Burst",cost:20,cd:7,desc:"Fire nova that ignites"}},
  paladin:{name:"Paladin",desc:"Holy blade; killing blows restore life. Oath of Dawn heals + shields.",hp:120,mp:60,atk:11,def:10,mag:10,spd:2.9,skill:{name:"Oath of Dawn",cost:25,cd:12,desc:"Heal 40% + brief shield"}},
  necromancer:{name:"Necromancer",desc:"Piercing bone bolts that sip life; raises skeletal knights. Dark but loyal.",hp:90,mp:85,atk:7,def:4,mag:16,spd:3.0,skill:{name:"Raise Dead",cost:30,cd:12,desc:"Raise a skeletal knight (max 4) that fights beside you"}}
};
RHE.ITEMS = {
  potion:{name:"Moonwell Tonic",type:"use",price:25,desc:"Restore 60 HP.",use:{hp:60}},
  bread:{name:"Rye Bread",type:"use",price:8,desc:"Restore 25 HP.",use:{hp:25}},
  manacake:{name:"Wisp Honeycake",type:"use",price:14,desc:"Restore 40 MP.",use:{mp:40}},
  antidote:{name:"Bogmint Antidote",type:"use",price:12,desc:"Cure poison/burn.",use:{cure:1}},
  sword1:{name:"Greenwood Shortsword",type:"weapon",price:60,atk:4,desc:"Elf-forged practice blade."},
  sword2:{name:"Oathkeeper Blade",type:"weapon",price:220,atk:9,desc:"Hums near Heart Threads. Secret: +vs corrupted."},
  bow1:{name:"Yew Bow",type:"weapon",price:70,atk:5,desc:"Hunter's bow."},
  staff1:{name:"Ember Branch",type:"weapon",price:70,mag:6,desc:"Warm to the touch."},
  armor1:{name:"Scout Leathers",type:"armor",price:55,def:3,desc:"Quiet and light."},
  armor2:{name:"Warden Mail",type:"armor",price:180,def:6,desc:"Outpost warden's spare."},
  ring1:{name:"Threadseer's Ring",type:"trinket",price:150,desc:"+15% XP. Found, not sold.",xp:0.15},
  fragment:{name:"Heart Fragment",type:"key",desc:"Cold crystallized darkness. Hums with a grief not yours."},
  keychain:{name:"Chipped Keychain",type:"key",desc:"Logo of a Tokyo high school. Impossible — yet here."},
  mapscrap:{name:"Torn Treasure Map",type:"key",desc:"Marks a cave behind falling water."},
  diary:{name:"Warden's Diary",type:"key",desc:"'If love refuses goodbye, it grows teeth.'"},
  lens:{name:"Archive Lens",type:"key",desc:"A cool glass monocle. Aegis seeth through it — and through thee, kindly."},
  flower:{name:"Moonpetal",type:"gift",price:5,desc:"Rosalind secretly likes these. (Gift via R menu)"},
  comb:{name:"Silver Acorn Comb",type:"gift",price:40,desc:"A lady's gift. Some Romances love it."}
};
/* Factions / history for codex + NPC dialogue memory */
RHE.FACTIONS = [
 {id:"greenwood",name:"Whispering Greenwood",desc:"Elf wardens of the great tree Vael-Thir. Led by Elder Council; Guard-Captain Rosalind holds the Guardian's Oath. Allies: Silverwall (strained). Enemies: corruption nodes. Secret: the Oath kills the warden if her heart moves — by design."},
 {id:"silverwall",name:"Silverwall Kingdom",desc:"Human walled cities, white stone, blue banners. King Aldric the Patient. Knight order trains Belladonna. Wants Rehevane's 'Heart-Bearer' power as a weapon. Internal split: isolationists vs interventionists."},
 {id:"spires",name:"Ashen Spires (Dragonkin)",desc:"Princess Ruby rules a crater fortress. Ancestor pacted with the proto-Devourer for power: every ruler's heart slowly stones if they wish for themselves. Teased in Act II."},
 {id:"plains",name:"Verdant Clans (Demi-humans)",desc:"Wolf-folk villages under human 'brand law'. Nyx's people. Teased in Act II."},
 {id:"mistveil",name:"Mistveil Circle (Witches)",desc:"Exiled scholar-witch Minerva studies the curse at personal cost. Teased."},
 {id:"starlia",name:"Church of Starlia",desc:"Saint Daisy anchors thousands of prayers — and unknowingly, the Devourer's core. Teased."},
 {id:"devourer",name:"The Heart Devourer",desc:"Not a person: what love becomes when it refuses to let go. Born from the First Off-worlder's wish: 'make no one leave me.' Feeds on distorted love; creates corruption nodes, brands, stone-hearts, oaths."},
 {id:"first",name:"The First Off-worlder",desc:"An Earth man who lost someone and begged the world to end goodbye. The world obeyed — wrongly. His sin is why Rehevane is suspected."}
];
/* Romance cast — all adults. dere = outer flavor; wound = inner truth. */
RHE.ROMANCE = {
  liliane:{name:"Rosalind",title:"Guard-Captain of the Greenwood",age:27,dere:"TSUNDERE",
    look:"Long pink hair with a black bow, sharp rose-brown eyes; red cape over a black-white-and-red captain's dress with gold trim. Elven ears half-hidden in her hair.",
    outer:"Cold, proud, commanding; pretends she doesn't care.",
    inner:"Acts cold because vulnerability was punished: her mother died trusting a human during the last slaughter. The Guardian's Oath will literally stop her heart if she cares — so caring feels like dying. Kindness breaks through anyway.",
    arc:"Oath-bound guard → reluctant teacher → woman who chooses trust despite a curse built to punish it.",
    harem:"Jealous but honest; confronts Rehevane, then respects chosen boundaries. Rivals with Belladonna; softens toward Nyx.",
    pastTone:"dark",
    past:"Her mother died trusting a human the night the last slaughter came through the Greenwood — Rosalind, twelve years old, held the door and learned that unguarded kindness is a wound. The Guard drilled it deeper: the Oath will stop her heart the day she cares. So she captains, she scolds, she keeps every thread at spear's length... and hates how the sky-fallen boy makes the spear feel heavy.",
    portrait:"assets/img/portraits/liliane.svg", thread:"#7fc76a"},
  yua:{name:"Belladonna",title:"Knight-Candidate of Silverwall",age:23,dere:"YANDERE (dandere lean)",
    look:"Long black hair with a purple flower, dark-red eyes; black-and-violet gothic gown with gold corsetry. Her knight's sword rides at her hip.",
    outer:"Soft-spoken and shyly devoted, with a dreamy smile and slightly intense eyes; possessive undercurrent.",
    inner:"Orphaned squire raised to be a perfect shield; love = the only proof she exists. Terrified of abandonment. Route explores possessiveness vs trust — player reassurance or neglect measurably steers her.",
    arc:"Perfect guard → Sworn Shield ritual (Act III) → either protective miracle or Devourer's tool, by player hands.",
    harem:"Competitive; clashes with Rosalind, unsettles others. Can learn restraint if Rehevane sets boundaries.",
    pastTone:"dark",
    past:"Orphaned squire, raised by the order to be a perfect shield: fed, drilled, and told she exists where she is needed. Her first charge died on her first road — she has logged every heartbeat since, terrified that love unheld is love lost. Rehevane is the first soul who ever told her to stop. She obeyed. It saved her.",
    portrait:"assets/img/portraits/yua.svg", thread:"#e05252"},
  seraphina:{name:"Ruby",title:"Princess of the Ashen Flame",age:29,dere:"HIMEDERE",
    look:"Long platinum hair crowned in gold, violet eyes, low draconic horns; white royal gown with red lining and a fur mantle.",
    outer:"Proud, elegant, demanding; expects reverence.",
    inner:"A ruler whose stone-heart curse punishes any selfish wish; has never been loved as a person, only a title.",
    arc:"Statue → woman who dares one sunrise for herself. (Act II)",harem:"Proud rival; respects strength.",
    pastTone:"wholesome",
    past:"Third heir of a volcanic throne, raised on ceremony and the family curse: wish for thyself, and thy heart stones. She has never once been loved as Ruby — only as Highness, Radiance, Necessity. Her one selfish dream is small: to watch a whole sunrise, hand in hand, crownless. Rehevane promised it her, and the stone cracked a fraction.",
    portrait:"assets/img/portraits/seraphina.svg",thread:"#ff9a3c"},
  mira:{name:"Nyx",title:"Wolf-girl of the Plains",age:21,dere:"KUUDERE + sadodere edge",
    look:"Long dark-violet hair, wolf ears, sharp amber-red eyes; black gothic coat with red lining, belts and choker.",
    outer:"Cool, teasing, sharp-tongued; keeps everyone at arm's length and enjoys the upper hand.",
    inner:"Her barb is armor: a branded collar-child who learned that softness gets owned. She tests Rehevane to see if anyone can hold ground without holding a leash.",
    arc:"Barbed distance → chosen vulnerability → free choice. (Act II)",harem:"Teasing and possessive; tests the other girls as much as Rehevane.",
    pastTone:"cute",
    past:"A collar-child of the brand law, who learned young that softness gets owned — so she grew fangs first and feelings second, and teases everyone before they can leash her. Under the barb: a pup who shares her meat, thumps her tail in her sleep, and chose her own pack at last. She chose Rehevane. Loudly, and in front of witnesses.",
    portrait:"assets/img/portraits/mira.svg",thread:"#ffd23f"},
  elowen:{name:"Minerva",title:"Witch of Mistveil",age:26,dere:"KUUDERE",
    look:"Long silver-lavender hair, round glasses, calm blue-violet eyes; deep-blue hooded scholar's robe with gold clasp.",
    outer:"Quiet elegance; speaks little, observes much; refined, intelligent, emotionally reserved.",
    inner:"Opened her tower to no one for years; trusts notes over people — until someone reads her instead of her research.",
    arc:"Distance → being seen clearly → leaning on someone. (Act II)",harem:"Quiet; notices everything; gently honest.",
    pastTone:"wholesome",
    past:"A marsh scholar who trusts footnotes more than folk; her crooked tower has held one resident, one kettle, and ten thousand candles for years. She charts the curse by night and tells no one her arms are darkening with it. What she wants is unscientific: to be read clearly, leaned upon, and stayed with. Rehevane stayed — and she documented the miracle in the margin.",
    portrait:"assets/img/portraits/elowen.svg",thread:"#b388eb"},
  aria:{name:"Daisy",title:"Saint of Starlia",age:24,dere:"DEREDERE (+hime edge)",
    look:"Long golden-blonde hair with a blue flower, bright honey eyes, open sunny smile; blue-and-white dress.",
    outer:"Pure sunshine; bright, playful, openly warm — lifts every room she enters.",
    inner:"Centralized suffering: she anchors thousands of prayers so no one else is eaten. Exhausted symbol who wants one morning as 'just a girl.'",
    arc:"Symbol → person. (Act III)",harem:"Accepting, sorrowful, kind even in rivalry.",
    pastTone:"wholesome",
    past:"The Church raised her kindly and spends her freely: every prayer in Starlia drains through her smile into a pit she hides with sunshine. She laughs unpainted only alone, on cold chapel stone. Her wish is the smallest of all — one ordinary morning, loved as just a girl. Rehevane is making it happen, one selfish morning at a time.",
    portrait:"assets/img/portraits/aria.svg",thread:"#fff3b0"},
  lyra:{name:"Lyra",title:"Keeper of the Sunken Archive",age:22,dere:"DEREDERE",
    look:"Long silver hair crowned with gold thorns and roses, calm red eyes; ornate wine-red gown with gold thorn jewelry and a rose at her shoulder.",
    outer:"Openly, endlessly loving — she saith it outright and showeth it always: his wife, by her own delighted declaration. Cheerful, devoted, and utterly without shame about any of it.",
    inner:"Born a bound-spirit, promised heart to a sky-fallen soul not yet fallen — she loved him three hundred years through stone, and feareth now but one thing: that waking life cannot hold what dreams promised.",
    arc:"Sealed sleeper → woken beloved → the second heartbeat within thy chest. (Act I, Hidden Grotto)",
    harem:"Timid but brave when books are threatened; adores Rosalind's discipline, takes notes on everyone.",
    pastTone:"wholesome",
    past:"Not kept but kept-for: Lyra was born a bound-spirit, promised to a sky-fallen soul not yet fallen. The Thorned Stag — grief-made warden of the Hollow, speaking with a man's voice — sealed her at the Devourer's bidding, locking her spirit within her own sleeping flesh in the grotto wall, lest any thread-seer ever wake her counsel. Three hundred years she dreamed him: his fall, his name, his mouth. His truths loosed the bindings; his kiss broke the last seal — and she went within him, to be his second heartbeat. Should the Stag fall ere she waketh, the seal closeth forever. Filed under MIRACLE.",
    portrait:"assets/img/portraits/lyra.svg", thread:"#d8dce4"}
};
/* Original SVG illustrations, recreated from the character.png lineup
   (same faces, same cloth designs — no image assets used in-game). */
RHE.PORTRAITS = {
  rin:"assets/img/portraits/player.svg",
  player:"assets/img/portraits/player.svg",
  liliane:"assets/img/portraits/liliane.svg",
  yua:"assets/img/portraits/yua.svg",
  seraphina:"assets/img/portraits/seraphina.svg",
  mira:"assets/img/portraits/mira.svg",
  elowen:"assets/img/portraits/elowen.svg",
  aria:"assets/img/portraits/aria.svg",
  lyra:"assets/img/portraits/lyra.svg",
  aegis:"assets/img/portraits/aegis.svg"
};
/* NPC roster for the vertical slice maps */
RHE.NPCS = {
  liliane:{name:"Rosalind",map:"outpost",x:20,y:12,role:"companion",color:"#7fc76a"},
  elder:{name:"Elder Thaelor",map:"outpost",x:20,y:6,role:"elder",color:"#cfe3c0"},
  mira_scout:{name:"Wounded Scout Fen",map:"forest",x:30,y:20,role:"quest",color:"#ffd23f"},
  merchant:{name:"Peddler Odo",map:"outpost",x:14,y:14,role:"shop",color:"#d8b45c"},
  smith:{name:"Smith Hilda",map:"outpost",x:26,y:14,role:"shop",color:"#ff9a3c"},
  innkeep:{name:"Innkeep Marta",map:"outpost",x:20,y:18,role:"inn",color:"#e89ac0"},
  yua:{name:"??? Knight",map:"gate",x:5,y:5,role:"teaser",color:"#e05252"},
  seraphina:{name:"Ruby",map:"spire",x:19,y:7,role:"act2",color:"#ff9a3c"},
  mira:{name:"Nyx",map:"plains",x:9,y:8,role:"act2",color:"#ffd23f"},
  elowen:{name:"Minerva",map:"marsh",x:6,y:7,role:"act2",color:"#b388eb"},
  aria:{name:"Daisy",map:"starlia",x:10,y:4,role:"act3",color:"#fff3b0"},
  hermit:{name:"Hermit Corv",map:"cave",x:5,y:5,role:"lore",color:"#b388eb"},
  lyra:{name:"Lyra",map:"cave",x:8,y:5,role:"keeper",color:"#d8dce4"}
};
/* Quest definitions. objectives tracked by flags/counters. */
RHE.QUESTS = {
  mq1:{name:"The Sky That Cracked",type:"MAIN",desc:"Talk to Rosalind at the outpost center.",obj:["Talk to Rosalind"]},
  mq2:{name:"Guardian's Oath",type:"MAIN",desc:"Prove yourself: purge 4 corrupted wolves in the Greenwood, then return to Rosalind.",obj:["Slay corrupted wolves (0/4)","Return to Rosalind"]},
  mq3:{name:"The First Fragment",type:"MAIN",desc:"Enter the Corrupted Hollow north of the forest. Slay the Thorned Stag. Claim the fragment.",obj:["Enter the Hollow","Slay the Thorned Stag","Claim the Heart Fragment","Bring it to Rosalind"]},
  mq4:{name:"Road Beyond the Trees",type:"MAIN",desc:"Meet Rosalind on the moonlit platform (outpost east, night). Then head to the Silverwall Gate.",obj:["Meet Rosalind at night","Reach the Silverwall Gate","Hear the Act I closing scene"]},
  mq5:{name:"Ashes of the Spires (Act II)",type:"MAIN",desc:"Pass the Silverwall portcullis south. Meet Ruby at the dragonkin checkpoint.",obj:["Enter the Ashen Approach","Meet Ruby"]},
  mq6:{name:"Stone-Heart Princess",type:"MAIN",desc:"Enter the Spire Capital. Hear Ruby's court by day, then find her alone at night.",obj:["Enter the capital","Court by day","Balcony at night"]},
  mq7:{name:"Fire in the Sky",type:"MAIN",desc:"Climb north to the Sky-Node vortex. Slay the corrupted node. Return to Ruby.",obj:["Slay the Sky-Node","Return to Ruby"]},
  mq8:{name:"Howl on the Plains",type:"MAIN",desc:"Descend south to the Verdant Plains. Drive off 3 reavers, then meet the wolf-girl.",obj:["Slay reavers (0/3)","Meet Nyx"]},
  mq9:{name:"Witch of Mistveil",type:"MAIN",desc:"Go east into Mistveil Marsh. Meet Minerva, then join her vision of the First Sin.",obj:["Meet Minerva","Enter the tower vision"]},
  mq10:{name:"Knight's Vow (Act III)",type:"MAIN",desc:"Enter Silverwall City. Accept Belladonna's guard, fell 2 Oathless blades, swear the Rite.",obj:["Meet Belladonna","Slay blades (0/2)","Swear the Rite"]},
  mq11:{name:"Saint of the Devouring Altar",type:"MAIN",desc:"Enter Holy Starlia. Meet Daisy, then find her in the side chapel at night.",obj:["Meet Daisy","Chapel at night"]},
  mq12:{name:"Twisted Devotion",type:"MAIN",desc:"Confront Belladonna on the Walls of Starlia. Bind her fear with a new oath.",obj:["Face Belladonna on the walls"]},
  mq13:{name:"Choice of Hearts (Finale)",type:"MAIN",desc:"Descend north into the Altar Depths. Destroy the Devourer Core. Choose.",obj:["Slay the Core","Choose at the Altar"]},
  sq_key:{name:"Falling-Star Keepsake",type:"HIDDEN",desc:"A scout babbles about 'sky-metal' where the beasts gather. Something from another world lies in the forest.",obj:["Find the strange keepsake"]},
  sq_scout:{name:"Blood on the Roots",type:"SIDE",desc:"A wounded scout lies east in the forest. Help him — by healing, carrying, or mercy.",obj:["Find the wounded scout","Decide his fate"]},
  sq_notes:{name:"The Witch's Pages",type:"SIDE",desc:"Hermit Corv lost 3 research pages (forest, hollow, waterfall cave).",obj:["Recover pages (0/3)"]},
  sq_bounty:{name:"Bounty: Thorn Nest",type:"BOUNTY",desc:"Hilda pays for 6 corrupted beasts slain anywhere.",obj:["Slay beasts (0/6)"]},
  rq_lil:{name:"Adjust Your Stance",type:"ROMANCE — Rosalind",desc:"Rosalind offered evening sparring. Go to the training grounds at dusk with a Moonpetal.",obj:["Bring a Moonpetal to evening sparring"]},
  hq_cave:{name:"Behind Falling Water",type:"MYSTERY",desc:"A torn map marks a cave behind falling water, west of the forest. The falls open only beneath the full moon, betwixt midnight and one — and should the Hollow's Stag fall first, they close forever. A silver sleeper lieth bound in the grotto wall.",obj:["Find the grotto behind the falls (full-moon midnight)","Read the wall-script","Wake the sleeper"]},
  sq_archive:{name:"Echoes of the Sunken Archive",type:"MYSTERY",desc:"Lyra sleepeth bound in the Hidden Grotto, three bindings and one last seal. Free her bindings with three truths, read the wall — and wake what sleepeth.",obj:["Free the three bindings (riddle)","Wake the sleeper"]}
};
/* Dialogue trees. Nodes: {sp, tx, img, choices:[{t, tone, to, do, cond}], next} */
RHE.DLG = {
  liliane_first:{start:"n0",nodes:{
    n0:{sp:"Rosalind",tx:"Stay where thou art, human. Thy name. Thy origin. Thy purpose. Lie not — my bow shall hear it.",next:"n1"},
    n1:{sp:"???",tx:"...Earth. A city of iron and neon called Tokyo. I fell out of the sky — and my name fell out somewhere on the way down. I can't... quite say it yet.",next:"n2"},
    n2:{sp:"Rosalind",tx:"That was the night our rot grew twofold. The elders shall call thee the Devourer's hound. Yet thou starest. What seest thou when thou look'st upon me?",choices:[
      {t:"\"A thread. Pale green. From you... to me.\" (honest)",tone:"SERIOUS",to:"n3a",do:{f:{saw_thread:1},rom:{liliane:{trust:2,close:2}}}},
      {t:"\"A very stressed elf holding a bow.\" (deflect)",tone:"SARCASTIC",to:"n3b",do:{rom:{liliane:{aff:1}}}},
      {t:"\"Someone exhausted from carrying everyone.\" (kind)",tone:"KIND",to:"n3c",do:{rom:{liliane:{aff:2,trust:1,close:1}}}},
      {t:"\"None of your business. Lower the bow.\" (hard)",tone:"AGGRESSIVE",to:"n3d",do:{rom:{liliane:{respect:1,aff:-1}}}}
    ]},
    n3a:{sp:"Rosalind",tx:"None save seers see Heart Threads. Yet thou, sky-fallen, seest at a glance. That is miracle or lure. I shall watch thee myself. If thou be a knife aimed at this wood, I shall break thee first.",next:"n4"},
    n3b:{sp:"Rosalind",tx:"Ha — flatter not thyself into an arrow wound. Thou jestest, fallen from the sky. Brave or fool. Perchance both. I shall watch thee myself.",next:"n4"},
    n3c:{sp:"Rosalind",tx:"Thou know'st naught of me. And yet. Hmph. The elders would slay thee outright. I shall bear thee instead — the Guardian's Oath. My life for thy leash.",next:"n4"},
    n3d:{sp:"Rosalind",tx:"Bold. Foolish, yet bold. The Oath waketh not if I hate thee. A pity — thou wouldst have made it easy. I take thee as my charge. Waste it not.",next:"n4"},
    n4:{sp:"Elder Thaelor",tx:"So be it. Guard-Captain, the Oath bindeth thee: should his being bring ruin to the Greenwood, thy heart shall stop ere his. Dost thou accept?",choices:[
      {t:"Step forward: \"Then bind me too. Punish me, not her.\" (brave)",tone:"BRAVE",to:"n5a",do:{f:{oath_brave:1},rom:{liliane:{trust:2,respect:2,close:1}}}},
      {t:"\"Rosalind — don't. There has to be another way.\" (plead)",tone:"KIND",to:"n5b",do:{rom:{liliane:{aff:1,trust:1}}}},
      {t:"Stay silent. Remember this debt.",tone:"CLEVER",to:"n5c",do:{rom:{liliane:{respect:1}}}}
    ]},
    n5a:{sp:"Rosalind",tx:"Fool. Utter fool, to vow thus. (Her grip closeth on thy wrist — then letteth go, gentle.) I accept, Elder. He is mine to guard.",next:"n6"},
    n5b:{sp:"Rosalind",tx:"Peace. Shame not our ways by begging for me. Yet. I thank thee. I accept, Elder. He is mine to guard.",next:"n6"},
    n5c:{sp:"Rosalind",tx:"(She meeteth thy silence with a long gaze — nigh approval.) I accept, Elder. He is mine to guard.",next:"n6"},
    n6:{sp:"Rosalind",tx:"One thing more, sky-fallen. The Oath bindeth lives, not names — and I shall not cry 'hey, thou' across a field of battle. When I bid thee duck... what name do I cry?",end:1,quest:"mq1",namePrompt:1}
  }},
  liliane_after:{start:"n0",nodes:{
    n0:{sp:"Rosalind",tx:"The wood sickens north beyond the treeline. Purge four corrupted wolves and return. Die not — the Oath's writs are tedious.",dynamic:1}
  }},
  liliane_return:{start:"n0",nodes:{
    n0:{sp:"Rosalind",tx:"Four pelts of mist. Clean work... for a sky-fallen fool. The Hollow's ward-door standeth open now. Bring me what lieth within — and come back breathing.",end:1,quest:"mq2"}
  }},
  liliane_fragment:{start:"n0",nodes:{
    n0:{sp:"Rosalind",tx:"Thou held'st it. It burned me, yet chilled thee only. Know'st thou what that meaneth? Nay. Nor do I. And that feareth me more.",choices:[
      {t:"\"Then we learn together. I choose you — all of you.\" ",tone:"KIND",to:"n1a",do:{rom:{liliane:{aff:2,trust:2,close:2}}}},
      {t:"\"It means I'm useful. Use me well, Captain.\"",tone:"SERIOUS",to:"n1b",do:{rom:{liliane:{respect:2}}}},
      {t:"\"It means your gods owe me dinner.\" ",tone:"SARCASTIC",to:"n1c",do:{rom:{liliane:{aff:1}}}}
    ]},
    n1a:{sp:"Rosalind",tx:"To choose is easy. To keep choosing — that is the vow this world forgot. Meet me upon the east platform after dark. Alone. I prithee.",end:1,quest:"mq3"},
    n1b:{sp:"Rosalind",tx:"Hmph. A soldier's answer. Meet me upon the east platform after dark. We shall plan the road hence.",end:1,quest:"mq3"},
    n1c:{sp:"Rosalind",tx:"Pfft — fool. Fine. Supper. After thou survivest the night platform. Come alone, at dark.",end:1,quest:"mq3"}
  }},
  liliane_night:{start:"n0",nodes:{
    n0:{sp:"Rosalind",tx:"(No armor. Hair unbound. She looketh not upon thee.) Beyond these trees: dragonfire, brands, witches, saints. The elders name thee Heart-Bearer. I name thee... trouble.",choices:[
      {t:"\"Everyone needs someone. Even guardians.\" (take her hand)",tone:"KIND",to:"n1a",do:{rom:{liliane:{aff:3,trust:2,close:3}},f:{night_hand:1}}},
      {t:"\"Then let's move faster than the curse.\" (oath)",tone:"BRAVE",to:"n1b",do:{rom:{liliane:{respect:2,close:2}},f:{night_oath:1}}},
      {t:"\"Is that moonlight, or are you blushing, Captain?\" (tease)",tone:"SARCASTIC",to:"n1c",do:{rom:{liliane:{aff:2}},f:{night_tease:1}}}
    ]},
    n1a:{sp:"Rosalind",tx:"(Her hand is warm. The Oath flareth — then, wondrous, soft'neth.) Make me not rue my faith in thee, Rehevane of Earth. My heart is wayward enough.",end:1,quest:"mq4a"},
    n1b:{sp:"Rosalind",tx:"Thou ever vow'st impossibles to cursed maids. (A breath, nigh laughter.) Then I shall hold thee to it. To the gate at dawn.",end:1,quest:"mq4a"},
    n1c:{sp:"Rosalind",tx:"I —! I am NOT — ugh. Thou art the worst. (She pulleth not away.) To the gate at dawn. And Rehevane... I thank thee for coming.",end:1,quest:"mq4a"}
  }},
  sparring:{start:"n0",nodes:{
    n0:{sp:"Rosalind",tx:"Thou brought'st a Moonpetal? They are weeds. Common. Full common. (She taketh it most carefully.) Spar with me. Show me the stance I taught thee.",choices:[
      {t:"Spar gently — let her win the last exchange. (compassionate)",tone:"KIND",to:"n1a",do:{rom:{liliane:{aff:2,trust:1}},f:{spar_kind:1}}},
      {t:"Go all out — earn her respect. (fierce)",tone:"BRAVE",to:"n1b",do:{rom:{liliane:{respect:2,aff:1}},f:{spar_fierce:1}}}
    ]},
    n1a:{sp:"Rosalind",tx:"Thou stayed'st thy last cut. I saw it. I thank thee. For making me feel not breakable. (The Oath stingeth — she stayeth still.)",end:1,quest:"rq"},
    n1b:{sp:"Rosalind",tx:"Ha! Good! Again! Thou learn'st swiftly, sky-fool. Perchance thou shalt outlive me after all.",end:1,quest:"rq"}
  }},
  scout:{start:"n0",nodes:{
    n0:{sp:"Fen (wounded)",tx:"Don't... fuss. Corrupted stag... gored the patrol. Tell Rosalind... the Hollow... ugh—",choices:[
      {t:"Spend a tonic & bind his wounds. (compassionate)",tone:"KIND",to:"n1a",do:{f:{scout_healed:1},rep:{greenwood:2}}},
      {t:"Carry him back to Marta's inn. (brave)",tone:"BRAVE",to:"n1b",do:{f:{scout_carried:1},rep:{greenwood:1}}},
      {t:"\"Tell me what you saw first.\" (press him)",tone:"CLEVER",to:"n1c",do:{f:{scout_info:1}}},
      {t:"Leave him. The mission matters more. (cold)",tone:"SELFISH",to:"n1d",do:{f:{scout_left:1},rep:{greenwood:-2}}}
    ]},
    n1a:{sp:"Fen",tx:"...Warm. Hah. Tell Hilda... her bounty board... underpays... (He lives. The outpost will remember this.)",end:1,quest:"scout"},
    n1b:{sp:"Fen",tx:"Ugh— put me down, hero— ...fine. Owe you a drink. A strong one. (He lives.)",end:1,quest:"scout"},
    n1c:{sp:"Fen",tx:"The stag... speaketh... with a man's voice... begging... 'don't leave me'... Then it chargeth. Gods. Let it not touch thee.",end:1,quest:"scout"},
    n1d:{sp:"Fen",tx:"...Yeah. ...That's what the forest... teaches... (You walk away. Something in you walks slower.)",end:1,quest:"scout"}
  }},
  corv:{start:"n0",nodes:{
    n0:{sp:"Hermit Corv",tx:"Another thread-seer? Nay — a thread-GRABBER. Hoh. When the Hollow sneezed, Minerva's pages flew. Three there be. One hideth behind water. Fetch them, and I shall tell thee what the Oath truly costeth.",end:1}
  }},
  corv_done:{start:"n0",nodes:{
    n0:{sp:"Hermit Corv",tx:"Pages! Good. Hark: Oath, brand, stone-heart, altar — one shape. The Devourer inventeth not love. It keepeth love that will not end. Burn thou the archive... or teach it farewell. That is thy war.",end:1,quest:"notes"}
  }},
  yua_gate:{start:"n0",img:"assets/img/portraits/yua.svg",nodes:{
    n0:{sp:"??? Knight",tx:"Halt, traveler. ...Rehevane? The Heart-Bearer? (Her dark-red eyes hold thee — a breath too long. Her hand closeth on her sword... then openeth.) Forgive me. Thou walk'st as one I have sworn to already.",img:"assets/img/portraits/yua.svg",next:"n1"},
    n1:{sp:"Belladonna",tx:"I am Belladonna, knight-maid of Silverwall. The King shall crave thee. The road craveth thee more, I deem. (A small, perfect smile — with hunger folded within.) We shall meet anew. I ever... find... my charge.",img:"assets/img/portraits/yua.svg",choices:[
      {t:"\"Then I'll look forward to it, Belladonna.\" (warm)",tone:"KIND",to:"n2a",do:{rom:{yua:{aff:2,trust:1}},f:{met_yua:1}}},
      {t:"\"Are you following me already?\" (wary)",tone:"CLEVER",to:"n2b",do:{rom:{yua:{aff:1}},f:{met_yua:1}}}
    ]},
    n2a:{sp:"Belladonna",tx:"(Her breath catcheth — joy unhid.) Aye. Aye, I shall hold thee to that. (She writeth in a small book. Thy name. Thrice.)",img:"assets/img/portraits/yua.svg",end:1,quest:"gate"},
    n2b:{sp:"Belladonna",tx:"Keen-eyed. Good. Thou shalt need that. (She smileth sweet, whilst marking thy heartbeat.) Till soon, Rehevane.",img:"assets/img/portraits/yua.svg",end:1,quest:"gate"}
  }},
  seraphina_court:{start:"n0",img:"assets/img/portraits/seraphina.svg",nodes:{
    n0:{sp:"Ruby",tx:"Behold my court, sky-fallen. Counselors who would seal the peaks and let the world burn. 'Risk our blood for elves and men?' they cry. Answer them — for my stone heart may not speak what I feel.",img:"assets/img/portraits/seraphina.svg",choices:[
      {t:"\"If the sky falls, it won't stop at your borders.\" (bold)",tone:"BRAVE",to:"n1a",do:{rom:{seraphina:{aff:2,respect:2}}}},
      {t:"\"A ruler who feels is followed. A statue is merely stared at.\" (kind)",tone:"KIND",to:"n1b",do:{rom:{seraphina:{aff:2,trust:1}}}}
    ]},
    n1a:{sp:"Ruby",tx:"Hah! Borrowed words, well spent. The court adjourneth, grumbling. (Her hand presseth her breast a breath.) Thou fightest well with words. Come — after dark, the balcony. Alone.",img:"assets/img/portraits/seraphina.svg",end:1,f:{court_seen:1}},
    n1b:{sp:"Ruby",tx:"...Felt. Aye. They heard it from thee, since stone forbiddeth me. (Her gaze softeneth one fraction.) After dark, the balcony. None shall follow us.",img:"assets/img/portraits/seraphina.svg",end:1,f:{court_seen:1}}
  }},
  seraphina_balcony:{start:"n0",img:"assets/img/portraits/seraphina.svg",nodes:{
    n0:{sp:"Ruby",tx:"(No crown. No armor. Only Ruby.) My ancestor begged the first Devourer for power, and now should I wish for mine own joy — one sunrise walk, one life unruled — my heart stones further. I fear to care. For them. Perchance... for thee.",img:"assets/img/portraits/seraphina.svg",choices:[
      {t:"\"Then we'll break it before it seals. I promise.\" (oath)",tone:"BRAVE",to:"n1a",do:{rom:{seraphina:{aff:2,trust:2,close:2}},f:{sera_trust:1}}},
      {t:"\"Rule well first as dragon, then as crown.\" (wise)",tone:"CLEVER",to:"n1b",do:{rom:{seraphina:{respect:2,trust:1}},f:{sera_trust:1}}}
    ]},
    n1a:{sp:"Ruby",tx:"Thou vow'st impossibles as easily as breathing. (A laugh, nigh tears.) Then north, at dawn — the sky-node feedeth on despair, and I shall burn it with thee beside me.",img:"assets/img/portraits/seraphina.svg",end:1,quest:"mq6"},
    n1b:{sp:"Ruby",tx:"Dragon ere crown. Hm. None ever ordered me thus. (She standeth straighter, stone aching.) North, at dawn. We burn the sky-node together.",img:"assets/img/portraits/seraphina.svg",end:1,quest:"mq6"}
  }},
  seraphina_after:{start:"n0",img:"assets/img/portraits/seraphina.svg",nodes:{
    n0:{sp:"Ruby",tx:"The sky is steady. My wings remember silence. (She holdeth thy hand one heartbeat longer than custom.) Thou didst not flinch from my stone. Go then — the plains howl below, and a wolf-girl's thread pulleth toward thee. I shall hold the peaks till thou returnest.",img:"assets/img/portraits/seraphina.svg",end:1,quest:"mq7"}
  }},
  mira_meet:{start:"n0",img:"assets/img/portraits/mira.svg",nodes:{
    n0:{sp:"Nyx",tx:"Whew! Three reavers down and thou'rt still standing! (She sniffeth thee, tail high.) Thou smellest strange. Not of this world. I like it. Thou art MINE now. ...Eh? Why showest thou thy teeth? That was a joke. Mostly.",img:"assets/img/portraits/mira.svg",next:"n1"},
    n1:{sp:"Nyx",tx:"(Her grin fadeth; her fingers find the collar-brand.) This? Human law. One word from a lord and I kneel, mind empty. Thou treatest me as folk. But how know I what I feel is not the brand twisting me?",img:"assets/img/portraits/mira.svg",choices:[
      {t:"\"We cut the brand's threads. What stays is true.\" (vow)",tone:"KIND",to:"n2a",do:{rom:{mira:{aff:3,trust:2,close:2}},f:{met_mira:1,mira_free:1}}},
      {t:"\"Then test me. No leash, no orders. Only choice.\" (fierce)",tone:"BRAVE",to:"n2b",do:{rom:{mira:{aff:2,respect:2,close:1}},f:{met_mira:1,mira_free:1}}}
    ]},
    n2a:{sp:"Nyx",tx:"...Cut them. Aye. (The brand flickereth; her tail thundereth against thy cup.) Whatever's left liketh thee, sky-strange. Remember thou said it! East lieth a marsh-witch who knoweth such bindings. Take me with thee!",img:"assets/img/portraits/mira.svg",end:1,quest:"mq8"},
    n2b:{sp:"Nyx",tx:"No leash, no orders... (She tasteth the words, ears high.) Dangerous words, sky-strange. I accept. And if I stay, 'tis MY choosing — carve that on thy sword! East: a marsh-witch. Move!",img:"assets/img/portraits/mira.svg",end:1,quest:"mq8"}
  }},
  elowen_intro:{start:"n0",nodes:{
    n0:{sp:"Minerva",tx:"...Begone. I do no cleansings. I lift no love-curses. I study theoretical dooms. (A pause. The door openeth a crack wider.) ...'Heart Devourer,' thou saidst? Enter. Mind the candles. Mind me not.",next:"n1"},
    n1:{sp:"Minerva",tx:"My notes: the first sky-soul, the first wish, love that would not bear loss made living. My arms: the price — shadow climbeth whene'er I cast. If any loveth me, the curse shall drink them too. Hence... distance. Ask thy questions swiftly.",choices:[
      {t:"\"Show us the First Sin. All of it.\" (steady)",tone:"SERIOUS",to:"n2a",do:{f:{met_elowen:1},rom:{elowen:{trust:2,respect:1}}}},
      {t:"\"You're shaking when you cast. I see you.\" (gentle)",tone:"KIND",to:"n2b",do:{f:{met_elowen:1},rom:{elowen:{aff:2,trust:1,close:1}}}}
    ]},
    n2a:{sp:"Minerva",tx:"...Direct. Very well. My tower can join our minds and show the echo. Touch the crystal with me — and brace thy heart.",end:1},
    n2b:{sp:"Minerva",tx:"...I was not meant to be seen so clearly. (Tears, silent.) Too late, thou sayest? ...Take my hand, then. The echo needeth us both.",end:1}
  }},
  elowen_vision:{start:"n0",nodes:{
    n0:{sp:"Echo of the Past",tx:"(A young man kneeleth in ash, cradling nothing.) 'Make it that none leave me. Make love last evermore. Make it that I hear farewell never again.' The world answereth — wrongly. Love that never looseth. Chains. Brands. Stone. Oaths. THE HEART DEVOURER IS BORN.",next:"n1"},
    n1:{sp:"Rin",tx:"...One of mine. An Earthling's grief, weaponized by a world that obeyed too literally. His sin rotted your tower, your brands, your oaths — all of it.",next:"n2"},
    n2:{sp:"Minerva",tx:"Then our geometry is proven. And thou — what wilt THOU do with his legacy, sky-fallen?",choices:[
      {t:"\"Not repeat him. I choose, and keep choosing.\" (vow)",tone:"BRAVE",to:"n3a",do:{f:{sin_seen:1},rom:{elowen:{aff:2,trust:2,close:2}}}},
      {t:"\"Teach this world goodbye — starting with your fear.\" (tender)",tone:"KIND",to:"n3b",do:{f:{sin_seen:1},rom:{elowen:{aff:3,close:1}}}}
    ]},
    n3a:{sp:"Minerva",tx:"(Her shadow-veins recede a finger's width.) Choosing. Aye. My tower standeth with thee. West... no, EAST — Silverwall. A knight-maid scribbleth thy name thrice somewhere. Go.",end:1,quest:"mq9"},
    n3b:{sp:"Minerva",tx:"My fear? Hah. ...Burn my notes if I fall, and remember I leaned once. (She leaneth — briefly.) East. Silverwall. Thy knight awaiteth.",end:1,quest:"mq9"}
  }},
  yua_city:{start:"n0",img:"assets/img/portraits/yua.svg",nodes:{
    n0:{sp:"Belladonna",tx:"Rehevane. Thou camest. (She is at thy door ere dawn, blade already drawn — for THEM, never thee.) The King nameth me thy shield. Assassins already gather; two Oathless blades stalk these streets. Stay near me. Stay MINE — ...safe. I meant safe.",img:"assets/img/portraits/yua.svg",choices:[
      {t:"\"Then I look forward to it — guard me well.\" (warm)",tone:"KIND",to:"n1a",do:{rom:{yua:{aff:2,trust:2}}}},
      {t:"\"Count the blades with me. We face them together.\" (steady)",tone:"BRAVE",to:"n1b",do:{rom:{yua:{trust:2,respect:2}}}}
    ]},
    n1a:{sp:"Belladonna",tx:"(Delight, undisguised.) Aye. None shall touch thee. Fell the two blades in this city, and I shall show thee the Rite Circle — where I may bind my soul to thine. Properly. Forever. ...If thou permittest.",img:"assets/img/portraits/yua.svg",end:1,f:{yua_posted:1}},
    n1b:{sp:"Belladonna",tx:"Together. ...None ever said that and meant it. (Her grip looseneth; her smile warmeth one degree.) Two blades walk Silverwall. End them, and meet me at the Rite Circle.",img:"assets/img/portraits/yua.svg",end:1,f:{yua_posted:1}}
  }},
  yua_rite:{start:"n0",img:"assets/img/portraits/yua.svg",nodes:{
    n0:{sp:"Belladonna",tx:"The blades are fallen. The Circle waiteth. With this rite I shall sense all peril ere it toucheth thee — no hand raised 'gainst thee shall live to strike. My whole being, thine. Wilt thou have it?",img:"assets/img/portraits/yua.svg",choices:[
      {t:"\"On one condition: if I tell you to stop, you stop. Always.\" (bind)",tone:"BRAVE",to:"n1a",do:{f:{sworn:1},rom:{yua:{aff:2,trust:3,loyal:3}}}},
      {t:"\"Only if you stay mine AND your own.\" (tender)",tone:"KIND",to:"n1b",do:{f:{sworn:1},rom:{yua:{aff:3,close:2,loyal:2}}}}
    ]},
    n1a:{sp:"Belladonna",tx:"...A leash of thy choosing, upon my eternity. (She kneeleth, radiant.) I swear it. Bid me halt, and I shall — e'en if my heart scream otherwise. (Light bindeth. Something hungry, behind it, waiteth... and is DENIED its first taste.)",img:"assets/img/portraits/yua.svg",end:1,quest:"mq10"},
    n1b:{sp:"Belladonna",tx:"Thine own... none ever granted me that half. (Tears, shining.) I swear: thy shield AND thy friend. East lieth Starlia, where prayers devour a saint. Walk with me into the bells.",img:"assets/img/portraits/yua.svg",end:1,quest:"mq10"}
  }},
  aria_intro:{start:"n0",img:"assets/img/portraits/aria.svg",nodes:{
    n0:{sp:"Daisy",tx:"Welcome to Starlia, Rehevane-who-beareth-shards! (Sunlight itself curtsies.) Thou holdest pieces of the Devourer and breakest not — the pilgrims already sing it. Come, let me bless thee! ...Closer, then. Why starest thou so?",img:"assets/img/portraits/aria.svg",next:"n1"},
    n1:{sp:"Rin",tx:"...Thousands of threads. All running into you — then draining into a pit behind your heart. The Devourer's main anchor. And you just smile through it.",next:"n2"},
    n2:{sp:"Daisy",tx:"...Perceptive. (The sunshine thinneth, just a breath.) Then thou know'st: if I stop, the prayers eat others instead. So I burn — centrally. Efficiently. Cheerfully! ...Find me in the side chapel after dark, if thou wouldst see what sunshine hideth.",end:1,f:{met_aria:1}}
  }},
  aria_chapel:{start:"n0",img:"assets/img/portraits/aria.svg",nodes:{
    n0:{sp:"Daisy",tx:"(No veil. No choir. A girl hugging her knees on cold stone.) I am weary of being a sign. Of being the vessel where all pour their pain and call it faith. Tell me true, sky-boy: what am I, if not loved?",img:"assets/img/portraits/aria.svg",choices:[
      {t:"\"Daisy. Not a vessel. Let's make a world where you laugh.\" (vow)",tone:"KIND",to:"n1a",do:{f:{aria_open:1},rom:{aria:{aff:3,trust:2,close:2}}}},
      {t:"\"Mine. Ours. Real — if you dare one selfish morning.\" (fierce)",tone:"BRAVE",to:"n1b",do:{f:{aria_open:1},rom:{aria:{aff:2,close:3}}}}
    ]},
    n1a:{sp:"Daisy",tx:"...A world where I laugh unpainted. Selfish. Lovely. (Fragile hope kindleth; the curse SHUDDERS.) Then below us — the Altar Depths. It knoweth I am coming. Hold my hand going down?",img:"assets/img/portraits/aria.svg",end:1,quest:"mq11"},
    n1b:{sp:"Daisy",tx:"One selfish morning... (She laugheth — ungraceful, unpainted, REAL.) Granted! And after it, the Depths. The pit hath drunk its last saint. Come!",img:"assets/img/portraits/aria.svg",end:1,quest:"mq11"}
  }},
  yua_wall:{start:"n0",img:"assets/img/portraits/yua.svg",nodes:{
    n0:{sp:"Belladonna",tx:"(Golden eyes too bright upon the wall.) A merchant cheated thee — his stall burned. A squire challenged thee — his sword bent double in the night. I did those things, Rehevane. I feel thy pulse quicken when blades near thee... and I am AFRAID. All leave. Mother. Master. My first charge. If I hold not tight, thou wilt slip likewise.",img:"assets/img/portraits/yua.svg",choices:[
      {t:"\"Then hear my order, my Shield: don't hurt anyone for me. Only block true attacks.\" (bind)",tone:"BRAVE",to:"n1a",do:{f:{wall_oath:1},rom:{yua:{trust:3,loyal:2}}}},
      {t:"\"Tell me when fear bites, instead of hiding it in steel.\" (tender)",tone:"KIND",to:"n1b",do:{f:{wall_oath:1},rom:{yua:{aff:2,trust:2,close:2}}}}
    ]},
    n1a:{sp:"Belladonna",tx:"(She setteth her sword-point to her OWN breast, then lowereth it.) I was bid to halt, and I shall. My love is not thy leash. (The hungry thing behind her glow draweth back, cheated.) Below, the Altar. I walk BESIDE thee now. Not before.",img:"assets/img/portraits/yua.svg",end:1,quest:"mq12"},
    n1b:{sp:"Belladonna",tx:"...Tell thee. Instead of steel. (Tears at last.) I swear it. Hold me to it — remind me whose knight I would be, when fear gnaweth. The Depths await. Together.",img:"assets/img/portraits/yua.svg",end:1,quest:"mq12"}
  }},
  devourer_final:{start:"n0",nodes:{
    n0:{sp:"The Grief",tx:"(It weareth the First Soul's face.) STAY. HOLD. NEVER FAREWELL. (To Belladonna:) KEEP THEM FROM HIM. (To Rosalind, through the Oath:) SLAY HIM, AND LIVE. (To Ruby:) WISH FOR NAUGHT. (To Nyx:) OBEY. (To Minerva:) HIDE. (To Daisy:) SUFFER.",next:"n1"},
    n1:{sp:"The Six",tx:"Belladonna: 'My love is not thy leash.' Rosalind: 'Let caring find me caring.' Ruby: 'Ruby ere Highness.' Nyx: 'What chaineth me may break.' Minerva: 'Let them see me fail loving.' Daisy: 'This morn I am but a maid.' (Six threads blaze — not to bind, but to LOOSEN.)",next:"n2"},
    n2:{sp:"Rin",tx:"(Fragments warm in your hands.) You were loved. You are missed. But love is not keeping. Go — and rest.",choices:[
      {t:"\"I'll keep choosing them. Every morning. All of them.\" (free all)",tone:"KIND",to:"n3a",do:{f:{finale_tone:"free"}}},
      {t:"\"One thread held tightest — yet never chained.\" (hold one)",tone:"BRAVE",to:"n3b",do:{f:{finale_tone:"hold"}}},
      {t:"\"I let go of everything — even myself.\" (release)",tone:"CLEVER",to:"n3c",do:{f:{finale_tone:"release"}}}
    ]},
    n3a:{sp:"Dawn",tx:"(Light runneth green to Greenwood, red-gold to Spires, amber to Plains, violet to Marsh, white-gold to Starlia. The pit screameth — then learneth a new word: ENOUGH.)",next:"n4"},
    n3b:{sp:"Dawn",tx:"(One thread burneth brightest of six — yet the others hold, freely. The pit, denied its favorite meal, starveth thin and strange.)",next:"n4"},
    n3c:{sp:"Dawn",tx:"(Thou openest thy hands wholly. The Grief, offered nothing to grip, looseth. Six hands catch THEE ere thou fallest.)",next:"n4"},
    n4:{sp:"Rin",tx:"(Years unspool ahead like dawn threads. No choice is offered here — every morning already chose. Every cake shared, every spar, every sunrise, every halt-word honored... and every jealousy soothed or left to burn. The threads gather. Fate holds its breath.)",route:"finale"},
    n5_lil:{sp:"Rosalind",tx:"Hmph. ...The threads chose... ME? ...Idiot. ...The Oath-scar still itcheth when my heart runneth — so hear my terms: I captain the Greenwood by day and scold thee by night, and if thou thinkest that soft, test the edge of my — ...look not upon me so. A cottage past the east platform. {kt} — {kb} and {kg} — with pointed ears and thy stubbornness. They call me Captain. They call thee Papa. ...Make not that face. ...Stay. That is an order. From the Captain. From thy wife.",end:1,quest:"mq13"},
    n5_yua:{sp:"Belladonna",tx:"Mine. ...The threads spoke — and said ME. (She writeth it thrice, hand trembling.) A house in Silverwall, locks oiled by mine own hand. {kt} — {kb} and {kg} — every heartbeat logged, every tooth, every first step. Possessive? Aye. Thou knew'st, and chosest anyway. Hold too tight, and speak the word: I halt. That is our whole marriage — thy voice, my leash, willingly worn. ...Mine. Ours. Evermore. (Wrong temperature. Perfect.)",end:1,quest:"mq13"},
    n5_sera:{sp:"Ruby",tx:"Kneel not — ...thou wouldst not anyway. (A sunrise walk at last, hand in hand, no crown.) The court objected to a sky-fallen consort. The court was REMINDED that their Princess survived stone-heart and sky-node, and marrieth as she pleaseth. WE are pleased. A palace wing, {kt} — {kb} and {kg} — with tiny horns and thy grin. They call me Radiance. They call thee the Sunrise Thief. ...Steal me again to-morrow.",end:1,quest:"mq13"},
    n5_mira:{sp:"Nyx",tx:"Eh?! ME?! (Tail: absolute thunderstorm. She near setteth the altar candle wagging.) ...My choosing, then! MY pack, MY den upon the plains, MY sky-strange mate who cut my collar and asked for naught. {kt} — {kb} and {kg} — all ears and fangs and thy laugh. I teach them the hunt; thou teachest them to CHOOSE. ...No leash. No orders. Only us. ...Mine. (Thou heardest nothing.)",end:1,quest:"mq13"},
    n5_elowen:{sp:"Minerva",tx:"Hypothesis confirmed: proximity to thee improveth all outcomes. (She adjusteth her glasses; her ears redden.) The tower gaineth a second desk, a wider bed, and {kt} — {kb} and {kg} — with ink-stained fingers and thy habit of seeing clearly. I document every milestone. I lean, now — regularly. Peer-reviewed. ...Stay for further study. Permanent study. ...Love thee. Footnote: always did.",end:1,quest:"mq13"},
    n5_aria:{sp:"Daisy",tx:"ME?! Just-a-girl me?! (Sunshine, weaponized; the very bells ring themselves.) A cottage where prayers cannot reach — mornings of unpainted laughter, {kt} — {kb} and {kg} — who know their mama as Daisy first, and Saint never, unless SHE chooseth! Thou taughtest me selfishness. I shall teach our brood joy. Bless thee, sky-boy — ...bless US! (She laugheth. Ungraceful. Perfect. Home.)",end:1,quest:"mq13"},
    n5_seramira:{sp:"Ruby & Nyx",tx:"Ruby: 'The palace-thermostat war is hereby declared a draw. She sleepeth by the hearth; I keep the hearth.' Nyx: 'Fang-wife keepeth the hunt, fire-wife keepeth the gold — and thou keepest US, sky-strange!' {kt} — {kb} and {kg} — of horns, ears, and thy grin fill both den and palace. Bickering nightly. Devotion always. ...Ours.",end:1,quest:"mq13"},
    n5_lilyua:{sp:"Rosalind & Belladonna",tx:"Rosalind: 'The knight and the captain. The Oath and the Shield. Rota negotiated: I guard days, she guardeth nights, and thou art guarded ALWAYS. Object and be outvoted.' Belladonna: 'Two shields, one heart. The children are... logged. Lovingly. (Thrice.)' Rivalry, transmuted to sisterhood. {kt} — {kb} and {kg} — the best-guarded brood in three realms. ...Ours.",end:1,quest:"mq13"},
    n5_eloaria:{sp:"Minerva & Daisy",tx:"Minerva: 'Variables controlled: one sunny wife, one quiet tower, {kt}.' Daisy: 'And one scholar who leaneth WITHOUT being asked! {kb} and {kg} of footnotes and sunshine!' A garden beside the bog; bells beside the candles. {kt} raised on laughter and marginalia. ...Ours.",end:1,quest:"mq13"},
    n5_harem:{sp:"The Six",tx:"All of us. ...So the threads decreed: ALL of thee. (Six voices, one answer.) The Greenwood cottage overfloweth; the Spires palace echoeth; the plains den thundereth. {kt} — {kb} and {kg} — of pointed ears, tiny horns, fangs, ink, sunshine, and thy stubborn heart. Jealousy, negotiated nightly. Love, chosen daily. Rosalind still ordereth thee to stay. ...Stay.",end:1,quest:"mq13"},
    n5_alone:{sp:"Rin",tx:"Alone? ...Then I shall wander, and they shall visit. (Six voices, six promises.) A warden's road, unbound: Greenwood moons, Spire sunrises, plains wind, marsh mist, Silverwall steel, Starlia bells. No house. No hearth. Only the whole world — and six threads that loosen but never snap. ...I will return any morning. They will be choosing me.",end:1,quest:"mq13"},
    n5_lyra:{sp:"Lyra",tx:"...Alone? (Warmth, behind thy ribs, laughing through tears.) Thou canst never be alone again, promised heart — I made sure of it three hundred years ago. No cottage. No palace. No den. Thou needest no house for me: I am thy house. Where thou wanderest, I wander — thy second heartbeat, thy first witness, thy wife. ...Thee. Evermore. Filed.",img:"assets/img/portraits/lyra.svg",end:1,quest:"mq13"}
  }},
  /* Rivalry — a jealous heroine acts to win thee back. Her jealousy spendeth
     in the scene; some other girl marketh it. NPC archaic, Rin modern. */
  rival_liliane:{start:"n0",nodes:{
    n0:{sp:"Rosalind",tx:"(She findeth thee mid-step, bow over shoulder, braid swinging like a verdict.) Thou hast been... DISTRIBUTING thy smiles, sky-fallen. ...Spar with me. NOW. Winner claimeth thy whole evening. No patrol. No excuses.",choices:[
      {t:"Spar with her — let her vent it out. (game)",tone:"BRAVE",to:"n1a",do:{f:{rival_with:"liliane"},rom:{liliane:{aff:2,close:2,jeal:-99}}}},
      {t:"\"First admit the braid looks nice today.\" (tease)",tone:"SARCASTIC",to:"n1b",do:{f:{rival_with:"liliane"},rom:{liliane:{aff:3,close:1,jeal:-99}}}}
    ]},
    n1a:{sp:"Rosalind",tx:"(Blades clash till dusk. She winneth — barely — and demandeth her prize: a walk, thy arm, silence.) ...There. Jealousy, sparred out. Remember this form the next time some knight-maid monopolizeth thy pulse.",end:1,quest:"rival"},
    n1b:{sp:"Rosalind",tx:"...The braid?! (Guard: dropped. Ears: scarlet.) ...It took an hour. ...Thine evening is MINE, and thy flattery is noted in the patrol log. Under 'threats neutralized.' ...Stay.",end:1,quest:"rival"}
  }},
  rival_yua:{start:"n0",img:"assets/img/portraits/yua.svg",nodes:{
    n0:{sp:"Belladonna",tx:"(She steppeth from thy shadow — she was never NOT there.) Thy pulse ran QUICK yestereve. Not for me. ...Am I not enough? Answer with thy hand in mine. And mean it.",img:"assets/img/portraits/yua.svg",choices:[
      {t:"Hold her hand. Reassure her — and restate the boundary. (tender)",tone:"KIND",to:"n1a",do:{f:{rival_with:"yua"},rom:{yua:{aff:2,trust:2,close:1,jeal:-99}}}},
      {t:"\"Guard my walk with me. Together, not behind me.\" (steady)",tone:"BRAVE",to:"n1b",do:{f:{rival_with:"yua"},rom:{yua:{trust:2,loyal:2,jeal:-99}}}}
    ]},
    n1a:{sp:"Belladonna",tx:"(Thy hand, held like scripture.) ...Enough. Thou sayest it, and I believe — for an evening. The boundary holdeth: thy voice, my leash, willingly worn. ...Mine. Breathe easy. I am easy. (She is not easy. She is trying.)",img:"assets/img/portraits/yua.svg",end:1,quest:"rival"},
    n1b:{sp:"Belladonna",tx:"...Together. Not thy shadow — thy side. (She moveth beside thee, radiant, terrifying.) I shall guard thy joy as fiercely as thy life. Woe to whatever divideth them. ...To whatever divideth them.",img:"assets/img/portraits/yua.svg",end:1,quest:"rival"}
  }},
  rival_seraphina:{start:"n0",img:"assets/img/portraits/seraphina.svg",nodes:{
    n0:{sp:"Ruby",tx:"(A summons. Wax seal. No appeal.) My court noticeth thy absence. *I* noticed first. Attend me at once — tribute of attention, paid in full, no counselors, no crown. Only thee. Only me.",img:"assets/img/portraits/seraphina.svg",choices:[
      {t:"Kneel gallantly and pay full tribute. (courtly)",tone:"KIND",to:"n1a",do:{f:{rival_with:"seraphina"},rom:{seraphina:{aff:2,close:2,jeal:-99}}}},
      {t:"\"A private sunrise instead. No court. Just us.\" (bold)",tone:"BRAVE",to:"n1b",do:{f:{rival_with:"seraphina"},rom:{seraphina:{aff:3,close:1,jeal:-99}}}}
    ]},
    n1a:{sp:"Ruby",tx:"...Paid. In full. (She keepeth thee past midnight, stone forgotten.) Let the court whisper: their Princess hoardeth sky-fallen the way dragons hoard gold. ...Accurately.",img:"assets/img/portraits/seraphina.svg",end:1,quest:"rival"},
    n1b:{sp:"Ruby",tx:"...No court. (Dawn, hand in hand, command obeyed.) Thou learned'st royalty's true weakness: to be *chosen* over duty. ...Again to-morrow. That is not a request.",img:"assets/img/portraits/seraphina.svg",end:1,quest:"rival"}
  }},
  rival_mira:{start:"n0",img:"assets/img/portraits/mira.svg",nodes:{
    n0:{sp:"Nyx",tx:"(She droppeth from a branch, landing between thee and whatever held thy gaze.) Heard thou racest OTHER hearts! ...Rematch. Hunt-race. Winner keepeth thee the whole evening — and I. SHALL. WIN.",img:"assets/img/portraits/mira.svg",choices:[
      {t:"Race her, fair and laughing. (game)",tone:"BRAVE",to:"n1a",do:{f:{rival_with:"mira"},rom:{mira:{aff:2,close:2,jeal:-99}}}},
      {t:"Forfeit on the spot. Declare her winner. (soft)",tone:"KIND",to:"n1b",do:{f:{rival_with:"mira"},rom:{mira:{aff:3,trust:1,jeal:-99}}}}
    ]},
    n1a:{sp:"Nyx",tx:"(Dust. Laughter. A photo-finish howl.) ...MINE evening! (Victory yips.) Thou runnest well — for prey. ...For PACK. Thou runnest well for pack.",img:"assets/img/portraits/mira.svg",end:1,quest:"rival"},
    n1b:{sp:"Nyx",tx:"...Forfeit?! NO rematch?! (Ears flat — then VERTICAL.) ...Clever prey. ...Clever MATE. Evening: mine, uncontested, tail-thunderous. ...Thou art lucky thou art cute.",img:"assets/img/portraits/mira.svg",end:1,quest:"rival"}
  }},
  rival_elowen:{start:"n0",nodes:{
    n0:{sp:"Minerva",tx:"(A note, slipped into thy hand. It readeth: 'Observation, n=several: thy evenings distribute unevenly. Hypothesis: I require more data. With me. — S.') ...Well? Doth the subject consent to study?",choices:[
      {t:"\"An evening of footnotes and tea. I'm yours.\" (curious)",tone:"CLEVER",to:"n1a",do:{f:{rival_with:"elowen"},rom:{elowen:{trust:2,aff:1,jeal:-99}}}},
      {t:"\"Close the book tonight. Just you and me.\" (tender)",tone:"KIND",to:"n1b",do:{f:{rival_with:"elowen"},rom:{elowen:{aff:2,close:2,jeal:-99}}}}
    ]},
    n1a:{sp:"Minerva",tx:"(Tea. Candlelight. Margin-notes in duplicate.) ...Data gathered. Conclusion: thy company improveth ALL outcomes. ...Further study scheduled. Nightly.",end:1,quest:"rival"},
    n1b:{sp:"Minerva",tx:"...Closed. (The book shutteth; her glasses fog.) ...Unproductive. ...Lovely. Result logged once, in large letters: HIS.",end:1,quest:"rival"}
  }},
  rival_aria:{start:"n0",img:"assets/img/portraits/aria.svg",nodes:{
    n0:{sp:"Daisy",tx:"(She beameth — a shade too bright. A basket overflows with blessings and cake.) Thou hast been SHARING thy smiles! ...Well. Mine are BETTER. (Beat.) ...That sounded jealous. It WAS jealous. Forgive me? ...Bless me instead — stay.",img:"assets/img/portraits/aria.svg",choices:[
      {t:"Stay for blessings and cake. (warm)",tone:"KIND",to:"n1a",do:{f:{rival_with:"aria"},rom:{aria:{aff:3,close:1,jeal:-99}}}},
      {t:"\"Yours IS the best laugh. Prove it again.\" (sweet)",tone:"BRAVE",to:"n1b",do:{f:{rival_with:"aria"},rom:{aria:{aff:2,close:2,jeal:-99}}}}
    ]},
    n1a:{sp:"Daisy",tx:"(Cake. Blessings. A laugh that wobbleth, then ringeth true.) ...Stayed! Victory! (She recordeth it in the chapel book under 'miracles, minor but MINE.')",img:"assets/img/portraits/aria.svg",end:1,quest:"rival"},
    n1b:{sp:"Daisy",tx:"...Best laugh. (She giveth it — unpainted, ungraceful, perfect.) ...There! None laugheth thus for thee but ME. ...Visit the others. But laugh like THAT only here.",img:"assets/img/portraits/aria.svg",end:1,quest:"rival"}
  }},
  elder_talk:{start:"n0",nodes:{
    n0:{sp:"Elder Thaelor",tx:"Sky-fallen. The tree remembereth the First of thy kind — his wish is our rot. Prove thou art not his echo: cleanse the wolves, brave the Hollow. The Greenwood watcheth.",end:1}
  }},
  seraphina_intro:{start:"n0",img:"assets/img/portraits/seraphina.svg",nodes:{
    n0:{sp:"Ruby",tx:"So. The sky-fallen Heart-Bearer crawleth from the Greenwood with an elf-shadow and a knight-maid. I am Ruby, Princess of the Ashen Flame. Thy rot followed thee hither — skyfire burneth wild above my peaks.",img:"assets/img/portraits/seraphina.svg",next:"n1"},
    n1:{sp:"Ruby",tx:"Thou bearest a fragment and breakest not. Then thou shalt aid my court... or the Spires shall seal their gates as the elves sealed their wood. Choose swiftly, little flame.",img:"assets/img/portraits/seraphina.svg",choices:[
      {t:"\"Then we'll aid you. Show us the skyfire.\" (brave)",tone:"BRAVE",to:"n2a",do:{rom:{seraphina:{aff:2,trust:1}},f:{met_seraphina:1}}},
      {t:"\"We came to help, not to kneel.\" (proud)",tone:"CLEVER",to:"n2b",do:{rom:{seraphina:{aff:1,respect:2}},f:{met_seraphina:1}}}
    ]},
    n2a:{sp:"Ruby",tx:"Bold. Good. The mountains eat the meek. Rest at my fire, Rehevane — on the morrow we hunt a corrupted sky-node. (Act II continueth in the full game beyond this approach.)",img:"assets/img/portraits/seraphina.svg",end:1,quest:"mq5"},
    n2b:{sp:"Ruby",tx:"Ha! Pride. The Spires understand pride. Very well — stand tall, and burn with us. (Act II continueth in the full game beyond this approach.)",img:"assets/img/portraits/seraphina.svg",end:1,quest:"mq5"}
  }},
  marta:{start:"n0",nodes:{
    n0:{sp:"Marta",tx:"Hero's discount, love: rest 10g, bread 8g, tonic 25g. Beds be warm and the gossip warmer. Fen's patrol came not back, poor lamb.",end:1}
  }},
  /* Dates — one soft evening each (20g, +3h). Her jealousy melteth to naught;
     the others mark thy absence (+1; Belladonna +2). NPC archaic, Rin modern. */
  date_liliane:{start:"n0",starts:["n0","n0b","n0c"],nodes:{
    n0:{sp:"Rosalind",tx:"(Moonrise over the east platform. She came in half-armor — 'patrol,' she claimed, though no patrol bringeth honeycakes.) ...Stare not. The Oath itcheth warm to-night, not sharp. Perchance it, too, liketh cake. Sit. Ere I remember I am thy captain.",choices:[
      {t:"\"Even patrols need moonlight. And you.\" (sweet)",tone:"KIND",to:"n1a",do:{f:{date_with:"liliane"}}},
      {t:"\"Admit it, Captain — this is a date.\" (tease)",tone:"SARCASTIC",to:"n1b",do:{f:{date_with:"liliane"}}}
    ]},
    n0b:{sp:"Rosalind",tx:"(Riverbank. She skipped patrol route to walk the water with thee — bow unstrung, boots off, toes defiant.) ...Say naught of my feet. The Oath alloweth wading. ...Sit, ere I remember regulations.",choices:[
      {t:"\"Even patrols need moonlight. And you.\" (sweet)",tone:"KIND",to:"n1a",do:{f:{date_with:"liliane"}}},
      {t:"\"Admit it, Captain — this is a date.\" (tease)",tone:"SARCASTIC",to:"n1b",do:{f:{date_with:"liliane"}}}
    ]},
    n0c:{sp:"Rosalind",tx:"(Training ground, past midnight. Thou corrected her star-chart; she corrected thy stance — thrice.) ...Enough drills. Lie back. Name me one constellation that is NOT an omen. ...Difficult? Thought so. Stay.",choices:[
      {t:"\"Even patrols need moonlight. And you.\" (sweet)",tone:"KIND",to:"n1a",do:{f:{date_with:"liliane"}}},
      {t:"\"Admit it, Captain — this is a date.\" (tease)",tone:"SARCASTIC",to:"n1b",do:{f:{date_with:"liliane"}}}
    ]},
    n1a:{sp:"Rosalind",tx:"...Patrols need vigilance. Moonlight is — ...aye. And me. (She sharereth the last cake, grumbling, and her braids sway closer.) The Oath is silent to-night. Stay a while longer. That is... a request. Not an order.",end:1,quest:"date"},
    n1b:{sp:"Rosalind",tx:"I —! It is a PATROL that — ...oh, hang the patrol. (Red to the ear-tips, she surrendereth the honeycake.) ...Aye. A date. Breathe thou a word of it at the outpost and thou sparrest at dawn. ...Thank thee. For asking.",end:1,quest:"date"}
  }},
  date_yua:{start:"n0",starts:["n0","n0b","n0c"],img:"assets/img/portraits/yua.svg",nodes:{
    n0:{sp:"Belladonna",tx:"(She planned the route days ago — quiet wall, no patrols, thy favorite bread procured. It is logged: 'Evening. His. Mine.') Thou camest. ...I rehearsed eleven greetings and forgot them all at thy step. Walk with me. I shall guard the silence.",img:"assets/img/portraits/yua.svg",choices:[
      {t:"Take her hand. Say nothing. Just walk. (tender)",tone:"KIND",to:"n1a",do:{f:{date_with:"yua"}}},
      {t:"\"Log this too: best evening of my life.\" (warm)",tone:"BRAVE",to:"n1b",do:{f:{date_with:"yua"}}}
    ]},
    n0b:{sp:"Belladonna",tx:"(Market street. She parted the crowd with one look — vendors now gift thee apples 'for the knight's beloved.' She logged them.) ...They stare. Let them. Thou art safest where all can see how guarded thou art.",choices:[
      {t:"Take her hand. Say nothing. Just walk. (tender)",tone:"KIND",to:"n1a",do:{f:{date_with:"yua"}}},
      {t:"\"Log this too: best evening of my life.\" (warm)",tone:"BRAVE",to:"n1b",do:{f:{date_with:"yua"}}}
    ]},
    n0c:{sp:"Belladonna",tx:"(Training yard. She teacheth thee her parry — hands over thine, breath at thy ear.) ...Closer. Thus. ...Thy pulse quickeneth. Noted. ...Again.",choices:[
      {t:"Take her hand. Say nothing. Just walk. (tender)",tone:"KIND",to:"n1a",do:{f:{date_with:"yua"}}},
      {t:"\"Log this too: best evening of my life.\" (warm)",tone:"BRAVE",to:"n1b",do:{f:{date_with:"yua"}}}
    ]},
    n1a:{sp:"Belladonna",tx:"(Her hand trembleth once — then steadeth, warm.) ...Noted. 'Hand. His. Warm.' (A breath, nigh laughter.) Fear biteth less, thus. Tell me when it biteth thee, and I shall be wall, not blade. ...Evermore.",img:"assets/img/portraits/yua.svg",end:1,quest:"date"},
    n1b:{sp:"Belladonna",tx:"...'Best evening.' (She writeth it thrice, glowing.) Then I shall top it to-morrow. And ever after. That is my vow entire: outdo yesterday's joy. ...Mine. Thine. Ours.",img:"assets/img/portraits/yua.svg",end:1,quest:"date"}
  }},
  date_seraphina:{start:"n0",starts:["n0","n0b","n0c"],img:"assets/img/portraits/seraphina.svg",nodes:{
    n0:{sp:"Ruby",tx:"(Balcony. Sunrise. No crown — and a picnic she would execute any counselor for revealing.) Thou broughtest ME to MY balcony. Bold. ...The stone acheth less when thou pourest. Sit, little flame, and watch the realm gild itself for us.",img:"assets/img/portraits/seraphina.svg",choices:[
      {t:"Pour her tea first. Serve the princess. (gallant)",tone:"KIND",to:"n1a",do:{f:{date_with:"seraphina"}}},
      {t:"\"To Ruby — not Highness. Just her.\" (toast)",tone:"BRAVE",to:"n1b",do:{f:{date_with:"seraphina"}}}
    ]},
    n0b:{sp:"Ruby",tx:"(Ember garden. She dismissed the guard — 'the sky-fallen outranketh thee to-night.' Lanterns. Ashen roses that bloom only for royalty. And thee.) ...Walk. The roses approve. So do I.",choices:[
      {t:"Pour her tea first. Serve the princess. (gallant)",tone:"KIND",to:"n1a",do:{f:{date_with:"seraphina"}}},
      {t:"\"To Ruby — not Highness. Just her.\" (toast)",tone:"BRAVE",to:"n1b",do:{f:{date_with:"seraphina"}}}
    ]},
    n0c:{sp:"Ruby",tx:"(Her library. She readeth decrees aloud in her worst councilor voices till thou wept laughing.) ...Worthier than court, this. ...Read to ME now. Royal command. Gentle voice.",choices:[
      {t:"Pour her tea first. Serve the princess. (gallant)",tone:"KIND",to:"n1a",do:{f:{date_with:"seraphina"}}},
      {t:"\"To Ruby — not Highness. Just her.\" (toast)",tone:"BRAVE",to:"n1b",do:{f:{date_with:"seraphina"}}}
    ]},
    n1a:{sp:"Ruby",tx:"...Served. By a sky-fallen. (She drinketh slow, eyes bright.) None serveth ME — they serve the crown. Mark this morning, Rehevane: the first tea poured for Ruby. I shall demand it yearly. ...Please.",img:"assets/img/portraits/seraphina.svg",end:1,quest:"date"},
    n1b:{sp:"Ruby",tx:"...Just her. (The stone twingeth — then easeth, outshone.) A toast to Ruby it is. And to the thief who stole her sunrise and returneth it nightly. ...Again to-morrow. That is a royal command.",img:"assets/img/portraits/seraphina.svg",end:1,quest:"date"}
  }},
  date_mira:{start:"n0",starts:["n0","n0b","n0c"],img:"assets/img/portraits/mira.svg",nodes:{
    n0:{sp:"Nyx",tx:"(The plains at dusk. She challengeth thee to a hunt-race ere thou speakest — tail high, already running.) Catch me, sky-slow! Loser carrieth the winner! ...Why smilest thou? Run! (She is laughing already.)",img:"assets/img/portraits/mira.svg",choices:[
      {t:"Race her fair — win or lose, run together. (game)",tone:"BRAVE",to:"n1a",do:{f:{date_with:"mira"}}},
      {t:"Let her win the last stretch. (soft)",tone:"KIND",to:"n1b",do:{f:{date_with:"mira"}}}
    ]},
    n0b:{sp:"Nyx",tx:"(Riverbend. She fisheth with paws, teeth, and total commitment — and splasheth thee thoroughly.) ...Ha! Wet sky-strange! ...Sit. I shall share my catch. The burnt half is thine. Generosity.",choices:[
      {t:"Race her fair — win or lose, run together. (game)",tone:"BRAVE",to:"n1a",do:{f:{date_with:"mira"}}},
      {t:"Let her win the last stretch. (soft)",tone:"KIND",to:"n1b",do:{f:{date_with:"mira"}}}
    ]},
    n0c:{sp:"Nyx",tx:"(Her den. Stew of... uncertain provenance. She watcheth thee taste it, tail still.) ...Well?! ...Edible?! ...GOOD. Thou livest! Seconds?!",choices:[
      {t:"Race her fair — win or lose, run together. (game)",tone:"BRAVE",to:"n1a",do:{f:{date_with:"mira"}}},
      {t:"Let her win the last stretch. (soft)",tone:"KIND",to:"n1b",do:{f:{date_with:"mira"}}}
    ]},
    n1a:{sp:"Nyx",tx:"(Breathless, grass-stained, tail thunder.) ...A TIE, I declare it! (It was not a tie.) Meat, fire, stars — and thee, panting beside me. Best hunt ever. No leash. No orders. Only pack.",img:"assets/img/portraits/mira.svg",end:1,quest:"date"},
    n1b:{sp:"Nyx",tx:"...Thou slowed. I SAW it, sky-strange. (She bumpeth her brow to thine, gentle.) ...Thank thee. For letting the pup have her victory. Next time I shall earn it — and thou shalt carry ME.",img:"assets/img/portraits/mira.svg",end:1,quest:"date"}
  }},
  date_elowen:{start:"n0",starts:["n0","n0b","n0c"],nodes:{
    n0:{sp:"Minerva",tx:"(Tower. Tea. Two cups — the second dusty from years of solitude.) Thou... reservest an evening. For me. (She cleanseth the cup with needless care.) My research can document this after. ...Ask me aught. Or ask me naught. Company sufficeth.",choices:[
      {t:"\"Tell me about your research. I want to know.\" (curious)",tone:"CLEVER",to:"n1a",do:{f:{date_with:"elowen"}}},
      {t:"\"Close the book tonight. Just us.\" (tender)",tone:"KIND",to:"n1b",do:{f:{date_with:"elowen"}}}
    ]},
    n0b:{sp:"Minerva",tx:"(Bog edge. She catcheth fireflies in a jar 'for luminescence trials' — then openeth it, watching them rise with thee.) ...Data: beautiful. Control group: thy smile. ...Again.",choices:[
      {t:"\"Tell me about your research. I want to know.\" (curious)",tone:"CLEVER",to:"n1a",do:{f:{date_with:"elowen"}}},
      {t:"\"Close the book tonight. Just us.\" (tender)",tone:"KIND",to:"n1b",do:{f:{date_with:"elowen"}}}
    ]},
    n0c:{sp:"Minerva",tx:"(Tower roof. Star-charts, two blankets, one telescope fought over.) ...That one is the Lovers. I named it. Peer-rev— ...Look not at me. Look up. ...Stay.",choices:[
      {t:"\"Tell me about your research. I want to know.\" (curious)",tone:"CLEVER",to:"n1a",do:{f:{date_with:"elowen"}}},
      {t:"\"Close the book tonight. Just us.\" (tender)",tone:"KIND",to:"n1b",do:{f:{date_with:"elowen"}}}
    ]},
    n1a:{sp:"Minerva",tx:"...My thread-maps? Truly? (Candlelight. Ink. An hour gone like breath.) None ever ASKED. ...Hypothesis: thou art my favorite variable. (Ears red. Footnote: confirmed.)",end:1,quest:"date"},
    n1b:{sp:"Minerva",tx:"...Close it? The book can — ...aye. (She closeth it. Her hand findeth thine across the tea.) Unproductive. Unrecorded. ...Lovely. Lean a while. For science. And warmth.",end:1,quest:"date"}
  }},
  date_aria:{start:"n0",starts:["n0","n0b","n0c"],img:"assets/img/portraits/aria.svg",nodes:{
    n0:{sp:"Daisy",tx:"(Chapel hill. Picnic. Bells far below, and a saint with grass in her hair.) Thou stolest me from MY OWN altar! ...Best theft ever. Laugh with me, sky-boy — unpainted, ungraceful, LOUD. The pit cannot hear us up here.",img:"assets/img/portraits/aria.svg",choices:[
      {t:"Laugh with her until your sides hurt. (joy)",tone:"KIND",to:"n1a",do:{f:{date_with:"aria"}}},
      {t:"\"Bless you — no, let ME bless YOU for once.\" (sweet)",tone:"BRAVE",to:"n1b",do:{f:{date_with:"aria"}}}
    ]},
    n0b:{sp:"Daisy",tx:"(Bell tower, highest stair. She pointeth out ALL of Starlia and nameth every bell — including the off-key one, which is HERS.) ...Ring it with me! LOUDER! ...The pit cannot hear joy. Let us be deafening.",choices:[
      {t:"Laugh with her until your sides hurt. (joy)",tone:"KIND",to:"n1a",do:{f:{date_with:"aria"}}},
      {t:"\"Bless you — no, let ME bless YOU for once.\" (sweet)",tone:"BRAVE",to:"n1b",do:{f:{date_with:"aria"}}}
    ]},
    n0c:{sp:"Daisy",tx:"(Market. She buyeth two of everything — one for thee, one for 'just-a-girl me.' Sugar on thy nose.) ...There! Now thou matchest my grin. ...Sweetest evening. Objectively. I measured.",choices:[
      {t:"Laugh with her until your sides hurt. (joy)",tone:"KIND",to:"n1a",do:{f:{date_with:"aria"}}},
      {t:"\"Bless you — no, let ME bless YOU for once.\" (sweet)",tone:"BRAVE",to:"n1b",do:{f:{date_with:"aria"}}}
    ]},
    n1a:{sp:"Daisy",tx:"(She laugheth till she toppleth sideways into thee.) ...There! That one was REAL! Keep it — my unpainted laugh, gifted. One selfish evening, perfectly spent. Again to-morrow? ...Say aye.",img:"assets/img/portraits/aria.svg",end:1,quest:"date"},
    n1b:{sp:"Daisy",tx:"...Blessed. By thee. (Eyes shining, she presseth her brow to thine.) Then I bless thee back — doubled. May thy mornings be selfish and thy nights be warm. ...Thee. First. Always.",img:"assets/img/portraits/aria.svg",end:1,quest:"date"}
  }},
   /* Devotions — one-time vows (bond 20+ with trust/respect/loyalty 5+ each, R menu).
      Two gauges rise past the
      mortal cap of 8, unto 10. NPC archaic, Rin modern. */
  dev_liliane:{start:"n0",nodes:{
    n0:{sp:"Rosalind",tx:"(Thou kneelest with no blade drawn, and offerest thy mornings — all of them.) ...Rise. Rise, fool. (Her voice breaketh; the Oath-scar gloweth warm, not wounding.) Thou wouldst bind thy life to a captain the curse may claim? ...Then hear MY vow first.",choices:[
      {t:"\"Speak it. I'm listening. Always.\" (vow)",tone:"KIND",to:"n1a",do:{f:{devoted_liliane:1},rom:{liliane:{aff:2,close:2,devote:1}}}}
    ]},
    n1a:{sp:"Rosalind",tx:"...I vow thee patrols and scoldings, braids and battles, and a heart that stopped fearing its own beating the night thou took'st my hand. (The scar setteth as silver.) ...Evermore, sky-fallen. Dismissed — to my arms.",end:1}
  }},
  dev_yua:{start:"n0",img:"assets/img/portraits/yua.svg",nodes:{
    n0:{sp:"Belladonna",tx:"(Thou offerest thy mornings — all of them — and biddest her keep the halt-word evermore.) ...Mine. (Tears, shining, logged as 'joy, unprecedented.') Thou givest eternity to one raised as a moment's shield? ...Then take MY vow with it.",img:"assets/img/portraits/yua.svg",choices:[
      {t:"\"Yours. Mine. Ours. Speak it.\" (vow)",tone:"KIND",to:"n1a",do:{f:{devoted_yua:1},rom:{yua:{aff:2,close:2,devote:1}}}}
    ]},
    n1a:{sp:"Belladonna",tx:"...I vow thee vigilance without hunger, devotion without devouring: thy shield AND thy side, thy keeper AND thy kept. Bid me halt, and I shall — evermore, gladly. (She writeth it thrice, then closeth the book.) ...Complete.",img:"assets/img/portraits/yua.svg",end:1}
  }},
  dev_seraphina:{start:"n0",img:"assets/img/portraits/seraphina.svg",nodes:{
    n0:{sp:"Ruby",tx:"(Thou offerest thy mornings — all of them — ere the whole court.) Scandal! ...Lovely scandal. (She standeth, crownless by choice, and taketh thy hands.) Thou wouldst wed the stone-heart itself? ...Then hear a Princess vow as a woman.",img:"assets/img/portraits/seraphina.svg",choices:[
      {t:"\"Crownless suits you. Speak.\" (vow)",tone:"KIND",to:"n1a",do:{f:{devoted_seraphina:1},rom:{seraphina:{aff:2,close:2,devote:1}}}}
    ]},
    n1a:{sp:"Ruby",tx:"...I vow thee sunrises uncounted, a throne shared, and a heart that beateth for one — not for duty, but for THEE. (The stone thinneth to a scar of gold.) ...WE are pleased. Evermore.",img:"assets/img/portraits/seraphina.svg",end:1}
  }},
  dev_mira:{start:"n0",img:"assets/img/portraits/mira.svg",nodes:{
    n0:{sp:"Nyx",tx:"(Thou offerest thy mornings — all of them — and askest nothing, no leash, no orders.) ...Idiot. ...MY idiot. (Tail: total system failure. She tackleth thee into the grass.) Thou joinest MY pack entire? ...Then hear the pack-vow.",img:"assets/img/portraits/mira.svg",choices:[
      {t:"\"Your pack is my pack. Always.\" (vow)",tone:"KIND",to:"n1a",do:{f:{devoted_mira:1},rom:{mira:{aff:2,close:2,devote:1}}}}
    ]},
    n1a:{sp:"Nyx",tx:"...I vow thee hunts and hearths, teeth bared FOR thee never AT thee, and a den with thy name howled into its posts. (She biteth thy sleeve gently: marked.) ...Pack. Evermore. ...Mine.",img:"assets/img/portraits/mira.svg",end:1}
  }},
  dev_elowen:{start:"n0",nodes:{
    n0:{sp:"Minerva",tx:"(Thou offerest thy mornings — all of them — and askest only to be leaned upon.) ...Statistically improbable. ...Wonderful. (Glasses fog. The tower itself seemeth to lean.) Thou wouldst bind thy life to a footnote? ...Then record MY vow.",choices:[
      {t:"\"Hypothesis accepted. Speak.\" (vow)",tone:"KIND",to:"n1a",do:{f:{devoted_elowen:1},rom:{elowen:{aff:2,close:2,devote:1}}}}
    ]},
    n1a:{sp:"Minerva",tx:"...I vow thee margins full of thee, tea ever warm, and a scholar who leaneth first now, not last. (She writeth it large, unfootnoted.) ...Evermore. For further study. Permanent study.",end:1}
  }},
  dev_aria:{start:"n0",img:"assets/img/portraits/aria.svg",nodes:{
    n0:{sp:"Daisy",tx:"(Thou offerest thy mornings — all of them — and askest only her unpainted laugh.) ...ME?! Just-a-girl me, for evermore?! (Sunshine, weaponized; bells ring unasked.) Thou wouldst marry the morning itself? ...Then hear a Saint vow as a girl.",img:"assets/img/portraits/aria.svg",choices:[
      {t:"\"Laugh us into evermore.\" (vow)",tone:"KIND",to:"n1a",do:{f:{devoted_aria:1},rom:{aria:{aff:2,close:2,devote:1}}}}
    ]},
    n1a:{sp:"Daisy",tx:"...I vow thee joy as curriculum, blessings doubled, and mornings selfish and golden, evermore. (She laugheth through it — ungraceful, perfect.) ...Bless US. ...Evermore.",img:"assets/img/portraits/aria.svg",end:1}
  }},
   /* LYRA — the bound-heart (Hidden Grotto, Act I). A spirit born promised to
      the sky-fallen, sealed 300 years in the wall. Bindings fall to three
      truths; the last seal breaketh only to a freely-given princess kiss. */
  lyra_intro:{start:"n0",nodes:{
    n0:{sp:"Rin",tx:"(The water parted — and my breath stopped. She's sealed to the wall. Not chained: sealed. Three rings of pale light through her wrists, her waist — like jewelry that hurts. Silver hair to the floor. A red dress fit for a burned-down court. Roses carved in the stone all around her. And she's... breathing. Asleep.)",next:"n1"},
    n1:{sp:"Rin",tx:"(Writing covers the wall, old words, and I can almost read them — 'Here sleepeth the heart that was promised: three hundred years, three bindings.' ...Three hundred years? Alone? In the dark? ...My chest hurts. Why does my chest hurt?)",choices:[
      {t:"(Check her breathing — gently.)",tone:"KIND",to:"n2a",do:{f:{met_lyra:1},rom:{lyra:{aff:1,trust:1}}}},
      {t:"(Don't touch. Read everything first.)",tone:"CLEVER",to:"n2b",do:{f:{met_lyra:1},rom:{lyra:{respect:1,trust:1}}}},
      {t:"(...She's beautiful. Focus, Rin.)",tone:"SERIOUS",to:"n2c",do:{f:{met_lyra:1},rom:{lyra:{aff:2}}}}
    ]},
    n2a:{sp:"Rin",tx:"(Warm. Breathing — slow as winter honey. Dust three centuries deep on her sleeves, and she still smells like roses. ...What is wrong with me? Focus. The wall. Read the wall.)",next:"n3"},
    n2b:{sp:"Rin",tx:"(Rule one of strange caves: read the warnings before touching the sleeping sealed girl. Smart. ...So why am I disappointed?)",next:"n3"},
    n2c:{sp:"Rin",tx:"(Okay. Noted. Gorgeous. Unfairly, stupidly gorgeous. ...And sealed to a wall, Rin. Priorities.)",next:"n3"},
    n3:{sp:"Rin",tx:"(Worked out line by line, by lantern-light: 'Three bindings chain her. Three truths unchain. Yet unbound, she sleepeth still — for the last seal is no lock of iron. The sleeper wakeneth only to a freely-given princess kiss from the promised heart.' Lower, half-drowned: '...vnder ful mone, ye waters parte, betwixt xii and i...' ...'Under full moon, the waters part, between twelve and one.' ...The wall hath a SCHEDULE? ...And it wanteth me to KISS her? I have never even held hands!)",choices:[
      {t:"\"...First the bindings. Three truths. Then... the kiss part.\" (breathe)",tone:"BRAVE",to:"n4a",do:{rom:{lyra:{trust:1}}}},
      {t:"\"Nope. No way. ...Three hundred years, though.\" (flustered)",tone:"SARCASTIC",to:"n4b",do:{rom:{lyra:{aff:1}}}}
    ]},
    n4a:{sp:"Rin",tx:"(Me. The promised heart. I fell out of the sky days ago and the wall claims I was promised three centuries back. ...Fine. Truths first. The kiss part — we'll get to the kiss part. She deserves someone steadier. She'll have to settle for me.)",end:1,quest:"archive_start"},
    n4b:{sp:"Rin",tx:"(This is insane. A fairy tale with extra steps. ...But three hundred years alone in the dark, and I'd be the first face she sees? ...No pressure, Rin. None at all. Truths first. Kiss — ...later. Maybe. Probably. Oh no.)",end:1,quest:"archive_start"}
  }},
  lyra_seals:{start:"s0",nodes:{
    s0:{sp:"Wall-script",tx:"'HARKEN, PROMISED HEART. FIRST BINDING: WHEN THE FIRST OFF-WORLDER KNELT IN ASH, HOLDING NAUGHT — WHAT DID HE BEG OF THE WORLD?'",choices:[
      {t:"\"That no one ever leave him.\" (steady)",tone:"SERIOUS",to:"s1",do:{f:{seal1:1},rom:{lyra:{trust:1,aff:1}}}},
      {t:"\"Power over the dragon peaks.\" (guess)",tone:"CLEVER",to:"s0h"},
      {t:"\"A road back to Earth.\" (guess)",tone:"KIND",to:"s0h"}
    ]},
    s0h:{sp:"Rin",tx:"(Power? No. The hermit's pages said grief, not greed — he begged the world to end goodbye. 'Make it that none leave me.' Think, Rin. Say it true.)",next:"s0"},
    s1:{sp:"Wall-script",tx:"'THE FIRST BINDING LOOSENETH. SECOND: THE WISH WAS GRANTED AMISS, AND AUGHT WAS BORN OF IT. WHAT DOTH THE HEART DEVOURER KEEP?'",choices:[
      {t:"\"Love that would not end.\" (steady)",tone:"SERIOUS",to:"s2",do:{f:{seal2:1},rom:{lyra:{trust:1,close:1}}}},
      {t:"\"Gold and thrones.\" (guess)",tone:"SARCASTIC",to:"s1h"},
      {t:"\"The bones of heroes.\" (guess)",tone:"BRAVE",to:"s1h"}
    ]},
    s1h:{sp:"Rin",tx:"(Gold? No. Bones? No. ...Chains. Brands. Stone. Oaths. It keeps love that will not end. Corv said it. The pages say it. I say it.)",next:"s1"},
    s2:{sp:"Wall-script",tx:"'THE SECOND LOOSENETH. LAST: THE ARCHIVE ASKETH NOT FOR SORROW, BUT FOR HOPE. WHAT UNBINDETH SUCH A KEEPING?'",choices:[
      {t:"\"Farewell, freely chosen — choosing, every morning.\" (vow)",tone:"BRAVE",to:"s3",do:{f:{seal3:1},rom:{lyra:{aff:2,trust:1,close:1}}}},
      {t:"\"A sharper sword.\" (guess)",tone:"AGGRESSIVE",to:"s2h"},
      {t:"\"Forgetting the dead.\" (guess)",tone:"CLEVER",to:"s2h"}
    ]},
    s2h:{sp:"Rin",tx:"(A sword never unbound anything. Forgetting is just leaving by another name. ...No: love is not keeping. It is choosing, and freeing. Say it like thou meanest it — she deserves true answers.)",next:"s2"},
    s3:{sp:"Rin",tx:"(The rings dim. The light-bindings fall like cut thread — and she slumps forward. I catch her. She's warm. Real. Still asleep. ...Okay. The kiss part. The wall was very specific. A princess kiss. Freely given. My whole face is on fire.)",next:"s4"},
    s4:{sp:"Rin",tx:"(I've never done this. Never. Not even close. And the first time is — her? Three hundred years she waited in the dark. For me. ...Hey. Lyra. If thou canst hear me in there — I don't know if this is right. But I swear I'll take responsibility for it. Every morning of it.)",choices:[
      {t:"\"...Thou wert worth every year.\" (kiss her)",tone:"KIND",to:"s5",do:{rom:{lyra:{aff:2,close:2}}}},
      {t:"\"...Please don't wake mid — ...too late, going in.\" (kiss her)",tone:"SARCASTIC",to:"s5",do:{rom:{lyra:{aff:1,close:2}}}}
    ]},
    s5:{sp:"Lyra",tx:"(Light. Silver and red and morning. ...Her eyes open — red as roses, wet at once.) ...Thou camest. (Her hands find thy face like thou art the dream.) Three hundred years I dreamed thee, promised heart — thy fall, thy name, thy mouth. The Stag chained me here, lest I guide thee; its master feared a bound-heart. Every morning I said aye to thee, asleep. ...Didst thou mean it? The kiss — say thou meant it.",img:"assets/img/portraits/lyra.svg",choices:[
      {t:"\"Every word. Every heartbeat.\" (hold her)",tone:"KIND",to:"s6",do:{rom:{lyra:{aff:2,trust:2,close:1}}}},
      {t:"\"...Aye. (Trying not to combust.)\"",tone:"BRAVE",to:"s6",do:{rom:{lyra:{aff:1,trust:1,close:2}}}}
    ]},
    s6:{sp:"Lyra",tx:"(She presseth her brow to thine — and light poureth. Her body lighteneth, looseth, becometh dawn through thy ribs.) No more wall. No more sleep. I was born thy bound-heart; now I am thine, within — thy second heartbeat. (A smaller flame kindleth beside thee — teal, steady-eyed.) And this is Aegis, my seal-warden. She serveth thee too now. ...Soulbound. ...Strike with my bloom [F] when thou art pressed. I shall feel it with thee.",img:"assets/img/portraits/lyra.svg",next:"s7"},
    s7:{sp:"Aegis",tx:"(The teal flame boweth.) Warden transferred. I offer: richer learning (+25% XP), richer spoils (+50%), a deeper mana well, quarter-ward on wounds — and counsel [T]: half thy flesh, full mana, eight heartbeats of shield, all poisons cleansed, and six heartbeats of ward-fire that seeketh thy foes unbidden. ...Notice: thy keeper trembleth within thee. Reassure her. That, too, is counsel.",img:"assets/img/portraits/aegis.svg",end:1,quest:"archive_done"}
  }},
  rival_lyra:{start:"n0",img:"assets/img/portraits/lyra.svg",nodes:{
    n0:{sp:"Lyra",tx:"(She findeth thee with her tablet full of tallies — thy evenings, counted in tiny script.) Th-thy smiles... distribute unevenly of late. (She hideth behind the lantern.) I — I counted! For the archive! ...May I... file a claim? For one evening?",img:"assets/img/portraits/lyra.svg",choices:[
      {t:"\"Claim granted, Keeper. Tonight, just us.\" (tender)",tone:"KIND",to:"n1a",do:{f:{rival_with:"lyra"},rom:{lyra:{aff:2,close:2,jeal:-99}}}},
      {t:"\"Show me the tallies. Then we'll even them.\" (steady)",tone:"CLEVER",to:"n1b",do:{f:{rival_with:"lyra"},rom:{lyra:{trust:2,aff:1,jeal:-99}}}}
    ]},
    n1a:{sp:"Lyra",tx:"...Granted! (She stampeth the tablet with great ceremony, ears scarlet.) One evening, filed under MINE. ...The archive shall record it as a major acquisition.",img:"assets/img/portraits/lyra.svg",end:1,quest:"rival"},
    n1b:{sp:"Lyra",tx:"...Here. See? (Shaky tallies, then thy hand over hers, steadying.) ...Evened. (A whisper:) Thank thee for — for being countable. And kind.",img:"assets/img/portraits/lyra.svg",end:1,quest:"rival"}
  }},
  date_lyra:{start:"n0",starts:["n0","n0b","n0c"],img:"assets/img/portraits/lyra.svg",nodes:{
    n0:{sp:"Lyra",tx:"(Grotto, lantern-lit. She hath shelved the drowned books by COLOR, for the occasion, and reheated tea twice.) Thou — thou camest. To the wet archive. For me. (She wringeth her gloves.) ...Shall I read to thee? Or — or read ME? Either is — ...permitted.",img:"assets/img/portraits/lyra.svg",choices:[
      {t:"\"Read to me. I like your voice.\" (soft)",tone:"KIND",to:"n1a",do:{f:{date_with:"lyra"}}},
      {t:"\"No books tonight. Just lanterns. Just us.\" (bold)",tone:"BRAVE",to:"n1b",do:{f:{date_with:"lyra"}}}
    ]},
    n0b:{sp:"Lyra",tx:"(Outpost, archive corner by the Elder Hall. She hath built a nest of cushions betwixt the shelves and smuggled honeycakes.) I — I requisitioned these. For research. The research is... thee. (Ears scarlet.) Sit?",choices:[
      {t:"\"Read to me. I like your voice.\" (soft)",tone:"KIND",to:"n1a",do:{f:{date_with:"lyra"}}},
      {t:"\"No books tonight. Just lanterns. Just us.\" (bold)",tone:"BRAVE",to:"n1b",do:{f:{date_with:"lyra"}}}
    ]},
    n0c:{sp:"Lyra",tx:"(Behind the falls, at dusk. Water-light on her cheeks; Aegis hovering attendance with great dignity.) Three years I kept this place alone. To-night it keepeth US. (She offereth half her cloak.) ...Share? It is — ...protocol.",choices:[
      {t:"\"Read to me. I like your voice.\" (soft)",tone:"KIND",to:"n1a",do:{f:{date_with:"lyra"}}},
      {t:"\"No books tonight. Just lanterns. Just us.\" (bold)",tone:"BRAVE",to:"n1b",do:{f:{date_with:"lyra"}}}
    ]},
    n1a:{sp:"Lyra",tx:"(She readeth — grandmother's margin-notes first, voice shaking, then steadying, then warm.) ...And so the keeper waited, and the water parted. (A pause.) That part is — ...newly true. (She leaneth, lightly, against thy shoulder.) ...Filed. Under MINE.",img:"assets/img/portraits/lyra.svg",end:1,quest:"date"},
    n1b:{sp:"Lyra",tx:"...No books. (She setteth them aside — an archivist's sacrifice, duly noted in the log.) Lanterns. Water. Thee. (Her hand findeth thine in the water-light.) ...Unproductive. Unrecorded. ...Lovely. Aegis: log nothing. Aegis: ...logged it anyway.",img:"assets/img/portraits/lyra.svg",end:1,quest:"date"}
  }},
  dev_lyra:{start:"n0",img:"assets/img/portraits/lyra.svg",nodes:{
    n0:{sp:"Lyra",tx:"(Thou offerest thy mornings — all of them — and askest only to be read to.) ...Me? The damp keeper? (Lantern shaking; Aegis hovering solemnly.) Thou wouldst bind thy life to a footnote no one ever — ...Then hear MY vow. I have rehearsed it. Thrice.",img:"assets/img/portraits/lyra.svg",choices:[
      {t:"\"Rehearsed is perfect. Speak.\" (vow)",tone:"KIND",to:"n1a",do:{f:{devoted_lyra:1},rom:{lyra:{aff:2,close:2,devote:1}}}}
    ]},
    n1a:{sp:"Lyra",tx:"...I vow thee every margin, every lantern, every morning read-aloud — and a keeper who hideth no longer. (She setteth the lantern betwixt thy hands: kept.) ...Evermore. Filed. Under OURS. (Aegis: ...approved. Warmly. — and lo, her counsel shall return swifter henceforth: thirty heartbeats.)",img:"assets/img/portraits/lyra.svg",end:1}
  }}
};
RHE.CODEX_LORE = [
  ["The Continent — Vaeltheria","Six known regions: the Greenwood heartland, the Ashen Spires (dragonkin), Verdant Plains (demi-humans), Mistveil Marsh (witches), Silverwall Kingdom (humans), and the Forbidden Scar where the First Off-worlder's wish tore the sky. All six are traversable, Acts I–III."],
["Rehevane — the sky-fallen hero","Black hair, navy gold-trim coat, sword at the hip. Kuudere with a light himedere edge: calm, composed, slightly distant, but a natural leader — deeply loyal once you're in his circle. Named for the grand fortress on the high cliff, keeper of the light: thou art where the realms are safe — magic and stone, become one."],
 ["The Heart Devourer","Born when an Earth man begged the world to end goodbye. Love that refuses loss becomes chain, brand, stone, oath. Corruption nodes are its scar tissue. Rehevane's immunity to fragments makes him the 'Heart-Bearer'."],
 ["Factions (Act I & beyond)","See journal → Factions. Every power wants Rehevane: wardens as leash, Silverwall as weapon, the Devourer as heir."],
  ["Romance — how it works","No affection vending machine. Hidden axes: affection, trust, respect, jealousy, loyalty, closeness — each capped at 8 (a one-time Vow needs bond 20+ with trust, respect and loyalty 5+ each, and opens 10). Grand favor (+2 affection at once: gifts, dates, big scenes) for one girl gives +1 jealousy to every other girl who already cares — +2 to Belladonna. Small talk never stings. Dates give RANDOM favor across all five axes, shown openly. At 3+ jealousy (Belladonna 2+) a heroine will compete for thee when thou speakest with her. Soothe with dates, rivalry, and quiet days (−1 all). All adult, non-explicit, story-first."],
   ["Main cast — character.png lineup","Rehevane (black hair, navy gold-trim coat, sword) and the six heroines as drawn, each name carrying its meaning: Rosalind the pink-haired tsundere captain ('pretty rose', red cape, black bow) — dark past; Minerva the silver kuudere scholar (wisdom, glasses, blue robe, book) — quiet wholesome past; Belladonna the dark-haired devoted knight ('beautiful lady', purple flower, violet-black gown) — dark past; Daisy the blonde deredere sunshine ('day's eye', blue-white dress) — wholesome past; Ruby the crowned himedere ('red fire-gem', white-red fur gown, horns) — wholesome past; Nyx the dark-violet kuudere edge (night, wolf ears, black-red coat) — cute past with a dark edge. Portraits are original illustrations of these designs; no image files appear in-game."],
   ["Lyra — the bound-heart","A spirit born promised to the sky-fallen, sealed 300 years in the grotto wall by the Thorned Stag's grief-magic — her spirit locked within her own sleeping flesh, lest any thread-seer wake her. Three bindings fell to three truths; the last seal broke to a freely-given princess kiss. Now she dwelleth within Rehevane's chest as his second heartbeat — guiding, teasing, loving aloud, and stepping out in miniature whensoever he idlest (she seeth the one beyond the glass). Her Soulbloom [F]: 30 to all foes, all cooldowns washed clean, forty heartbeats of surge. Full moon, midnight to one, openeth her falls; the Stag's death sealeth them forever. Bonus thread: gifts, talk, dates and a vow are all hers — though fate's Decree still counteth only the six."],
   ["Aegis — the bound guardian","Not a spell but a spirit: Aegis (Greek, 'shield-ward') is a warden-light bound in the drowned archive ages ago to counsel thread-seers. Passive: +25% XP, +50% spoils, deep mana (8/s), quarter-ward on all wounds. Active [T]: half flesh, full mana, 8-heartbeat shield, full cleanse, plus a 6-heartbeat auto-volley at thy nearest foe (45 heartbeats — 30 once Lyra is vowed). She seeth thy bonds too — Lyra readeth her best. Mark her: the teal flame hovering at thy shoulder."]
];
