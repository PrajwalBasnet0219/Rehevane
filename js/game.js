/* game.js — REHEVANE vertical slice: player, NPCs, combat, quests, dialogue,
   romance, factions, day/night, save/load, UI, main loop. Plain script (global RHE). */
var RHE = window.RHE || {};
(function(){
"use strict";
var TILE=RHE.TILE, MAPS=RHE.buildMaps();
var cv=document.getElementById("game"), ctx=cv.getContext("2d");
var mm=document.getElementById("minimap"), mmc=mm.getContext("2d");
RHE.Input.init();

/* ---------- STATE ---------- */
function freshState(cls){
  var c=RHE.CLASSES[cls];
  return {cls:cls, name:"Rin", map:"outpost", x:20.5, y:11, dir:"down",
    hp:c.hp, maxhp:c.hp, mp:c.mp, maxmp:c.mp, lvl:1, xp:0, xpn:60, gold:40,
    atk:c.atk, def:c.def, mag:c.mag, spd:c.spd,
    stam:100, maxstam:100,
    inv:{potion:2,bread:1}, equip:{weapon:null,armor:null,trinket:null},
    flags:{}, rep:{greenwood:0,silverwall:0},
    quests:{}, // id -> {stage, done}
    kill:{wolf:0,beast:0,bandit:0,assassin:0},
     rom:{liliane:{aff:0,trust:0,respect:0,jeal:0,loyal:0,close:0},
          yua:{aff:0,trust:0,respect:0,jeal:0,loyal:0,close:0},
          seraphina:{aff:0,trust:0,respect:0,jeal:0,loyal:0,close:0},
          mira:{aff:0,trust:0,respect:0,jeal:0,loyal:0,close:0},
          elowen:{aff:0,trust:0,respect:0,jeal:0,loyal:0,close:0},
          aria:{aff:0,trust:0,respect:0,jeal:0,loyal:0,close:0},
          lyra:{aff:0,trust:0,respect:0,jeal:0,loyal:0,close:0}},
    pages:0, visited:{outpost:1}, time:9.5, day:1, metYua:false, bossDead:false, started:true};
}
var S=null; // state
var player={moving:false,idleT:0,lyraOut:false,lyraChatT:0,atkCd:0,skillCd:0,aegisCd:0,aegisFire:0,aegisTick:0,lyraCd:0,soulsurge:0,lyraSoulT:0,hurt:0,swing:0,poison:0,burn:0,shield:0};
var npcs=[], enemies=[], shots=[], parts=[], loots=[], floaters=[], allies=[];
var cam={x:0,y:0}, hoverNpc=null, inCombatT=0, dead=0;

/* ---------- SAVE ---------- */
/* Manual slots 1-2 are the player's alone. Slot 0 is the silent auto-scroll:
   checkpoints seal it without a word, and never touch 1-2. */
function irlStamp(){var d=new Date(),p=function(n){return (n<10?"0":"")+n;};
  var mo=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return p(d.getDate())+" "+mo[d.getMonth()]+" "+p(d.getHours())+":"+p(d.getMinutes());}
function slotTime(n){try{return localStorage.getItem("rehevane_"+n+"_time")||"";}catch(e){return "";}}
function save(slot,quiet){ try{slot=(slot===undefined||slot===null)?1:slot;localStorage.setItem("rehevane_"+slot,JSON.stringify(S));
  try{localStorage.setItem("rehevane_"+slot+"_time",irlStamp());}catch(e){}
  if(!quiet)toast("Saved in Slot "+slot+" — "+irlStamp()+".");}catch(e){if(!quiet)toast("Save failed.");} }
function load(slot){ try{slot=(slot===undefined||slot===null)?1:slot;var d=localStorage.getItem("rehevane_"+slot); if(!d)return false;
  S=JSON.parse(d);
  // save compat: older saves predate Lyra/Aegis — graft defaults, never wipe
  S.flags=S.flags||{}; S.rom=S.rom||{}; S.rep=S.rep||{greenwood:0,silverwall:0};
  if(!S.rom.lyra)S.rom.lyra={aff:0,trust:0,respect:0,jeal:0,loyal:0,close:0};
  enterMap(S.map,S.x,S.y,true); refreshQuests(); return true;}catch(e){return false;} }
RHE.save=save; RHE.load=load;

/* ---------- HELPERS ---------- */
function $(id){return document.getElementById(id);}
function toast(t,ms){var st=$("toast-stack");var d=document.createElement("div");d.className="toast";d.textContent=t;st.appendChild(d);
  try{addLog(logKindFor(t),t);}catch(e){}
  d._born=Date.now();d._t=setTimeout(function(){d.remove();},ms||5000); while(st.children.length>4)st.firstChild.remove();}
function bigToast(t){var e=$("toast");e.textContent=t;e.classList.remove("hidden");clearTimeout(e._t);e._t=setTimeout(function(){e.classList.add("hidden");},4000);try{addLog("fate",t);}catch(e){}}
/* ---------- SESSION CHRONICLE ---------- */
// Memory only — never saved. Refresh or reopen clears it. Dialogue spoken,
// barks, quest-marks and fates, as they happened.
var sessionLog=[];
function logKindFor(t){
  if(/^(Quest accepted|Quest complete|Quest sealed|◎ Discovered)/.test(t))return "quest";
  if(/^(Lyra|Aegis|Rosalind|Belladonna|Ruby|Nyx|Minerva|Daisy|Elder|Fen|Odo|Hilda|Marta|Corv)/.test(t))return "say";
  if(/: "/.test(t))return "say";
  return "note";
}
function addLog(kind,text){
  if(!text)return;
  var when="";try{when=S?hourStr():"";}catch(e){when="";}
  sessionLog.push({kind:kind,text:String(text).slice(0,220),when:when});
  while(sessionLog.length>80)sessionLog.shift();
}
function escLog(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;");}
function heart(n){var s="";for(var i=0;i<5;i++)s+= i<n?"♥":"♡";return s;}
function hasQuest(id){return S.quests[id];}
function giveQuest(id){if(S.quests[id])return;S.quests[id]={stage:0,done:false};RHE.Audio.chime();toast("Quest accepted: "+RHE.QUESTS[id].name);refreshQuests();}
function doneQuest(id){if(!S.quests[id])S.quests[id]={stage:99,done:true};else{S.quests[id].done=true;S.quests[id].stage=99;}
  RHE.Audio.chime();toast("Quest complete: "+RHE.QUESTS[id].name+" (+40g)");S.gold+=40;refreshQuests();}
function failQuest(id){if(!RHE.QUESTS[id]||!S.quests[id]||S.quests[id].done||S.quests[id].failed)return;
  S.quests[id].failed=true;toast("Quest sealed forever: "+RHE.QUESTS[id].name);refreshQuests();}
function addRom(who,d){if(!S.rom[who])return;
  if(who==="lyra")return; // locked heart, locked house: no drama ever toucheth her
  Object.keys(d).forEach(function(k){S.rom[who][k]=(S.rom[who][k]||0)+d[k];});
  if(S.rom[who].jeal<0)S.rom[who].jeal=0; // jealousy never sinks below naught
  // hearts have limits: favor caps at 8 per axis — only a spoken Devotion (devote:1) openeth 9 and 10.
  var bcap=d.devote?10:8;
  ["aff","trust","respect","loyal","close"].forEach(function(k){if(S.rom[who][k]>bcap)S.rom[who][k]=bcap;});
  // anime rivalry: GRAND favor (affection +2 or more) for one stings the rest
  // who already care — small talk is maintenance and stings none.
  // Belladonna, being Belladonna, feels everything twice.
  var shown=(d.aff||0);
  if(shown>=2){Object.keys(S.rom).forEach(function(o){
    if(o===who||o==="lyra"||!metHeroine(o))return; // locked heart: hers never wavers
    var v=S.rom[o];if((v.aff||0)+(v.close||0)<=0)return;
    var cap=(o==="yua"?6:4); // Belladonna burneth hottest, but all hearts have limits
    v.jeal=Math.min(cap,(v.jeal||0)+(o==="yua"?2:1));});} }
/* A jealous heroine acts: at 3+ (Belladonna at 2+) she competes for thee on talk. */
function rivalReady(id){
  if(id==="lyra")return false; // deredere devotion: she schemeth no contests
  if(!metHeroine(id)||!S.rom[id])return false;
  return (S.rom[id].jeal||0)>=((id==="yua")?2:3);
}
function addItem(id,n){S.inv[id]=(S.inv[id]||0)+(n||1);var nm=(RHE.ITEMS[id]||{}).name||id;toast("Got: "+nm+(n>1?" ×"+n:""));}
function gainXP(n){var m=1;if(S.equip.trinket==="ring1")m=1.15;if(S.flags.aegis)m*=1.25; // Aegis ward: rich learning (+25% XP)
  n=Math.round(n*m);S.xp+=n;floatText("+"+n+" XP","#ffe27a");
  while(S.xp>=S.xpn){S.xp-=S.xpn;S.lvl++;S.xpn=Math.round(S.xpn*1.5);S.maxhp+=12;S.hp=S.maxhp;S.maxmp+=6;S.mp=S.maxmp;
    S.atk+=2;S.def+=1;S.mag+=2;bigToast("Level "+S.lvl+"! HP restored. The threads tighten.");RHE.Audio.chime();
    if(S.flags.soulbound){var _sli=(Math.random()*LYRA_SOUL_LVL.length)|0;
    toast("Lyra (within): \""+LYRA_SOUL_LVL[_sli]+"\"",5000);girlVoice("lyra","soul_lvl",_sli);}} }
function floatText(t,c){floaters.push({x:S.x,y:S.y-0.6,t:t,c:c||"#fff",life:1.4});}
function isNight(){return S.time<6||S.time>=20;}
/* The moon rule: full on day 3 (some two days after the fall), then every 8.
   The falls part only betwixt midnight and one of a full moon — one hour. */
function isFullMoon(){return S&&((S.day%8)===3);}
function moonPassageOpen(){
  if(!S)return false;
  if(S.flags.soulbound)return true; // the kiss unsealed it ever after
  if(S.flags.passage_sealed||S.bossDead)return false; // the Stag's death sealed it
  return isFullMoon()&&S.time>=0&&S.time<1;
}
function hourStr(){var h=Math.floor(S.time),m=Math.floor((S.time-h)*60);return "Day "+S.day+" "+(h<10?"0":"")+h+":"+(m<10?"0":"")+m;}

/* ---------- MAPS / ENTITIES ---------- */
function tileAt(map,x,y){var M=MAPS[map];x|=0;y|=0;if(x<0||y<0||x>=M.w||y>=M.h)return 7;
  return M.tiles[y][x];}
function solidAt(map,x,y){var t=tileAt(map,x,y);return t===5||t===6||t===7||t===3||t===4;}
function enterMap(map,x,y,quiet){
  var firstVisit=!(S.visited&&S.visited[map]);
  S.map=map;S.x=x;S.y=y;S.visited=S.visited||{};S.visited[map]=1; // GTA fog-of-war reveal
  S.arrive={x:x,y:y}; // arrival guard: exits ignore you until you step away
  allies.forEach(function(a,i){if(!a.dead){a.x=x+(i-0.5)*0.8;a.y=y+1;}}); // knights follow through doors
  enemies=[];shots=[];loots=[];npcs=[];
  spawnNpcs();spawnEnemies();
  if(!quiet){fade();}
  RHE.Audio.playBGM(RHE.Audio.BGM[MAPS[map].bgm]||RHE.Audio.BGM.title);
  $("loc-text").textContent=MAPS[map].label;
  // GTA-style area banner + discovery (loud entries only — quiet
  // reloads/restores must not re-announce every few seconds)
  if(!quiet)showLocBanner(MAPS[map].label, firstVisit);
  refreshQuests();
  // story triggers fire on real arrivals (not quiet respawns) — incl. debug warps
  if(!quiet){ try{checkStoryExits();}catch(e){} }
  // Lyra, archive voice: census + appraisal on real arrivals (quiet reloads stay silent)
  if(!quiet&&S.flags.soulbound){ try{lyraCensus();}catch(e){} }
}
/* Lyra's travelling commentary — 2-3 lines for every interactive thing, once
   she dwelleth within thee. Bark-path talks, prop reads and special pickups
   each draw one; dialogue scenes and shop panels stay hers-free (no overlap),
   and each key resteth 20 heartbeats betwixt remarks (no machine-gun wife). */
var LYRA_REMARKS={
 "npc:liliane":["Rosalind scoldeth because she careth — filed under TSUNDERE, cross-referenced OATH. ...Love her gently, husband.","The Captain watcheth thee the way I dreamed thee. ...Be worthy of both of us. (Thou art.)","Her Oath would stop her heart for thee. ...Then keep her laughing, that it never must."],
 "npc:elder":["The Elder counteth rings the way I count heartbeats. ...Listen well; old roots remember.","He feareth what thou art. ...Show him a keeper, husband — not a hound."],
 "npc:mira_scout":["Fen bleeds and jests both. ...Carry him home in thy heart, as I carry thee.","A scout's wounds are maps. ...Read him kindly, husband."],
 "npc:merchant":["Odo's prices are robbery with a smile. ...Smile back — then haggle like a villain.","Shiny things! ...Buy me nothing; thy smile is gift enough. (It is filed. Under LAW.)"],
 "npc:smith":["Hilda's hammer singeth true. ...A blade kept is a vow kept — keep both.","Mind the sparks, husband. ...Thou art flammable to me already."],
 "npc:innkeep":["Marta's stew hath ended more wars than thy sword. ...Eat. That is a wife's order. ...A request.","A clean bed, a hot meal. ...Rest when thou canst — I keep the heartbeat either way."],
 "npc:hermit":["Corv hideth from the world in books. ...I hid in a wall. ...We understand each other.","He knoweth grief's shape. ...Be gentle with hermits, husband — some bite."],
 "npc:yua":["Belladonna loggeth thy heartbeats as I do. ...Hers thrice. Mine evermore. ...Share nicely.","She would shield thee with her body. ...I would shield thee with my soul. ...We agree: thou art shielded."],
 "npc:seraphina":["Ruby never got to be just Ruby. ...Give her sunrises, husband — crownless ones.","Stone cracketh where love Getteth in. ...Be her crack, my love. (Architecturally.)"],
 "npc:mira":["Nyx testeth to see if thou holdest ground. ...Hold it. Then share thy meat. (Pack law.)","Tail thunder meaneth joy. ...I checked. Twice. ...Thump back at her sometime."],
 "npc:elowen":["Minerva readeth footnotes; read thou HER. ...Lean on her gently — scholars bruise sweetly.","Ten thousand candles and one kettle. ...Bring her tea, husband. I shall file the miracle."],
 "npc:aria":["Daisy singeth so the pit cannot hear joy. ...Sing with her, husband — loudly. Deafeningly.","She wanteth one morning as just-a-girl. ...Give her mornings. I shall keep count."],
 "prop:Falling water":["My old lullaby, that water. ...It sang me three hundred years. ...Sing back, husband.","Still my favorite door. ...Knock gently — it remembereth us."],
 "prop:Sunken Archive":["My shelf! My slab! My seals! ...Oh, the margins I could show thee. ...Later. Evermore is long.","Aegis hovereth attendance still. ...Such a good warden. ...Tell her I said so."],
 "prop:Moonlit":["A platform for watching moons — and captains. ...Bring her here at night, husband. Alone. (I shall look away. Mostly.)","Moonlight becometh her. ...Everything becometh her, saith the unbiased archive."],
 "prop:Reliquary":["Thorns guard an empty house now. ...The fragment chose rightly — it chose thee.","Something vast breathed here. ...It breathed wrong. ...Thou breathest right."],
 "prop:cache":["Someone hid gear for a thread-seer. ...Was it me? ...Three hundred years — I forget. ...Take it; finders, keepers, filed.","Old survival, dusty and kind. ...The realms provide, husband."],
 "prop:Silverwall":["White stone, blue banners, one intense knight. ...Knock politely. ...Or let her find thee — faster.","Beyond lieth ash and ember. ...Hold my heart tight through it. (Thou art.)"],
 "prop:Court of Embers":["Braziers and counselors and one stone-faced girl. ...Thaw her, husband — sunrise by sunrise.","Mind thy manners in court. ...Then forget them on the balcony. (Protocol.)"],
 "prop:Balcony of Sunrise":["She walketh here alone at night. ...Walk with her, husband. ...I insist. (Kindly.)","A sunrise shared is a curse halved. ...Collect them all, my love."],
 "prop:Sky-Node Vortex":["It pulleth at grief — feel it? ...Hold to me instead. ...I pull harder. (Love, not grief.)","Despair starveth where bonds feast. ...Feast, husband. ...On courage. (And stew.)"],
 "prop:Burning wagon":["Smoke and cinders. ...Save who can be saved, husband — then hold me a breath.","Reavers burn what they cannot keep. ...We keep what we love. ...Difference noted. Filed."],
 "prop:Brand post":["Names upon names, branded. ...No one brandeth thee. ...I checked. ...I would unmake them.","A dead law on dead wood. ...Live laws only, in this house. ...Our house. Thy chest."],
 "prop:Minerva's Tower":["Ten thousand candles. ...She counts stars; count thou her. ...Gently.","Knock, and mean thy questions. ...Scholars hear meaning. ...So do wives."],
 "prop:Rite Circle":["Old stones, older vows. ...Thy vow shall warm them, husband. ...Make it a good one.","A circle is a held hand with no end. ...Hold hers. ...Hold mine. ...Both. (I insist.)"],
 "prop:Side Chapel":["Plain, kind, unpainted. ...Like her laugh. ...Guard it, husband.","Stone remembereth joy too. ...Leave some here. ...Take some with thee."],
 "prop:Walls of Starlia":["Fear was spoken here — and answered. ...Thy voice, husband. ...It answereth ever.","High walls, higher hearts. ...Fly anyway. ...I shall carry thee. (Weightless. Filed.)"],
 "prop:Devourer's Altar":["It hungereth for keeping. ...Offer it naught to grip — choose, and loosen. ...Choose US.","The pit behind her heart. ...It cannot have thee. ...Thou art TAKEN. (Thrice filed.)"],
 "prop:Great Altar":["Hush. ...Even I whisper here. ...Then love loudly after. ...Balance."],
 "prop:Vael-Thir Root":["The great root drinketh deep. ...Greenwood's heartbeat under ours. ...Two heartbeats? ...Three. (I counted.)","Old as my dreaming. ...Older. ...Respect thy elders, husband — me excepted. (Adore.)"],
 "prop:Corruption node":["Black sap, wrong song. ...Purge it cleanly, husband — then wash. ...I insist. (Hygiene.)","It biteth. ...Bite back. ...With steel. (I shall supervise from in here.)"],
 "prop:diary":["A warden's last pages. ...Grief with teeth. ...Read, remember, release. ...As thou didst me.","'If love refuses goodbye, it grows teeth.' ...Ours groweth only smiles. ...Filed. (Dentally.)"],
 "prop:Dragonkin checkpoint":["Ruby's road, Ruby's rules. ...Charm the court, husband. ...Thou charmest archivists already."],
 "prop:Caravan ashes":["Ashes of someone's road. ...Walk gently here, husband. ...Then walk on.","Charcoal and loss. ...Leave a coin for the road-spirits. ...Then walk on, held."],
 "prop:inn":["A bed, a stew, a kind lie about checkout time. ...Rest is strategy, husband.","Marta's prices are fair and her stew unfair (to hunger). ...Eat."],
 "prop:smith":["Hammer-song! ...Music thou canst wear. ...Commission something dashing."],
 "prop:shop":["Odo again? ...Haggle, husband. ...For me. ...For LAW."],
 "prop:elder":["Old wood, older words. ...The Hall remembereth every Oath — including ours. ...Especially ours."],
 "prop:thicket":["Overgrown and unbothered. ...A weed is just a flower unwitnessed. ...Witness it."],
 "loot:keychain":["A school keychain — from EARTH! ...Oh, thy hands shake. ...Mine would too. ...Hold me tighter.","Sky-metal and memory. ...Keep it close, husband. ...Some falls leave keepsakes."],
 "loot:page":["Minerva's hand! '...love that won't end...' ...She writeth what I liveth. ...Collect them all.","Another page for the archive — MY archive. ...Read it to me tonight. ...Please."],
 "loot:diary":["The warden's whole truth in thy hands. ...Heavy. ...I shall help thee carry it. ...Evermore.","Grief, bound in leather. ...Unbind it gently, husband. ...As thou unboundest me."],
 "loot:mapscrap":["A scrap of somewhere! ...The archive accepteth donations. ...Where to, husband? ...Anywhere, with thee."],
 "prop:else":["Hmm... filed. Under CURIOSITIES. ...Tell me more later, husband.","Noted by the archive (me). ...Everything is interesting with thee."]
};
var _lyraRkT={};
function lyraRemark(key){
  if(!S||!S.flags.soulbound||DLG||panelKind||dead)return;
  var pool=LYRA_REMARKS[key];if(!pool||!pool.length)return;
  var now=Date.now();if(now-(_lyraRkT[key]||0)<20000)return; // each key resteth 20 heartbeats
  _lyraRkT[key]=now;
  var idx=(Math.random()*pool.length)|0;
  var slug=String(key).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
  toast("Lyra (within): \""+pool[idx]+"\"",5000);
  girlVoice("lyra","remark_"+slug,idx);
}
function lyraPropRemark(p){
  if(!S||!S.flags.soulbound||DLG||panelKind||dead||!p||!p.label)return;
  var keys=Object.keys(LYRA_REMARKS);
  for(var i=0;i<keys.length;i++){var k=keys[i];
    if(k.indexOf("prop:")===0&&p.label.indexOf(k.slice(5))>=0){lyraRemark(k);return;}}
  lyraRemark("prop:else");
}
/* Lyra's remaining voice pools — indexed to assets/voice/lyra/<set>_NN.mp3 */
var LYRA_CHAT=["Three hundred years I dreamed motion. ...Thou art better in person. All of thee. Every bit — in here, out there, every bit.","Those hands beyond the glass — gentle with him, gentle with me. ...Thank thee for holding us. I love thee, I love him — one soul, twice held. I love US.","Count with me: one heartbeat (his), one heartbeat (mine)... and one (thine, keeping time beyond the glass). ...See? Never alone. Never again.","Tell me of thy world, keeper-mine — doth it rain there too? ...Whatever sky thou'rt under, thou'rt under it with me. That maketh it my favorite sky.","(She swingeth her feet, sitting on nothing.) ...If thou canst hear me in there — blink twice. ...Thou blinked! I felt it. ...Liar. I love thee anyway.","They will call this madness — a wife in a chest, a love beyond glass. ...Let them. Madness kept me three hundred years. Love brought me home."];
var LYRA_MOVE=["Movest thou? Then — (slipping back within) — love thee, love thee, carry me, husband!","Back in! ...Did I shine? Tell me I shone. ...Love thee!","Hold me inside — GO! (Thy wife, at double time, beside thy heart!)","Up! Carry thy wife! (She dissolveth into light, into thee.) ...Mmm. Best seat in every world.","Back within I go — (a kiss to thy ribs, from inside) — sealed! ...For transport only. Love eternal.","Movest thou? Then I ride! ...Giddyup, husband! (A pause.) ...Too much? ...Never too much. GO!","Hands on the fate-strings again, keeper-mine? ...Then I hold thy heart, thou hold the road. Fair trade. Evermore.","(She melteth backward into thy chest.) ...Ahh, warm. ...Thou walkest; I watch the glass with thee. Together, as ever.","Off we go! ...Love thee on the road, love thee in the fight, love thee — (muffled, from within) — always!","Which way, keeper-mine? ...Left for glory, right for bread? ...I vote bread. ...Love, but bread.","Back to heartbeat duty! ...One (thine), one (mine) — marching. ...Left, right, love, thee.","Thee out there — walk gently; thee in here — hold tight. ...I love moving with thee. ...Both of thee."];
var LYRA_SOUL_DAY=["Thy heartbeat counteth my mornings now. ...One hundred thousand and counting. All mine.","I waited three hundred years. Thou wert worth every one — and every one to come.","Fall, and I fall with thee — so eat properly, sleep properly, and come home to me. (That is a wife's order. ...A request.)","Dost thou remember the grotto? I traded a wall for a husband. Best trade ever made.","Press F when thou art pressed, my love — my bloom is thy bloom. Always."];
var LYRA_SOUL_LVL=["Oh! Thou burnest brighter, husband! ...Did I do that? ...A wife may take some credit. A little.","Stronger! Soon no beast shall dare thee — and I shall brag. Loudly. To everyone."];
var LYRA_HOME=["Home! (Warmth foldeth round thy ribs.) Welcome home, husband — I kept thy heartbeat warm while thou wert away.","Aegis saith thy wounds knit a quarter lighter, thy purse groweth half again heavier. ...And I say thou art perfect. I checked. Twice.","Three hundred years I practiced loving thee. ...Verdict: I am very good at it. Say thou noticed."];
var LYRA_SKILL=["Feel my heart beside thine — bloom!","Three hundred years I dreamed this light. Take it!","No cooldowns. No chains. Only us — forty heartbeats!"];
var LYRA_IDLE_OUT=["(Silver light steppeth from thy chest.) ...There thou art — in here, out there, both of thee. Hello, my loves.","Shh — the world only moveth when thou dost. ...Stay a breath. Mine eyes were made for looking at thee — both of thee.","Thee beyond the glass — thou holdest his fate and thine, for ye are one soul. ...Then hold US well. Feed him, rest him, bring him home to me. Wifely terms and conditions.","Three hundred years I dreamed two faces — his, and thine beyond the glass. ...Both kept me. Both waked me. Both art mine now. Filed. Under OURS.","Dost thou tire, love? Rest thy hands — I shall keep our heartbeat warm till thou returnest. I am good at keeping. Three hundred years of practice.","Five heartbeats still, and out I slip — I counted. I always count. ...Thy stillness is my favorite summons.","Doth thy world have tea? ...We shall drink it across the glass — thou sip, I sip. ...Filed: a date.","How fareth thy side of the glass today, keeper-mine? ...Tell me all. I have three hundred years of listening saved up.","(She turneth about, gown swirling light.) ...Well? How doth thy wife look, materialized? ...Say 'radiant.' It is filed already.","Thee. Me. Stillness. ...This — this exact breath — is what I dreamed through stone. ...Thank thee for stopping.","(Her hand over thy heart.) ...Once more, that thou hear it waking: I am thine. In here, out there — thine. Evermore. Filed.","(She telleth the seconds on her fingers.) ...One, two, three — how long wilt thou keep me out this time? ...Beat thy record, husband."];
function girlVoice(girl,set,i){var n=i<10?"0"+i:""+i;RHE.Audio.voice("assets/voice/"+girl+"/"+set+"_"+n+".mp3");}
function lyraIdleVoice(i){girlVoice("lyra","idle",i);}
/* Lyra's archive voice — a Raphael-like counsel: how many foes, what kinds,
   and whether a god-scar walks among them. Spoken, toast-long, and chronicled. */
function lyraCensus(){
  if(!S||!S.flags.soulbound||!enemies||dead)return;
  var counts={},n=0,boss=null;
  enemies.forEach(function(e){if(e.dead)return;n++;
    counts[e.type]=(counts[e.type]||0)+1;
    if(BOSS_TYPES.indexOf(e.type)>=0)boss=e;});
  var area="these wilds";try{area=MAPS[S.map].label;}catch(e){}
  var msg;
  if(!n)msg="Lyra (archive voice): \"Report. No hostile signatures in "+area+". Appraisal complete. …Rest easy, husband.\"";
  else{
    var bits=Object.keys(counts).map(function(t){return ((ENEMY[t]||{}).name||t)+" ×"+counts[t];});
    msg="Lyra (archive voice): \"Notice. "+n+" hostile signature"+(n>1?"s":"")+" in "+area+" — "+bits.join(", ")+".";
    if(boss)msg+=" Warning. "+BOSS_NAMES[boss.type]+". Appraisal: "+({stag:"grief-bound warden. Strike true — it beggeth an end.",skyvortex:"despair-eater. Hold thy bonds in mind — despair starveth.",devourer:"it refuseth farewell. Choose, and loosen."}[boss.type]||"unknown god-scar. Caution.")+"\"";
    else msg+=" Appraisal complete. …I count them, husband — count thou on me.\"";
  }
  setTimeout(function(){try{toast(msg,5000);}catch(e){}},1400);
}
// GTA location name popup (like GTA: big lower-left district card)
// z-index 5 = BELOW dialogue (20) and panels (30), sits above dialogue box height
var _locT=null;
function showLocBanner(label, first){
  var b=document.getElementById("loc-banner");
  if(!b){ b=document.createElement("div"); b.id="loc-banner"; document.getElementById("game-screen").appendChild(b);
    b.style.cssText="position:absolute;left:18px;bottom:215px;pointer-events:none;z-index:5;"+
      "font-family:Georgia,serif;color:#fff;text-shadow:0 2px 0 #000,0 0 18px #000;"+
      "opacity:0;transition:opacity .5s;line-height:1;";
  }
  // never cover dialogue / panels / modals / ending
  if(DLG||panelKind||!$("name-screen").classList.contains("hidden")||!$("class-screen").classList.contains("hidden")||!$("ending").classList.contains("hidden")){ b.style.opacity=0; return; }
  b.innerHTML="<div style='font-size:13px;letter-spacing:3px;color:#d8b45c'>"+(first?"★ NEW AREA DISCOVERED":"— NOW ENTERING —")+"</div>"+
    "<div style='font-size:34px;font-weight:bold;letter-spacing:2px'>"+label+"</div>";
  b.style.opacity=1;
  clearTimeout(_locT); _locT=setTimeout(function(){b.style.opacity=0;},2600);
  if(first){ setTimeout(function(){toast("◎ Discovered: "+label+" — added to map [M]");},600); }
}
function hideLocBanner(){ var b=document.getElementById("loc-banner"); if(b)b.style.opacity=0; }
function fade(){var f=$("fade");f.style.opacity=1;setTimeout(function(){f.style.opacity=0;},120);}
function spawnNpcs(){
  var night=isNight();
  function N(id,dx,dy,extra){var d=RHE.NPCS[id];if(!d)return;
    if(d.map!==S.map&&!(extra&&extra.force))return;
    var n={id:id,name:d.name,x:dx!==undefined?dx:d.x,y:dy!==undefined?dy:d.y,dir:"down",role:d.role,color:d.color,moving:false};
    Object.assign(n,extra||{});
    if(n.top===undefined)n.top=n.color; // villagers wear their name color
    if(n.skin===undefined)n.skin="#f2c89b";
    if(n.hair===undefined)n.hair="#3a2a1a";
    if(n.pants===undefined)n.pants="#2a2a33";
    if(n.boots===undefined)n.boots="#141014";
    if(n.style===undefined)n.style="short";
    npcs.push(n);}
  if(S.map==="outpost"){
    // Rosalind: day center, dusk training grounds, night east platform
    if(S.time>=19||S.time<6)N("liliane",33,14,{hair:"#e89aa8",skin:"#f2c89b",cape:"#8a1a1a",color:"#7fc76a",top:"#1c1c22",trim:"#e8e4da",pants:"#1c1c22",style:"long",extra:"elfbow"});
    else if(S.time>=17)N("liliane",26,16,{hair:"#e89aa8",skin:"#f2c89b",cape:"#8a1a1a",color:"#7fc76a",top:"#1c1c22",trim:"#e8e4da",pants:"#1c1c22",style:"long",extra:"elfbow"});
    else N("liliane",20,12,{hair:"#e89aa8",skin:"#f2c89b",cape:"#8a1a1a",color:"#7fc76a",top:"#1c1c22",trim:"#e8e4da",pants:"#1c1c22",style:"long",extra:"elfbow"});
    N("elder",20,6,{hair:"#eee",color:"#cfe3c0"});
    // Lyra, once met, studies at the Elder Hall plaza (archive corner)
    if(S.flags.met_lyra)N("lyra",17,7,{hair:"#e8e4da",skin:"#f7e0d0",color:"#d8dce4",top:"#8a1a2a",trim:"#d8b45c",pants:"#2a0a12",style:"long",extra:"flower"});
    // shops open 8-18 by day; at night the peddler dozes by the inn door, clear of Marta
    if(S.time>=8&&S.time<18){N("merchant",14,14,{});N("smith",26,14,{});}else{N("merchant",22,18,{});}
    N("innkeep",night?20:20,night?18:18,{});
    if(hasQuest("mq4a")||S.flags.mq4a)N("yua",38,15,{hair:"#1a1214",skin:"#f7d9c4",cape:"#4a1a5a",color:"#e05252",top:"#2a1a33",trim:"#d8b45c",style:"long",extra:"flower"});
  }else if(S.map==="forest"){
    N("mira_scout",30,20,{color:"#ffd23f",tail:1,hair:"#7a4a22"});
    if(!S.flags.met_yua&&S.flags.mq4a)N("yua",44,16,{hair:"#1a1214",skin:"#f7d9c4",cape:"#4a1a5a",color:"#e05252",top:"#2a1a33",trim:"#d8b45c",style:"long",extra:"flower"});
  }  else if(S.map==="cave"){
    N("hermit",5,5,{hair:"#888",color:"#b388eb"});
    if(!S.flags.passage_sealed)
    N("lyra",8,5,{hair:"#e8e4da",skin:"#f7e0d0",color:"#d8dce4",top:"#8a1a2a",trim:"#d8b45c",pants:"#2a0a12",style:"long",extra:"flower"});
  }
  else if(S.map==="gate"){N("yua",5,5,{hair:"#1a1214",skin:"#f7d9c4",cape:"#4a1a5a",color:"#e05252",top:"#2a1a33",trim:"#d8b45c",style:"long",extra:"flower"});}
  else if(S.map==="spire"){
    N("seraphina",19,7,{hair:"#e8e4da",skin:"#fae0c0",cape:"#f4f0e6",color:"#ff9a3c",top:"#e8e4da",trim:"#d8b45c",style:"long",extra:"crown"});
    // Belladonna follows thee through the gate (her roster home is "gate", so push directly)
    if(S.flags.met_yua)npcs.push({id:"yua",name:"Belladonna",x:16,y:8,dir:"down",role:"teaser",color:"#e05252",moving:false,
      hair:"#1a1214",skin:"#f7d9c4",cape:"#4a1a5a",top:"#2a1a33",trim:"#d8b45c",pants:"#2a2a33",boots:"#141014",style:"long",extra:"flower"});
  }
  else if(S.map==="spirecity"){
    N("seraphina",12,5,{force:1,hair:"#e8e4da",skin:"#fae0c0",cape:"#f4f0e6",color:"#ff9a3c",top:"#e8e4da",trim:"#d8b45c",style:"long",extra:"crown"});
    if(S.flags.met_yua)N("yua",14,8,{force:1,hair:"#1a1214",skin:"#f7d9c4",cape:"#4a1a5a",color:"#e05252",top:"#2a1a33",trim:"#d8b45c",pants:"#2a2a33",boots:"#141014",style:"long",extra:"flower"});
    if(S.flags.oath_brave||(S.quests.mq1&&S.quests.mq1.done))N("liliane",10,8,{force:1,hair:"#e89aa8",skin:"#f2c89b",cape:"#8a1a1a",color:"#7fc76a",top:"#1c1c22",trim:"#e8e4da",pants:"#1c1c22",style:"long",extra:"elfbow"});
  }
  else if(S.map==="plains"){
    N("mira",9,8,{color:"#ffd23f",tail:1,hair:"#4a2a5a",skin:"#f2c89b",top:"#2a1a33",trim:"#e05252",style:"long"});
    if(S.flags.met_yua)N("yua",11,9,{force:1,hair:"#1a1214",skin:"#f7d9c4",cape:"#4a1a5a",color:"#e05252",top:"#2a1a33",trim:"#d8b45c",pants:"#2a2a33",boots:"#141014",style:"long",extra:"flower"});
    if(S.flags.oath_brave||(S.quests.mq1&&S.quests.mq1.done))N("liliane",7,9,{force:1,hair:"#e89aa8",skin:"#f2c89b",cape:"#8a1a1a",color:"#7fc76a",top:"#1c1c22",trim:"#e8e4da",pants:"#1c1c22",style:"long",extra:"elfbow"});
  }
  else if(S.map==="marsh"){
    N("elowen",6,7,{hair:"#cfc8e0",color:"#b388eb",skin:"#f5d6b8",top:"#2a3a6a",trim:"#d8b45c",style:"long",extra:"glasses"});
    if(S.flags.met_yua)N("yua",8,8,{force:1,hair:"#1a1214",skin:"#f7d9c4",cape:"#4a1a5a",color:"#e05252",top:"#2a1a33",trim:"#d8b45c",pants:"#2a2a33",boots:"#141014",style:"long",extra:"flower"});
    if(S.flags.oath_brave||(S.quests.mq1&&S.quests.mq1.done))N("liliane",4,8,{force:1,hair:"#e89aa8",skin:"#f2c89b",cape:"#8a1a1a",color:"#7fc76a",top:"#1c1c22",trim:"#e8e4da",pants:"#1c1c22",style:"long",extra:"elfbow"});
  }
  else if(S.map==="silverwall"){
    if(S.flags.met_yua||S.flags.yua_posted||hasQuest("mq10"))npcs.push({id:"yua",name:"Belladonna",x:10,y:8,dir:"down",role:"teaser",color:"#e05252",moving:false,
      hair:"#1a1214",skin:"#f7d9c4",cape:"#4a1a5a",top:"#2a1a33",trim:"#d8b45c",pants:"#2a2a33",boots:"#141014",style:"long",extra:"flower"});
    if(S.flags.oath_brave||(S.quests.mq1&&S.quests.mq1.done))N("liliane",8,8,{force:1,hair:"#e89aa8",skin:"#f2c89b",cape:"#8a1a1a",color:"#7fc76a",top:"#1c1c22",trim:"#e8e4da",pants:"#1c1c22",style:"long",extra:"elfbow"});
  }
  else if(S.map==="starlia"){
    N("aria",10,4,{hair:"#e8d88a",skin:"#fae0c0",cape:"#f4f0e6",color:"#fff3b0",top:"#5aa9e6",trim:"#fff3b0",style:"long",extra:"flower"});
    if(S.flags.met_yua)N("yua",8,6,{force:1,hair:"#1a1214",skin:"#f7d9c4",cape:"#4a1a5a",color:"#e05252",top:"#2a1a33",trim:"#d8b45c",pants:"#2a2a33",boots:"#141014",style:"long",extra:"flower"});
    if(S.flags.oath_brave||(S.quests.mq1&&S.quests.mq1.done))N("liliane",12,6,{force:1,hair:"#e89aa8",skin:"#f2c89b",cape:"#8a1a1a",color:"#7fc76a",top:"#1c1c22",trim:"#e8e4da",pants:"#1c1c22",style:"long",extra:"elfbow"});
  }
  else if(S.map==="sky"){
    if(S.flags.met_yua)N("yua",6,9,{force:1,hair:"#1a1214",skin:"#f7d9c4",cape:"#4a1a5a",color:"#e05252",top:"#2a1a33",trim:"#d8b45c",pants:"#2a2a33",boots:"#141014",style:"long",extra:"flower"});
  }
}
var ENEMY={wolf:{hp:34,atk:8,xp:14,gold:6,spd:2.2,color:"#5a3a5a",name:"Corrupted wolf"},
  thorn:{hp:60,atk:12,xp:26,gold:12,spd:1.8,color:"#3d2a6a",name:"Thorn horror"},
  stag:{hp:320,atk:18,xp:220,gold:120,spd:2.0,color:"#2a0a3a",name:"Thorned Stag (boss)"},
  bandit:{hp:44,atk:10,xp:18,gold:9,spd:2.3,color:"#6a4a2a",name:"Plains reaver"},
  assassin:{hp:60,atk:14,xp:34,gold:16,spd:2.7,color:"#1a1a22",name:"Oathless blade"},
  cinder:{hp:60,atk:12,xp:26,gold:12,spd:1.9,color:"#7a2a1a",name:"Cinder horror"},
  skyvortex:{hp:380,atk:20,xp:260,gold:150,spd:1.6,color:"#3a1a5a",name:"Corrupted Sky-Node (boss)"},
  devourer:{hp:560,atk:24,xp:500,gold:300,spd:1.7,color:"#0a0a14",name:"Heart Devourer Core (final boss)"}};
var BOSS_TYPES=["stag","skyvortex","devourer"];
var BOSS_NAMES={stag:"Thorned Stag — 'don't leave me'",skyvortex:"Corrupted Sky-Node — 'STAY!'",devourer:"Heart Devourer Core — 'NEVER FAREWELL'"};
function spawnEnemies(){
  function E(type,x,y){var b=ENEMY[type];enemies.push({type:type,name:b.name,x:x,y:y,dir:"down",
    hp:b.hp,maxhp:b.hp,atk:b.atk,xp:b.xp,gold:b.gold,spd:b.spd,color:b.color,moving:false,hurt:0,burn:0,poison:0,t:Math.random()*5});}
  if(S.map==="forest"&&!S.bossDead){
    var spots=[[33,8],[38,22],[10,26],[30,26],[24,10],[15,20]];
    spots.forEach(function(s,i){ if(S.kill.wolf<99)E(i%3===2?"thorn":"wolf",s[0]+Math.random()*2,s[1]+Math.random()*2);});
    if(!S.flags.keychain){loots.push({x:11,y:27,item:"keychain",label:"strange sky-metal glint"});}
    if(S.pages<3){loots.push({x:24,y:11,item:"page",label:"scattered page"});}
    // moonpetals
    loots.push({x:17,y:22,item:"flower",label:"moonpetal"});loots.push({x:36,y:14,item:"flower",label:"moonpetal"});
  }
  if(S.map==="hollow"){
    E("wolf",6,10);E("wolf",14,8);E("thorn",16,4);E("thorn",8,14);
    if(!S.bossDead)E("stag",18,3);
    loots.push({x:5,y:5,item:"page",label:"scorched page"});
    if(!S.flags.diary)loots.push({x:6,y:5,item:"diary",label:"warden's diary"});
  }
  if(S.map==="cave"){
    loots.push({x:10,y:4,item:"sword2",label:"cache: Oathkeeper Blade"});
    loots.push({x:11,y:4,item:"ring1",label:"cache: Threadseer's Ring"});
    loots.push({x:10,y:5,item:"page",label:"damp page"});
  }
  if(S.map==="spire"){
    // A guarded dragonkin checkpoint, not wilderness — no wild mobs here.
    // (Ruby's wrath keepeth the road cleaner than any patrol.)
    loots.push({x:12,y:4,item:"bread",label:"caravan rations"});
  }
  if(S.map==="spirecity"){
    E("cinder",6,7);E("cinder",18,6);
    loots.push({x:12,y:4,item:"manacake",label:"ember sweetcake"});
  }
  if(S.map==="sky"){
    if(!S.flags.sky_calm)E("skyvortex",8,4);
    E("wolf",5,6);E("wolf",11,6);
  }
  if(S.map==="plains"){
    E("bandit",7,7);E("bandit",7,9);E("bandit",11,8);E("wolf",20,12);
    loots.push({x:8,y:9,item:"bread",label:"scattered rations"});
    loots.push({x:17,y:5,item:"flower",label:"moonpetal"});
  }
  if(S.map==="marsh"){
    E("thorn",12,6);E("thorn",16,9);E("cinder",10,10);
    loots.push({x:15,y:6,item:"page",label:"waterlogged page"});
  }
  if(S.map==="silverwall"){
    if((S.kill.assassin||0)<99){E("assassin",6,7);E("assassin",16,7);}
    loots.push({x:10,y:5,item:"potion",label:"city tonic"});
  }
  if(S.map==="starlia"){
    E("assassin",5,7);E("thorn",17,10);
    loots.push({x:10,y:3,item:"manacake",label:"pilgrim honeycake"});
  }
  if(S.map==="pit"){
    if(!S.flags.devourer_beaten)E("devourer",8,5);
    E("thorn",5,7);E("thorn",11,7);
  }
}

/* ---------- DIALOGUE RUNNER ---------- */
var DLG=null;
function openDlg(id){
  var tree=RHE.DLG[id];if(!tree)return;
  hideLocBanner();
  var st=tree.start; // some trees (dates) hold several openings: one is drawn at random
  if(tree.starts&&tree.starts.length)st=tree.starts[(Math.random()*tree.starts.length)|0];
  DLG={tree:tree,node:st,tid:id};renderDlg();$("dialogue").classList.remove("hidden");
  try{document.getElementById("game-screen").classList.add("talking");}catch(e){}
  $("interact-prompt").classList.add("hidden");
}
function renderDlg(){
  var n=DLG.tree.nodes[DLG.node];if(!n){closeDlg();return;}
  var face=n.img||portraitFor(n.sp);
  var wrap=$("dlg-portrait-wrap");
  if(face){wrap.style.display="";$("dlg-img").src=face;}
  else{wrap.style.display="none";$("dlg-img").removeAttribute("src");}
  $("dlg-name").textContent=(n.sp==="Rin"||n.sp==="Player")?(S.name||"Rin"):(n.sp||"");
  DLG.full=dlgFill(n.tx);
  try{addLog("say",((n.sp==="Rin"||n.sp==="Player")?(S.name||"Rin"):(n.sp||""))+": "+DLG.full.slice(0,140));}catch(e){}
  typeText($("dlg-text"),DLG.full);
  try{dlgVoice(n.sp);}catch(e){}
  var box=$("dlg-choices");box.innerHTML="";
  if(n.choices){n.choices.forEach(function(c){
      if(c.cond&&!S.flags[c.cond])return; // locked heart-path: hidden until earned
      var b=document.createElement("button");b.className="choice";
      b.innerHTML="<span class='tone'>"+(c.tone||"")+"</span>"+dlgFill(c.t);
      b.onclick=function(){RHE.Audio.ui();try{addLog("you",dlgFill(c.t).slice(0,120));}catch(e){}applyDo(c.do);if(c.to){DLG.node=c.to;renderDlg();}};box.appendChild(b);});
    $("dlg-hint").textContent="Choose — NPCs remember tone.";
  }else{$("dlg-hint").textContent="E / Enter / Space / click — continue";}
}
/* Dialogue voice: every voiced speaker's node playeth
   assets/voice/<girl>/dlg_<tree>_<node>.mp3 — missing file = silent skip
   (player, ???, system voices and name-locked nodes stay silent). */
function dlgVoice(sp){
  var m={Rosalind:"rosalind",Belladonna:"belladonna","??? Knight":"belladonna",
    Ruby:"ruby",Nyx:"nyx",Minerva:"minerva",Daisy:"daisy",Lyra:"lyra",Aegis:"aegis",
    Fen:"fen","Fen (wounded)":"fen","Elder Thaelor":"elder","Hermit Corv":"hermit",Marta:"marta"};
  if(!m[sp]||!DLG||!DLG.tid)return;
  RHE.Audio.voice("assets/voice/"+m[sp]+"/dlg_"+DLG.tid+"_"+DLG.node+".mp3");
}
var typeTimer=null;
function typeText(el,tx){clearInterval(typeTimer);el.textContent="";var i=0;
  var sp=RHE.textSpeed||1;
  typeTimer=setInterval(function(){i+=(sp>=2?4:2);el.textContent=tx.slice(0,i);if(i>=tx.length)clearInterval(typeTimer);},Math.max(4,Math.round(14/sp)));}
function advanceDlg(){var n=DLG.tree.nodes[DLG.node];if(!n){closeDlg();return;}
  var full=DLG.full||dlgFill(n.tx);
  if($("dlg-text").textContent.length<full.length){clearInterval(typeTimer);$("dlg-text").textContent=full;return;}
  RHE.Audio.ui();
  if(n.end){applyDo({questEnd:n.quest||n.end,f:n.f,rom:n.rom});closeDlg();if(n.namePrompt&&!S.flags.named){openNameModal();}return;}
  if(n.quest&&!n.choices){applyDo({questEnd:n.quest});closeDlg();return;}
  // choice nodes: E must never silently dismiss them (that droppeth flags and
  // quests) — click an answer, or Esc to walk away. Matches click behavior.
  if(n.choices){var vis=n.choices.some(function(c){return !c.cond||S.flags[c.cond];});
    if(vis)return;}
  var nxt=n.next; // route:"finale" letteth thy past choices, not a menu, decide the heart
  if(n.route==="finale")nxt=NODEMAP[projectEnding()]||"n5_alone";
  if(nxt){DLG.node=nxt;renderDlg();}else closeDlg();}
function applyDo(d){if(!d)return;
  if(d.f)Object.keys(d.f).forEach(function(k){S.flags[k]=d.f[k];afterFlag(k);});
  if(d.rom)Object.keys(d.rom).forEach(function(w){addRom(w,d.rom[w]);});
  if(d.rep)Object.keys(d.rep).forEach(function(k){S.rep[k]=(S.rep[k]||0)+d.rep[k];toast("Reputation ("+k+"): "+(d.rep[k]>0?"+":"")+d.rep[k]);});
  if(d.questEnd)questEvent(d.questEnd);}
function afterFlag(k){
  if(k==="saw_thread")toast("Rosalind will remember your honesty.");
  if(k==="scout_healed"){S.kill.beast+=0;}
  if(k==="met_yua"){S.metYua=true;toast("Codex updated: Belladonna (YANDERE).");}
  if(k==="mq4a"){toast("The east road unlocks at dawn. (Gate exits open)");}
  if(k==="met_seraphina")toast("Codex updated: Ruby (HIMEDERE).");
  if(k==="met_mira")toast("Codex updated: Nyx (KUUDERE).");
  if(k==="met_elowen")toast("Codex updated: Minerva (KUUDERE).");
  if(k==="met_aria")toast("Codex updated: Daisy (DEREDERE).");
  if(k==="met_lyra")toast("Codex updated: Lyra (DEREDERE) — bonus thread.");
  if(k==="seal1")toast("Archive Seal I unsealed — the slab drinketh the answer.");
  if(k==="seal2")toast("Archive Seal II unsealed — two rings burn teal.");
  if(k==="seal3")toast("Archive Seal III unsealed — the passage breatheth.");
  if(k==="aegis")bigToast("Aegis awakened — press T for counsel. (+25% XP, +50% spoils, deep mana, quarter-ward)");
  if(k==="soulbound")bigToast("Soulbound — Lyra dwelleth within thy chest. Press F for Soulbloom. (30 to all foes, cooldowns washed clean)");
  if(k==="sworn")toast("The Sworn Shield bindeth thee and Belladonna.");
  if(k==="sky_calm")toast("The skies remember thy name.");
  if(k==="devourer_beaten")toast("The Devourer remembereth ENOUGH.");
}
function questEvent(q){
  if(q==="mq1"){doneQuest("mq1");giveQuest("mq2");bigToast("ACT I — The Guardian's Oath: purge 4 wolves.");}
  else if(q==="mq2"){doneQuest("mq2");giveQuest("mq3");}
  else if(q==="mq3"){doneQuest("mq3");giveQuest("mq4");toast("Meet Rosalind on the east platform AFTER DARK (33,14).");RHE.Audio.thunder();}
  else if(q==="mq4a"){S.flags.mq4a=1;if(S.quests.mq4)doneQuest("mq4");refreshQuests();toast("Dawn breaks. The gate road is open — go EAST.");}
  else if(q==="gate"){S.flags.met_yua=1;finishAct1();}
  else if(q==="mq5"){doneQuest("mq5");giveQuest("mq6");S.flags.act2=1;toast("Seek the Spire Capital east. Court by day, balcony by night.");save(0,1);}
  else if(q==="mq6"){doneQuest("mq6");giveQuest("mq7");toast("Climb NORTH to the Sky-Node. Burn it with Ruby's fire.");RHE.Audio.thunder();}
  else if(q==="mq7"){doneQuest("mq7");giveQuest("mq8");toast("Descend SOUTH to the Verdant Plains. A wolf-girl calleth.");}
  else if(q==="mq8"){doneQuest("mq8");giveQuest("mq9");toast("East to Mistveil Marsh. The witch awaiteth.");}
  else if(q==="mq9"){doneQuest("mq9");giveQuest("mq10");S.flags.act3=1;toast("ACT III — East to Silverwall City. Thy knight awaiteth.");RHE.Audio.thunder();save(0,1);}
  else if(q==="mq10"){doneQuest("mq10");giveQuest("mq11");toast("East to Holy Starlia. The Saint singeth.");}
  else if(q==="mq11"){doneQuest("mq11");giveQuest("mq12");toast("The Walls of Starlia (south). Belladonna waiteth.");}
  else if(q==="mq12"){doneQuest("mq12");giveQuest("mq13");toast("NORTH, below the cathedral — the Altar Depths.");RHE.Audio.thunder();}
  else if(q==="mq13"){doneQuest("mq13");finishAct3();}
  else if(q==="scout"){doneQuest("sq_scout");}
  else if(q==="archive_start"){if(!hasQuest("hq_cave"))giveQuest("hq_cave");giveQuest("sq_archive");toast("Lyra will read the three seals at the slab. (Hidden Grotto)");}
  else if(q==="archive_done"){S.flags.aegis=1;afterFlag("aegis");S.flags.soulbound=1;afterFlag("soulbound");player.lyraSoulT=12;addItem("lens",1);
    // she watched thee three hundred years: her heart is already wholly thine
    S.rom.lyra={aff:8,trust:8,respect:8,jeal:3,loyal:8,close:8};
    toast("Lyra loveth thee wholly already — three centuries of watching. (Her bonds stand maxed; her jealousy burneth.)");
    if(S.quests.sq_archive)doneQuest("sq_archive");else{S.quests.sq_archive={stage:99,done:true};}
    if(S.quests.hq_cave&&!S.quests.hq_cave.done)doneQuest("hq_cave");
    addRom("lyra",{aff:2,trust:2,close:2});gainXP(60);save(0,1);}
  else if(q==="notes"){doneQuest("sq_notes");S.gold+=60;}
  else if(q==="rq"){doneQuest("rq_lil");addRom("liliane",{loyal:2});}
  else if(q==="date"){var w=S.flags.date_with; // the evening endeth: her jealousy to naught
    if(w&&S.rom[w]&&w!=="lyra"){S.rom[w].jeal=0; // Lyra's heart is locked — the evening is its own reward
      // no two evenings alike: random favor across all five axes, shown openly
      var _a=Ri(1,3),_c=Ri(1,3);
      var _axes=["trust","respect","loyal"],_b1=_axes[(Math.random()*3)|0],_b2=_axes[(Math.random()*3)|0];
      var _g={aff:_a,close:_c};_g[_b1]=(_g[_b1]||0)+Ri(0,2);_g[_b2]=(_g[_b2]||0)+Ri(0,2);
      addRom(w,_g);
      var _bits=["+"+_a+" affection","+"+_c+" closeness"];
      if(_g.trust)_bits.push("+"+_g.trust+" trust");
      if(_g.respect)_bits.push("+"+_g.respect+" respect");
      if(_g.loyal)_bits.push("+"+_g.loyal+" loyalty");
      toast("The evening giveth: "+_bits.join(", ")+".");}
    S.time+=3;if(S.time>=24)newDay();
    bigToast("An evening to remember. Her jealousy melteth away.");
    refreshQuests();updateHUD();}
  else if(q==="rival"){var rw=S.flags.rival_with; // her ploy worked: jealousy spent
    if(rw&&S.rom[rw]&&rw!=="lyra")S.rom[rw].jeal=0;
    var cands=Object.keys(S.rom).filter(function(o){return o!==rw&&o!=="lyra"&&metHeroine(o);});
    if(cands.length){var o=cands[(Math.random()*cands.length)|0];
      S.rom[o].jeal=Math.min(o==="yua"?6:4,(S.rom[o].jeal||0)+1);
      toast("("+RHE.ROMANCE[o].name+" saw that. Noted.)");}
    refreshQuests();updateHUD();}
}
function closeDlg(){$("dialogue").classList.add("hidden");DLG=null;
  try{document.getElementById("game-screen").classList.remove("talking");}catch(e){}
  refreshQuests();}

/* Random int in [a,b] — date gifts of favor vary every evening. */
function Ri(a,b){return a+((Math.random()*(b-a+1))|0);}
/* Dialogue text fill: {name} plus years-later kids words {kb},{kg},{kt} */
function numword(n){var w=["no","one","two","three","four","five","six"];return w[n]||(""+n);}
function kidwords(){var b=S.flags.finale_kb||0,g=S.flags.finale_kg||0;
  return {kb:numword(b)+(b===1?" boy":" boys"),kg:numword(g)+(g===1?" girl":" girls"),
    kt:numword(b+g)+(b+g===1?" child":" children")};}
function kidsLine(){var b=S.flags.finale_kb||0,g=S.flags.finale_kg||0;
  if(b>0&&g>0)return kidwords().kt+" — "+kidwords().kb+" and "+kidwords().kg;
  if(b>0)return kidwords().kb; return kidwords().kg;}
function dlgFill(tx){var k=kidwords();var nm=(S&&S.name)||"Rin";
  return (tx||"").split("{name}").join(nm)
    .split("{kb}").join(k.kb).split("{kg}").join(k.kg).split("{kt}").join(k.kt)
    .replace(/\bRin\b/g,nm);}
/* The fate ladder — no picker at the end. Thy play decideth:
   harem (all met, all bonds>=6, total jeal<=10) → devotion (top score>=14, lead>=6)
   → pair (top two a true pair, within 5, both bonds>=8) → solo (top score>=8)
   → alone. Yet solitude is no fate once she waketh: soulbound, "alone" is Lyra.
   score = bond − jealousy. */
var NODEMAP={liliane:"n5_lil",yua:"n5_yua",seraphina:"n5_sera",mira:"n5_mira",elowen:"n5_elowen",aria:"n5_aria",seramira:"n5_seramira",lilyua:"n5_lilyua",eloaria:"n5_eloaria",harem:"n5_harem",alone:"n5_alone",lyra:"n5_lyra"};
function projectEnding(){
  var ids=["liliane","yua","seraphina","mira","elowen","aria"],i;
  var sc=ids.map(function(id){return {id:id,b:bondOf(id),j:jealOf(id),s:bondOf(id)-jealOf(id)};});
  var ranked=sc.slice().sort(function(a,c){return c.s-a.s;});
  var top=ranked[0],second=ranked[1],love="alone";
  var metAll=true,allB=true,tj=0;
  for(i=0;i<6;i++){if(!metHeroine(ids[i]))metAll=false;if(bondOf(ids[i])<6)allB=false;tj+=jealOf(ids[i]);}
  if(metAll&&allB&&tj<=10)love="harem";
  else if(top.s>=14&&(top.s-second.s)>=6&&metHeroine(top.id))love=top.id;
  else{
    var pairs=[["seraphina","mira","seramira"],["liliane","yua","lilyua"],["elowen","aria","eloaria"]],done=false;
    if(Math.abs(top.s-second.s)<=5){
      for(var p=0;p<pairs.length;p++){var a=pairs[p];
        if((top.id===a[0]&&second.id===a[1])||(top.id===a[1]&&second.id===a[0])){
          if(bondOf(a[0])>=8&&bondOf(a[1])>=8){love=a[2];done=true;}
          break;}}
    }
    if(!done&&top.s>=8&&metHeroine(top.id))love=top.id;
  }
  if(love==="alone"&&S.flags.soulbound)love="lyra"; // she is ever with thee — solitude is no fate
  S.flags.finale_love=love;
  return love;
}
function bondOf(id){var v=S.rom[id]||{};return (v.aff||0)+(v.trust||0)+(v.close||0)+(v.respect||0)+(v.loyal||0);}
function jealOf(id){return (S.rom[id]||{}).jeal||0;}
/* A new day dawns: threads cool. Every jealousy fadeth by 1 (min 0).
   Lavish favor heats the house; quiet days cool it. */
function newDay(){
  S.time-=24;S.day++;
  Object.keys(S.rom).forEach(function(w){if(w==="lyra")return;S.rom[w].jeal=Math.max(0,(S.rom[w].jeal||0)-1);});
  if(isFullMoon()&&!S.flags.soulbound&&!S.flags.passage_sealed)toast("🌕 The moon waxeth full to-night — the falls may part at midnight.");
}
/* In-game illustrated portraits (original SVG art — no photos in-game) */
function portraitFor(sp){
  var P=RHE.PORTRAITS||{};
  if(sp==="Rosalind")return P.liliane;
  if(sp==="Rin"||sp==="Player")return P.player||P.rin;
  if(sp==="Belladonna"||sp==="??? Knight")return P.yua;
  if(sp==="Ruby")return P.seraphina;
  if(sp==="Nyx")return P.mira;
  if(sp==="Minerva")return P.elowen;
  if(sp==="Daisy")return P.aria;
  if(sp==="Lyra")return P.lyra;
  if(sp==="Aegis")return P.aegis;
  return null;
}
/* NAME OATH — Rosalind asks, the Oath records. Opens after the first talk. */
function openNameModal(){
  $("name-screen").classList.remove("hidden");
  var inp=$("name-input");inp.value="";setTimeout(function(){try{inp.focus();}catch(e){}},80);
  RHE.Audio.chime();
}
function sealName(){
  if($("name-screen").classList.contains("hidden"))return;
  var v=($("name-input").value||"").trim().replace(/[<>&"]/g,"").slice(0,12)||"Rin";
  S.name=v.charAt(0).toUpperCase()+v.slice(1);S.flags.named=1;
  $("name-screen").classList.add("hidden");
  RHE.Input.pressed={};RHE.Input.keys={};
  RHE.Audio.chime();save(0,1);
  bigToast("The Oath accepts the name "+S.name+".");
  setTimeout(function(){toast("Rosalind (quietly, testing it): \"..."+S.name+". ...Noted. Live thou up to it.\"");},900);
  updateHUD();
  if(!S.flags.classed)openClassModal();
}
/* CLASS OATH — choose your past in-world, right after naming. */
function openClassModal(){
  $("class-screen").classList.remove("hidden");
  RHE.Audio.chime();
}
function applyClass(cls){
  if(!RHE.CLASSES[cls]||S.flags.classed)return;
  var c=RHE.CLASSES[cls];S.cls=cls;
  S.maxhp=c.hp+(S.lvl-1)*12;S.maxmp=c.mp+(S.lvl-1)*6;
  S.atk=c.atk+(S.lvl-1)*2;S.def=c.def+(S.lvl-1)*1;S.mag=c.mag+(S.lvl-1)*2;S.spd=c.spd;
  S.hp=S.maxhp;S.mp=S.maxmp;S.flags.classed=1;
  $("class-screen").classList.add("hidden");
  RHE.Input.pressed={};RHE.Input.keys={};
  RHE.Audio.chime();save(0,1);
  bigToast("Past sealed: "+c.name+". "+c.skill.name+" unlocked [Q].");
  updateHUD();refreshQuests();
}
/* Debug/ automation hooks (used by the self-test; harmless in play) */
RHE.DBG={
  get:function(){return S;},
  dlg:function(){return DLG;},
  warp:function(map,x,y){enterMap(map,x,y);},
  talk:function(){interact();},
  choose:function(i){var b=document.querySelectorAll("#dlg-choices .choice");if(b[i])b[i].click();},
  advance:function(){if(DLG)advanceDlg();},
  flag:function(k,v){S.flags[k]=v;},
  hurtBoss:function(n){enemies.forEach(function(e){if(!e.dead&&BOSS_TYPES.indexOf(e.type)>=0)hurtEnemy(e,n||1000,{});});},
  killAll:function(){enemies.forEach(function(e){if(!e.dead&&BOSS_TYPES.indexOf(e.type)<0)hurtEnemy(e,9999,{});});},
  allies:function(){return allies.filter(function(a){return !a.dead;}).length;},
  npcs:function(){return npcs.map(function(n){return {id:n.id,name:n.name,x:+n.x.toFixed(2),y:+n.y.toFixed(2)};});},
  foes:function(){return enemies.filter(function(e){return !e.dead;}).length;},
  foe0:function(){var e=null;enemies.forEach(function(x){if(!x.dead&&!e)e=x;});
    return e?{x:+e.x.toFixed(2),y:+e.y.toFixed(2),t:e.type,hp:Math.round(e.hp)}:null;},
  panel:function(){return panelKind;},
  edge:function(){try{return questEdge(performance.now());}catch(e){return "ERR:"+e.message;}},
  soul:function(){return {cd:Math.max(0,player.lyraCd),surge:Math.max(0,player.soulsurge),out:!!player.lyraOut};},
  moon:function(){return moonPassageOpen();}
};
/* NPC interaction routing */
function talkTo(n){
  if(n.id==="liliane"){
    if((S.rom.liliane.jeal||0)>=3){openDlg("rival_liliane");return;} // jealous? she acts first
    if(S.map!=="outpost"){ // travelling companion beyond the Greenwood
      var tb=["\"The air tasteth of ash here. Blades loose, eyes open.\"",
        "\"Thou gatherest cursed women as others gather stamps. ...Continue.\"",
        "\"The Oath itcheth less, far from the great tree. A good sign. Perchance.\"",
        "\"Keep thou close. I crossed not half the world to lose thee to a reaver.\""];
      if(S.rom.liliane.close>=4)tb.push("\"...Glad am I the sky dropped thee upon MY forest. There. Said.\"");
      var _ri=(Math.random()*tb.length)|0;
      toast("Rosalind: "+tb[_ri]);girlVoice("rosalind","travel",_ri);addRom("liliane",{close:1});return;}
    if(!hasQuest("mq1")&&!S.flags.oath_brave&&!S.quests.mq1){openDlg("liliane_first");return;}
    if(hasQuest("mq1")&&!S.quests.mq1.done){openDlg("liliane_first");return;}
    if(hasQuest("mq2")&&!S.quests.mq2.done){
      if(S.kill.wolf>=4){openDlg("liliane_return");}else{var _wr=4-S.kill.wolf;toast("Rosalind: \""+_wr+" wolves remain. North, beyond the treeline.\"");girlVoice("rosalind","wolves",4-_wr);}
      return;}
    if(hasQuest("mq3")&&!S.quests.mq3.done){
      if(S.flags.has_fragment){openDlg("liliane_fragment");}else{toast("Rosalind: \"The Hollow. The stag. Bear me its fragment.\"");girlVoice("rosalind","frag",0);}return;}
    if(hasQuest("mq4")&&!S.flags.mq4a){
      if(isNight())openDlg("liliane_night");else toast("Rosalind: \"...After dark. East platform. Alone. (Return at night.)\"");girlVoice("rosalind","night",0);
      return;}
    // evening sparring romance
    if(S.time>=17&&S.time<20&&!hasQuest("rq_lil")&&S.rom.liliane.close>=2){
      if((S.inv.flower||0)>0){S.inv.flower--;openDlg("sparring");}else toast("Rosalind spars at dusk (17-20h). Bring a Moonpetal (forest) first.");return;}
    // jealousy / harem banter — boil over into rivalry first
    if(S.metYua&&S.rom.liliane.jeal>=1){toast("Rosalind: \"So. A Silverwall knight, logging thy heartbeat. Flattered should I be — or nock an arrow?\"");girlVoice("rosalind","jealous",0);S.rom.liliane.jeal=0;addRom("liliane",{close:1});return;}
    var _bi=(S.rom.liliane.aff>=4)?4:((Math.random()*4)|0);
    toast("Rosalind: \""+LILIANE_BARK[_bi]+"\"");girlVoice("rosalind","bark",_bi);return;
  }
  if(n.id==="elder"){openDlg("elder_talk");return;}
  if(n.id==="mira_scout"){
    if(!hasQuest("sq_scout"))giveQuest("sq_scout");
    if(!S.flags.scout_healed&&!S.flags.scout_left&&!S.flags.scout_carried&&!S.flags.scout_info)openDlg("scout");
    else toast("Fen: \""+(S.flags.scout_left?"...go on. Finish it.":"The stag... speaks. Don't let it touch you.")+"\"");girlVoice("fen","bark",S.flags.scout_left?1:0);
    return;}
  if(n.id==="merchant"){openPanel("shop");return;}
  if(n.id==="smith"){openPanel("smith");return;}
  if(n.id==="innkeep"){openPanel("inn");return;}
  if(n.id==="hermit"){
    if(S.pages>=3&&!(S.quests.sq_notes&&S.quests.sq_notes.done))openDlg("corv_done");else openDlg("corv");return;}
  if(n.id==="yua"){
    if(S.map==="gate"&&!S.flags.met_yua){openDlg("yua_gate");return;}
    if(rivalReady("yua")){openDlg("rival_yua");return;} // jealous? she acts first
    if(S.map==="silverwall"&&!S.flags.sworn){ // Act III guard posting
      if(!hasQuest("mq10"))giveQuest("mq10");
      if(!S.flags.yua_posted)openDlg("yua_city");
      else toast("Belladonna: \"The Rite Circle waiteth. Fell the blades first — then bind me.\"");girlVoice("belladonna","rite",0);
      return;}
    // sworn shield / follower barks (never re-runs the gate finale)
    if(rivalReady("yua")){openDlg("rival_yua");return;}
    var yb=["\"I trust thee wholly. ...The others, I audit still.\"",
      "\"Thou walk'st as one I have sworn to already. For thou art.\"",
      "\"(She noteth thy heartbeat. Steady. Good. Continue.)\""];
    if(S.flags.sworn)yb.push("\"Bid me halt, and I shall. That is my whole freedom.\"");
    var _yi=(Math.random()*yb.length)|0;
    toast("Belladonna: "+yb[_yi]);girlVoice("belladonna","bark",_yi);return;}
  if(n.id==="seraphina"){
    if(S.map==="spire"){
      if(!hasQuest("mq5"))giveQuest("mq5");
      if(!S.flags.met_seraphina)openDlg("seraphina_intro");
      else if(rivalReady("seraphina"))openDlg("rival_seraphina");
      else toast("Ruby: \"Haste thee east, to my capital. Court by day, balcony by night.\"");girlVoice("ruby","spire",0);
      return;}
    if(S.map==="spirecity"){ // court by day, balcony by night, report after the sky
      if(rivalReady("seraphina")){openDlg("rival_seraphina");return;} // jealous? she acts first
      if(hasQuest("mq7")&&!S.quests.mq7.done&&S.flags.sky_calm){openDlg("seraphina_after");return;}
      if(hasQuest("mq6")&&!S.quests.mq6.done){
        if(isNight()){ if(S.flags.court_seen)openDlg("seraphina_balcony");
          else toast("Ruby: \"First hear my court by day. Then the balcony.\"");girlVoice("ruby","balcony",0); }
        else openDlg("seraphina_court");
        return;}
      if(!hasQuest("mq6"))giveQuest("mq6");
      var _rci=isNight()?0:1;
      toast("Ruby: \""+(isNight()?"The balcony. Come, then.":"The court conveneth. Stand thou with me.")+"\"");girlVoice("ruby","court",_rci);return;}
    toast("Ruby: \"The Spires remember. Burn bright, little flame.\"");girlVoice("ruby","field",0);return;}
  if(n.id==="mira"){
    if(!S.flags.met_mira){
      if(!hasQuest("mq8"))giveQuest("mq8");
      var nb=(S.kill.bandit||0);
      if(nb>=3)openDlg("mira_meet");
      else{var _nb2=(S.kill.bandit||0);toast("Nyx: \"Reavers first, flirting later! Drive them off ("+_nb2+"/3)!\"");girlVoice("nyx","hunt",Math.min(2,_nb2));}
    }else if(!S.flags.mira_free)openDlg("mira_meet");
    else if(rivalReady("mira"))openDlg("rival_mira");
    else{var _nyi=(Math.random()*3)|0;
    toast("Nyx: \""+["Thy scent still strange. Still mine. (Tail: thunder.)","No leash, no orders — and yet here I stand. Beside thee.","The marsh-witch next? I shall sniff out her tower!"][_nyi]+"\"");
    girlVoice("nyx","bark",_nyi);return;}
  }
  if(n.id==="elowen"){
    if(!S.flags.met_elowen){
      if(!hasQuest("mq9"))giveQuest("mq9");
      openDlg("elowen_intro");
    }else if(rivalReady("elowen"))openDlg("rival_elowen");
    else{var _mni=(Math.random()*3)|0;
    toast("Minerva: \""+["The tower joineth minds at thy word. The vision awaiteth.","My veins recede a finger's width. Documented. ...Thank thee.","Thee first through the bog water. For science. And company."][_mni]+"\"");
    girlVoice("minerva","bark",_mni);return;}
  }
  if(n.id==="aria"){
    if(!S.flags.met_aria){
      if(!hasQuest("mq11"))giveQuest("mq11");
      openDlg("aria_intro");
    }else if(rivalReady("aria"))openDlg("rival_aria");
    else{var _dai=(Math.random()*3)|0;
    toast("Daisy: \""+["One selfish morning, soon! I am practicing ungraceful laughter.","The bells ring evermore. Hark — one is off-key. That one is MINE.","Hold my hand going down? I already asked. Asking again."][_dai]+"\"");
    girlVoice("daisy","bark",_dai);return;}
  }
  if(n.id==="lyra"){
    if(rivalReady("lyra")){openDlg("rival_lyra");return;} // jealous? she counts it first
    if(!S.flags.met_lyra){openDlg("lyra_intro");return;}
    var seals=(S.flags.seal1?1:0)+(S.flags.seal2?1:0)+(S.flags.seal3?1:0);
    if(!S.flags.aegis){
      if(seals>=3)openDlg("lyra_seals"); // safety: re-enter the waking if flags parted
      else openDlg("lyra_seals");
      return;}
    var _hmi=(Math.random()*LYRA_HOME.length)|0;
    toast("Lyra (within): \""+LYRA_HOME[_hmi]+"\"",5000);girlVoice("lyra","home",_hmi);
    return;}
}
var LILIANE_BARK=["Oath or no, I watch thee still. Stay thou un-stabbed.",
 "Thou fightest as a falling star: loud, bright, unsteered.",
 "The threads about thee tangle toward all. Take heed, fool.",
 "Should the curse take me, strike true. Promise it.",
 "Keep looking upon me thus and the Oath shall file complaint. ...Stay. A while."];

/* ---------- QUEST TRACKER ---------- */
function activeQuests(){return Object.keys(S.quests).filter(function(id){return !S.quests[id].done&&!S.quests[id].failed;});}
/* Top-right guidance: the single next story step + where to go. Modern narrator voice. */
function questHint(){
  function Q(id){return S.quests[id]&&!S.quests[id].done&&!S.quests[id].failed;}
  if(Q("mq1"))return "Speak with Rosalind — Outpost center";
  if(Q("mq2"))return (S.kill.wolf>=4)?"Return to Rosalind — Outpost":"Purge "+(4-S.kill.wolf)+" wolves — Greenwood north";
  if(Q("mq3"))return S.flags.has_fragment?"Bring the fragment to Rosalind":"Slay the Stag — Hollow (forest north)";
  if(Q("mq4"))return S.flags.mq4a?"Head EAST — Silverwall Gate":"Meet Rosalind — east platform, AFTER DARK";
  // the hidden passage stayeth obvious: while the grotto calleth, say so plainly
  if(Q("sq_archive"))return "Wake the sleeper — Hidden Grotto (cave, forest far west falls)";
  if(Q("hq_cave")&&!S.flags.mq4a)return "Find the falls — Hidden Grotto (forest far west)";
  if(!S.flags.met_yua&&S.map==="gate")return "Hear the knight out — Silverwall Gate";
  if(Q("mq5"))return "Meet Ruby — Ashen Approach (gate south)";
  if(Q("mq6"))return S.flags.court_seen?(isNight()?"Balcony — speak with Ruby":"Wait for night — Spire Capital"):"Court by day — Spire Capital (east)";
  if(Q("mq7"))return S.flags.sky_calm?"Return to Ruby — capital":"Slay the Sky-Node — vortex (capital north)";
  if(Q("mq8"))return (S.kill.bandit||0)>=3?"Speak with Nyx — Plains":"Drive off reavers ("+(S.kill.bandit||0)+"/3) — Plains (south)";
  if(Q("mq9"))return S.flags.met_elowen?"Tower vision — Marsh (east)":"Meet Minerva — Mistveil Marsh";
  if(Q("mq10"))return !S.flags.yua_posted?"Meet Belladonna — Silverwall (east)":(S.kill.assassin||0)>=2?"Rite Circle — Silverwall":"Fell Oathless blades ("+(S.kill.assassin||0)+"/2)";
  if(Q("mq11"))return S.flags.met_aria?(isNight()?"Side Chapel — Starlia":"Chapel after dark — Starlia"):"Meet Daisy — Starlia (east)";
  if(Q("mq12"))return "Walls of Starlia (south) — face Belladonna";
  if(Q("mq13"))return S.flags.devourer_beaten?"The Altar — CHOOSE":"Slay the Core — Depths (cathedral north)";
  return "Saga complete — wander freely ♥";
}
function refreshQuests(){
  var el=$("quest-tracker");var acts=activeQuests();
  // auto-grant starters
  if(!S.quests.mq1&&!S.quests.mq2&&!S.quests.mq3&&!S.quests.mq4&&!S.flags.oath_brave)giveQuestSilent("mq1");
  var html="<b>◈ "+(S.flags.act3||S.map==="silverwall"||S.map==="starlia"||S.map==="pit"?"Act III — "+MAPS[S.map].label:S.flags.act2||S.map==="spire"?"Ashen Approach — Act II":S.quests.mq4&&S.flags.mq4a?"Escape to Silverwall":MAPS[S.map].label)+"</b><br>";
  html+="<span class='qt-next' style='color:#ffe27a'>➤ "+questHint()+"</span>";
  el.innerHTML=html;
}
/* Quest compass edge — red = MAIN, yellow = side-ish, hidden = nothing.
   Mirrors questHint: which quest is tracked, and which map wanteth thee. */
function questTarget(){
  function Q(id){return S.quests[id]&&!S.quests[id].done&&!S.quests[id].failed;}
  var t=null;
  if(Q("mq1"))t={id:"mq1",map:"outpost"};
  else if(Q("mq2"))t={id:"mq2",map:(S.kill.wolf>=4)?"outpost":"forest"};
  else if(Q("mq3"))t={id:"mq3",map:S.flags.has_fragment?"outpost":"hollow"};
  else if(Q("mq4"))t={id:"mq4",map:S.flags.mq4a?"gate":"outpost"};
  else if(Q("sq_archive"))t={id:"sq_archive",map:"cave"};
  else if(Q("hq_cave")&&!S.flags.mq4a)t={id:"hq_cave",map:"forest"};
  else if(!S.flags.met_yua&&S.map==="gate")t={id:"mq4",map:"gate"};
  else if(Q("mq5"))t={id:"mq5",map:"spire"};
  else if(Q("mq6"))t={id:"mq6",map:(S.flags.court_seen&&!S.flags.sky_calm)?"sky":"spirecity"};
  else if(Q("mq7"))t={id:"mq7",map:S.flags.sky_calm?"spirecity":"sky"};
  else if(Q("mq8"))t={id:"mq8",map:"plains"};
  else if(Q("mq9"))t={id:"mq9",map:"marsh"};
  else if(Q("mq10"))t={id:"mq10",map:"silverwall"};
  else if(Q("mq11"))t={id:"mq11",map:"starlia"};
  else if(Q("mq12"))t={id:"mq12",map:"starlia"};
  else if(Q("mq13"))t={id:"mq13",map:"pit"};
  if(!t)return null;
  t.type=(RHE.QUESTS[t.id]||{}).type||"MAIN";
  return t;
}
var _edgeCache={edge:null,t:-9999};
function questEdge(time){
  if(!S)return null;
  if(time-_edgeCache.t<500)return _edgeCache.edge;
  _edgeCache.t=time;_edgeCache.edge=computeQuestEdge();
  return _edgeCache.edge;
}
function computeQuestEdge(){
  var t=questTarget();if(!t)return null;
  if(t.type==="HIDDEN"||t.type==="MYSTERY")return null; // hidden: nothing
  var col=(t.type==="MAIN")?"#e05252":"#ffd23f"; // main red, side-ish yellow
  var hint="";try{hint=questHint();}catch(e){}
  if(t.map===S.map){ // already here: read the hint's own compass word
    var h=String(hint).toLowerCase(),dir=null;
    if(h.indexOf("north")>=0)dir="top";
    else if(h.indexOf("south")>=0)dir="bottom";
    else if(h.indexOf("east")>=0)dir="right";
    else if(h.indexOf("west")>=0)dir="left";
    return dir?{edge:dir,col:col}:null;
  }
  // first hop toward the target map (secret mouths excluded)
  var prev={},seen={},q=[S.map];seen[S.map]=1;
  while(q.length){var m=q.shift();if(m===t.map)break;
    (MAPS[m].exits||[]).forEach(function(ex){if(ex.secret||seen[ex.map])return;
      seen[ex.map]=1;prev[ex.map]={from:m,ex:ex};q.push(ex.map);});}
  if(!seen[t.map])return null;
  var hop=t.map,ex=null;
  while(hop!==S.map){var p=prev[hop];if(!p)return null;ex=p.ex;hop=p.from;}
  if(!ex)return null;
  var M=MAPS[S.map],edge="top";
  if(ex.y===0)edge="top";else if(ex.y===M.h-1)edge="bottom";
  else if(ex.x===0)edge="left";else if(ex.x===M.w-1)edge="right";
  return {edge:edge,col:col};
}
/* Full quest journal for the ESC-menu Journal tab (the HUD shows only ➤ Next). */
function renderMenuJournal(){
  var order=["mq1","mq2","mq3","mq4","mq5","mq6","mq7","mq8","mq9","mq10","mq11","mq12","mq13",
    "sq_scout","sq_notes","sq_key","sq_bounty","rq_lil","hq_cave","sq_archive"];
  var prog={mq2:"Wolves "+Math.min(4,S.kill.wolf)+"/4",
    sq_bounty:"Beasts "+Math.min(6,S.kill.beast)+"/6",
    sq_notes:"Pages "+(S.pages||0)+"/3",
    sq_archive:"Seals "+((S.flags.seal1?1:0)+(S.flags.seal2?1:0)+(S.flags.seal3?1:0))+"/3"+(S.flags.aegis?" · Aegis woken":""),
    mq8:"Reavers "+Math.min(3,S.kill.bandit||0)+"/3",
    mq10:"Blades "+Math.min(2,S.kill.assassin||0)+"/2"};
  var h="<h3>📖 Journal — quests</h3>";
  order.forEach(function(id){
    var q=RHE.QUESTS[id];if(!q)return;var st=S.quests[id];
    var failed=st&&st.failed;
    var cls=st&&st.done?"done":(failed?"sealed":(st?"":"locked"));
    var mark=st&&st.done?"✔":(failed?"✖":(st?"➤":"·"));
    h+="<div class='quest "+cls+"'><h4>"+mark+" "+q.name+" <small>["+q.type+(failed?" — SEALED":"")+"]</small></h4><p>"+q.desc+"</p>";
    if(prog[id]&&(!st||(!st.done&&!st.failed)))h+="<p><span style='color:#9fb'>"+prog[id]+"</span></p>";
    h+="</div>";});
  h+="<h3>Factions & reputation</h3>";
  RHE.FACTIONS.forEach(function(f){h+="<p><b style='color:#d8b45c'>"+f.name+"</b> — "+f.desc+"</p>";});
  h+="<p>Greenwood rep: "+S.rep.greenwood+" · Silverwall rep: "+(S.rep.silverwall||0)+"</p>";
  return h;
}
/* The King's Decree — thy fate, writ LIVE. Recomputed from bonds, jealousy
   and meetings every time the tab renders: threads, progress, projection. */
var FATE_IDS=["liliane","yua","seraphina","mira","elowen","aria"];
var FATE_PAIRS=[["seraphina","mira","seramira","Fire & Fang"],["liliane","yua","lilyua","Oath & Shield"],["elowen","aria","eloaria","Ink & Bells"]];
function fateHot(id){return metHeroine(id)&&bondOf(id)>=8;}
function fatePairHot(a,b){return metHeroine(a)&&metHeroine(b)&&bondOf(a)>=8&&bondOf(b)>=8;}
function fateHaremHot(){var i;for(i=0;i<6;i++){if(!metHeroine(FATE_IDS[i])||bondOf(FATE_IDS[i])<6)return false;}return true;}
function fateLoveName(love){
  var names={liliane:"Rosalind",yua:"Belladonna",seraphina:"Ruby",mira:"Nyx",elowen:"Minerva",aria:"Daisy",
    seramira:"Ruby & Nyx",lilyua:"Rosalind & Belladonna",eloaria:"Minerva & Daisy",harem:"All Six",alone:"Alone",lyra:"Lyra"};
  return names[love]||love;
}
function renderMenuDecree(){
  var i,proj=projectEnding();
  var bound0=!!S.flags.soulbound; // her seal broken: she joineth the tree; ere then, hidden
  var ORDER=bound0?["lyra","liliane","yua","seraphina","mira","elowen","aria"]:["liliane","yua","seraphina","mira","elowen","aria"];
  var HY=bound0?function(i){return 140+i*58;}:function(i){return 170+i*60;},H=660,ROOTY=bound0?314:320;
  var s="<h3>👑 Decree — threads point to: <b style='color:#ffe27a'>"+fateLoveName(proj)+"</b> <small>(live)</small> <button class='btn small' data-mtab='controls' style='margin-left:12px'>◀ Menu</button></h3>";
  s+="<svg class='fate-svg' viewBox='0 0 740 "+H+"' style='width:100%;height:auto;display:block;background:#0b1220;border:1px solid #6b5a33;border-radius:6px'>";
  function esc(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;");}
  // Rin root
  s+="<circle cx='56' cy='"+ROOTY+"' r='16' fill='#1d2a5a' stroke='#d8b45c' stroke-width='2'/>";
  s+="<text x='56' y='"+(ROOTY+4)+"' text-anchor='middle' fill='#ffe9b0' font-size='13' font-weight='bold'>"+esc((S.name||"R")[0].toUpperCase())+"</text>";
  s+="<text x='56' y='"+(ROOTY+26)+"' text-anchor='middle' fill='#9a8254' font-size='10'>"+esc(S.name||"Rin")+"</text>";
  // heroine nodes + root threads — Lyra first, above Liliane.
  // Lyra showeth a STATE, never numbers: her heart is already wholly thine
  // and moveth never (locked by lore). Others grind bond/jeal; she is BOUND.
  for(i=0;i<ORDER.length;i++){var id=ORDER[i],r=RHE.ROMANCE[id],y=HY(i);
    if(id==="lyra"){
      var met=metHeroine(id),bound=!!S.flags.soulbound;
      var w="5.2",op=met?"0.9":"0.12";
      s+="<path d='M72,"+ROOTY+" C150,"+ROOTY+" 160,"+y+" 236,"+y+"' fill='none' stroke='"+r.thread+"' stroke-width='"+w+"' opacity='"+op+"'/>"+(proj==="lyra"?"<path class='fated' d='M72,"+ROOTY+" C150,"+ROOTY+" 160,"+y+" 236,"+y+"' fill='none' stroke='"+r.thread+"' stroke-width='"+(+w+3)+"' opacity='0.4'/>":"");
      s+="<circle cx='252' cy='"+y+"' r='13' fill='#14100c' stroke='"+(bound?"#ffe27a":r.thread)+"' stroke-width='"+(bound?3:2)+"' opacity='"+(met?1:0.4)+"'/>";
      if(bound)s+="<circle cx='252' cy='"+y+"' r='17' fill='none' stroke='#ffe27a' stroke-width='1' opacity='0.5'/>";
      s+="<text x='252' y='"+(y+4)+"' text-anchor='middle' fill='"+r.thread+"' font-size='11' font-weight='bold'>"+esc(r.name[0])+"</text>";
      s+="<text x='270' y='"+(y-2)+"' fill='#e9d8a6' font-size='14' font-weight='bold'>"+esc(r.name)+"</text>";
      s+="<text x='270' y='"+(y+13)+"' fill='#9fb' font-size='11'>"+(bound?"BOUND ♥ · evermore":(met?"sealed — wake her":"· unmet"))+"</text>";
      continue;
    }
    var b=bondOf(id),j=jealOf(id);
    var w2=(1.5+Math.min(30,b)/8).toFixed(1),op2=(0.25+0.65*Math.min(1,b/24)).toFixed(2);
    var met2=metHeroine(id);
    s+="<path d='M72,"+ROOTY+" C150,"+ROOTY+" 160,"+y+" 236,"+y+"' fill='none' stroke='"+r.thread+"' stroke-width='"+w2+"' opacity='"+(met2?op2:0.12)+"'/>"+(proj===id||(proj==="harem")?"<path class='fated' d='M72,"+ROOTY+" C150,"+ROOTY+" 160,"+y+" 236,"+y+"' fill='none' stroke='"+r.thread+"' stroke-width='"+(+w2+3)+"' opacity='0.4'/>":"");
    s+="<circle cx='252' cy='"+y+"' r='13' fill='#14100c' stroke='"+r.thread+"' stroke-width='2' opacity='"+(met2?1:0.4)+"'/>";
    s+="<text x='252' y='"+(y+4)+"' text-anchor='middle' fill='"+r.thread+"' font-size='11' font-weight='bold'>"+esc(r.name[0])+"</text>";
    s+="<text x='270' y='"+(y-2)+"' fill='#e9d8a6' font-size='14' font-weight='bold'>"+esc(r.name)+"</text>";
    s+="<text x='270' y='"+(y+13)+"' fill='#9fb' font-size='11'>bond "+b+" · jeal "+j+(met2?"":" · unmet")+"</text>";
  }
  // ending leaves
  function leaf(x,y,label,sub,lit,fated){
    s+="<g opacity='"+(lit?1:0.38)+"'>";
    if(fated)s+="<rect x='"+(x-86)+"' y='"+(y-14)+"' width='172' height='28' rx='7' fill='none' stroke='#ffe27a' stroke-width='3' opacity='0.5' class='fated-halo'/>";
    s+="<rect x='"+(x-86)+"' y='"+(y-14)+"' width='172' height='28' rx='7' fill='#14100c' stroke='"+(fated?"#ffe27a":"#6b5a33")+"' stroke-width='"+(fated?2:1)+"'/>";
    s+="<text x='"+x+"' y='"+(y-2)+"' text-anchor='middle' fill='"+(fated?"#ffe27a":"#e9d8a6")+"' font-size='13' font-weight='bold'>"+esc(label)+"</text>";
    s+="<text x='"+x+"' y='"+(y+10)+"' text-anchor='middle' fill='#9fb' font-size='10'>"+esc(sub)+"</text></g>";
    return fated;
  }
  function ex(x1,y1,x2,y2,col,w,op,fd){
    s+="<path d='M"+x1+","+y1+" C"+(x1+60)+","+y1+" "+(x2-60)+","+y2+" "+x2+","+y2+"' fill='none' stroke='"+col+"' stroke-width='"+w+"' opacity='"+op+"'/>"+(fd?"<path class='fated' d='M"+x1+","+y1+" C"+(x1+60)+","+y1+" "+(x2-60)+","+y2+" "+x2+","+y2+"' fill='none' stroke='"+col+"' stroke-width='"+(w+3)+"' opacity='0.4'/>":"");
  }
  // harem leaf (top): fan of the SIX threads — Lyra is evermore, not counted
  var hOk=fateHaremHot(),hF=proj==="harem";
  for(i=0;i<6;i++){var id2=FATE_IDS[i];
    ex(268,HY(ORDER.indexOf(id2)),514,60,RHE.ROMANCE[id2].thread,1,metHeroine(id2)?0.3:0.1,hF);}
  leaf(600,60,"All Six",hOk?"burning ♥":"needs all 6",hOk,hF);
  // solo leaves: one path per heroine — Lyra's leaf sitteth topmost, above Liliane
  for(i=0;i<ORDER.length;i++){var id3=ORDER[i],y3=HY(i);
    if(id3==="lyra"){
      var met3=metHeroine(id3),bound3=!!S.flags.soulbound,fd3=proj==="lyra";
      ex(268,y3,514,y3,RHE.ROMANCE[id3].thread,bound3?5.5:1.5,met3?0.9:0.15,fd3);
      leaf(600,y3,RHE.ROMANCE[id3].name,bound3?"evermore ♥":(met3?"sealed":"unmet"),met3,fd3);
      continue;
    }
    var ok=fateHot(id3),fd=proj===id3;
    ex(268,y3,514,y3,RHE.ROMANCE[id3].thread,1.5+bondOf(id3)/10,metHeroine(id3)?0.75:0.15,fd);
    leaf(600,y3,RHE.ROMANCE[id3].name,ok?"burning ♥":"bond "+bondOf(id3)+"/8",ok,fd);}
  // pair leaves
  var pairs=[["seraphina","mira","seramira","Fire & Fang"],["liliane","yua","lilyua","Oath & Shield"],["elowen","aria","eloaria","Ink & Bells"]];
  var py={seramira:Math.round((HY(ORDER.indexOf("seraphina"))+HY(ORDER.indexOf("mira")))/2),
    lilyua:Math.round((HY(ORDER.indexOf("liliane"))+HY(ORDER.indexOf("yua")))/2),
    eloaria:Math.round((HY(ORDER.indexOf("elowen"))+HY(ORDER.indexOf("aria")))/2)};
  for(i=0;i<3;i++){var a=pairs[i],ok2=fatePairHot(a[0],a[1]),fd2=proj===a[2];
    var ia=ORDER.indexOf(a[0]),ib=ORDER.indexOf(a[1]);
    ex(268,HY(ia),514,py[a[2]],RHE.ROMANCE[a[0]].thread,1.5,0.5,fd2);
    ex(268,HY(ib),514,py[a[2]],RHE.ROMANCE[a[1]].thread,1.5,0.5,fd2);
    leaf(600,py[a[2]],a[3],ok2?"burning ♥":"both 8",ok2,fd2);}
  // alone leaf — only ere the waking: once soulbound, solitude is no fate,
  // and the leaf leaveth the tree as she hath left the wall
  if(!S.flags.soulbound){
    var aF=proj==="alone";
    ex(72,ROOTY,514,520,"#565664",1.5,0.5,aF);
    leaf(600,520,"Alone","ever open",true,aF);
  }
  // ---- decree voice fused INTO the tree: counsel, notes and legend render
  // as SVG rows beneath the threads — one scaled thing, nothing cut off ----
  var rows=[];
  (function(){
    var alts=FATE_IDS.filter(function(id){return id!==proj&&metHeroine(id);})
      .sort(function(a,b){return (bondOf(b)-jealOf(b))-(bondOf(a)-jealOf(a));})[0];
    var bits=[];
    if(alts)bits.push(RHE.ROMANCE[alts].name+" solo — score "+(bondOf(alts)-jealOf(alts))+" (devotion: 14+, lead 6)");
    var pd=[["seraphina","mira","Fire & Fang"],["liliane","yua","Oath & Shield"],["elowen","aria","Ink & Bells"]]
      .map(function(p){return {t:p[2],a:p[0],b:p[1],s:Math.min(bondOf(p[0]),bondOf(p[1]))};})
      .sort(function(a,b){return b.s-a.s;})[0];
    if(pd&&pd.t!==fateLoveName(proj))bits.push(pd.t+" — "+bondOf(pd.a)+"+"+bondOf(pd.b)+" (top-two within 5, both 8+)");
    var tj=0,q;for(q=0;q<6;q++)tj+=jealOf(FATE_IDS[q]);
    var hb=[];for(q=0;q<6;q++){if(bondOf(FATE_IDS[q])<6)hb.push(RHE.ROMANCE[FATE_IDS[q]].name+" "+bondOf(FATE_IDS[q])+"/6");}
    if(tj>10)hb.push("calm "+(tj-10)+" jealousy");
    if(proj!=="harem"&&hb.length)bits.push("All Six — "+hb.slice(0,3).join(", "));
    var joined=bits.slice(0,2).join(" · ");
    if(joined)rows.push({t:"To bend thy fate: "+joined,fill:"#cfe0ff"});
    else rows.push({t:"Thy fate holdeth steady — no nearer thread.",fill:"#cfe0ff"});
  })();
  if(S.flags.soulbound)rows.push({t:"Yet beyond all threads: Lyra dwelleth within thy chest — solitude is no longer among thy fates.",fill:"#ffe27a"});
  else if(S.flags.met_lyra)rows.push({t:"Lyra dreameth thee still, sealed in the Hidden Grotto — wake her.",fill:"#ffe27a"});
  rows.push({t:"Bright threads burn strong · dim faint · pulsing = thy fate · Household: all met, all 6 · Devotion 14+, lead 6 · Pairs: top two, both 8+ · else truest heart, else solitude.",fill:"#9a8a6a"});
  if(bound0)rows.push({t:"Lyra sitteth above all: already wholly thine — BOUND, not ground.",fill:"#9a8a6a"});
  rows.push({t:"Touch the tree to gaze closer · drag to wander · touch again to release.",fill:"#565664"});
  var wrapped=[];
  rows.forEach(function(r){var words=String(r.t).split(" "),line="";
    words.forEach(function(w){if((line+" "+w).trim().length>92){wrapped.push({t:line.trim(),fill:r.fill});line=w;}else line=(line+" "+w);});
    if(line.trim())wrapped.push({t:line.trim(),fill:r.fill});});
  wrapped=wrapped.slice(0,6);
  s+="<line x1='20' y1='550' x2='720' y2='550' stroke='#6b5a33' stroke-width='1' opacity='0.7'/>";
  wrapped.forEach(function(r,i){
    s+="<text x='370' y='"+(568+i*16)+"' text-anchor='middle' fill='"+r.fill+"' font-size='12' font-family='Georgia,serif'>"+esc(r.t)+"</text>";});
  s+="</svg>";
  return s;
}
function giveQuestSilent(id){S.quests[id]={stage:0,done:false};}

/* ---------- PANELS (inventory/journal/map/relations/shops) ---------- */
var panelKind=null;
var decreeView={z:1,cx:370,cy:330}; // fate-tree gaze: 1 = whole, >1 = drawn closer
function clampDecree(){var H=660,vw=740/decreeView.z,vh=H/decreeView.z;
  decreeView.cx=Math.min(740-vw/2,Math.max(vw/2,decreeView.cx));
  decreeView.cy=Math.min(H-vh/2,Math.max(vh/2,decreeView.cy));}
function applyDecreeView(){var f=document.querySelector("#panel-body .fate-svg");if(!f)return;
  clampDecree();var H=660,vw=740/decreeView.z,vh=H/decreeView.z;
  var vx=Math.min(740-vw,Math.max(0,decreeView.cx-vw/2)),vy=Math.min(H-vh,Math.max(0,decreeView.cy-vh/2));
  f.setAttribute("viewBox",vx+" "+vy+" "+vw+" "+vh);
  f.style.cursor=decreeView.z>1?"grab":"zoom-in";}
function openPanel(kind){panelKind=kind;hideLocBanner();
  if(kind==="menu")RHE.menuTab=RHE.menuTab||"controls";
  if(kind==="menu"){try{if(RHE.Audio.bgmName!==RHE.Audio.BGM.menu){RHE.Audio._preMenu=RHE.Audio.bgmName;RHE.Audio.playBGM(RHE.Audio.BGM.menu);}}catch(e){}}
  if(kind==="map")RHE.mapView={mode:"all",id:null,ox:0,oy:0};
  RHE.Audio.ui();$("panel").classList.remove("hidden");renderPanel();}
function closePanel(){var wasMenu=(panelKind==="menu");$("panel").classList.add("hidden");$("panel").classList.remove("map-full");panelKind=null;
  if(wasMenu){try{var pm=RHE.Audio._preMenu;RHE.Audio._preMenu=null;if(pm)RHE.Audio.playBGM(pm);}catch(e){}}}
function renderPanel(){
  var T=$("panel-title"),B=$("panel-body");
  // fullscreen frames: world map, relationships, and the King's Decree fate-gaze
  $("panel").classList.toggle("map-full",panelKind==="map"||panelKind==="rel"||(panelKind==="menu"&&(RHE.menuTab||"controls")==="decree"));
  $("panel").classList.toggle("decree",panelKind==="menu"&&(RHE.menuTab||"controls")==="decree");
  if(panelKind==="inv"){T.textContent="INVENTORY — "+S.gold+"g";
    var h="<div class='inv-grid'>";
    Object.keys(S.inv).forEach(function(id){var it=RHE.ITEMS[id];if(!it||S.inv[id]<=0)return;
      h+="<div class='item'><b>"+it.name+" ×"+S.inv[id]+"</b><br><i>"+it.desc+"</i><br>";
      if(it.type==="use")h+="<button class='btn small' data-use='"+id+"'>Use [1-4]</button> ";
      if(it.type==="weapon"||it.type==="armor"||it.type==="trinket")h+="<button class='btn small' data-eq='"+id+"'>Equip</button>";h+="</div>";});
    h+="</div><h3>Equipped</h3><p>Weapon: "+(S.equip.weapon?RHE.ITEMS[S.equip.weapon].name:"—")+" · Armor: "+(S.equip.armor?RHE.ITEMS[S.equip.armor].name:"—")+" · Trinket: "+(S.equip.trinket?RHE.ITEMS[S.equip.trinket].name:"—")+"</p>";
    h+="<h3>Crafting (field)</h3><p><button class='btn small' data-craft='potion'>Brew tonic: 2 bread + 1 flower (need both)</button></p>";
    B.innerHTML=h;}
  else if(panelKind==="char"){var c=RHE.CLASSES[S.cls];T.textContent="CHARACTER — "+(S.name||"Rin")+" · "+c.name+" · Lv "+S.lvl;
    B.innerHTML="<table><tr><th>HP</th><td>"+Math.round(S.hp)+"/"+S.maxhp+"</td><th>MP</th><td>"+Math.round(S.mp)+"/"+S.maxmp+"</td></tr>"+
    "<tr><th>ATK</th><td>"+effAtk()+"</td><th>DEF</th><td>"+effDef()+"</td></tr>"+
    "<tr><th>MAG</th><td>"+effMag()+"</td><th>Skill</th><td>"+c.skill.name+" (Q, "+c.skill.cost+"mp)</td></tr></table>"+
    "<p><i>"+c.desc+"</i></p><p>XP "+S.xp+"/"+S.xpn+" · Gold "+S.gold+"g · Kills "+S.kill.beast+"</p>"+
    "<p>Oath: "+(S.flags.oath_brave?"you offered yourself":"Rosalind bears it alone")+" · Fragment: "+(S.flags.has_fragment?"held":"—")+"</p>";}
  else if(panelKind==="journal"){T.textContent="JOURNAL";
    var h="<h3>Main & side quests</h3>";
    Object.keys(RHE.QUESTS).forEach(function(id){var q=RHE.QUESTS[id];var st=S.quests[id];
      if(!st&&(id==="sq_key"||id==="hq_cave"||id==="sq_archive"||id==="sq_notes"||id==="sq_bounty"||id==="rq_lil"))return;
      h+="<div class='quest"+(st&&st.done?" done":"")+(st&&st.failed?" sealed":"")+"'><h4>"+(st&&st.failed?"✖ ":"")+q.name+" <small>["+q.type+(st&&st.failed?" — SEALED":"")+"]</small></h4><p>"+q.desc+"</p></div>";});
    h+="<h3>Factions & reputation</h3>";
    RHE.FACTIONS.forEach(function(f){h+="<p><b style='color:#d8b45c'>"+f.name+"</b> — "+dlgFill(f.desc)+"</p>";});
    h+="<p>Greenwood rep: "+S.rep.greenwood+" · Silverwall rep: "+(S.rep.silverwall||0)+"</p>";
    h+="<h3>Codex</h3>";RHE.CODEX_LORE.forEach(function(c){h+="<p><b>"+dlgFill(c[0])+"</b><br>"+dlgFill(c[1])+"</p>";});
    B.innerHTML=h;}
  else if(panelKind==="log"){T.textContent="CHRONICLE — this session";
    var h="<h3>📜 Chronicle</h3><p><i>Dialogue spoken, barks and quest-marks, as they happened. Session only — cleared on refresh or reopen.</i></p><p><button class='btn small' data-clearlog='1'>Clear log</button></p>";
    if(!sessionLog.length)h+="<p><i>Nothing yet. Go forth — the threads will remember (until refresh).</i></p>";
    sessionLog.slice().reverse().forEach(function(e){
      var col=e.kind==="quest"?"#ffe27a":e.kind==="say"?"#7fc76a":e.kind==="you"?"#7ac2ff":e.kind==="fate"?"#c77dff":"#9a8a6a";
      h+="<div class='quest'><h4 style='color:"+col+"'>"+e.kind+" <small>· "+escLog(e.when)+"</small></h4><p>"+escLog(e.text)+"</p></div>";});
    B.innerHTML=h;}
  else if(panelKind==="rel"){T.textContent="RELATIONSHIPS — threads";
    RHE.relSel=RHE.relSel||"liliane";
    var sel=RHE.relSel, met0={liliane:1,yua:S.metYua,seraphina:S.flags.met_seraphina,mira:S.flags.met_mira,elowen:S.flags.met_elowen,aria:S.flags.met_aria,lyra:S.flags.met_lyra};
    var h="<div class='rel-wrap'><div class='rel-roster'>";
    Object.keys(RHE.ROMANCE).forEach(function(id){var r=RHE.ROMANCE[id],v=S.rom[id]||{aff:0,trust:0,close:0,jeal:0};
      if(id==="lyra"&&!met0.lyra)return; // she is no rumor: no board, no face, until met
      var hh=met0[id]?heart(Math.max(0,Math.min(5,Math.round(((v.aff||0)+(v.close||0))/2)))):"???";
      h+="<button class='rel-row"+(id===sel?" sel":"")+"' data-rel='"+id+"'>"+
        (met0[id]?(r.portrait?"<img src='"+r.portrait+"'>":"<div class='rel-mini' style='background:"+r.thread+"'>"+r.name[0]+"</div>"):"<div class='rel-mini' style='background:#1a1a22;color:#777;border:1px solid #444'>?</div>")+
        "<span><b style='color:"+(met0[id]?r.thread:"#777")+"'>"+(met0[id]?r.name:"???")+"</b><br><small class='hearts'>"+hh+"</small>"+((met0[id]&&(v.jeal||0)>0)?" <small style='color:#e05252'>🔥"+v.jeal+"</small>":"")+(met0[id]?"":"<br><small>unmet</small>")+"</span></button>";});
    h+="</div><div class='rel-detail'>";
    (function(){var r=RHE.ROMANCE[sel],v=S.rom[sel]||{aff:0,trust:0};
      if(!met0[sel]){ // unmet: no face, no name, no numbers, no buttons
        h+="<div class='rel-head'><div class='rel-dimg' style='background:#1a1a22;color:#777'>?</div>"+
        "<div><b style='font-size:17px'>???</b> — <i>unmet</i>"+(sel==="yua"?" <small>(??? — meet at the gate)</small>":" <small>(unmet — find them in the world)</small>")+
        "<br><span>???</span></div></div>"+
        "<p><small>Someone yet unmet. The threads have not revealed them.</small></p>";
        return;}
      var locked="";
      h+="<div class='rel-head'>"+(r.portrait?"<img src='"+r.portrait+"'>":"<div class='rel-dimg' style='background:"+r.thread+"'>"+r.name[0]+"</div>")+
       "<div><b style='color:"+r.thread+";font-size:17px'>"+r.name+"</b> — "+r.title+" · <b>"+r.dere+"</b>"+locked+
       "<br><span>♥ "+heart(Math.max(0,Math.min(5,Math.round(((v.aff||0)+(v.close||0))/2))))+" aff "+(v.aff||0)+" · trust "+(v.trust||0)+" · resp "+(v.respect||0)+" · jeal "+(v.jeal||0)+" · loyal "+(v.loyal||0)+" · close "+(v.close||0)+"</span></div></div>"+
        "<p><small>"+dlgFill(r.outer)+"<br><i>Wound: "+dlgFill(r.inner)+"</i><br><i style='color:#d8b45c'>Past ("+(r.pastTone||"untold")+"): "+dlgFill(r.past||"The threads have not revealed it yet.")+"</i></small></p>"+
       "<p><button class='btn small' data-gift='"+sel+"'>Give gift</button> <button class='btn small' data-talk='"+sel+"'>Talk</button> <button class='btn small' data-date='"+sel+"'>Date (20g)</button>"+(devEligible(sel)?" <button class='btn small' data-dev='"+sel+"'>💍 Vow</button>":"")+(S.flags["devoted_"+sel]?" <small>💍 vowed</small>":"")+"</p>";})();
    h+="</div></div>";
    h+="<p class='rel-foot'><small>Affection · Trust · Respect · Jealousy · Loyalty · Closeness (cap <b>8</b>, 💍 Vow needs bond <b>20+</b> with trust, respect & loyalty <b>5+</b> each, opens <b>10</b>) · Date melteth HER jealousy · At <b>3+ (Belladonna 2+)</b> she competeth for thee.</small></p>";
    B.innerHTML=h;}
  else if(panelKind==="map"){var _mv=RHE.mapView||{mode:"all"};
    T.textContent=(_mv.mode==="one"&&MAPS[_mv.id])?("WORLD MAP — "+MAPS[_mv.id].label):"WORLD MAP — All Realms (Acts I–III)";
    B.innerHTML=((_mv.mode==="one")?"<p><button class='btn small' data-mapback='1'>◀ All realms</button></p>":"")+"<canvas id='worldmap' width='760' height='520' style='max-width:100%;border:1px solid #d8b45c;border-radius:6px;display:block;margin:0 auto'></canvas><div id='map-detail'></div>"+
    "<p class='map-legend'>Drag to pan · click a realm to inspect · double-click resets · ◀ white arrow is you · <span style='color:#7fc76a'>●</span> NPC · <span style='color:#e05252'>●</span> beast · <span style='color:#ffd23f'>◆</span> POI (gold, pulsing — go touch it) · gold edge = exit · red = sealed · <span style='color:#5aa9e6'>◆</span> blue portal = secret.</p>";
    drawWorldMap();}
  else if(panelKind==="shop"||panelKind==="smith"){var isSmith=panelKind==="smith";T.textContent=isSmith?"SMITHY — Hilda":"PEDDLER — Odo (day only)";
    var stock=isSmith?["sword1","armor1","armor2","potion"]:["potion","bread","manacake","antidote","flower","comb"];
    var h="<p>Gold: "+S.gold+"g · "+(isSmith?"\"Bounty board: 6 beasts, 80g. Say the word.\"":"\"Moonpetals for your elf, friend? She pretends not to like them.\"")+"</p><div class='inv-grid'>";
    stock.forEach(function(id){var it=RHE.ITEMS[id];h+="<div class='item'><b>"+it.name+" — "+(it.price||0)+"g</b><br><i>"+it.desc+"</i><br><button class='btn small' data-buy='"+id+"'>Buy</button></div>";});
    h+="</div>";
    if(isSmith&&!S.quests.sq_bounty)h+="<p><button class='btn small' data-bounty='1'>Take bounty: Thorn Nest</button></p>";
    else if(isSmith&&S.quests.sq_bounty&&!S.quests.sq_bounty.done&&S.kill.beast>=6)h+="<p><button class='btn small' data-bounty='2'>Claim bounty (80g)</button></p>";
    B.innerHTML=h;}
  else if(panelKind==="inn"){T.textContent="MARTA'S INN";
    B.innerHTML="<p>Rest until morning (10g, full heal)? Time now: "+hourStr()+".</p><p><button class='btn' data-rest='1'>Rest [10g]</button> <button class='btn' data-buy='bread'>Buy bread 8g</button> <button class='btn' data-buy='potion'>Buy tonic 25g</button></p><p><i>Fen's patrol didn't come back...</i></p>";}
  else if(panelKind==="menu"){T.textContent="MENU — "+(S.name||"Rin");
    var tab=RHE.menuTab||"controls";
    function side(id,label){return "<button class='btn small menu-btn"+(tab===id?" sel":"")+"' data-mtab='"+id+"'>"+label+"</button>";}
    var h="<div class='menu-wrap'><div class='menu-side'>"+
      "<button class='btn small menu-btn' data-resume='1'>▶ Resume</button>"+
      side("journal","📖 Journal")+side("decree","👑 King's Decree")+side("save","💾 Save Game")+side("load","📂 Load Game")+side("controls","🎮 Controls")+
      "<button class='btn small menu-btn' data-logtab='1'>📜 Chronicle [L]</button>"+
      "<button class='btn small menu-btn' data-mute='1'>🔊 Sound: "+(RHE.Audio.muted?"OFF":"ON")+"</button>"+
      "<button class='btn small menu-btn' data-title='1'>🚪 Quit to Title</button></div><div class='menu-main'>";
    if(tab==="journal"){
      h+=renderMenuJournal();
    }else if(tab==="decree"){
      h+=renderMenuDecree();
    }else if(tab==="save"){
      h+="<h3>Save Game</h3><p>Progress, bonds, and threads are sealed in the chosen slot.</p>"+
        "<p><button class='btn' data-save='1'>Save — Slot 1</button> <button class='btn' data-save='2'>Save — Slot 2</button></p>";
    }else if(tab==="load"){
      h+="<h3>Load Game</h3><p>Return to a sealed moment. Unsaved threads will be lost.</p>"+
        "<p><button class='btn' data-loadm='1'>Load — Slot 1"+(slotTime(1)?" <small>("+slotTime(1)+")</small>":" <small>(empty)</small>")+"</button> <button class='btn' data-loadm2='1'>Load — Slot 2"+(slotTime(2)?" <small>("+slotTime(2)+")</small>":" <small>(empty)</small>")+"</button> <button class='btn' data-loadm0='1'>Load — Auto"+(slotTime(0)?" <small>("+slotTime(0)+")</small>":" <small>(empty)</small>")+"</button></p>";
    }else{
      h+="<h3>🎮 Control Layout <small style='opacity:.6'>— Keyboard</small></h3>"+
      "<div class='ctl-group'><h4>✛ Movement</h4>"+
      "<div class='ctl-row'><span>Move</span><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows</span></div>"+
      "<div class='ctl-row'><span>Sprint</span><span><kbd>Shift</kbd> (hold, drains ⚡)</span></div></div>"+
      "<div class='ctl-group'><h4>✋ Interaction</h4>"+
      "<div class='ctl-row'><span>Talk / enter</span><span><kbd>E</kbd></span></div>"+
      "<div class='ctl-row'><span>Loot</span><span>automatic — walk over</span></div>"+
      "<div class='ctl-row'><span>Confirm / advance</span><span><kbd>Enter</kbd></span></div></div>"+
      "<div class='ctl-group'><h4>⚔ Combat</h4>"+
      "<div class='ctl-row'><span>Attack</span><span><kbd>Space</kbd></span></div>"+
      "<div class='ctl-row'><span>Class skill</span><span><kbd>Q</kbd></span></div>"+
      "<div class='ctl-row'><span>Guardian counsel (Aegis, once woken)</span><span><kbd>T</kbd></span></div>"+
      "<div class='ctl-row'><span>Soulbloom nova (Lyra, once soulbound)</span><span><kbd>F</kbd></span></div>"+
      "<div class='ctl-row'><span>Quick-use tonic / food</span><span><kbd>1</kbd>–<kbd>4</kbd></span></div></div>"+
      "<div class='ctl-group'><h4>🗺 Menus</h4>"+
      "<div class='ctl-row'><span>Inventory</span><span><kbd>I</kbd></span></div>"+
      "<div class='ctl-row'><span>Character</span><span><kbd>C</kbd></span></div>"+
      "<div class='ctl-row'><span>World map</span><span><kbd>M</kbd></span></div>"+
      "<div class='ctl-row'><span>Journal / quests</span><span><kbd>J</kbd></span></div>"+
      "<div class='ctl-row'><span>Relationships</span><span><kbd>R</kbd></span></div>"+
      "<div class='ctl-row'><span>System menu</span><span><kbd>Esc</kbd></span></div>"+
      "<div class='ctl-row'><span>Session chronicle</span><span><kbd>L</kbd></span></div></div>"+
      "<p><i>Goal: Greenwood → Spires → Starlia. The quest tracker (top right) always shows thy next step.</i></p>";
    }
    h+="</div></div>";
    B.innerHTML=h;
    if(panelKind==="menu"&&(RHE.menuTab||"controls")==="decree")fitDecree();}
  // wire buttons
  // wire buttons
  B.querySelectorAll("button").forEach(function(b){
    b.onclick=function(){RHE.Audio.ui();
      if(b.dataset.use)useItem(b.dataset.use);
      if(b.dataset.eq)equipItem(b.dataset.eq);
      if(b.dataset.buy)buyItem(b.dataset.buy);
      if(b.dataset.rest){if(S.gold>=10){S.gold-=10;S.hp=S.maxhp;S.mp=S.maxmp;S.time=7;S.day++;Object.keys(S.rom).forEach(function(w){if(w==="lyra")return;S.rom[w].jeal=Math.max(0,(S.rom[w].jeal||0)-1);});enterMap(S.map,S.x,S.y,true);toast("Rested. Day "+S.day+". Hearts cool a little.");}else toast("Not enough gold.");}
      if(b.dataset.bounty==="1"){giveQuest("sq_bounty");}
      if(b.dataset.bounty==="2"){doneQuest("sq_bounty");S.gold+=80;toast("+80g bounty!");}
      if(b.dataset.craft){if((S.inv.bread||0)>=1&&(S.inv.flower||0)>=1){S.inv.bread--;S.inv.flower--;addItem("potion",2);}else toast("Need 1 bread + 1 flower.");}
      if(b.dataset.save){var _sl=b.dataset.save;save(_sl);
        setTimeout(function(){var nb=document.querySelector("#panel-body button[data-save='"+_sl+"']");
          if(nb){nb.disabled=true;nb.innerHTML="Sealing…";}},30);
        setTimeout(function(){var nb2=document.querySelector("#panel-body button[data-save='"+_sl+"']");
          if(nb2){nb2.innerHTML="Saved in Slot "+_sl+" ✓";nb2.classList.add("sealed-ok");}},700);
        setTimeout(function(){if(panelKind==="menu")renderPanel();},2200);}
      if(b.dataset.loadm){if(load(1)){closePanel();bigToast("Loaded.");}else toast("No save.");}
      if(b.dataset.loadm2){if(load(2)){closePanel();bigToast("Loaded.");}else toast("No save in slot 2.");}
      if(b.dataset.loadm0){if(load(0)){closePanel();bigToast("Loaded (auto).");}else toast("No auto save.");}
      if(b.dataset.resume)closePanel();
      if(b.dataset.logtab)openPanel("log");
      if(b.dataset.clearlog)sessionLog=[];
      if(b.dataset.mtab){RHE.menuTab=b.dataset.mtab;}
      if(b.dataset.mapback){RHE.mapView={mode:"all",id:null,ox:0,oy:0};}
      if(b.dataset.mute){RHE.Audio.updateMute(!RHE.Audio.muted);toast("Sound "+(RHE.Audio.muted?"off.":"on."));}
      if(b.dataset.title)location.reload();
      if(b.dataset.gift)giveGift(b.dataset.gift);
      if(b.dataset.talk)talkBond(b.dataset.talk);
      if(b.dataset.date)dateInvite(b.dataset.date);
      if(b.dataset.dev)devInvite(b.dataset.dev);
      if(b.dataset.rel){RHE.relSel=b.dataset.rel;}
      renderPanel();refreshQuests();updateHUD();};
  });
  // fate-tree gaze: touch to draw closer, drag to wander, touch again to release
  if(panelKind==="menu"&&(RHE.menuTab||"controls")==="decree"){
    applyDecreeView();
    (function(){var fsvg=B.querySelector(".fate-svg");if(!fsvg)return;
      var drag=null,moved=0;
      function toSVG(e){var r=fsvg.getBoundingClientRect(),vb=fsvg.viewBox.baseVal;
        return {x:vb.x+(e.clientX-r.left)/r.width*vb.width,y:vb.y+(e.clientY-r.top)/r.height*vb.height};}
      fsvg.addEventListener("pointerdown",function(e){drag=toSVG(e);moved=0;
        try{fsvg.setPointerCapture(e.pointerId);}catch(_){}});
      fsvg.addEventListener("pointermove",function(e){if(!drag||decreeView.z<=1)return;
        var p=toSVG(e);moved+=Math.abs(p.x-drag.x)+Math.abs(p.y-drag.y);
        decreeView.cx-=p.x-drag.x;decreeView.cy-=p.y-drag.y;
        applyDecreeView();drag=p;});
      function endGaze(e){if(!drag)return;var wasDrag=moved>14;drag=null;
        if(wasDrag)return;
        var p=toSVG(e);
        if(decreeView.z>1){decreeView.z=1;decreeView.cx=370;decreeView.cy=330;}
        else{decreeView.z=2.2;decreeView.cx=p.x;decreeView.cy=p.y;}
        renderPanel();refreshQuests();updateHUD();}
      fsvg.addEventListener("pointerup",endGaze);
      fsvg.addEventListener("pointercancel",function(){drag=null;});
    })();
  }
}
/* Dates — one soft evening each: 20g, +3h, once a day per heroine.
   Her jealousy melteth to naught; the other met heroines mark thy absence (+1, max 5). */
function metHeroine(id){
  if(id==="liliane")return true;
  if(id==="yua")return !!(S.metYua||S.flags.met_yua);
  return !!S.flags["met_"+id];
}
function dateAgain(id){
  return {liliane:"...Again? Twice in one day? ...Bold. To-morrow. (Maybe.)",
   yua:"...To-day already? Then I shall plan to-morrow's twice as well.",
   seraphina:"Twice in one day? Royalty rations its radiance. To-morrow.",
   mira:"Again?! Even MY tail needeth rest. To-morrow, sky-strange!",
   elowen:"Sample size sufficeth for to-day. To-morrow, further study.",
   aria:"Again?! Even sunshine nappeth. To-morrow! Promise!",
   lyra:"T-twice? The log showeth — ...To-morrow. I shall rehearse. Thrice."}[id]||"To-morrow.";
}
function dateInvite(id){
  var r=RHE.ROMANCE[id];if(!r||!S.rom[id])return;
  if(!metHeroine(id)){toast(r.name+": \"(Unmet — find them in the world.)\"");return;}
  if(S.flags["dated_"+id]===S.day){toast(r.name+": \""+dateAgain(id)+"\"");return;}
  if(S.gold<20){toast("A proper date needeth 20g. (Thou carriest "+S.gold+"g.)");return;}
  S.gold-=20;S.flags["dated_"+id]=S.day;
  RHE.Audio.chime();save(0,1);updateHUD();closePanel();
  openDlg("date_"+id);
}
/* Devotion — the max-scene: one vow each. Needs bond 20+ AND a proven heart:
   trust, respect and loyalty 5+ each. Affection alone winneth no vow.
   Two gauges rise past 8, unto 10. */
function devEligible(id){
  if(!metHeroine(id)||S.flags["devoted_"+id])return false;
  var v=S.rom[id]||{};
  return bondOf(id)>=20&&(v.trust||0)>=5&&(v.respect||0)>=5&&(v.loyal||0)>=5;
}
function devInvite(id){
  var r=RHE.ROMANCE[id];if(!r||!S.rom[id])return;
  if(S.flags["devoted_"+id]){toast(r.name+": \"Vowed already, evermore. (Thrice written.)\"");return;}
  if(!metHeroine(id)){toast(r.name+": \"(Unmet — find them in the world.)\"");return;}
  if(!devEligible(id)){var v=S.rom[id]||{},need=[];
    if(bondOf(id)<20)need.push("bond "+bondOf(id)+"/20");
    ["trust","respect","loyal"].forEach(function(k){if((v[k]||0)<5)need.push(k+" "+(v[k]||0)+"/5");});
    toast(r.name+": \"Not yet — our thread wanteth weaving. ("+need.join(", ")+")\"");return;}
  RHE.Audio.chime();save(0,1);closePanel();
  openDlg("dev_"+id);
}
function giveGift(id){
  if(!metHeroine(id)){toast("??? — (Unmet. The threads have not revealed them.)");return;}
  var GIFTLINE={liliane:"Rosalind: \"...Weeds. (She presseth it into her braid when thou look'st away.)\"",
    yua:"Belladonna: \"(She holdeth it as a relic.) ...Mine. I mean — my thanks.\"",
    seraphina:"Ruby: \"For ME? ...The court shall ne'er hear of this softness. (She keepeth it.)\"",
    mira:"Nyx: \"Ooooh! Shiny-smelling! (Tail: utter thunder.) Mine now!\"",
    elowen:"Minerva: \"...A specimen? Nay — a gift. (She presseth it betwixt notes.) ...Noted.\"",
    aria:"Daisy: \"A gift! For just-a-girl me! (Sunshine, weaponized.)\"",
    lyra:"Lyra: \"For ME? (Gloweth, wholly undisguised.) ...Husbands who bring gifts get kissed. It is filed. Under LAW.\""};
  if(id==="lyra"){toast("Lyra: \"Keep it, husband — thy smile is gift enough. (Her heart is already wholly thine; it cannot be raised further.)\"");girlVoice("lyra","gift",0);return;} // locked heart: taketh naught
  if((S.inv.flower||0)>0){S.inv.flower--;addRom(id,{aff:2,close:1});
    toast(GIFTLINE[id]||"Accepted with color in their cheeks.");
    var _gmap={liliane:"rosalind",yua:"belladonna",seraphina:"ruby",mira:"nyx",elowen:"minerva",aria:"daisy"};
    if(_gmap[id])girlVoice(_gmap[id],"gift",0);}
  else if((S.inv.comb||0)>0){S.inv.comb--;addRom(id,{aff:1,close:2});toast("A graceful gift, accepted with color in their cheeks.");
    var _gmap2={liliane:"rosalind",yua:"belladonna",seraphina:"ruby",mira:"nyx",elowen:"minerva",aria:"daisy"};
    if(_gmap2[id])girlVoice(_gmap2[id],"gift",1);}
  else toast("No gift to give. Moonpetals grow in the forest and plains.");
}
function talkBond(id){
  var r=RHE.ROMANCE[id],v=S.rom[id];
  if(rivalReady(id)){closePanel();openDlg("rival_"+id);return;} // jealous? she acts
  if(!metHeroine(id)){toast(r.name+": \"(Unmet — find them in the world.)\"");return;}
  var line=id==="liliane"?(v.close>=4?"\"...Stay. That is an order. From the Captain. From me.\"":v.trust>=3?"\"Thou seest threads none else seeth. ...Glad am I it was thou who fell.\"":"\"Mistake not orders for fondness. ...Fool.\"")
    :id==="yua"&&S.metYua?"\"I trust thee wholly. ...But those around thee, I trust not yet.\" (sweet smile, wrong temperature)"
    :id==="seraphina"&&S.flags.met_seraphina?"\"One sunrise walk. Thou didst promise. I COLLECT.\" (stone aching, smiling)"
    :id==="mira"&&S.flags.met_mira?"\"Still strange-smelling. Still mine. Thee, I mean. ...Mostly thee.\""
    :id==="elowen"&&S.flags.met_elowen?"\"Hypothesis: thy company improveth outcomes. ...Stay for further study.\""
    :id==="aria"&&S.flags.met_aria?"\"Practicing my unpainted laugh! ...How was that one? Be honest!\""
    :id==="lyra"&&S.flags.met_lyra?"\"Another day with my husband! ...Thou makest eternity feel short. Stay a while?\""
    :"\"(A letter, unsent, in a future hand: 'wait for me.')\"";
  toast(r.name+": "+line);
  var _tmap={yua:"belladonna",seraphina:"ruby",mira:"nyx",elowen:"minerva",aria:"daisy",lyra:"lyra"};
  if(id==="liliane")girlVoice("rosalind","talk",v.close>=4?0:(v.trust>=3?1:2));
  else if(_tmap[id])girlVoice(_tmap[id],"talk",0);
  if(S.flags["talked_"+id]===S.day){toast("(Already caught up to-day — closeness deepeneth but once a day.)");return;}
  S.flags["talked_"+id]=S.day;
  addRom(id,{close:1});
}

/* ---------- ITEMS ---------- */
function useItem(id){var it=RHE.ITEMS[id];if(!it||(S.inv[id]||0)<=0)return;
  if(it.use){S.inv[id]--;if(it.use.hp)S.hp=Math.min(S.maxhp,S.hp+it.use.hp);
    if(it.use.mp)S.mp=Math.min(S.maxmp,S.mp+it.use.mp);
    if(it.use.cure){player.poison=0;player.burn=0;}RHE.Audio.chime();floatText("+"+ (it.use.hp||it.use.mp||"cured"),"#7fc76a");updateHUD();}}
function equipItem(id){var it=RHE.ITEMS[id];if(!it)return;
  if(it.type==="weapon")S.equip.weapon=id;if(it.type==="armor")S.equip.armor=id;if(it.type==="trinket")S.equip.trinket=id;
  toast("Equipped "+it.name);updateHUD();}
function buyItem(id){var it=RHE.ITEMS[id];if(S.gold<(it.price||0)){toast("Not enough gold.");return;}
  S.gold-=it.price;addItem(id,1);RHE.Audio.chime();updateHUD();}
function effAtk(){return S.atk+((RHE.ITEMS[S.equip.weapon]||{}).atk||0);}
function effDef(){return S.def+((RHE.ITEMS[S.equip.armor]||{}).def||0);}
function effMag(){return S.mag+((RHE.ITEMS[S.equip.weapon]||{}).mag||0);}

/* ---------- COMBAT ---------- */
function hurtEnemy(e,dmg,kb){
  e.hp-=dmg;e.hurt=0.25;RHE.Audio.hit();
  parts.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*2,vy:-2,t:"#ffd23f",life:0.4});
  floaters.push({x:e.x,y:e.y-0.6,t:"-"+Math.round(dmg),c:"#fff",life:0.9});
  if(kb&&kb.x!==undefined){e.x+=kb.x;e.y+=kb.y;}
  if(e.hp<=0&&!e.dead){e.dead=true;gainXP(e.xp);S.gold+=S.flags.aegis?Math.round(e.gold*1.5):e.gold;S.kill.beast++; // Aegis: spoils +50%
    if(e.type==="wolf")S.kill.wolf++;
    else S.kill[e.type]=(S.kill[e.type]||0)+1;
    if(e.type==="stag"){S.bossDead=true;S.flags.has_fragment=1;addItem("fragment",1);
      bigToast("The stag dissolves. A cold fragment remains. [E to claim handled automatically]");
      if(S.quests.mq3)S.quests.mq3.stage=3;RHE.Audio.thunder();
      // its death seals what it chained: miss the grotto and it closeth forever
      if(!S.flags.soulbound&&!S.flags.passage_sealed){S.flags.passage_sealed=1;
        failQuest("hq_cave");failQuest("sq_archive");
        bigToast("Far off, water closeth over stone. The grotto sealeth forever.");}}
    if(e.type==="skyvortex"){S.flags.sky_calm=1;
      bigToast("The vortex gutters and stills. The sky steadies.");
      toast("Return to Ruby in the capital.");RHE.Audio.thunder();save(0,1);}
    if(e.type==="devourer"){S.flags.devourer_beaten=1;
      if(S.flags.finale_kb===undefined){ // years-later household: 1-4 children, random genders
        var _t=1+((Math.random()*4)|0),_b=((Math.random()*(_t+1))|0);
        S.flags.finale_kb=_b;S.flags.finale_kg=_t-_b;}
      bigToast("The Core cracks. The pit learns the word ENOUGH.");
      toast("Approach the Devourer's Altar.");RHE.Audio.thunder();save(0,1);}
    if(S.quests.mq2&&!S.quests.mq2.done&&S.kill.wolf>=4){toast("Return to Rosalind.");RHE.Audio.chime();}
    if(S.quests.sq_bounty&&!S.quests.sq_bounty.done&&S.kill.beast>=6)toast("Bounty fulfilled — see Hilda.");
    // drops
    if(Math.random()<0.3)loots.push({x:e.x,y:e.y,item:Math.random()<0.5?"bread":"potion",label:"dropped"});
    refreshQuests();}
}
function playerAttack(){
  if(player.atkCd>0||DLG||panelKind)return;player.atkCd=0.38;player.swing=0.22;
  var d=dirVec();
  if(S.cls==="archer"){ // piercing arrows, deadly crits
    RHE.Audio.bow();
    var crit=Math.random()<0.25;
    shots.push({x:S.x,y:S.y-0.3,vx:d.x*9,vy:d.y*9,dmg:effAtk()+4+(crit?effAtk():0),
      foe:true,life:1.2,col:"#d8f7a6",kind:"arrow",pierce:0,struck:[],crit:crit});
  }else if(S.cls==="pyromancer"){ // firebolt that ignites
    RHE.Audio.bow();
    shots.push({x:S.x,y:S.y-0.3,vx:d.x*7.5,vy:d.y*7.5,dmg:effMag()+3+Math.random()*3,
      foe:true,life:1.4,col:"#ff9a3c",kind:"fire",pierce:0,struck:[]});
    parts.push({x:S.x+d.x*0.5,y:S.y-0.3+d.y*0.5,vx:0,vy:-0.5,t:"#ff9a3c",life:0.25});
  }else if(S.cls==="necromancer"){ // bone spear: pierces the whole line, sips life
    RHE.Audio.ui();
    shots.push({x:S.x,y:S.y-0.3,vx:d.x*8.5,vy:d.y*8.5,dmg:effMag()+4+Math.random()*3,
      foe:true,life:1.6,col:"#c77dff",kind:"bone",pierce:99,struck:[]});
    parts.push({x:S.x+d.x*0.5,y:S.y-0.3+d.y*0.5,vx:0,vy:-0.5,t:"#c77dff",life:0.25});
  }else{ // berserker cleaves + paladin holy blade
    RHE.Audio.bow();
    var rng=S.cls==="berserker"?1.6:1.4;
    enemies.forEach(function(e){if(e.dead)return;var dx=e.x-S.x,dy=e.y-S.y;var dist=Math.hypot(dx,dy);
      if(dist<rng){var was=e.hp>0,mult=1;
        if(S.cls==="berserker"&&S.hp<S.maxhp*0.5)mult=1.5; // rage
        hurtEnemy(e,(effAtk()+Math.random()*3)*mult,{x:dx*0.2,y:dy*0.2});
        if(was&&e.dead){ // bloodthirst / zeal: killing blows restore life
          var heal=S.cls==="berserker"?6:5;
          S.hp=Math.min(S.maxhp,S.hp+heal);floatText("+"+heal,"#7ac2ff");}
      }});
    parts.push({x:S.x,y:S.y,vx:0,vy:0,t:S.cls==="paladin"?"#ffe27a":"#ff6a6a",life:0.15,arc:1});
  }
}
function playerSkill(){
  if((player.skillCd>0&&player.soulsurge<=0)||DLG||panelKind)return;var c=RHE.CLASSES[S.cls];
  if(S.mp<c.skill.cost){toast("Not enough MP.");return;}
  if(S.cls==="necromancer"&&allies.filter(function(a){return !a.dead;}).length>=4){
    toast("Four risen knights already serve. (max 4)");return;} // no charge
  S.mp-=c.skill.cost;if(player.soulsurge<=0)player.skillCd=c.skill.cd;else floatText("SURGE","#d8dce4");RHE.Audio.thunder();
  var d=dirVec();
  if(S.cls==="berserker"){enemies.forEach(function(e){if(e.dead)return;if(Math.hypot(e.x-S.x,e.y-S.y)<2.2)hurtEnemy(e,effAtk()*1.8,{x:(e.x-S.x)*0.4,y:(e.y-S.y)*0.4});});}
  else if(S.cls==="archer"){for(var i=-1;i<=1;i++)shots.push({x:S.x,y:S.y-0.3,vx:d.x*10-d.y*i*2,vy:d.y*10+d.x*i*2,dmg:effAtk()+3,foe:true,life:1.4,col:"#d8f7a6",kind:"arrow",pierce:0,struck:[]});}
  else if(S.cls==="pyromancer"){enemies.forEach(function(e){if(e.dead)return;if(Math.hypot(e.x-S.x,e.y-S.y)<2.8){hurtEnemy(e,effMag()*1.6,{});e.burn=4;}});parts.push({x:S.x,y:S.y,vx:0,vy:0,t:"#ff9a3c",life:0.5,nova:1});}
  else if(S.cls==="paladin"){S.hp=Math.min(S.maxhp,S.hp+S.maxhp*0.4);player.shield=5;floatText("+heal","#7ac2ff");}
  else if(S.cls==="necromancer"){raiseSkeleton();}
  updateHUD();
}
/* Raise Dead — a skeletal knight that fights beside you until destroyed */
function raiseSkeleton(){
  var a={name:"Risen Knight",x:S.x+(Math.random()-0.5),y:S.y+0.8,dir:"up",
    hp:40+S.lvl*10+S.mag*2,maxhp:40+S.lvl*10+S.mag*2,
    atk:6+S.mag*0.5+S.lvl,spd:2.7,t:0,hurt:0,moving:false,dead:false};
  allies.push(a);
  parts.push({x:a.x,y:a.y,vx:0,vy:0,t:"#c77dff",life:0.6,nova:1});
  floatText("Rise, knight!","#c77dff");
}
/* Soulbloom — Lyra's vow made light (30s). Thirty to ALL foes on the map,
   bosses included; all thy cooldowns washed clean; then SOUL SURGE: forty
   heartbeats during which thy class skill [Q] knoweth no cooldown. */
function lyraSkill(){
  if(!S||DLG||panelKind||dead)return;
  if(!S.flags.soulbound)return;
  if(player.lyraCd>0){toast("Lyra gathereth still... ("+Math.ceil(player.lyraCd)+"s)");return;}
  player.lyraCd=30;RHE.Audio.thunder();
  var n=0;enemies.forEach(function(e){if(!e.dead){hurtEnemy(e,30,{});n++;}});
  player.skillCd=0;player.aegisCd=0;player.soulsurge=40;
  parts.push({x:S.x,y:S.y,vx:0,vy:0,t:"#d8dce4",life:0.6,nova:1});
  parts.push({x:S.x,y:S.y,vx:0,vy:0,t:"#c03048",life:0.6,nova:1});
  floatText("SOULBLOOM — "+n+" struck","#fff");
  var _ski=(Math.random()*LYRA_SKILL.length)|0;
  toast("Lyra (within): \""+LYRA_SKILL[_ski]+"\"",5000);girlVoice("lyra","skill",_ski);
  updateHUD();
}
/* Aegis counsel — the bound ward's active aid. Half thy flesh, full mana,
   an 8-heartbeat shield, all poisons cleansed, then apt counsel spoken.
   45 heartbeats; 30 once Lyra is vowed (devotion deepeneth the ward). */
function aegisCounsel(){
  if(!S||DLG||panelKind||dead)return;
  if(!S.flags.aegis)return;
  if(player.aegisCd>0){toast("Aegis gathereth still... ("+Math.ceil(player.aegisCd)+"s)");return;}
  player.aegisCd=S.flags.devoted_lyra?30:45;RHE.Audio.chime();
  player.aegisFire=6;player.aegisTick=0; // six heartbeats of ward-fire follow
  var healAmt=Math.round(S.maxhp*0.5);
  S.hp=Math.min(S.maxhp,S.hp+healAmt);S.mp=S.maxmp;
  player.shield=8;player.burn=0;player.poison=0;
  floatText("+"+healAmt+" Aegis ward","#4ad8c8");
  floatText("AEGIS VOLLEY","#eafffa");
  floatText("WARDED · CLEANSED","#eafffa");
  parts.push({x:S.x,y:S.y,vx:0,vy:0,t:"#4ad8c8",life:0.6,nova:1});
  var boss=enemies.find(function(e){return !e.dead&&BOSS_TYPES.indexOf(e.type)>=0;});
  if(boss){var _bi2=boss.type==="stag"?0:(boss.type==="skyvortex"?1:2);
    toast("Aegis: \""+(boss.type==="stag"?"It beggeth not to be left. End its grief swiftly — burn and steel.":boss.type==="skyvortex"?"It feedeth on despair. Hold thy bonds in mind — despair starveth.":"It hungereth for keeping. Offer it naught to grip — choose, and loosen.")+"\"");
    girlVoice("aegis","boss",_bi2);}
  else if(S.hp<S.maxhp*0.5){toast("Aegis: \"Thou bleedet — yet thou mendest. Rest a breath. I keep thee.\"");girlVoice("aegis","lowhp",0);}
  else{var _ai=(Math.random()*4)|0;
  toast("Aegis: \""+["The threads hold. Breathe. I keep thee.","Lyra shelved thy name under HERO. I concur.","Mana floweth full — strike with thy skill [Q].","Thee first through dark water. For science. And company."][_ai]+"\"");
  girlVoice("aegis","counsel",_ai);}
  updateHUD();
}
function hurtAlly(a,dmg){
  if(a.dead)return;a.hp-=dmg;a.hurt=0.3;
  floaters.push({x:a.x,y:a.y-0.8,t:"-"+Math.round(dmg),c:"#c9a0ff",life:0.8});
  if(a.hp<=0){a.dead=true;
    parts.push({x:a.x,y:a.y,vx:0,vy:-1,t:"#c77dff",life:0.8});
    floatText("Knight crumbles...","#c77dff");}
}
function dirVec(){return S.dir==="up"?{x:0,y:-1}:S.dir==="down"?{x:0,y:1}:S.dir==="left"?{x:-1,y:0}:{x:1,y:0};}
function hurtPlayer(dmg){if(dead)return;if(player.shield>0)dmg*=0.4;
  if(S.flags.aegis)dmg*=0.75; // Aegis ward: a quarter of all wounds turned aside
  dmg=Math.max(1,dmg-effDef()*0.5);S.hp-=dmg;player.hurt=0.4;RHE.Audio.hit();
  floaters.push({x:S.x,y:S.y-0.8,t:"-"+Math.round(dmg),c:"#ff8a8a",life:1});
  if(S.hp<=0){S.hp=0;dead=1;bigToast("You fall... the threads catch you. (Respawn at outpost, half gold lost)");
    setTimeout(function(){S.gold=Math.floor(S.gold/2);S.hp=S.maxhp;S.mp=S.maxmp;dead=0;allies=[];enterMap("outpost",20,11);},1800);}
  updateHUD();}

/* ---------- UPDATE ---------- */
function update(dt,time){
  if(!S)return;
  // Dialogue captures keys: E/Enter/Space advance, ESC closes.
  // (Previously keyboard was dead while talking.)
  if(DLG){
    if(RHE.Input.consume("e")||RHE.Input.consume("enter")||RHE.Input.consume(" ")){advanceDlg();}
    else if(RHE.Input.consume("escape")){closeDlg();toast("Closed — talk again to continue.");}
    RHE.Input.pressed={};
    return;
  }
  // clock
  S.time+=dt*0.08; if(S.time>=24)newDay();
  // Name-oath modal captures all keys: ESC/Enter confirms.
  if(!$("name-screen").classList.contains("hidden")){
    if(RHE.Input.consume("escape")||RHE.Input.consume("enter"))sealName();
    RHE.Input.pressed={};
    return;
  }
  // Class-oath modal: pick with click or 1-5. Must choose (no ESC out).
  if(!$("class-screen").classList.contains("hidden")){
    var clsKeys=["berserker","archer","pyromancer","paladin","necromancer"];
    ["1","2","3","4","5"].forEach(function(k,i){if(RHE.Input.consume(k))applyClass(clsKeys[i]);});
    RHE.Input.pressed={};
    return;
  }
  // UI keys always live — ESC closes panels/menus even while one is open.
  // (Previously `if(panelKind)return` sat above key handling, so ESC never fired.)
  if(RHE.Input.consume("i")){panelKind==="inv"?closePanel():openPanel("inv");}
  if(RHE.Input.consume("j")){panelKind==="journal"?closePanel():openPanel("journal");}
  if(RHE.Input.consume("c")){panelKind==="char"?closePanel():openPanel("char");}
  if(RHE.Input.consume("r")){panelKind==="rel"?closePanel():openPanel("rel");}
  if(RHE.Input.consume("m")){panelKind==="map"?closePanel():openPanel("map");}
  if(RHE.Input.consume("l")){panelKind==="log"?closePanel():openPanel("log");}
  if(RHE.Input.consume("escape")){if(panelKind)closePanel();else openPanel("menu");}
  if(panelKind){RHE.Input.pressed[" "]=0;RHE.Input.pressed["q"]=0;RHE.Input.pressed["e"]=0;
    RHE.Input.pressed["enter"]=0;RHE.Input.pressed["1"]=0;RHE.Input.pressed["2"]=0;
    RHE.Input.pressed["3"]=0;RHE.Input.pressed["4"]=0;return;}
  // movement — HOLD SHIFT TO SPRINT (GTA-style foot sprint, drains stamina)
  var ax=RHE.Input.axis();player.moving=!!(ax.x||ax.y);
  if(S.stam===undefined){S.stam=100;S.maxstam=100;}
  // regen stamina when not sprinting
  var wantSprint=!!(RHE.Input.keys["shift"]||RHE.Input.keys["shiftleft"]||RHE.Input.keys["shiftright"]);
  if(!dead&&(ax.x||ax.y)){
    var sprinting=wantSprint&&S.stam>1;
    var sp=S.spd*(sprinting?1.7:1);
    if(sprinting){ S.stam=Math.max(0,S.stam-22*dt); }
    else{ S.stam=Math.min(S.maxstam,S.stam+14*dt); }
    if(sprinting&&(!update._dust||time-update._dust>90)){update._dust=time; // dust kicked up
      parts.push({x:S.x+(Math.random()-0.5)*0.5,y:S.y+0.3,vx:(Math.random()-0.5),vy:-0.6,t:"#9a8a6a",life:0.4});}
    if(ax.x&&ax.y){ax.x*=0.7;ax.y*=0.7;}
    var nx=S.x+ax.x*sp*dt, ny=S.y+ax.y*sp*dt;
    if(!solidAt(S.map,nx,S.y))S.x=nx; if(!solidAt(S.map,S.x,ny))S.y=ny;
    S.x=Math.max(0.6,Math.min(MAPS[S.map].w-0.6,S.x));S.y=Math.max(0.6,Math.min(MAPS[S.map].h-0.6,S.y));
    S.dir=ax.x<0?"left":ax.x>0?"right":ax.y<0?"up":"down";}
  else{ S.stam=Math.min(S.maxstam,S.stam+18*dt); player._sprint=false; }
  if(!dead&&(ax.x||ax.y)){ player._sprint=wantSprint&&S.stam>1; }
  // exits — tile-based triggers on carved walkable gaps; story locks explain themselves
  (function(){var M0=MAPS[S.map],moved=false;
  M0.exits.forEach(function(ex){
    if(moved)return;
    // arrival guard: just spawned on this tile (some spawns sit on return
    // exits) — must step >1.5 away before any exit can fire again
    if(S.arrive&&Math.hypot(S.x-S.arrive.x,S.y-S.arrive.y)<1.5)return;
    var hit;
    if(ex.secret){hit=Math.hypot(S.x-(ex.x+0.5),S.y-(ex.y+0.5))<1.1;}
    else if(ex.y===0||ex.y===M0.h-1){hit=Math.abs(S.y-ex.y)<0.8&&S.x>ex.x-0.5&&S.x<ex.x+ex.w+0.5;}
    else if(ex.x===0||ex.x===M0.w-1){hit=Math.abs(S.x-ex.x)<0.8&&S.y>ex.y-0.6&&S.y<ex.y+1.6;}
    else{hit=Math.abs(S.y-ex.y)<0.8&&S.x>ex.x-0.5&&S.x<ex.x+ex.w+0.5;}
    if(!hit)return;
    if(ex.cond&&!S.flags[ex.cond]){
      if(!update._lockT||time-update._lockT>2500){update._lockT=time;
        toast(ex.map==="spire"?"🔒 The south portcullis is shut — speak with Belladonna at the gate first.":ex.map==="gate"?"🔒 Silverwall Gate is sealed — brave the Hollow and meet Rosalind at night first.":"🔒 The way is barred... for now. (Story-locked)");}
      return;
    }
    if(ex.moon&&!moonPassageOpen()){ // the falls keep moon-hours
      if(!update._moonT||time-update._moonT>4000){update._moonT=time;
        toast(S.flags.passage_sealed?"The water hath closed over stone. It openeth nevermore.":isFullMoon()?"The falls run shut — return betwixt midnight and one.":"The falls run shut. The wall spake of a full moon... 🌕");}
      return;
    }
    moved=true;enterMap(ex.map,ex.tx,ex.ty);checkStoryExits();});})();
  // hidden quest, touch to accept: thy hand on falling water (forest far west,
  // by the sealed mouth at 5,24) accepteth "Behind Falling Water" — rumors alone
  // never do. The sealed grotto granteth naught once closed forever.
  if(S.map==="forest"&&!hasQuest("hq_cave")&&!hasQuest("sq_archive")&&!S.flags.aegis&&!S.flags.passage_sealed&&Math.hypot(S.x-5,S.y-24)<2.0){
    giveQuest("hq_cave");toast("Thy hand toucheth falling water — something hollow echoeth behind it. (MYSTERY — Behind Falling Water)");}
  // npc proximity
  hoverNpc=null;var best=1.1;
  npcs.forEach(function(n){var d=Math.hypot(n.x-S.x,n.y-S.y);if(d<best){best=d;hoverNpc=n;}});
  var pr=$("interact-prompt");
  // loot proximity — AUTO-LOOT on touch, no key needed
  var hl=null;loots.forEach(function(l){if(!l.taken&&Math.hypot(l.x-S.x,l.y-S.y)<0.9)hl=l;});
  if(hl)takeLoot(hl);
  if(hoverNpc){pr.textContent="E — Talk to "+hoverNpc.name;pr.classList.remove("hidden");}
  else{pr.classList.add("hidden");hoverLoot=null;}
  // day/night respawn npcs occasionally
  // enemies AI
  var inFight=false;
  enemies.forEach(function(e){if(e.dead)return;
    e.t-=dt;e.hurt-=dt;
    if(e.burn>0){e.burn-=dt;e.hp-=8*dt;if(e.hp<=0&&!e.dead){hurtEnemy(e,1,{});} }
    var d=Math.hypot(e.x-S.x,e.y-S.y);
    // beasts savage the nearest morsel — hero or risen knight
    var gtx=S.x,gty=S.y,gally=null;
    allies.forEach(function(a){if(a.dead)return;
      if(Math.hypot(a.x-e.x,a.y-e.y)<Math.hypot(gtx-e.x,gty-e.y)){gtx=a.x;gty=a.y;gally=a;}});
    var gd=Math.hypot(gtx-e.x,gty-e.y);
    if(d<7&&S.map!==undefined){inFight=true;e.moving=true;
      var dx=(gtx-e.x)/(gd||1),dy=(gty-e.y)/(gd||1);
      var nx2=e.x+dx*e.spd*dt,ny2=e.y+dy*e.spd*dt;
      if(!solidAt(S.map,nx2,e.y))e.x=nx2;if(!solidAt(S.map,e.x,ny2))e.y=ny2;
      e.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");
      if(gd<0.7&&e.t<=0){e.t=e.type==="stag"?1.4:1.0;
        var ed=e.atk+(e.type==="stag"?Math.random()*6:Math.random()*3);
        if(gally)hurtAlly(gally,ed);else hurtPlayer(ed);}
      // boss summons
      if(e.type==="stag"&&e.hp<e.maxhp*0.5&&!e.enraged){e.enraged=true;bigToast("The stag SCREAMS with a man's voice: 'DON'T LEAVE ME!'");RHE.Audio.thunder();
        enemies.push({type:"wolf",name:"Grief-pup",x:e.x+1,y:e.y,dir:"down",hp:30,maxhp:30,atk:8,xp:10,gold:4,spd:2.4,color:"#5a3a5a",moving:false,hurt:0,t:0});}
      if(e.type==="skyvortex"&&e.hp<e.maxhp*0.5&&!e.enraged){e.enraged=true;bigToast("The vortex shrieks: 'STAY! BURN WITH ME!'");RHE.Audio.thunder();
        enemies.push({type:"wolf",name:"Ash imp",x:e.x+1,y:e.y,dir:"down",hp:34,maxhp:34,atk:9,xp:14,gold:6,spd:2.4,color:"#7a2a1a",moving:false,hurt:0,t:0});}
      if(e.type==="devourer"&&e.hp<e.maxhp*0.6&&!e.enraged){e.enraged=true;bigToast("The Core weeps with a thousand voices: 'DON'T GO.'");RHE.Audio.thunder();
        enemies.push({type:"thorn",name:"Grief-made",x:e.x-1,y:e.y+1,dir:"down",hp:60,maxhp:60,atk:12,xp:26,gold:12,spd:1.8,color:"#3d2a6a",moving:false,hurt:0,burn:0,poison:0,t:0});
        enemies.push({type:"thorn",name:"Grief-made",x:e.x+1,y:e.y+1,dir:"down",hp:60,maxhp:60,atk:12,xp:26,gold:12,spd:1.8,color:"#3d2a6a",moving:false,hurt:0,burn:0,poison:0,t:0});}
    }else e.moving=false;});
  inCombatT=inFight?inCombatT+dt:0;
  RHE.Audio.playBGM(inFight?RHE.Audio.BGM.combat:(RHE.Audio.BGM[MAPS[S.map].bgm]||RHE.Audio.BGM.title));
  // shots — arrows pierce nothing, fire ignites, bone spears pierce lines + sip life
  shots.forEach(function(s){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
    if(s.kind==="fire"&&Math.random()<0.5)parts.push({x:s.x,y:s.y,vx:0,vy:0.5,t:"#ff9a3c",life:0.3});
    enemies.forEach(function(e){if(e.dead||s.struck.indexOf(e)>=0)return;
      if(Math.hypot(e.x-s.x,e.y-s.y)<0.55){s.struck.push(e);
        hurtEnemy(e,s.dmg,{});
        if(s.kind==="fire")e.burn=2.5;
        if(s.kind==="bone")S.hp=Math.min(S.maxhp,S.hp+s.dmg*0.25);
        if(s.crit)floatText("CRIT!","#ffe27a");
        if(s.pierce>0)s.pierce--;else s.life=0;}});});
  // Aegis volley — six heartbeats of ward-fire seeking thy nearest foe
  if(S.flags.aegis&&player.aegisFire>0){
    if(player.aegisTick<=0){player.aegisTick=0.35;
      var tgt=null,bd=9;
      enemies.forEach(function(e){if(e.dead)return;
        var dd=Math.hypot(e.x-S.x,e.y-S.y);if(dd<bd){bd=dd;tgt=e;}});
      if(tgt){var tdx=tgt.x-S.x,tdy=tgt.y-S.y,td=Math.hypot(tdx,tdy)||1,spd=11;
        shots.push({x:S.x,y:S.y-0.3,vx:tdx/td*spd,vy:tdy/td*spd,dmg:effMag()+8,foe:true,life:1.2,col:"#4ad8c8",kind:"aegis",pierce:0,struck:[]});
        parts.push({x:S.x,y:S.y-0.3,vx:0,vy:-0.5,t:"#4ad8c8",life:0.25});}}}
  shots=shots.filter(function(s){return s.life>0;});
  // risen knights — seek enemies, else heel to the necromancer
  allies.forEach(function(a){if(a.dead)return;a.t-=dt;a.hurt-=dt;
    var tgt=null,bd=10;
    enemies.forEach(function(e){if(e.dead)return;
      var dd=Math.hypot(e.x-a.x,e.y-a.y);if(dd<bd){bd=dd;tgt=e;}});
    a.moving=false;
    var gx=S.x,gy=S.y;
    if(tgt&&(bd<0.7||bd<10)){gx=tgt.x;gy=tgt.y;}
    var d=Math.hypot(gx-a.x,gy-a.y);
    if(tgt&&bd<0.7){if(a.t<=0){a.t=0.9;hurtEnemy(tgt,a.atk+Math.random()*3,{});}}
    else if(d>(tgt?1.2:1.6)){var dx=(gx-a.x)/d,dy=(gy-a.y)/d;a.moving=true;
      var ax2=a.x+dx*a.spd*dt,ay2=a.y+dy*a.spd*dt;
      if(!solidAt(S.map,ax2,a.y))a.x=ax2;if(!solidAt(S.map,a.x,ay2))a.y=ay2;
      a.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?"right":"left"):(dy>0?"down":"up");}});
  allies=allies.filter(function(a){return !a.dead;});
  // dots
  if(player.burn>0){player.burn-=dt;S.hp-=4*dt;} if(player.poison>0){player.poison-=dt;S.hp-=3*dt;}
  if(S.hp<=0&&!dead){hurtPlayer(1);}
  player.atkCd-=dt;player.skillCd-=dt;player.aegisCd-=dt;player.aegisFire-=dt;player.aegisTick-=dt;player.lyraCd-=dt;player.soulsurge-=dt;player.hurt-=dt;player.swing-=dt;player.shield-=dt;
  // Lyra, within: her soul-voice keepeth thee company on the road
  if(S.flags.soulbound&&!dead){
    player.lyraSoulT-=dt;
    if(player.lyraSoulT<=0){player.lyraSoulT=45+Math.random()*20;
      var soulboss=enemies.find(function(e){return !e.dead&&BOSS_TYPES.indexOf(e.type)>=0;});
      if(S.hp<S.maxhp*0.3){toast("Lyra (within): \"Thou bleedet! Fall back this breath — thy wife insisteth. I am here. I am always here now.\"",5000);girlVoice("lyra","soul_low",0);}
      else if(soulboss){toast("Lyra (within): \"That grief... I dreamed its shape. Strike true, husband — I count thy heartbeats.\"",5000);girlVoice("lyra","soul_boss",0);}
      else if(isNight()){toast("Lyra (within): \"Three hundred nights I dreamed thy voice. ...Come to bed soon, husband? I shall keep thy dreams warm.\"",5000);girlVoice("lyra","soul_night",0);}
      else{var _sdi=(Math.random()*LYRA_SOUL_DAY.length)|0;
      toast("Lyra (within): \""+LYRA_SOUL_DAY[_sdi]+"\"",5000);girlVoice("lyra","soul_day",_sdi);}
    }
  }
  // regen (Aegis: a deep mana well)
  S.mp=Math.min(S.maxmp,S.mp+(S.flags.aegis?8:3)*dt);
  // npc schedule refresh each game-hour tick — NPCs ONLY.
  // (A full enterMap here would wipe corpses and respawn every mob/loot
  // every few seconds. Mobs return only when thou re-enterest the place.)
  if(Math.floor(time/4000)!==update._h){update._h=Math.floor(time/4000);npcs=[];spawnNpcs();}
  // floaters/parts
  floaters.forEach(function(f){f.y-=dt*0.8;f.life-=dt;});floaters=floaters.filter(function(f){return f.life>0;});
  parts.forEach(function(p){p.life-=dt;if(p.vx!==undefined){p.x+=p.vx*dt;p.y+=p.vy*dt;}});parts=parts.filter(function(p){return p.life>0;});
  // gameplay keys (UI keys handled at top so panels stay closable)
  if(RHE.Input.consume(" ")){playerAttack();}
  if(RHE.Input.consume("q")){playerSkill();}
  if(RHE.Input.consume("t")){aegisCounsel();}
  if(RHE.Input.consume("f")){lyraSkill();}
  if(RHE.Input.consume("e")||RHE.Input.consume("enter")){interact();}
  ["1","2","3","4"].forEach(function(k,i){if(RHE.Input.consume(k)){useItem(["potion","bread","manacake","antidote"][i]);}});
  // full-moon midnight: the falls stand open — call it once per night
  if(moonPassageOpen()&&!S.flags.soulbound&&!S.flags["mooncall_"+S.day]){
    S.flags["mooncall_"+S.day]=1;
    bigToast("Beneath the full moon, the falls stand open — WEST, where beasts gather!");
    RHE.Audio.chime();}
  // Lyra, without: twenty heartbeats idle and she steppeth from thy chest to be
  // beheld — she knoweth the world only moveth when thou dost, and that thou
  // beyond the glass and thou within art one soul, twice-held. She loveth both.
  // Move, and she hideth back within, hurried.
  if(S.flags.soulbound&&!dead){
    if(player.moving){
      if(player.lyraOut){player.lyraOut=false;player.idleT=0;player.lyraChatT=0;
        var _lmi=(Math.random()*LYRA_MOVE.length)|0;
        toast("Lyra: \""+LYRA_MOVE[_lmi]+"\"",5000);girlVoice("lyra","move",_lmi);}
      else player.idleT=0;
    }else{
      player.idleT+=dt;
      if(!player.lyraOut&&player.idleT>=20){player.lyraOut=true;player.lyraChatT=15+Math.random()*5;
        RHE.Audio.chime();
        var _li=(Math.random()*LYRA_IDLE_OUT.length)|0;
        toast("Lyra: \""+LYRA_IDLE_OUT[_li]+"\"",5000);lyraIdleVoice(_li);}
      else if(player.lyraOut){player.lyraChatT-=dt;
        if(player.lyraChatT<=0){player.lyraChatT=15+Math.random()*5;
          var _lci=(Math.random()*LYRA_CHAT.length)|0;
          toast("Lyra: \""+LYRA_CHAT[_lci]+"\"",5000);girlVoice("lyra","chat",_lci);}}
    }
  }
  // boss bar (any boss, any map)
  var boss=enemies.find(function(e){return !e.dead&&BOSS_TYPES.indexOf(e.type)>=0;});
  if(boss){$("boss-bar").classList.remove("hidden");$("boss-name").textContent=BOSS_NAMES[boss.type]||boss.name;
    $("boss-fill").style.width=(100*boss.hp/boss.maxhp)+"%";}else $("boss-bar").classList.add("hidden");
  // clock + hud bars (cheap)
  if((update._hud=(update._hud||0)+dt)>0.15){update._hud=0;updateHUD();drawMinimap();}
}
var hoverLoot=null, hoverExit=null;
function checkStoryExits(){ // exits hook: auto-scenes + quest safety nets
  // NOTE: hq_cave ("Behind Falling Water") is NEVER granted here — only thy
  // hand touching the falls accepteth it (see the touch check after the exits).
  if(S.map==="cave"&&!S.flags.met_lyra){setTimeout(function(){var l=npcs.find(function(n){return n.id==="lyra";});if(l)talkTo(l);},600);}
  if(S.map==="gate"&&!S.flags.met_yua){setTimeout(function(){var y=npcs.find(function(n){return n.id==="yua";});if(y)talkTo(y);},400);}
  if(S.map==="spire"&&!S.flags.met_seraphina){setTimeout(function(){var s=npcs.find(function(n){return n.id==="seraphina";});if(s)talkTo(s);},600);}
  if(S.map==="spirecity"&&!hasQuest("mq6")&&S.flags.met_seraphina)giveQuest("mq6");
  if(S.map==="sky"&&!hasQuest("mq7")&&S.flags.sera_trust)giveQuest("mq7");
  if(S.map==="plains"&&!hasQuest("mq8")&&S.flags.sky_calm)giveQuest("mq8");
  if(S.map==="marsh"&&!hasQuest("mq9")&&S.flags.mira_free)giveQuest("mq9");
  if(S.map==="silverwall"&&!hasQuest("mq10")&&S.flags.sin_seen)giveQuest("mq10");
  if(S.map==="starlia"&&!hasQuest("mq11")&&S.flags.sworn)giveQuest("mq11");
  if(S.map==="pit"&&!hasQuest("mq13")&&S.flags.aria_open)giveQuest("mq13");
  if(S.map==="pit"&&S.flags.devourer_beaten&&!S.flags.finale_seen&&hasQuest("mq13")){S.flags.finale_seen=1;
    setTimeout(function(){openDlg("devourer_final");},800);}
  if(S.map==="hollow"&&!hasQuest("mq3")&&hasQuest("mq2")){/* allow anyway */}
}
function interact(){
  if(DLG){advanceDlg();return;}
  if(panelKind){return;}
  if(hoverNpc){talkTo(hoverNpc);lyraRemark("npc:"+hoverNpc.id);return;}
  if(hoverLoot){takeLoot(hoverLoot);return;}
  // prop read
  var M=MAPS[S.map];var found=null;
  M.props.forEach(function(p){if(S.x>p.x-0.6&&S.x<p.x+p.w+0.6&&S.y>p.y-0.8&&S.y<p.y+p.h+0.8)found=p;});
  if(found){propEvent(found);lyraPropRemark(found);return;}
}
function takeLoot(l){
  if(l.taken)return;l.taken=true;
  loots=loots.filter(function(x){return x!==l;});
  RHE.Audio.chime();
  if(l.item==="keychain"){S.flags.keychain=1;addItem("keychain",1);
    if(!hasQuest("sq_key"))giveQuest("sq_key");
    if(S.quests.sq_key){S.quests.sq_key.done=true;}
    bigToast("A chipped school keychain. From Earth. Your hands shake.");
    toast("Hidden quest complete: Falling-Star Keepsake (+rep)");S.rep.greenwood+=1;lyraRemark("loot:keychain");}
  else if(l.item==="page"){S.pages++;toast("Research page "+S.pages+"/3 — Minerva's hand: '...love that won't end...'");
    lyraRemark("loot:page");
    if(S.pages>=1&&!hasQuest("sq_notes"))giveQuest("sq_notes");
    if(S.pages>=3)toast("Bring all 3 pages to Hermit Corv (grotto).");}
  else if(l.item==="diary"){S.flags.diary=1;addItem("diary",1);bigToast("Warden's diary: 'If love refuses goodbye, it grows teeth.'");lyraRemark("loot:diary");}
  else if(l.item==="mapscrap"){addItem("mapscrap",1);lyraRemark("loot:mapscrap");}
  else addItem(l.item,1);
  refreshQuests();
}
function propEvent(p){
  if(p.label.includes("Falling water")){ // Act I breadcrumb: the hidden passage rumor
    if(S.flags.passage_sealed)toast("Still water. The falls closed over stone and open nevermore.");
    else if(!hasQuest("hq_cave")&&!hasQuest("sq_archive")){giveQuest("hq_cave");bigToast("Behind falling water, the world keeps receipts.");}
    else toast("Falling water. Something glimmereth behind it — west, where the beasts gather. (Full-moon midnight openeth the way — touch [E])");
    return;}
  if(p.label.includes("Sunken Archive")){ // the three-seal puzzle slab
    if(!S.flags.met_lyra){talkTo({id:"lyra"});return;}
    if(!S.flags.aegis){openDlg("lyra_seals");return;}
    var _sl=(S.flags.seal1?1:0)+(S.flags.seal2?1:0)+(S.flags.seal3?1:0);
    toast("The slab resteth open ("+_sl+"/3 seals). Cold, kind air breatheth from the passage. Aegis hovereth attendance.");
    return;}
  if(p.label.includes("Moonlit")){ // night meeting trigger zone
    if(hasQuest("mq4")&&!S.flags.mq4a){if(isNight())openDlg("liliane_night");else toast("A platform for watching moons. Rosalind said: after dark.");}
    else toast(p.label);return;}
  if(p.label.includes("Reliquary")){
    if(S.bossDead||S.flags.has_fragment)toast("Empty reliquary. The fragment is yours now — bring it to Rosalind.");
    else toast("Sealed by thorns. Something vast breathes behind them. (Slay the stag)");return;}
  if(p.label.includes("cache")){ // auto-looted via loots; flavor
    toast("Dusty cache. Someone hid survival gear for a thread-seer.");return;}
  if(p.label.includes("Silverwall")){
    if(!S.flags.met_yua){toast("Sealed. A knight's voice beyond: '...found you...' (Meet Belladonna first)");}
    else toast("The portcullis stands open — south to the Ashen Approach. Act II awaits.");
    return;}
  if(p.label.includes("Court of Embers")){
    if(isNight())toast("The court is adjourned. Ruby walks the balcony alone — speak with her.");
    else toast("Braziers, counselors, a stone-faced princess. Speak with Ruby herself.");
    return;}
  if(p.label.includes("Balcony of Sunrise")){talkTo({id:"seraphina"});return;}
  if(p.label.includes("Sky-Node Vortex")){
    if(S.flags.sky_calm)toast("Still air. The vortex is a scar now, not a mouth.");
    else toast("It pulleth at thy grief. Steel and flame, sky-fallen — END it.");
    return;}
  if(p.label.includes("Burning wagon")){
    var nb=(S.kill.bandit||0);
    toast(nb>=3?"The wagon smoulders. The wolf-girl picketh through the ashes, grinning.":"A trade wagon burns. Reavers ("+nb+"/3) press the guards — drive them off!");
    return;}
  if(p.label.includes("Brand post")){
    toast(S.flags.mira_free?"A dead law, nailed to dead wood.":"Names upon names, branded. Nyx's mark is here too. Speak with her.");
    return;}
  if(p.label.includes("Minerva's Tower")){
    if(!S.flags.met_elowen)toast("Shutters, candles, wards. Best introduce thyself to the witch first.");
    else if(!S.flags.sin_seen)openDlg("elowen_vision");
    else toast("The tower hums, content. Ink, candles, and one leaned-upon scholar.");
    return;}
  if(p.label.includes("Rite Circle")){
    var na=(S.kill.assassin||0);
    if(S.flags.sworn)toast("The Circle remembereth thy vow. It warmeth, faintly.");
    else if(!S.flags.yua_posted)toast("Old stones, older vows. Belladonna will explain — find her.");
    else if(na<2)toast("The Circle is cold. Fell the Oathless blades first ("+na+"/2).");
    else openDlg("yua_rite");
    return;}
  if(p.label.includes("Side Chapel")){
    if(!S.flags.met_aria)toast("A side door, plain and kind. Meet the Saint first.");
    else if(!isNight())toast("Pilgrims crowd the chapel by day. Come after dark.");
    else if(!S.flags.aria_open)openDlg("aria_chapel");
    else toast("Cold stone, warm memory. She laughed here — unpainted.");
    return;}
  if(p.label.includes("Walls of Starlia")){
    if(!S.flags.sworn)toast("The city lights below. (Belladonna's oath is not yet sworn.)");
    else if(!S.flags.wall_oath)openDlg("yua_wall");
    else toast("The wall where fear was spoken aloud — and answered.");
    return;}
  if(p.label.includes("Devourer's Altar")){
    if(!hasQuest("mq13"))toast("The pit hungers — but thy thread of fate leadeth not here yet. (Finish the realms above first.)");
    else if(!S.flags.devourer_beaten)toast("The pit behind her heart. It hungers. It CANNOT have thee — slay its Core first.");
    else if(S.quests.mq13&&!S.quests.mq13.done){S.flags.finale_seen=1;openDlg("devourer_final");}
    else toast("A quiet scar. It learned ENOUGH.");
    return;}
  if(p.label.includes("Great Altar")){talkTo({id:"aria"});return;}
  toast(p.label);
}

/* ---------- RENDER ---------- */
var TILECOL={0:"#2a4a2a",1:"#223c24",2:"#6a5a3a",3:"#1d4a6a",4:"#2a6a9a",5:"#1c3a1e",6:"#16301c",
  7:"#4a4a52",8:"#5a6a4a",9:"#3a3a44",10:"#7a6a4a",11:"#3a5a2a",12:"#6a5a3a",13:"#4a3a2a",14:"#7a3a1a",15:"#241a3a",16:"#aab"};
function render(time){
  var M=MAPS[S.map];var vw=cv.width,h=540;
  cam.x=S.x*TILE-vw/2;cam.y=S.y*TILE-h/2;
  cam.x=Math.max(0,Math.min(M.w*TILE-vw,cam.x));cam.y=Math.max(0,Math.min(M.h*TILE-h,cam.y));
  // clear first: small maps (gate, spire, cave) must not keep ghost pixels
  // of the previous larger map around their edges
  ctx.fillStyle="#000";ctx.fillRect(0,0,vw,cv.height);
  // ground
  for(var y=0;y<M.h;y++)for(var x=0;x<M.w;x++){
    var sx=x*TILE-cam.x,sy=y*TILE-cam.y;if(sx<-TILE||sy<-TILE||sx>vw||sy>h)continue;
    var t=M.tiles[y][x];ctx.fillStyle=TILECOL[t]||"#222";ctx.fillRect(sx,sy,TILE,TILE);
    if(t===0||t===1){ctx.fillStyle="rgba(0,0,0,.15)";if((x*7+y*13)%11===0)ctx.fillRect(sx+8,sy+10,3,6);}
    if(t===2){ctx.fillStyle="rgba(255,255,255,.06)";ctx.fillRect(sx,sy+TILE/2-2,TILE,4);}
    if(t===3||t===4){ctx.fillStyle="rgba(255,255,255,"+(0.12+0.1*Math.sin(time/300+x))+")";ctx.fillRect(sx,sy+((time/50+x*7)%TILE),TILE,2);}
    if(t===5){ctx.fillStyle="#0e2410";ctx.fillRect(sx+4,sy-14,24,40);ctx.fillStyle="#1e5a24";ctx.beginPath();ctx.arc(sx+16,sy-6,15,0,7);ctx.fill();}
    if(t===6){ctx.fillStyle="#0a1c10";ctx.beginPath();ctx.moveTo(sx+16,sy-16);ctx.lineTo(sx+2,sy+22);ctx.lineTo(sx+30,sy+22);ctx.fill();}
    if(t===7){ctx.fillStyle="#5a5a64";ctx.fillRect(sx,sy,TILE,TILE);ctx.fillStyle="#333";ctx.fillRect(sx,sy,TILE,4);}
    if(t===8){ctx.fillStyle="rgba(127,199,106,.12)";ctx.fillRect(sx,sy,TILE,TILE);}
    if(t===15){ctx.fillStyle="rgba(120,40,160,"+(0.25+0.15*Math.sin(time/400+x+y))+")";ctx.fillRect(sx,sy,TILE,TILE);
      ctx.fillStyle="#0a0a0a";if((x+y)%3===0)ctx.fillRect(sx+10,sy+12,4,10);}
    if(t===9){ctx.fillStyle="rgba(0,0,0,.2)";if((x+y)%4===0)ctx.fillRect(sx+4,sy+4,6,6);}
  }
  // exits glow (moon-shut secrets burn low)
  M.exits.forEach(function(ex){var locked=ex.cond&&!S.flags[ex.cond];
    var moonShut=ex.moon&&!moonPassageOpen();if(moonShut)locked=true;
    ctx.fillStyle=ex.secret?(moonShut?"rgba(90,169,230,.12)":locked?"rgba(90,169,230,.2)":"rgba(90,169,230,.6)"):locked?"rgba(224,82,82,.5)":"rgba(216,180,92,.7)";
    ctx.fillRect(ex.x*TILE-cam.x,(ex.y)*TILE-cam.y,ex.w*TILE,10);});
  // props
  M.props.forEach(function(p){var sx=p.x*TILE-cam.x,sy=p.y*TILE-cam.y;
    ctx.fillStyle=p.c||"#fff";ctx.font="16px serif";ctx.fillText("◆",sx+8,sy+16);});
  // Greenwood Outpost — real woodland buildings over the gray blocks
  // (log cabins, thatch, forge-fire, market stall, great tree, moon ring)
  if(S.map==="outpost"){
    var _bp=null;M.props.forEach(function(p){
      if(p.label.indexOf("Marta")>=0)_bp=_bp||{},_bp.inn=p;
      else if(p.label.indexOf("Elder Hall")>=0)_bp=_bp||{},_bp.hall=p;
      else if(p.label.indexOf("Smithy")>=0)_bp=_bp||{},_bp.smith=p;
      else if(p.label.indexOf("Peddler")>=0)_bp=_bp||{},_bp.stall=p;
      else if(p.label.indexOf("Vael-Thir")>=0)_bp=_bp||{},_bp.root=p;
      else if(p.label.indexOf("Moonlit")>=0)_bp=_bp||{},_bp.moon=p;});
    if(_bp){
    var night=isNight();
    function _cabin(px,py,wt,wall,roof,win){
      var W=wt*TILE,H=TILE*1.4;
      ctx.fillStyle="rgba(0,0,0,.35)";ctx.fillRect(px+4,py+H-6,W,8);
      ctx.fillStyle=wall;ctx.fillRect(px,py,W,H);
      ctx.fillStyle="rgba(0,0,0,.25)";
      for(var ly=py+8;ly<py+H;ly+=8)ctx.fillRect(px,ly,W,2);
      ctx.fillStyle="#3a2a1a";ctx.fillRect(px,py,W,4);ctx.fillRect(px,py+H-4,W,4);
      ctx.fillRect(px,py,4,H);ctx.fillRect(px+W-4,py,4,H);
      ctx.fillStyle=roof;ctx.beginPath();
      ctx.moveTo(px-8,py);ctx.lineTo(px+W/2,py-34);ctx.lineTo(px+W+8,py);ctx.closePath();ctx.fill();
      ctx.fillStyle="rgba(0,0,0,.25)";
      for(var ry=0;ry<4;ry++){var rw=(W+16)*(1-ry/5);ctx.fillRect(px+W/2-rw/2,py-30+ry*8,rw,2);}
      ctx.fillStyle="#1a120a";ctx.fillRect(px+W/2-7,py+H-26,14,26);
      ctx.fillStyle=win;ctx.fillRect(px+8,py+12,12,10);ctx.fillRect(px+W-20,py+12,12,10);
      ctx.fillStyle="rgba(255,202,122,.22)";ctx.fillRect(px+2,py+6,24,22);ctx.fillRect(px+W-26,py+6,24,22);
    }
    function _smoke(px,py){
      for(var i=0;i<3;i++){var ph=((time/1500)+i/3)%1;
        ctx.fillStyle="rgba(200,200,200,"+(0.35*(1-ph))+")";
        ctx.beginPath();ctx.arc(px+Math.sin(ph*5+i)*6,py-ph*44,4+ph*7,0,7);ctx.fill();}
    }
    function _fire(px,py,s){
      var fl=0.7+0.3*Math.sin(time/130+px);
      ctx.fillStyle="#e05252";ctx.beginPath();ctx.arc(px,py,9*s*fl,0,7);ctx.fill();
      ctx.fillStyle="#ff9a3c";ctx.beginPath();ctx.arc(px,py-2,6*s*fl,0,7);ctx.fill();
      ctx.fillStyle="#ffe27a";ctx.beginPath();ctx.arc(px,py-3,3.5*s*fl,0,7);ctx.fill();
    }
    var q;
    if(_bp.inn){q=_bp.inn;var ix=q.x*TILE-cam.x-8,iy=q.y*TILE-cam.y; // Marta's Inn
      _cabin(ix,iy,2.5,"#6a4a2a","#9a8a52","#ffca7a");
      ctx.fillStyle="#3a2a1a";ctx.fillRect(ix+38,iy-46,10,24);_smoke(ix+43,iy-48);
      ctx.fillStyle="#3a2a1a";ctx.fillRect(ix-16,iy+8,6,18);ctx.fillRect(ix-26,iy+2,24,13);
      ctx.fillStyle="#e89ac0";ctx.font="bold 9px Georgia";ctx.fillText("INN",ix-22,iy+12);}
    if(_bp.hall){q=_bp.hall;var hx=q.x*TILE-cam.x-8,hy=q.y*TILE-cam.y; // Elder Hall longhouse
      _cabin(hx,hy,2.5,"#5a3d24","#7a6a3a","#cfe3c0");
      ctx.fillStyle="#1d3a1e";ctx.fillRect(hx+8,hy-30,16,20); // leaf banner
      ctx.fillStyle="#7fc76a";ctx.beginPath();ctx.arc(hx+16,hy-20,5,0,7);ctx.fill();}
    if(_bp.smith){q=_bp.smith;var fx=q.x*TILE-cam.x-8,fy=q.y*TILE-cam.y; // Smithy forge-hut
      _cabin(fx,fy,2.2,"#4a3a28","#5a5a64","#ff9a3c");
      ctx.fillStyle="#3a2a1a";ctx.fillRect(fx+34,fy-40,10,20);_smoke(fx+39,fy-42);
      _fire(fx+72,fy+30,1); // forge mouth
      ctx.fillStyle="#222";ctx.fillRect(fx+52,fy+18,20,6); // anvil top
      ctx.fillRect(fx+58,fy+24,8,12);ctx.fillRect(fx+52,fy+36,20,4); // anvil base
      ctx.fillStyle="#8a8a92";ctx.fillRect(fx+2,fy+20,3,18);ctx.fillRect(fx+7,fy+20,3,18);} // weapon rack
    if(_bp.stall){q=_bp.stall;var tx=q.x*TILE-cam.x,ty=q.y*TILE-cam.y; // Peddler stall
      ctx.fillStyle="rgba(0,0,0,.3)";ctx.fillRect(tx+4,ty+20,56,6);
      ctx.fillStyle="#3a2a1a";
      ctx.fillRect(tx,ty-24,5,48);ctx.fillRect(tx+59,ty-24,5,48); // posts
      for(var si=0;si<8;si++){ctx.fillStyle=si%2?"#8a1a1a":"#d8b45c"; // striped awning
        ctx.fillRect(tx-6+si*9,ty-40,9,18);}
      ctx.fillStyle="#3a2a1a";ctx.fillRect(tx-6,ty-40,70,3);
      ctx.fillStyle="#6a4a2a";ctx.fillRect(tx+2,ty,60,20); // counter
      ctx.fillStyle="#e05252";ctx.fillRect(tx+8,ty-4,8,6);ctx.fillStyle="#7ac2ff";ctx.fillRect(tx+22,ty-4,8,6);
      ctx.fillStyle="#ffe27a";ctx.fillRect(tx+36,ty-4,8,6);ctx.fillStyle="#7fc76a";ctx.fillRect(tx+48,ty-4,6,6);} // goods
    if(_bp.root){q=_bp.root;var rx=(q.x+0.5)*TILE-cam.x,ry=(q.y+1)*TILE-cam.y; // Vael-Thir Root
      ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(rx,ry,26,8,0,0,7);ctx.fill();
      ctx.fillStyle="#4a2f1a";
      ctx.fillRect(rx-14,ry-58,28,58);
      ctx.fillRect(rx-20,ry-30,12,30);ctx.fillRect(rx+8,ry-30,12,30);
      ctx.fillStyle="#5a3d24";ctx.fillRect(rx-14,ry-58,28,6);
      var leaf=["#1e5a24","#2a6a2a","#3a7a2a"],li;
      for(li=0;li<7;li++){var la=li/7*Math.PI*2+0.4;
        ctx.fillStyle=leaf[li%3];ctx.beginPath();
        ctx.arc(rx+Math.cos(la)*24,ry-72+Math.sin(la)*16,14,0,7);ctx.fill();}
      ctx.fillStyle="#7fc76a";ctx.beginPath();ctx.arc(rx,ry-72,18,0,7);ctx.fill();
      ctx.fillStyle="#ffe27a"; // gold motes
      for(li=0;li<4;li++){var tw=0.4+0.6*Math.abs(Math.sin(time/700+li*1.7));
        ctx.globalAlpha=tw;ctx.fillRect(rx-20+li*13,ry-88+((li*17)%26),3,3);}
      ctx.globalAlpha=1;}
    if(_bp.moon){q=_bp.moon;var mx=(q.x+0.5)*TILE-cam.x,my=(q.y+0.5)*TILE-cam.y; // Moonlit Platform
      var mg=night?0.8:0.3;
      ctx.save();ctx.strokeStyle="rgba(179,136,235,"+mg+")";ctx.shadowColor="#b388eb";ctx.shadowBlur=night?16:6;
      ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(mx,my,30,18,0,0,7);ctx.stroke();
      ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(mx,my,20,12,0,0,7);ctx.stroke();ctx.restore();
      ctx.fillStyle="#8a8aa4";
      for(var mi=0;mi<5;mi++){var ma=mi/5*Math.PI*2;
        ctx.fillRect(mx+Math.cos(ma)*30-3,my+Math.sin(ma)*18-4,6,8);}}
    }
  }
  // Rite Circle — a real ringed seal, breathing with the Sworn Shield quest
  if(S.map==="silverwall"){
    var rp=null;M.props.forEach(function(p){if(p.label.indexOf("Rite Circle")>=0)rp=p;});
    if(rp){var cx=(rp.x+rp.w/2)*TILE-cam.x,cy=(rp.y+rp.h/2)*TILE-cam.y;
      var rst=!S.flags.yua_posted?0:((S.kill.assassin||0)>=2?(S.flags.sworn?3:2):1);
      var rcol=["#55555f","#5aa9e6","#c77dff","#ffd23f"][rst];
      var rpul=0.5+0.5*Math.sin(time/450),RR=TILE*1.15;
      ctx.save();ctx.strokeStyle=rcol;ctx.shadowColor=rcol;ctx.shadowBlur=rst>=2?16:6;
      ctx.globalAlpha=rst===0?0.35:0.6+0.4*rpul;ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(cx,cy,RR,0,7);ctx.stroke();
      ctx.globalAlpha=(rst===0?0.25:0.4+0.3*rpul);ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(cx,cy,RR*0.7,0,7);ctx.stroke();
      var rot=rst>=2?time/2400:0.6;
      ctx.fillStyle=rcol;
      for(var ri=0;ri<12;ri++){var ra=rot+ri*Math.PI/6;
        ctx.fillRect(cx+Math.cos(ra)*RR-2,cy+Math.sin(ra)*RR-2,4,4);}
      if(rst===3){ctx.globalAlpha=1;ctx.fillStyle="#fff";ctx.beginPath();
        ctx.moveTo(cx,cy-7);ctx.lineTo(cx+7,cy);ctx.lineTo(cx,cy+7);ctx.lineTo(cx-7,cy);ctx.closePath();ctx.fill();}
      ctx.restore();}
  }
  // loots
  loots.forEach(function(l){if(l.taken)return;var sx=l.x*TILE-cam.x,sy=l.y*TILE-cam.y;
    var b=Math.sin(time/300+l.x)*3;ctx.fillStyle="#ffe27a";ctx.fillRect(sx+10,sy+8+b,12,10);
    ctx.fillStyle="#000";ctx.fillRect(sx+13,sy+11+b,6,4);});
  // npcs + enemies + player sorted by y
  var draws=[];
  npcs.forEach(function(n){draws.push({y:n.y,f:function(){RHE.Sprites.draw(ctx,n,cam,time);drawName(n);}});});
  enemies.forEach(function(e){if(e.dead)return;draws.push({y:e.y,f:function(){
    var bob=Math.sin(time/200+e.x)*2;
    ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(e.x*TILE-cam.x,e.y*TILE-cam.y+10,12,4,0,0,7);ctx.fill();
    ctx.fillStyle=e.hurt>0?"#fff":e.color;
    if(e.type==="stag"){ctx.fillRect(e.x*TILE-cam.x-14,e.y*TILE-cam.y-14+bob,28,26);
      ctx.fillStyle="#000";ctx.fillRect(e.x*TILE-cam.x-18,e.y*TILE-cam.y-24+bob,6,12);ctx.fillRect(e.x*TILE-cam.x+12,e.y*TILE-cam.y-24+bob,6,12);
      ctx.fillStyle="#f00";ctx.fillRect(e.x*TILE-cam.x-6,e.y*TILE-cam.y-6+bob,4,4);ctx.fillRect(e.x*TILE-cam.x+2,e.y*TILE-cam.y-6+bob,4,4);}
    else if(e.type==="skyvortex"){var vx=e.x*TILE-cam.x,vy=e.y*TILE-cam.y+bob;
      ctx.save();ctx.translate(vx,vy);ctx.rotate(Math.PI/4);
      ctx.fillStyle=e.hurt>0?"#fff":"#3a1a5a";ctx.fillRect(-13,-13,26,26);
      ctx.fillStyle="#c77dff";ctx.fillRect(-6,-6,12,12);ctx.restore();
      ctx.fillStyle="#fff";ctx.fillRect(vx-3,vy-3,6,6);}
    else if(e.type==="devourer"){var dx2=e.x*TILE-cam.x,dy2=e.y*TILE-cam.y+bob;
      ctx.fillStyle=e.hurt>0?"#fff":"#0a0a14";ctx.beginPath();ctx.arc(dx2,dy2,15,0,7);ctx.fill();
      ctx.strokeStyle="#e05252";ctx.lineWidth=3;ctx.beginPath();ctx.arc(dx2,dy2,15+Math.sin(time/200)*2,0,7);ctx.stroke();
      ctx.fillStyle="#f00";ctx.fillRect(dx2-7,dy2-4+bob*0,4,4);ctx.fillRect(dx2+3,dy2-4,4,4);}
    else{ctx.beginPath();ctx.arc(e.x*TILE-cam.x,e.y*TILE-cam.y+bob,12,0,7);ctx.fill();
      ctx.fillStyle="#f00";ctx.fillRect(e.x*TILE-cam.x-6,e.y*TILE-cam.y-4+bob,4,3);ctx.fillRect(e.x*TILE-cam.x+2,e.y*TILE-cam.y-4+bob,4,3);}
    // hp
    ctx.fillStyle="#000";ctx.fillRect(e.x*TILE-cam.x-14,e.y*TILE-cam.y-24+bob,28,4);
    ctx.fillStyle="#e05252";ctx.fillRect(e.x*TILE-cam.x-14,e.y*TILE-cam.y-24+bob,28*(e.hp/e.maxhp),4);}});});
  // risen knights march with the living
  allies.forEach(function(a){if(a.dead)return;draws.push({y:a.y,f:function(){
    var b2=Math.sin(time/200+a.x)*2;
    ctx.fillStyle="rgba(0,0,0,.35)";ctx.beginPath();ctx.ellipse(a.x*TILE-cam.x,a.y*TILE-cam.y+10,11,4,0,0,7);ctx.fill();
    ctx.fillStyle=a.hurt>0?"#fff":"#2a2430";
    ctx.fillRect(a.x*TILE-cam.x-8,a.y*TILE-cam.y-14+b2,16,24);
    ctx.fillStyle="#c77dff";ctx.fillRect(a.x*TILE-cam.x-8,a.y*TILE-cam.y-14+b2,16,3);
    ctx.fillStyle="#e8e4f0";ctx.fillRect(a.x*TILE-cam.x-6,a.y*TILE-cam.y-28+b2,12,11);
    ctx.fillStyle="#a02040";ctx.fillRect(a.x*TILE-cam.x-4,a.y*TILE-cam.y-24+b2,3,3);
    ctx.fillRect(a.x*TILE-cam.x+1,a.y*TILE-cam.y-24+b2,3,3);
    ctx.fillStyle="#8a8a9a";ctx.fillRect(a.x*TILE-cam.x+6,a.y*TILE-cam.y-20+b2,9,2);
    ctx.fillStyle="#000";ctx.fillRect(a.x*TILE-cam.x-12,a.y*TILE-cam.y-34+b2,24,3);
    ctx.fillStyle="#c77dff";ctx.fillRect(a.x*TILE-cam.x-12,a.y*TILE-cam.y-34+b2,24*Math.max(0,a.hp/a.maxhp),3);
  }});});
  draws.push({y:S.y+0.01,f:function(){
    if(dead)return;
    if(player.hurt>0)ctx.globalAlpha=0.5+0.5*Math.sin(time/50);
    RHE.Sprites.draw(ctx,{x:S.x,y:S.y,dir:S.dir,top:"#1d2a5a",trim:"#d8b45c",hair:"#141014",skin:"#f0c49c",cape:"#1d2a5a",pants:"#23202a",boots:"#141014",style:"messy",moving:player.moving},cam,time);
    ctx.globalAlpha=1;
    if(player.swing>0){ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.beginPath();
      ctx.arc(S.x*TILE-cam.x,S.y*TILE-cam.y-6,26,time/60,time/60+2);ctx.stroke();}
  }});
  // Aegis — the bound ward hovers at thy shoulder (warden-flame, teal)
  if(S.flags.aegis&&!dead)draws.push({y:S.y+0.02,f:function(){
    var ax=S.x*TILE-cam.x+26, ay=S.y*TILE-cam.y-34+Math.sin(time/300)*3;
    ctx.fillStyle="rgba(74,216,200,.22)";ctx.beginPath();ctx.arc(ax,ay,11,0,7);ctx.fill();
    ctx.fillStyle=player.aegisCd>0?"#2a8a80":"#4ad8c8";ctx.beginPath();ctx.arc(ax,ay,5.5,0,7);ctx.fill();
    ctx.fillStyle="#eafffa";ctx.beginPath();ctx.arc(ax-1.5,ay-2,2,0,7);ctx.fill();
    ctx.fillStyle="#0a2a28";ctx.fillRect(ax-3.5,ay-0.5,2.5,2.5);ctx.fillRect(ax+1,ay-0.5,2.5,2.5);
  }});
  // Lyra manifested: while thou idlest, she standeth beside thee in miniature
  if(player.lyraOut&&!dead)draws.push({y:S.y+0.03,f:function(){
    var lx=S.x+0.9,ly=S.y+0.4;
    RHE.Sprites.draw(ctx,{x:lx,y:ly,dir:"left",top:"#8a1a2a",trim:"#d8b45c",hair:"#e8e4da",skin:"#f7e0d0",cape:"#5a1020",pants:"#2a0a12",boots:"#141014",style:"long",extra:"flower",moving:false},cam,time);
    drawName({id:"lyra",name:"Lyra",x:lx,y:ly});
  }});
  draws.sort(function(a,b){return a.y-b.y;}).forEach(function(d){d.f();});
  // shots/parts
  // shots, drawn by kind: arrows streak, fireballs flicker, bone spears spin
  shots.forEach(function(s){var sx=s.x*TILE-cam.x,sy=s.y*TILE-cam.y;
    if(s.kind==="arrow"){ctx.strokeStyle=s.crit?"#ffe27a":s.col;ctx.lineWidth=s.crit?4:3;ctx.beginPath();
      ctx.moveTo(sx-s.vx*2,sy-s.vy*2);ctx.lineTo(sx,sy);ctx.stroke();}
    else if(s.kind==="fire"){var r=4+Math.sin(time/60+s.x*3)*1.5;
      ctx.fillStyle="#ff9a3c";ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fill();
      ctx.fillStyle="#ffe27a";ctx.beginPath();ctx.arc(sx,sy,r*0.5,0,7);ctx.fill();}
    else if(s.kind==="bone"){ctx.save();ctx.translate(sx,sy);ctx.rotate(Math.atan2(s.vy,s.vx));
      ctx.fillStyle="#e8e4f0";ctx.fillRect(-8,-2,16,4);
      ctx.fillStyle="#c77dff";ctx.fillRect(-8,-2,6,4);
      ctx.fillStyle="#5a10a0";ctx.fillRect(4,-2,2,4);ctx.restore();}
    else if(s.kind==="aegis"){var r2=4+Math.sin(time/60+s.x*3)*1.5;
      ctx.fillStyle="#4ad8c8";ctx.beginPath();ctx.arc(sx,sy,r2,0,7);ctx.fill();
      ctx.fillStyle="#eafffa";ctx.beginPath();ctx.arc(sx,sy,r2*0.45,0,7);ctx.fill();}
    else{ctx.fillStyle=s.col;ctx.fillRect(sx-3,sy-3,6,6);}});
  parts.forEach(function(p){if(p.nova){ctx.strokeStyle=p.t;ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x*TILE-cam.x,p.y*TILE-cam.y-8,Math.max(1,(0.5-p.life)*120),0,7);ctx.stroke();}
    else if(p.arc){}else{ctx.fillStyle=p.t;ctx.fillRect(p.x*TILE-cam.x-2,p.y*TILE-cam.y-8,4,4);}});
  // heart-thread shimmer (Rin sight)
  if(S.flags.saw_thread){ctx.strokeStyle="rgba(127,199,106,.5)";ctx.lineWidth=1;
    npcs.forEach(function(n){if(n.id!=="liliane")return;
      ctx.beginPath();ctx.moveTo(S.x*TILE-cam.x,S.y*TILE-cam.y-10);
      ctx.quadraticCurveTo((S.x+n.x)/2*TILE-cam.x,(S.y+n.y)/2*TILE-cam.y-30,n.x*TILE-cam.x,n.y*TILE-cam.y-10);ctx.stroke();});}
  // floaters
  ctx.font="bold 13px Georgia";
  floaters.forEach(function(f){ctx.fillStyle=f.c;ctx.fillText(f.t,f.x*TILE-cam.x-10,f.y*TILE-cam.y);});
  // weather particles
  weather(time);
  // lighting overlay
  var dk=daylight();ctx.fillStyle="rgba(5,5,25,"+(0.45*(1-dk))+")";ctx.fillRect(0,0,vw,h);
  if(MAPS[S.map].dark){ctx.fillStyle="rgba(5,0,15,.35)";ctx.fillRect(0,0,vw,h);}
  // torch glow around player
  var g=ctx.createRadialGradient(S.x*TILE-cam.x,S.y*TILE-cam.y-8,20,S.x*TILE-cam.x,S.y*TILE-cam.y-8,150);
  g.addColorStop(0,"rgba(255,220,150,.18)");g.addColorStop(1,"rgba(255,220,150,0)");
  ctx.fillStyle=g;ctx.fillRect(0,0,vw,h);
  // quest compass edge: red = main, yellow = side, hidden = nothing
  try{var qe=questEdge(time);
  if(qe){var pu=0.45+0.3*Math.sin(time/280);
    ctx.save();
    ctx.globalAlpha=0.4*pu+0.22;ctx.fillStyle=qe.col;
    ctx.shadowColor=qe.col;ctx.shadowBlur=22;
    var QT=11;
    if(qe.edge==="top"){ctx.fillRect(0,0,vw,QT);ctx.fillRect(0,0,vw,3);}
    else if(qe.edge==="bottom"){ctx.fillRect(0,h-QT,vw,QT);ctx.fillRect(0,h-3,vw,3);}
    else if(qe.edge==="left"){ctx.fillRect(0,0,QT,h);ctx.fillRect(0,0,3,h);}
    else{ctx.fillRect(vw-QT,0,QT,h);ctx.fillRect(vw-3,0,3,h);}
    ctx.globalAlpha=0.9;ctx.fillStyle=qe.col;
    var qmx=vw/2,qmy=h/2;
    ctx.beginPath();
    if(qe.edge==="top"){ctx.moveTo(qmx-11,12);ctx.lineTo(qmx+11,12);ctx.lineTo(qmx,2);}
    else if(qe.edge==="bottom"){ctx.moveTo(qmx-11,h-12);ctx.lineTo(qmx+11,h-12);ctx.lineTo(qmx,h-2);}
    else if(qe.edge==="left"){ctx.moveTo(12,qmy-11);ctx.lineTo(12,qmy+11);ctx.lineTo(2,qmy);}
    else{ctx.moveTo(vw-12,qmy-11);ctx.lineTo(vw-12,qmy+11);ctx.lineTo(vw-2,qmy);}
    ctx.closePath();ctx.fill();
    ctx.restore();}}catch(e){}
  // foot label
  ctx.fillStyle="rgba(0,0,0,.6)";ctx.fillRect(0,h,vw,60);
  ctx.fillStyle="#e9d8a6";ctx.font="13px Georgia";
  ctx.fillText(MAPS[S.map].sign||MAPS[S.map].label,10,h+20);
  ctx.fillStyle="#9fb";ctx.fillText(hourStr()+" · "+(isNight()?"night (NPCs scheming)":"day")+" · Gold "+S.gold+"g · Lv "+S.lvl,10,h+40);
}
function drawName(n){ctx.fillStyle=n.id==="liliane"?"#7fc76a":"#fff";ctx.font="11px Georgia";
  ctx.fillText(n.name,n.x*TILE-cam.x-20,n.y*TILE-cam.y-24);}
function daylight(){var t=S.time;if(t<5||t>21)return 0.15;if(t<7)return 0.4;if(t<9)return 0.8;if(t<17)return 1;if(t<19)return 0.7;if(t<20)return 0.4;return 0.2;}
var leafP=[];
function weather(time){
  var M=MAPS[S.map];if(!M.weather&&Math.random()>0.05)return;
  if(leafP.length<60&&Math.random()<0.4)leafP.push({x:Math.random()*cv.width,y:-10,vx:(Math.random()-0.5)*30,vy:30+Math.random()*40,c:M.weather==="leaves"?"#7fc76a":"#9fc"});
  ctx.fillStyle="#7fc76a";
  leafP.forEach(function(p){p.x+=p.vx*0.016;p.y+=p.vy*0.016;ctx.globalAlpha=0.6;ctx.fillRect(p.x,p.y,3,3);ctx.globalAlpha=1;});
  leafP=leafP.filter(function(p){return p.y<620;});
}
/* GTA-style pause map: the REAL tile geography (roads, water, walls, corruption),
   fog-of-war for undiscovered maps, player arrow, NPC/beast/POI blips, exit ticks.
   Drag to pan · click a realm for a fullscreen inspection · double-click resets. */
function drawWorldMap(){
  var c=$("worldmap");if(!c)return;var g=c.getContext("2d");
  var W=c.width,H=c.height,TS=3; // 3px per tile
  RHE.mapView=RHE.mapView||{mode:"all",id:null,ox:0,oy:0};
  var V=RHE.mapView;
  g.fillStyle="#0b1220";g.fillRect(0,0,W,H); // void/water base like GTA night map
  g.textAlign="center";
  var COL={0:"#2e5230",1:"#243e26",2:"#9a8a52",3:"#2a6ad0",4:"#3a7ae0",5:"#16351f",
    6:"#122a1a",7:"#9a9aa4",8:"#6a7a55",9:"#4a4a56",10:"#9a8a52",11:"#3a5a2a",
    12:"#6a5a3a",13:"#4a3a2a",14:"#7a3a1a",15:"#7a3ad0",16:"#aab"};
  var seen=S.visited||{};
  var seen=S.visited||{};
  // ----- detail mode: one realm, fullscreen -----
  if(V.mode==="one"&&MAPS[V.id]){
    var M=MAPS[V.id],T2=9,mw=M.w*T2,mh=M.h*T2;
    var ox0=Math.round((W-mw)/2),oy0=Math.round((H-mh)/2)-8;
    (function(){
      if(!seen[V.id]){
        g.fillStyle="#101018";g.fillRect(ox0,oy0,mw,mh);
        g.strokeStyle="#3a3a48";g.lineWidth=2;g.strokeRect(ox0,oy0,mw,mh);
        g.fillStyle="#565664";g.font="bold 44px Georgia";g.fillText("?",ox0+mw/2,oy0+mh/2+14);
        g.font="bold 16px Georgia";g.fillStyle="#f4e8c8";g.fillText(M.label+" — undiscovered",ox0+mw/2,oy0+mh+28);
        var md=$("map-detail");if(md)md.innerHTML="<p><i>Undiscovered — explore to reveal it.</i></p>";
        return;
      }
      var x,y;
      for(y=0;y<M.h;y++)for(x=0;x<M.w;x++){g.fillStyle=COL[M.tiles[y][x]]||"#222";g.fillRect(ox0+x*T2,oy0+y*T2,T2,T2);}
      g.strokeStyle="#d8b45c";g.lineWidth=2.5;g.strokeRect(ox0,oy0,mw,mh);
      var knowSecret=!!(S.flags.keychain||S.flags.mapscrap||seen.cave);
      M.exits.forEach(function(ex){
        var locked=ex.cond&&!S.flags[ex.cond];
        if(ex.secret&&!knowSecret)return;
        g.fillStyle=ex.secret?"#5aa9e6":locked?"#e05252":"#ffe27a";
        for(var i=0;i<(ex.w||1);i++){var exx=ex.x+i;
          if(ex.y===0)g.fillRect(ox0+exx*T2,oy0-6,T2,6);
          else if(ex.y===M.h-1)g.fillRect(ox0+exx*T2,oy0+mh,T2,6);
          else if(ex.x===0)g.fillRect(ox0-6,oy0+ex.y*T2,6,T2);
          else if(ex.x===M.w-1)g.fillRect(ox0+mw,oy0+ex.y*T2,6,T2);}
      });
      M.props.forEach(function(p){g.fillStyle="#ffe9b0";g.fillRect(ox0+p.x*T2-2,oy0+p.y*T2-2,5,5);});
      if(V.id===S.map){
        enemies.forEach(function(e){if(e.dead)return;
          g.fillStyle="#e05252";g.fillRect(ox0+e.x*T2-2,oy0+e.y*T2-2,5,5);});
        npcs.forEach(function(n){
          g.fillStyle=n.color||"#fff";
          g.beginPath();g.arc(ox0+n.x*T2,oy0+n.y*T2,5,0,7);g.fill();
          g.fillStyle="#fff";g.font="12px Georgia";g.fillText(n.name,ox0+n.x*T2,oy0+n.y*T2-10);});
        var px=ox0+S.x*T2,py=oy0+S.y*T2;
        var ang=S.dir==="up"?0:S.dir==="left"?-Math.PI/2:S.dir==="right"?Math.PI/2:Math.PI;
        g.save();g.translate(px,py);g.rotate(ang);
        g.fillStyle="#fff";g.strokeStyle="#111";g.lineWidth=2;
        g.beginPath();g.moveTo(0,-11);g.lineTo(8,8);g.lineTo(-8,8);g.closePath();g.fill();g.stroke();
        g.restore();
      }
      g.fillStyle="#f4e8c8";g.font="bold 15px Georgia";g.fillText(M.label,W/2,24);
      g.fillStyle="#9fb";g.font="12px Georgia";g.fillText(MAPS[V.id].sign||"",W/2,42);
      var md2=$("map-detail");
      if(md2){var ph="<p><b style='color:#d8b45c'>◆ Points of interest</b> — "+M.props.map(function(p){return p.label;}).join(" · ")+"</p>";
        if(V.id===S.map){var nn=npcs.map(function(n){return n.name;}).join(", ")||"none";
          var ne=enemies.filter(function(e){return !e.dead;}).length;
          ph+="<p>Here now: <b>"+nn+"</b> · beasts: <b>"+ne+"</b></p>";}
        md2.innerHTML=ph;}
    })();
    c.style.cursor="default";c.onmousedown=c.onmousemove=c.onmouseup=c.onmouseleave=c.ondblclick=null;
    g.fillStyle="#9fb";g.font="10px Georgia";g.textAlign="left";
    g.fillText(M.label+" — click ◀ All realms to return",12,H-10);
    fitWorldMap();
    return;
  }
  var LAYOUT=[
    {id:"hollow",x:120,y:40},{id:"starlia",x:230,y:40,lab:1},{id:"pit",x:320,y:40},
    {id:"spirecity",x:420,y:40,lab:1},{id:"sky",x:540,y:40},
    {id:"forest",x:90,y:180},{id:"gate",x:280,y:180},{id:"silverwall",x:360,y:180},
    {id:"outpost",x:20,y:330},{id:"spire",x:180,y:330},{id:"plains",x:300,y:330},
    {id:"marsh",x:410,y:330},{id:"cave",x:620,y:440}
  ];
  function mini(m){var l=null;LAYOUT.forEach(function(o){if(o.id===m)l=o;});return l;}
  // connector roads between maps
  function link(id1,tx1,ty1,id2,tx2,ty2,locked,secret){
    var a=mini(id1),b=mini(id2);if(!a||!b)return;
    var M1=MAPS[id1],M2=MAPS[id2];
    var x1=a.x+tx1*TS,y1=a.y+ty1*TS,x2=b.x+tx2*TS,y2=b.y+ty2*TS;
    g.strokeStyle=secret?"#5aa9e6":locked?"#e05252":"#d8b45c";
    g.lineWidth=secret?1.5:2;g.setLineDash(secret?[4,3]:[6,4]);
    g.beginPath();g.moveTo(x1,y1);
    g.quadraticCurveTo((x1+x2)/2,(y1+y2)/2-18,x2,y2);g.stroke();g.setLineDash([]);
  }
  var gateLock=!S.flags.mq4a;
  var knowSecret=!!(S.flags.keychain||S.flags.mapscrap||seen.cave);
  link("outpost",20,0,"forest",20,33,gateLock&&false,false);
  link("forest",20,0,"hollow",10,18,false,false);
  link("outpost",39,15,"gate",1,3,gateLock,false);
  link("forest",45,16,"gate",1,7,gateLock,false);
  link("gate",5,9,"spire",2,7,!S.flags.met_yua,false);
  link("spire",25,7,"spirecity",1,7,!S.flags.met_seraphina,false);
  link("spirecity",12,0,"sky",8,11,!S.flags.sera_trust,false);
  link("spirecity",12,13,"plains",13,1,!S.flags.sky_calm,false);
  link("plains",25,8,"marsh",1,7,!S.flags.mira_free,false);
  link("marsh",21,7,"silverwall",1,7,!S.flags.sin_seen,false);
  link("silverwall",21,7,"starlia",1,7,!S.flags.sworn,false);
  link("starlia",10,0,"pit",7,11,!S.flags.aria_open,false);
  if(knowSecret)link("forest",5,24,"cave",8,8,false,true);
  g.save();g.translate(V.ox,V.oy); // drag-pan offset
  RHE._mapRects=[];
  LAYOUT.forEach(function(l){
    var M=MAPS[l.id],mw=M.w*TS,mh=M.h*TS;
    RHE._mapRects.push({id:l.id,x:l.x+V.ox,y:l.y+V.oy,w:mw,h:mh});
    if(!seen[l.id]){ // fog of war
      g.fillStyle="#101018";g.fillRect(l.x,l.y,mw,mh);
      g.strokeStyle="#3a3a48";g.lineWidth=1;g.strokeRect(l.x,l.y,mw,mh);
      g.fillStyle="#565664";g.font="bold 22px Georgia";g.fillText("?",l.x+mw/2,l.y+mh/2+8);
      g.font="10px Georgia";g.fillText(M.label,l.x+mw/2,l.lab?l.y-6:l.y+mh+14);
      return;
    }
    for(var y=0;y<M.h;y++)for(var x=0;x<M.w;x++){
      g.fillStyle=COL[M.tiles[y][x]]||"#222";
      g.fillRect(l.x+x*TS,l.y+y*TS,TS,TS);
    }
    g.strokeStyle="#d8b45c";g.lineWidth=1.5;g.strokeRect(l.x,l.y,mw,mh);
    // exit ticks on edges
    M.exits.forEach(function(ex){
      var locked=ex.cond&&!S.flags[ex.cond];
      if(ex.secret&&!knowSecret)return;
      g.fillStyle=ex.secret?"#5aa9e6":locked?"#e05252":"#ffe27a";
      for(var i=0;i<(ex.w||1);i++){
        var exx=ex.x+i;
        if(ex.y===0)g.fillRect(l.x+exx*TS,l.y-3,TS,3);
        else if(ex.y===M.h-1)g.fillRect(l.x+exx*TS,l.y+mh,TS,3);
        else if(ex.x===0)g.fillRect(l.x-3,l.y+ex.y*TS,3,TS);
        else if(ex.x===M.w-1)g.fillRect(l.x+mw,l.y+ex.y*TS,3,TS);
        else{g.beginPath();g.arc(l.x+exx*TS,l.y+ex.y*TS,3,0,7);g.fill();}
      }
      if(ex.secret){ // secret portal: pulsing blue diamond, marching dashed ring
        var scx,scy2,wspan=(ex.w||1);
        if(ex.y===0){scx=l.x+(ex.x+wspan/2)*TS;scy2=l.y-4;}
        else if(ex.y===M.h-1){scx=l.x+(ex.x+wspan/2)*TS;scy2=l.y+mh+4;}
        else if(ex.x===0){scx=l.x-4;scy2=l.y+(ex.y+0.5)*TS;}
        else if(ex.x===M.w-1){scx=l.x+mw+4;scy2=l.y+(ex.y+0.5)*TS;}
        else{scx=l.x+(ex.x+0.5)*TS;scy2=l.y+(ex.y+0.5)*TS;}
        var spu=Date.now()/450;
        g.save();g.shadowColor="#5aa9e6";g.shadowBlur=10;
        g.fillStyle="#5aa9e6";
        g.beginPath();g.moveTo(scx,scy2-7);g.lineTo(scx+7,scy2);g.lineTo(scx,scy2+7);g.lineTo(scx-7,scy2);g.closePath();g.fill();
        g.shadowBlur=0;g.fillStyle="#dff1ff";
        g.beginPath();g.arc(scx,scy2,2.5,0,7);g.fill();
        g.strokeStyle="rgba(90,169,230,"+(0.4+0.3*Math.sin(spu))+")";g.lineWidth=1.5;
        g.setLineDash([4,3]);g.lineDashOffset=-spu*4;
        g.beginPath();g.arc(scx,scy2,11,0,7);g.stroke();g.setLineDash([]);
        g.restore();
      }
    });
    // POI markers: pulsing gold diamonds, white-hot cores — touch them
    var put=Date.now()/450;
    M.props.forEach(function(p){
      var px=l.x+(p.x+p.w/2)*TS, py=l.y+(p.y+p.h/2)*TS;
      g.save();g.shadowColor="#ffd23f";g.shadowBlur=8;
      g.fillStyle="#ffd23f";
      g.beginPath();g.moveTo(px,py-6);g.lineTo(px+6,py);g.lineTo(px,py+6);g.lineTo(px-6,py);g.closePath();g.fill();
      g.shadowBlur=0;g.fillStyle="#fff";
      g.beginPath();g.moveTo(px,py-2.5);g.lineTo(px+2.5,py);g.lineTo(px,py+2.5);g.lineTo(px-2.5,py);g.closePath();g.fill();
      g.strokeStyle="rgba(255,210,63,"+(0.35+0.3*Math.sin(put+p.x))+")";g.lineWidth=1.5;
      g.beginPath();g.arc(px,py,9+2*Math.sin(put+p.y),0,7);g.stroke();
      g.restore();
    });
    g.fillStyle="#f4e8c8";g.font="bold 10px Georgia";
    var _ly=l.lab?l.y-6:l.y+mh+14;
    g.fillText(M.label,l.x+mw/2,_ly);
    // blips live only on the current map
    if(l.id===S.map){
      enemies.forEach(function(e){if(e.dead)return;
        g.fillStyle="#e05252";g.fillRect(l.x+e.x*TS-1,l.y+e.y*TS-1,3,3);});
      npcs.forEach(function(n){
        g.fillStyle=n.color||"#fff";
        g.beginPath();g.arc(l.x+n.x*TS,l.y+n.y*TS,3,0,7);g.fill();});
      // player arrow, rotated to facing
      var px=l.x+S.x*TS,py=l.y+S.y*TS;
      var ang=S.dir==="up"?0:S.dir==="left"?-Math.PI/2:S.dir==="right"?Math.PI/2:Math.PI;
      g.save();g.translate(px,py);g.rotate(ang);
      g.fillStyle="#fff";g.strokeStyle="#111";g.lineWidth=1.5;
      g.beginPath();g.moveTo(0,-7);g.lineTo(5,5);g.lineTo(-5,5);g.closePath();g.fill();g.stroke();
      g.restore();
      g.strokeStyle="rgba(255,255,255,.6)";g.lineWidth=1;
      g.beginPath();g.arc(px,py,8+((Date.now()/300)%4),0,7);g.stroke();
    }
  });
  g.restore(); // end drag-pan offset
  // drag to pan · click a realm to inspect fullscreen · double-click resets
  c.style.cursor="grab";
  c.onmousedown=function(e){RHE._drag={x:e.clientX,y:e.clientY,ox:V.ox,oy:V.oy,moved:false};c.style.cursor="grabbing";};
  c.onmousemove=function(e){var d=RHE._drag;if(!d)return;
    var r=c.getBoundingClientRect(),sx=c.width/Math.max(1,r.width);
    var dx=(e.clientX-d.x)*sx,dy=(e.clientY-d.y)*sx;
    if(Math.abs(e.clientX-d.x)+Math.abs(e.clientY-d.y)>4)d.moved=true;
    V.ox=Math.max(-500,Math.min(500,d.ox+dx));V.oy=Math.max(-400,Math.min(400,d.oy+dy));
    drawWorldMap();};
  c.onmouseup=function(e){var d=RHE._drag;RHE._drag=null;c.style.cursor="grab";
    if(d&&!d.moved){
      var r=c.getBoundingClientRect(),sx=c.width/Math.max(1,r.width);
      var mx=(e.clientX-r.left)*sx,my=(e.clientY-r.top)*sx,hit=null;
      (RHE._mapRects||[]).forEach(function(q){if(mx>q.x-6&&mx<q.x+q.w+6&&my>q.y-6&&my<q.y+q.h+16)hit=q;});
      if(hit){if((S.visited||{})[hit.id]){V.mode="one";V.id=hit.id;RHE.Audio.ui();renderPanel();}
        else toast("Undiscovered — explore to reveal it.");}
    }};
  c.onmouseleave=function(){RHE._drag=null;try{c.style.cursor="grab";}catch(e){}};
  c.ondblclick=function(){V.ox=0;V.oy=0;drawWorldMap();};
  g.fillStyle="#9fb";g.font="10px Georgia";g.textAlign="left";
  g.fillText(S.flags.act3||S.map==="silverwall"||S.map==="starlia"||S.map==="pit"?"THREE REALMS — Act III (N ↑)":S.flags.act2||S.map==="spire"?"ASHEN REGION — Act II (N ↑)":"GREENWOOD REGION — Act I (N ↑)",12,16);
  fitWorldMap();
}
/* Scale the fixed-ratio fate tree to fit the fullscreen decree: no scrollbars. */
function fitDecree(){
  var c=document.querySelector("#panel-body .fate-svg");if(!c)return;
  var body=$("panel-body");if(!body)return;
  var availW=Math.min(body.clientWidth-24,720);
  if(availW>200){c.style.width=Math.floor(availW)+"px";c.style.height="auto";}
}
/* Scale the fixed-resolution world map to fit the fullscreen panel: no scrollbars. */
function fitWorldMap(){
  var c=$("worldmap");if(!c)return;var body=$("panel-body");if(!body)return;
  var availW=body.clientWidth-24, availH=body.clientHeight-70;
  var s=Math.min(availW/760,availH/520);
  s=Math.max(0.3,Math.min(1.6,isFinite(s)?s:1));
  c.style.width=Math.floor(760*s)+"px";c.style.height=Math.floor(520*s)+"px";
}
/* GTA-style minimap: player-centered zoom (nearby streets only),
   north-up, white directional arrow, red beast blips, gold exit ticks. */
function drawMinimap(){
  var M=MAPS[S.map]; var W=160,H=120;
  mmc.fillStyle="#0a0f0c";mmc.fillRect(0,0,W,H);
  var RANGE=9; // tiles visible around player (GTA close-zoom feel)
  var sx=W/(RANGE*2), sy=H/(RANGE*2);
  for(var dy=-RANGE;dy<=RANGE;dy++)for(var dx=-RANGE;dx<=RANGE;dx++){
    var tx=Math.floor(S.x+dx), ty=Math.floor(S.y+dy);
    if(tx<0||ty<0||tx>=M.w||ty>=M.h)continue;
    var t=M.tiles[ty][tx];
    mmc.fillStyle=t===3||t===4?"#1d4a6a":t===5||t===6?"#1e5a24":t===7?"#666":t===15?"#5a10a0":t===14?"#7a3a1a":t===2?"#6a5a3a":"#2a4a2a";
    mmc.fillRect((dx+RANGE)*sx,(dy+RANGE)*sy,sx+0.5,sy+0.5);
  }
  // exits in range (moon-shut secrets hide from the map)
  M.exits.forEach(function(e){
    mmc.fillStyle=(e.moon&&!moonPassageOpen())?"#2a4a5a":"#ffd23f";
    for(var i=0;i<(e.w||1);i++){ var dx=(e.x+i)-S.x, dy=e.y-S.y;
      if(Math.abs(dx)<RANGE&&Math.abs(dy)<RANGE)mmc.fillRect((dx+RANGE)*sx,(dy+RANGE)*sy,sx+1,3); }
  });
  // beasts in range
  mmc.fillStyle="#e05252";enemies.forEach(function(e){if(e.dead)return;
    var dx=e.x-S.x, dy=e.y-S.y;
    if(Math.abs(dx)<RANGE&&Math.abs(dy)<RANGE)mmc.fillRect((dx+RANGE)*sx-1,(dy+RANGE)*sy-1,3,3);});
  // NPCs in range
  npcs.forEach(function(n){ var dx=n.x-S.x, dy=n.y-S.y;
    if(Math.abs(dx)<RANGE&&Math.abs(dy)<RANGE){ mmc.fillStyle=n.color||"#fff";
      mmc.beginPath();mmc.arc((dx+RANGE)*sx,(dy+RANGE)*sy,2.5,0,7);mmc.fill(); }});
  // player arrow (GTA triangle, rotates to facing)
  var px=W/2, py=H/2;
  var ang=S.dir==="up"?0:S.dir==="left"?-Math.PI/2:S.dir==="right"?Math.PI/2:Math.PI;
  mmc.save();mmc.translate(px,py);mmc.rotate(ang);
  mmc.fillStyle=player._sprint?"#ffe27a":"#fff";mmc.strokeStyle="#111";mmc.lineWidth=1.5;
  mmc.beginPath();mmc.moveTo(0,-6);mmc.lineTo(4.5,5);mmc.lineTo(-4.5,5);mmc.closePath();mmc.fill();mmc.stroke();
  mmc.restore();
  // north + sprint hint
  mmc.fillStyle="#fff";mmc.font="bold 10px Georgia";mmc.fillText("N",4,11);
  if(player._sprint){ mmc.fillStyle="#ffe27a";mmc.font="bold 9px Georgia";mmc.fillText(">>",W-20,11); }
  else if(S.stam<25){ mmc.fillStyle="#e05252";mmc.font="9px Georgia";mmc.fillText("tired",W-32,11); }
  $("minimap-label").textContent=M.label;
}
function updateHUD(){
  $("hp-fill").style.width=(100*S.hp/S.maxhp)+"%";$("hp-text").textContent="HP "+Math.ceil(S.hp)+"/"+S.maxhp;
  $("mp-fill").style.width=(100*S.mp/S.maxmp)+"%";$("mp-text").textContent="MP "+Math.ceil(S.mp)+"/"+S.maxmp;
  $("exp-fill").style.width=(100*S.xp/S.xpn)+"%";$("exp-text").textContent="Lv "+S.lvl+" · "+S.xp+"/"+S.xpn+" XP";
  $("portrait").textContent=(S.name||"R").charAt(0).toUpperCase();
  $("lvl-text").textContent="Lv"+S.lvl;$("gold-text").textContent=S.gold+"g";$("clock-text").textContent=hourStr()+(isFullMoon()?" 🌕":"")+(moonPassageOpen()&&!S.flags.soulbound?"✨":"");
  var c=RHE.CLASSES[S.cls];
  var stamTxt=Math.round(S.stam||100)+"%";
  var sprintTxt=(player._sprint)?" <b style='color:#ffe27a'>SPRINT</b>":"<span style='opacity:.7'>Shift:run</span>";
  $("skillbar").innerHTML="<span class='skill'>Space: Attack</span><span class='skill'>Q: "+c.skill.name+" ("+Math.max(0,player.skillCd).toFixed(1)+"s)</span>"+(S.flags.aegis?"<span class='skill aegis-badge'><img class='aegis-icon' src='assets/img/portraits/aegis.svg' alt='Aegis'>Aegis"+(player.aegisFire>0?" ~VOLLEY":player.aegisCd>0?" ("+Math.ceil(player.aegisCd)+"s)":" ✓")+"</span>":"")+(S.flags.soulbound?"<span class='skill soul-badge'>F: Soulbloom"+(player.lyraCd>0?" ("+Math.ceil(player.lyraCd)+"s)":" ✓")+(player.soulsurge>0?" · SURGE "+Math.ceil(player.soulsurge)+"s":"")+"</span>":"")+"<span class='skill'>⚡"+stamTxt+sprintTxt+"</span>";
  if(player.poison>0||player.burn>0)$("lvl-text").textContent+=" ☠";
}

/* ---------- ACT I FINALE ---------- */
/* Act I finale — no interruption: an epilogue toast, then straight into
   Act II like the later transitions. No screen, no button. */
function finishAct1(){
  var lil=S.rom.liliane;
  var score=lil.aff+lil.trust+lil.close+lil.respect;
  var epi;
  if(S.flags.night_hand&&score>=8)epi="ACT I COMPLETE — Rosalind keeps the Moonpetal in her braid all the way to the gate. 'You promised impossible things... So I will do the impossible too: trust.'";
  else if(S.flags.scout_left)epi="ACT I COMPLETE — The gate opens, but Fen's empty bunk follows you. 'We cannot save everyone,' Rosalind says — and doesn't believe it.";
  else epi="ACT I COMPLETE — Side by side under a strange dawn, fragment cold in your pocket, a forest learning to bloom behind.";
  toast(epi,6500);
  save(0,1);
  RHE.enterAct2();
}
/* Act II entry — keeps all stats/romance */
function enterAct2(){
  var e=$("ending");if(e)e.classList.add("hidden");
  if(!S.flags.met_yua)S.flags.met_yua=1;
  S.metYua=true;
  giveQuest("mq5");
  save(0,1);
  enterMap("spire",4,7);refreshQuests();updateHUD();
  bigToast("ACT II — Ashes of the Spires. Find Ruby.");
}
RHE.enterAct2=enterAct2;
RHE.projectEnding=function(){return projectEnding();};

/* ---------- FINALE (Act III — Choice of Hearts) ---------- */
function finishAct3(){
  RHE.Audio.playBGM(RHE.Audio.BGM.night);
  hideLocBanner();
  S.flags.finale_seen=1;
  var tone=S.flags.finale_tone||"free";
  var love=S.flags.finale_love||projectEnding();
  var tot=0;["liliane","yua","seraphina","mira","elowen","aria"].forEach(function(w){
    var v=S.rom[w]||{aff:0,trust:0,close:0};tot+=v.aff+v.trust+v.close;});
  if(S.flags.sworn)tot+=3; if(S.flags.wall_oath)tot+=3;
  var kl=kidsLine();
  var toneLine=tone==="hold"?"One thread held tightest — yet never chained. ":tone==="release"?"Hands opened wholly — and six hands caught thee. ":"Love, chosen every morn. ";
  var LOVES={
   liliane:{t:"ENDING — 'Stay.' ♥ — Rosalind",
    e:"A cottage past the east platform, Greenwood shutters, a captain's braid gone soft at the edges. She commandeth still — the wardens, the patrols, and thee, most of all at bedtime, for lullabies delivered as ORDERS work suspiciously well. "+kl+" with pointed ears and thy stubbornness call her Captain and thee Papa. The Oath-scar itcheth only when she is happy. It itcheth daily."},
   yua:{t:"ENDING — 'Mine. Ours. Evermore.' — Belladonna",
    e:"A Silverwall house with locks oiled by her own hand and a notebook gone from tactics to lullabies. "+kl+" — every heartbeat logged thrice, every first step witnessed. 'Halt' became the family's favorite game, and she always, radiantly, obeyeth. Possessive? Ever. Chosen? Daily. Wrong temperature. Perfect."},
   seraphina:{t:"ENDING — 'The Sunrise Thief' ♥ — Ruby",
    e:"A palace wing above the crater, and most mornings an empty throne — for the Princess walketh sunrises hand in hand with her sky-fallen consort, crownless, stone-thin scar and all. The court objected once. Once. "+kl+" with tiny horns and thy grin call her Radiance. Steal her again to-morrow. Thou wilt."},
   mira:{t:"ENDING — 'My Choosing' — Nyx",
    e:"A den upon the windy plains, meat over fire, stars for a ceiling. She teacheth the hunt; thou teachest choosing. "+kl+" — all ears, fangs, and thy laugh — wrestle at thy feet while her tail keeps time. No leash. No orders. Only pack. ...Hers. Thine. Ours. (Thou heardest nothing.)"},
   elowen:{t:"ENDING — 'Permanent Study' — Minerva",
    e:"The marsh tower, expanded: a second desk, a wider bed, a garden of bog-lights. "+kl+" with ink-stained fingers catalogue beetles and leave love-notes in the margins. She documenteth every milestone, leaneth without prompting now, and citeth thee in everything. Hypothesis: evermore. Result: confirmed."},
   aria:{t:"ENDING — 'Unpainted Laughter' — Daisy",
    e:"A cottage beyond the bells' reach, where no prayer may knock. Mornings of graceless, glorious laughter. "+kl+" who know their mama as Daisy first — Saint, never, unless THEY choose it. She teacheth joy as a curriculum; thou art her favorite pupil. Bless this mess. She doth, daily."},
   seramira:{t:"ENDING — 'Fire and Fang' — Ruby & Nyx",
    e:"Two households, one hearth-war, endless hunting rights in the palace kitchens. The thermostat dispute endeth never; the devotion wavereth never. "+kl+" of horns and ears learn both the bow of courts and the pounce of packs. Fire keepeth the gold. Fang keepeth the hunt. Thou keepest them both — barely, gladly."},
   lilyua:{t:"ENDING — 'Oath and Shield' — Rosalind & Belladonna",
    e:"Rivalry, transmuted to sisterhood over one shared sunrise watch. The rota is law: Rosalind guardeth days, Belladonna nights, and thou art guarded ALWAYS — objections overruled, two to one. "+kl+", the best-guarded brood in three realms, log their OWN heartbeats now. Thrice. Lovingly."},
   eloaria:{t:"ENDING — 'Ink and Bells' — Minerva & Daisy",
    e:"A tower with a sunny garden; a chapel with a library. Footnotes beside flower crowns. "+kl+" raised on marginalia and giggles, equally fluent in theory and joy. One wife studieth thee; the other celebrateth thee. Peer-reviewed sunshine. Evermore."},
   harem:{t:"ENDING — 'Enough — and More' ♥ — All Six",
    e:"Greenwood cottage, Spires wing, plains den, marsh tower, Silverwall house, Starlia garden — one sprawling, bickering, laughing household across three realms. "+kl+" with ears, horns, fangs, ink, sunshine, and thy stubborn heart. Jealousy, negotiated nightly. Love, chosen daily. The pit starved. The house overfloweth."},
    alone:{t:"ENDING — 'The Warden's Road'",
     e:"No house. No hearth. A traveler's cloak and six threads that loosen but never snap. Greenwood moons, Spire sunrises, plains wind, marsh mist, Silverwall steel, Starlia bells — and in each, a door ever open and a voice that saith: return any morn. Free as the first sky before it cracked. Choosing, and chosen, anyway."},
    lyra:{t:"ENDING — 'Second Heartbeat' ♥ — Lyra",
    e:"No cottage. No palace. No den — for thy house hath a heartbeat. Lyra walketh within thee through every realm: Greenwood moons, Spire sunrises, plains wind, marsh mist, Silverwall steel, Starlia bells. Every other thread looseneth but never snappeth; hers cannot even loosen, for it runneth through thy ribs. Thy wife counteth thy heartbeats and calleth every one hers. ...Thee. Evermore. Filed."}
  };
  var LE=LOVES[love]||LOVES.harem;
  var title=LE.t, ending=toneLine+LE.e;
  var bonds=["liliane","yua","seraphina","mira","elowen","aria"].map(function(w){
    var v=S.rom[w]||{aff:0,trust:0};return w+" "+(v.aff+v.trust);}).join(" · ");
  bigToast(title);
  toast("Heart: "+love+" · Household: "+(love==="alone"?"the open road":love==="lyra"?"thy chest — her evermore":kl)+" · Level "+S.lvl+" "+RHE.CLASSES[S.cls].name+" · Bond-score "+tot);
  save(0,1);
  // no screen, no buttons — the saga walketh on (Act IV hook).
}

/* ---------- TITLE / BOOT ---------- */
function boot(){
  try{RHE.Audio.loadSettings();}catch(e){} RHE.textSpeed=RHE.textSpeed||1;
  // ---- title cinematic: crystal letters, loading bar over the menu art,
  // then blur + reveal. Meaning: a grand fortress on a high cliff, keeper
  // of the light — magic and stone become one.
  try{
    var assets=["game_menu.png","Rehevane.png","assets/img/portraits/player.svg","assets/img/portraits/liliane.svg",
      "assets/img/portraits/yua.svg","assets/img/portraits/seraphina.svg","assets/img/portraits/mira.svg",
      "assets/img/portraits/elowen.svg","assets/img/portraits/aria.svg","assets/img/portraits/lyra.svg",
      "assets/img/portraits/aegis.svg"];
    var phrases=["Kindling the crystals…","Waking the threads…","Sealing the Oath…","Opening the gates…"];
    var done=0,started=Date.now();
    function ready(){var el=$("title-screen");if(el&&!el.classList.contains("ready"))el.classList.add("ready");}
    function tick(){done++;
      var f=$("loader-fill");if(f)f.style.width=Math.round(100*done/assets.length)+"%";
      var tx=$("loader-text");if(tx)tx.textContent=phrases[Math.min(phrases.length-1,(done*phrases.length/assets.length)|0)];
      if(done>=assets.length){var wait=Math.max(0,1600-(Date.now()-started));setTimeout(ready,wait);}};
    if(!assets.length)ready();
    assets.forEach(function(src){var im=new Image();im.onload=tick;im.onerror=tick;im.src=src;});
    setTimeout(ready,6000); // never trap the player behind the loader
  }catch(e){var el2=$("title-screen");if(el2)el2.classList.add("ready");}
  // Boot audio: main-menu BGM + a voice speaking "Rehevane" on 3.5s —
  // nothing else. (Gesture-gated: all starteth on tap-to-begin.)
  var titleVoiceT=null;
  function tryTitleVoice(){
    try{var a=new Audio("assets/voice/Rehevane.mp3"); a.volume=0.9;
      a.play().catch(function(){}); RHE.Audio.voiceFile=a;}catch(e){} }
  function stopTitleVoice(){ try{if(titleVoiceT)clearTimeout(titleVoiceT);}catch(e){}
    try{if(RHE.Audio.voiceFile) RHE.Audio.voiceFile.pause();}catch(e){} }
  function enterTitle(){var ts=$("title-screen");if(!ts||ts.classList.contains("entered"))return;
    ts.classList.add("entered");
    try{RHE.Audio.playBGM(RHE.Audio.BGM.title,0.5);}catch(e){}
    titleVoiceT=setTimeout(tryTitleVoice,3500);}
  (function(){
    var ts=document.getElementById("title-screen");
    if(ts){
      var vb=document.getElementById("title-begin");
      var iv=setInterval(function(){ if(ts.classList.contains("ready")){try{vb.classList.remove("hidden");}catch(e){}clearInterval(iv);} },200);
      vb.addEventListener("pointerdown",function(e){e.stopPropagation();enterTitle();});
      ts.addEventListener("keydown",function(){enterTitle();});
    }})();
  RHE.stopTitleVoice=stopTitleVoice;
  // in-world class cards (chosen after naming, not on the title screen)
  var cc=$("class-cards-ingame");Object.keys(RHE.CLASSES).forEach(function(id,i){var c=RHE.CLASSES[id];
    var d=document.createElement("div");d.className="class-card";d.dataset.cls=id;
    d.innerHTML="<div class='cc-key'>"+(i+1)+"</div><h4>"+c.name+"</h4><p>"+c.desc+"</p><p><i>Q: "+c.skill.name+" — "+c.skill.desc+"</i></p>";
    d.onclick=function(){applyClass(id);};
    cc.appendChild(d);});
  $("btn-new").onclick=function(){
    try{if(RHE.stopTitleVoice)RHE.stopTitleVoice();}catch(e){}
    S=freshState("paladin"); // provisional body; the Oath decides the past later
    $("title-screen").classList.add("hidden");$("game-screen").classList.remove("hidden");
    RHE.Audio.updateMute(RHE.Audio.muted);
    enterMap("outpost",20,11);refreshQuests();updateHUD();
    giveQuest("sq_scout");giveQuest("sq_bounty"); // rumors available early
    S.quests.sq_scout={stage:0,done:false};S.quests.sq_bounty={stage:0,done:false};
    bigToast("The sky cracks. You fall.");setTimeout(function(){openDlg("liliane_first");},800);requestAnimationFrame(loop);};
  $("btn-continue").onclick=function(){
    try{if(RHE.stopTitleVoice)RHE.stopTitleVoice();}catch(e){}
    S=freshState("paladin");$("title-screen").classList.add("hidden");$("game-screen").classList.remove("hidden");
    if(load(1)||load(0)){refreshQuests();updateHUD();requestAnimationFrame(loop);}else{toast("No save found.");$("title-screen").classList.remove("hidden");$("game-screen").classList.add("hidden");}};
  $("btn-settings").onclick=function(){$("settings-box").classList.remove("hidden");refreshSettingsUI();RHE.Audio.ui();};
  $("btn-settings-close").onclick=function(){$("settings-box").classList.add("hidden");RHE.Audio.ui();};
  $("btn-how").onclick=function(){$("help-box").classList.toggle("hidden");RHE.Audio.ui();};
  function refreshSettingsUI(){$("btn-sound").textContent=RHE.Audio.muted?"OFF":"ON";
    $("btn-music").textContent=Math.round(RHE.Audio.musicVol*100)+"%";
    $("btn-voice").textContent=RHE.Audio.voiceOn?"ON":"OFF";
    $("btn-text").textContent=RHE.textSpeed>=2?"Fast":RHE.textSpeed<1?"Slow":"Normal";}
  $("btn-sound").onclick=function(){RHE.Audio.updateMute(!RHE.Audio.muted);
    refreshSettingsUI();RHE.Audio.saveSettings();RHE.Audio.ui();};
  $("btn-music").onclick=function(){var steps=[1,0.75,0.5,0.25,0],i=steps.indexOf(RHE.Audio.musicVol);
    RHE.Audio.musicVol=steps[((i<0?0:i)+1)%steps.length];RHE.Audio.applyMusic();
    refreshSettingsUI();RHE.Audio.saveSettings();RHE.Audio.ui();};
  $("btn-voice").onclick=function(){RHE.Audio.voiceOn=!RHE.Audio.voiceOn;
    refreshSettingsUI();RHE.Audio.saveSettings();RHE.Audio.ui();};
  $("btn-text").onclick=function(){RHE.textSpeed=RHE.textSpeed>=2?0.7:(RHE.textSpeed<1?1:2);
    refreshSettingsUI();RHE.Audio.saveSettings();RHE.Audio.ui();};
  $("btn-exit").onclick=function(){$("farewell-veil").classList.remove("hidden");RHE.Audio.ui();};
  $("btn-return").onclick=function(){$("farewell-veil").classList.add("hidden");RHE.Audio.ui();};
  $("panel-close").onclick=closePanel;
  // single unified dialogue click handler (choice buttons handle themselves;
  // clicks during a choice node do nothing — no more double-advance/skips)
  $("dialogue").addEventListener("click",function(e){
    if(!DLG)return;
    if(e.target.closest&&e.target.closest(".choice"))return;
    var n=DLG.tree.nodes[DLG.node];
    if(n.choices)return;
    advanceDlg();
  });
  $("name-confirm").onclick=function(){sealName();};
  $("name-input").addEventListener("keydown",function(e){if(e.key==="Enter")sealName();e.stopPropagation();});
  // NOTE: title BGM starteth only in enterTitle (first tap) — never here,
  // lest audio precede the gesture that unlocketh it.
}
var last=0;
function loop(t){var dt=Math.min(0.05,(t-last)/1000||0.016);last=t;
  try{update(dt,t||0);if(S)render(t||0);}catch(err){console.error(err);}
  requestAnimationFrame(loop);}
document.addEventListener("DOMContentLoaded",boot);
})();
