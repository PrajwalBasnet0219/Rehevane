/* engine.js — input, camera, tile renderer w/ day-night + weather + pixel sprites.
   Maps are data-driven rects; collision via solid tiles. No external libs. */
var RHE = window.RHE || {};
RHE.Input = {keys:{},pressed:{},
  init(){ addEventListener("keydown",e=>{ if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();
      var k=e.key.toLowerCase(); var code=(e.code||"").toLowerCase();
      if(!this.keys[k])this.pressed[k]=1; this.keys[k]=1;
      // robust sprint: track both key and physical code (ShiftLeft/ShiftRight)
      if(k==="shift"||code==="shiftleft"||code==="shiftright"){ this.keys["shift"]=1; if(!this.keys["shift"])this.pressed["shift"]=1; }
      if(code){ if(!this.keys[code])this.pressed[code]=1; this.keys[code]=1; }});
    addEventListener("keyup",e=>{var k=e.key.toLowerCase(); var code=(e.code||"").toLowerCase();
      this.keys[k]=0; if(code)this.keys[code]=0;
      if(k==="shift"||code==="shiftleft"||code==="shiftright"){ this.keys["shift"]=0; }});
    // clear keys on blur so Shift never sticks
    addEventListener("blur",()=>{this.keys={};}); },
  consume(k){var v=this.pressed[k];this.pressed[k]=0;return v;},
  axis(){var x=0,y=0,k=this.keys;
    if(k["a"]||k["arrowleft"])x-=1; if(k["d"]||k["arrowright"])x+=1;
    if(k["w"]||k["arrowup"])y-=1; if(k["s"]||k["arrowdown"])y+=1; return {x,y};}
};
RHE.TILE=32;
/* Map builder: returns {w,h,tiles,solids,spawns,exits,props,label,bgm,weather} */
RHE.buildMaps = function(){
  function blank(w,h,base){var t=[];for(var y=0;y<h;y++){var r=[];for(var x=0;x<w;x++)r.push(base);t.push(r);}return t;}
  // tile codes: 0 grass,1 darkgrass,2 path,3 water,4 fall(water anim),5 tree(solid),6 pine,7 wall(solid),
  // 8 floor,9 stone,10 bridge,11 flower,12 tent,13 house(solid via props),14 fire,15 dark(corrupt),16 snow
  var M={};
  // OUTPOST 40x30
  (function(){var w=40,h=30,t=blank(w,h,0);
    for(var i=0;i<400;i++)t[(Math.random()*h)|0][(Math.random()*w)|0]=(Math.random()<0.5?0:1);
    for(var x=8;x<32;x++)for(var y=13;y<17;y++)t[y][x]=2; // main road
    for(var x=18;x<23;x++)for(var y=0;y<30;y++)if(t[y][x]!==2)t[y][x]=2; // north road
    // river west
    for(var y=0;y<h;y++)for(var x=0;x<3;x++)t[y][x]=3;
    t[15][3]=10;t[16][3]=10;
    // great tree plaza
    for(var y=4;y<10;y++)for(var x=16;x<25;x++)t[y][x]=8;
    // houses as solid blocks
    var solids=[[12,10],[24,10],[12,19],[24,19],[28,20]];
    solids.forEach(function(s){t[s[1]][s[0]]=7;t[s[1]][s[0]+1]=7;});
    // forest border trees
    for(var x=0;x<w;x++){t[0][x]=5;t[h-1][x]=5;}for(var yy=0;yy<h;yy++){t[yy][w-1]=5;}
    t[1][20]=2; // north exit gap
    M.outpost={label:"Greenwood Outpost",bgm:"outpost",w:w,h:h,tiles:t,
      exits:[{x:20,y:0,w:2,map:"forest",tx:20,ty:28},{x:39,y:15,w:1,map:"gate",tx:1,ty:5,cond:"mq4a"}],
      props:[{x:12,y:10,w:2,h:1,label:"Marta's Inn 🛏",c:"#e89ac0"},{x:24,y:10,w:2,h:1,label:"Elder Hall",c:"#cfe3c0"},
        {x:12,y:19,w:2,h:1,label:"Smithy 🔨",c:"#ff9a3c"},{x:24,y:19,w:2,h:1,label:"Peddler",c:"#d8b45c"},
        {x:20,y:7,w:1,h:1,label:"Vael-Thir Root",c:"#7fc76a"},{x:33,y:14,w:1,h:1,label:"Moonlit Platform 🌙 (come at night)",c:"#b388eb"}],
      sign:"Greenwood Outpost — pop. 300 souls. Curfew: corruption after dark."};})();
  // FOREST 46x34
  (function(){var w=46,h=34,t=blank(w,h,1);
    for(var i=0;i<300;i++)t[(Math.random()*h)|0][(Math.random()*w)|0]=0;
    for(var y=0;y<h;y++)for(var x=0;x<w;x++)if(Math.random()<0.16)t[y][x]=6;
    for(var x=18;x<24;x++)for(var y=0;y<h;y++)t[y][x]=2; // vertical road
    for(var y=14;y<18;y++)for(var x=0;x<w;x++)if(t[y][x]!==2)t[y][x]=2; // horizontal
    // corrupt patches
    var corr=[[33,8],[38,22],[10,26],[30,26]];
    corr.forEach(function(c){for(var dy=-2;dy<=2;dy++)for(var dx=-2;dx<=2;dx++){var xx=c[0]+dx,yy=c[1]+dy;
      if(xx>0&&yy>0&&xx<w&&yy<h&&Math.abs(dx)+Math.abs(dy)<4)t[yy][xx]=15;}});
    // waterfall + secret cave (west)
    for(var y=20;y<28;y++)for(var x=4;x<6;x++)t[y][x]=4;
    for(var y=0;y<h;y++){t[y][0]=5;t[y][w-1]=5;}for(var x=0;x<w;x++){t[h-1][x]=5;}
    t[0][20]=2;t[0][21]=2;
    M.forest={label:"Whispering Greenwood",bgm:"forest",weather:"leaves",w:w,h:h,tiles:t,
      exits:[{x:20,y:33,w:2,map:"outpost",tx:20,ty:2},{x:20,y:0,w:2,map:"hollow",tx:10,ty:18},
        {x:5,y:24,w:1,map:"cave",tx:8,ty:8,secret:1,moon:1},{x:45,y:16,w:1,map:"gate",tx:1,ty:5,cond:"mq4a"}],
      props:[{x:5,y:23,w:1,h:3,label:"Falling water... (something behind?)",c:"#5aa9e6"},
        {x:33,y:8,w:1,h:1,label:"Corruption node",c:"#5a10a0"},{x:10,y:26,w:1,h:1,label:"Overgrown thicket",c:"#7fc76a"}],
      sign:"Whispering Greenwood — stay on roots. The black sap bites."};})();
  // HOLLOW dungeon 24x22
  (function(){var w=24,h=22,t=blank(w,h,9);
    for(var x=0;x<w;x++){t[0][x]=7;t[h-1][x]=7;}for(var y=0;y<h;y++){t[y][0]=7;t[y][w-1]=7;}
    for(var x=4;x<20;x++){t[6][x]=15;t[12][x]=7;}t[12][11]=9;t[12][12]=9; // chasm w/ bridge
    for(var y=2;y<5;y++)for(var x=16;x<20;x++)t[y][x]=15;
    t[18][10]=9;
    M.hollow={label:"Corrupted Hollow (dungeon)",bgm:"hollow",dark:1,w:w,h:h,tiles:t,
      exits:[{x:10,y:18,w:2,map:"forest",tx:20,ty:2}],
      props:[{x:18,y:3,w:1,h:1,label:"Heart Fragment Reliquary",c:"#e05252"},{x:5,y:5,w:1,h:1,label:"Warden's diary page?",c:"#d8b45c"}],
      sign:"Corrupted Hollow — warden crypt. The stag speaks with a man's voice."};})();
  // CAVE secret 14x12
  (function(){var w=14,h=12,t=blank(w,h,9);
    for(var x=0;x<w;x++){t[0][x]=7;t[h-1][x]=7;}for(var y=0;y<h;y++){t[y][0]=7;t[y][w-1]=7;}
    for(var y=3;y<9;y++)for(var x=2;x<4;x++)t[y][x]=3;
    M.cave={label:"Hidden Grotto 💧",bgm:"cave",dark:1,w:w,h:h,tiles:t,
      exits:[{x:8,y:8,w:1,map:"forest",tx:6,ty:24}],
      props:[{x:10,y:4,w:1,h:1,label:"Dusty cache + diary",c:"#d8b45c"},
        {x:8,y:3,w:1,h:1,label:"Sunken Archive slab — three seals sleep here",c:"#4ad8c8"}],
      sign:"Behind falling water, the world keeps receipts."};})();
  // GATE teaser 12x10 -> Act II doorway (unsealed by meeting Belladonna)
  (function(){var w=12,h=10,t=blank(w,h,2);
    for(var x=0;x<w;x++){t[0][x]=7;t[h-1][x]=7;}for(var y=0;y<h;y++){t[y][0]=7;t[y][w-1]=7;}
    // south portcullis row stays wall until carved by the spire exit below
    M.gate={label:"Silverwall Gate",bgm:"gate",w:w,h:h,tiles:t,
      exits:[{x:1,y:5,w:1,map:"forest",tx:44,ty:16},{x:1,y:2,w:1,map:"outpost",tx:38,ty:15},
        {x:5,y:9,w:2,map:"spire",tx:2,ty:7,cond:"met_yua"}],
      props:[{x:5,y:9,w:1,h:1,label:"Silverwall Portcullis — south to the Ashen Approach (Act II)",c:"#5aa9e6"}],
      sign:"SILVERWALL GATE — the south portcullis opens once Belladonna has found you."};})();
  // SPIRE — Act II entry: Ashen Approach checkpoint (minimal starter map)
  (function(){var w=26,h=14,t=blank(w,h,2);
    for(var i=0;i<200;i++)t[(Math.random()*h)|0][(Math.random()*w)|0]=(Math.random()<0.5?2:9);
    for(var x=0;x<w;x++){t[0][x]=7;t[h-1][x]=7;}for(var y=0;y<h;y++){t[y][0]=7;t[y][w-1]=7;}
    for(var x=1;x<w-1;x++)for(var y=6;y<9;y++)t[y][x]=2; // ash road
    for(var y=0;y<h;y++)for(var x=18;x<20;x++)t[y][x]=14; // ember flow / lava seam
    t[7][2]=2;t[7][3]=2;
    M.spire={label:"Ashen Approach (Act II)",bgm:"spire",w:w,h:h,tiles:t,
      exits:[{x:2,y:7,w:1,map:"gate",tx:5,ty:8},
        {x:25,y:7,w:1,map:"spirecity",tx:1,ty:7,cond:"met_seraphina"}],
      props:[{x:19,y:7,w:1,h:1,label:"Dragonkin checkpoint — Ruby holds court ahead",c:"#ff9a3c"},
        {x:12,y:4,w:1,h:1,label:"Caravan ashes — the road from Silverwall",c:"#d8b45c"}],
      sign:"ASHEN APPROACH — dragonfire on the wind. The Spires remember the First Wish."};})();
  // SPIRE CAPITAL 24x14 — crater fortress, court of embers (Act II)
  (function(){var w=24,h=14,t=blank(w,h,9);
    for(var i=0;i<120;i++)t[(Math.random()*h)|0][(Math.random()*w)|0]=2;
    for(var x=0;x<w;x++){t[0][x]=7;t[h-1][x]=7;}for(var y=0;y<h;y++){t[y][0]=7;t[y][w-1]=7;}
    for(var x=1;x<w-1;x++)for(var y=6;y<9;y++)t[y][x]=2; // ash road
    for(var x=11;x<14;x++)for(var y=1;y<6;y++)t[y][x]=2; // north court road
    for(var x=9;x<16;x++)for(var y=2;y<5;y++)t[y][x]=8; // court plaza
    for(var y=1;y<h-1;y++)t[y][20]=14; // ember seam
    t[10][3]=7;t[10][4]=7;t[10][18]=7;t[10][19]=7; // basalt houses
    M.spirecity={label:"Spire Capital (Act II)",bgm:"spirecity",w:w,h:h,tiles:t,
      exits:[{x:0,y:7,w:1,map:"spire",tx:24,ty:7},
        {x:12,y:0,w:1,map:"sky",tx:8,ty:10,cond:"sera_trust"},
        {x:12,y:13,w:1,map:"plains",tx:13,ty:1,cond:"sky_calm"}],
      props:[{x:12,y:3,w:1,h:1,label:"Court of Embers — Ruby judges here by day",c:"#ff9a3c"},
        {x:12,y:4,w:1,h:1,label:"Balcony of Sunrise — she walks here alone at night",c:"#b388eb"}],
      sign:"SPIRE CAPITAL — by dragon law. The stone-hearted rule, the sky burns."};})();
  // SKY ARENA 16x12 — corrupted sky-node vortex (Act II boss)
  (function(){var w=16,h=12,t=blank(w,h,9);
    for(var x=0;x<w;x++){t[0][x]=7;t[h-1][x]=7;}for(var y=0;y<h;y++){t[y][0]=7;t[y][w-1]=7;}
    for(var dy=-2;dy<=2;dy++)for(var dx=-2;dx<=2;dx++){if(Math.abs(dx)+Math.abs(dy)<4)t[5+dy][8+dx]=15;}
    M.sky={label:"Corrupted Sky-Node",bgm:"sky",w:w,h:h,tiles:t,
      exits:[{x:8,y:11,w:1,map:"spirecity",tx:12,ty:1}],
      props:[{x:8,y:5,w:1,h:1,label:"Sky-Node Vortex — it feedeth on despair",c:"#c77dff"}],
      sign:"SKY-NODE — above the Spires. Hold fast to what is true."};})();
  // PLAINS 26x16 — Verdant Plains, Nyx's village (Act II)
  (function(){var w=26,h=16,t=blank(w,h,0);
    for(var i=0;i<200;i++)t[(Math.random()*h)|0][(Math.random()*w)|0]=1;
    for(var x=0;x<w;x++){t[0][x]=5;t[h-1][x]=5;}for(var y=0;y<h;y++){t[y][0]=5;t[y][w-1]=5;}
    for(var x=1;x<w-1;x++)for(var y=7;y<10;y++)t[y][x]=2; // trade road
    for(var y=1;y<h-1;y++)for(var x=13;x<15;x++)if(t[y][x]!==2)t[y][x]=2; // north path
    t[4][19]=7;t[4][20]=7;t[11][19]=7;t[11][20]=7; // hide huts
    M.plains={label:"Verdant Plains (Act II)",bgm:"plains",w:w,h:h,tiles:t,
      exits:[{x:13,y:0,w:2,map:"spirecity",tx:12,ty:12},
        {x:25,y:8,w:1,map:"marsh",tx:1,ty:7,cond:"mira_free"}],
      props:[{x:8,y:8,w:1,h:1,label:"Burning wagon — reavers press a trade caravan",c:"#e05252"},
        {x:21,y:8,w:1,h:1,label:"Brand post — the collar-law of the plains",c:"#d8b45c"}],
      sign:"VERDANT PLAINS — the wind howls for miles. The branded endure."};})();
  // MARSH 22x14 — Mistveil Marsh, Minerva's tower (Act II)
  (function(){var w=22,h=14,t=blank(w,h,1);
    for(var x=0;x<w;x++){t[0][x]=5;t[h-1][x]=5;}for(var y=0;y<h;y++){t[y][0]=5;t[y][w-1]=5;}
    for(var x=1;x<w-1;x++)for(var y=6;y<9;y++)t[y][x]=2; // bog road
    for(var x=4;x<=6;x++)for(var y=2;y<=4;y++)t[y][x]=7; // Minerva's tower — stone under mist
    t[1][5]=7; // spire, a finger against the fog
    for(var y=3;y<6;y++)for(var x=9;x<12;x++)t[y][x]=3; // black pool
    for(var y=9;y<12;y++)for(var x=15;x<18;x++)t[y][x]=3; // black pool
    M.marsh={label:"Mistveil Marsh (Act II)",bgm:"marsh",w:w,h:h,tiles:t,
      exits:[{x:0,y:7,w:1,map:"plains",tx:24,ty:8},
        {x:21,y:7,w:1,map:"silverwall",tx:1,ty:7,cond:"sin_seen"}],
      props:[{x:5,y:5,w:1,h:1,label:"Minerva's Tower — knock, and mean thy questions",c:"#b388eb"}],
      sign:"MISTVEIL MARSH — the mist keepeth what scholars bury."};})();
  // SILVERWALL 22x14 — human city, knight's vow (Act III)
  (function(){var w=22,h=14,t=blank(w,h,2);
    for(var i=0;i<100;i++)t[(Math.random()*h)|0][(Math.random()*w)|0]=9;
    for(var x=0;x<w;x++){t[0][x]=7;t[h-1][x]=7;}for(var y=0;y<h;y++){t[y][0]=7;t[y][w-1]=7;}
    for(var x=1;x<w-1;x++)for(var y=6;y<9;y++)t[y][x]=2; // king's road
    for(var x=9;x<13;x++)for(var y=5;y<8;y++)t[y][x]=8; // rite plaza
    t[3][4]=7;t[3][5]=7;t[3][15]=7;t[3][16]=7;t[10][4]=7;t[10][5]=7;t[10][15]=7;t[10][16]=7; // houses
    M.silverwall={label:"Silverwall City (Act III)",bgm:"silverwall",w:w,h:h,tiles:t,
      exits:[{x:0,y:7,w:1,map:"marsh",tx:20,ty:7},
        {x:21,y:7,w:1,map:"starlia",tx:1,ty:7,cond:"sworn"}],
      props:[{x:10,y:6,w:1,h:1,label:"Rite Circle — the Sworn Shield is sealed here",c:"#e05252"}],
      sign:"SILVERWALL — white stone, blue banners. The King watches the Heart-Bearer."};})();
  // STARLIA 22x14 — holy city, saint of the altar (Act III)
  (function(){var w=22,h=14,t=blank(w,h,8);
    for(var i=0;i<80;i++)t[(Math.random()*h)|0][(Math.random()*w)|0]=2;
    for(var x=0;x<w;x++){t[0][x]=7;t[h-1][x]=7;}for(var y=0;y<h;y++){t[y][0]=7;t[y][w-1]=7;}
    for(var x=1;x<w-1;x++)for(var y=6;y<9;y++)t[y][x]=2; // pilgrim road
    t[1][8]=7;t[1][9]=7;t[1][12]=7;t[1][13]=7; // cathedral walls
    M.starlia={label:"Holy City Starlia (Act III)",bgm:"starlia",w:w,h:h,tiles:t,
      exits:[{x:0,y:7,w:1,map:"silverwall",tx:20,ty:7},
        {x:10,y:0,w:2,map:"pit",tx:7,ty:10,cond:"aria_open"}],
      props:[{x:2,y:7,w:1,h:1,label:"Side Chapel — she prays here alone at night",c:"#fff3b0"},
        {x:11,y:12,w:1,h:1,label:"Walls of Starlia — the city lights below",c:"#5aa9e6"},
        {x:10,y:1,w:1,h:1,label:"Great Altar — thousands of prayers drink here",c:"#e05252"}],
      sign:"STARLIA — bells without end. The Saint anchors every prayer."};})();
  // PIT 16x12 — Devourer's altar depths (finale)
  (function(){var w=16,h=12,t=blank(w,h,9);
    for(var x=0;x<w;x++){t[0][x]=7;t[h-1][x]=7;}for(var y=0;y<h;y++){t[y][0]=7;t[y][w-1]=7;}
    var corr=[[4,3],[11,3],[8,7]];
    corr.forEach(function(c){for(var dy=-2;dy<=2;dy++)for(var dx=-2;dx<=2;dx++){var xx=c[0]+dx,yy=c[1]+dy;
      if(xx>0&&yy>0&&xx<w&&yy<h&&Math.abs(dx)+Math.abs(dy)<4)t[yy][xx]=15;}});
    M.pit={label:"Altar Depths (Finale)",bgm:"pit",dark:1,w:w,h:h,tiles:t,
      exits:[{x:7,y:11,w:1,map:"starlia",tx:10,ty:1}],
      props:[{x:8,y:2,w:1,h:1,label:"Devourer's Altar — the pit behind her heart",c:"#e05252"}],
      sign:"ALTAR DEPTHS — love that will not end hungereth here."};})();
  // Post-process: carve walkable gaps at border exits (a trigger tile the
  // player can never stand on = a door that never opens) and clear trees
  // around every arrival point so nobody spawns inside a trunk.
  Object.keys(M).forEach(function(k){var m=M[k];
    m.exits.forEach(function(ex){
      if(!ex.secret){for(var i=0;i<(ex.w||1);i++){var xx=ex.x+i,yy=ex.y;
        if(xx>=0&&yy>=0&&xx<m.w&&yy<m.h)m.tiles[yy][xx]=(k==="hollow"||k==="cave")?9:2;}}
      var d=M[ex.map];if(!d)return;
      for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){
        var cx=Math.round(ex.tx+dx),cy=Math.round(ex.ty+dy);
        if(cx<0||cy<0||cx>=d.w||cy>=d.h)continue;
        var t=d.tiles[cy][cx];
        if(t===5||t===6)d.tiles[cy][cx]=(ex.map==="hollow"||ex.map==="cave")?9:0;
      }
    });});
  return M;
};
/* Sprite drawing (procedural pixel people) */
/* Chibi sprite renderer — each character carries their portrait identity:
   hair style/color, outfit, trim, cape, and extras (bows, ears, flowers...).
   Feet anchored at (0,+11); figure is ~47px tall (bigger than a tile, like classic RPGs). */
RHE.Sprites = {
  draw(ctx,e,cam,time){
    var x=Math.round(e.x*RHE.TILE-cam.x), y=Math.round(e.y*RHE.TILE-cam.y);
    var bob=e.moving?Math.round(Math.sin(time/130+e.x*3)*1.5):0;
    var top=e.top||e.color||"#d8b45c", trim=e.trim||"#d8b45c",
        hair=e.hair||"#3a2a1a", skin=e.skin||"#f2c89b",
        pants=e.pants||"#2a2a33", boots=e.boots||"#141014",
        cape=e.cape, style=e.style||"short",
        extra=e.extra||(e.ears?"elf":null);
    ctx.save(); ctx.translate(x,y);
    // shadow
    ctx.fillStyle="rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(0,11,11,4,0,0,7); ctx.fill();
    // wolf tail (behind everything)
    if(e.tail){ctx.strokeStyle=e.color||"#999";ctx.lineWidth=4;ctx.beginPath();
      ctx.moveTo(7,4);ctx.quadraticCurveTo(15,Math.sin(time/200)*2,13,-6);ctx.stroke();}
    // cape (behind body)
    if(cape){ctx.fillStyle=cape;ctx.fillRect(-11,-27+bob,5,36);ctx.fillRect(6,-27+bob,5,36);}
    var dress=!!e.dress;
    // legs / gown
    if(dress){ctx.fillStyle=top;ctx.fillRect(-9,-2,18,11);
      ctx.fillStyle="rgba(0,0,0,.28)";ctx.fillRect(-9,5,18,4);
      ctx.fillStyle=trim;ctx.fillRect(-9,7,18,2);}
    else{var l=bob?1:0;
      ctx.fillStyle=pants;ctx.fillRect(-6,-2,5,8+l);ctx.fillRect(1,-2,5,8-l);
      ctx.fillStyle=boots;ctx.fillRect(-6,6+l,5,4);ctx.fillRect(1,6-l,5,4);}
    // torso + collar + belt
    ctx.fillStyle=top;ctx.fillRect(-8,-15,16,13);
    ctx.fillStyle=trim;ctx.fillRect(-8,-15,16,2);
    ctx.fillStyle="rgba(0,0,0,.3)";ctx.fillRect(-8,-5,16,2);
    // arms
    ctx.fillStyle=top;ctx.fillRect(-11,-14+bob,3,9);ctx.fillRect(8,-14-bob,3,9);
    ctx.fillStyle=skin;ctx.fillRect(-11,-6+bob,3,3);ctx.fillRect(8,-6-bob,3,3);
    // head
    ctx.fillStyle=skin;ctx.fillRect(-7,-29,14,14);
    // hair back mass
    ctx.fillStyle=hair;
    if(style==="long"){ctx.fillRect(-9,-33,18,36);ctx.fillRect(-10,-4,4,10);ctx.fillRect(6,-4,4,10);}
    else if(style==="messy"){ctx.fillRect(-8,-33,16,9);ctx.fillRect(-9,-28,3,14);ctx.fillRect(6,-28,3,14);
      ctx.fillRect(-5,-35,4,4);ctx.fillRect(2,-36,4,4);}
    else{ctx.fillRect(-8,-33,16,8);} // short cap
    if(e.dir==="up"){ctx.fillRect(-7,-29,14,14);} // back of head
    // fringe band + strands (full coverage — no bald gaps)
    if(e.dir!=="up"){ctx.fillRect(-7,-30,14,6);
      ctx.fillRect(-7,-25,3,4);ctx.fillRect(4,-25,3,4);ctx.fillRect(-2,-25,4,6);}
    // side head extras (ears drawn over hair sides)
    if(extra==="elf"||extra==="elfbow"||extra==="wolf"){
      if(extra==="wolf"){ctx.fillStyle=hair;
        ctx.fillRect(-10,-40,5,5);ctx.fillRect(-9,-43,3,3);
        ctx.fillRect(5,-40,5,5);ctx.fillRect(6,-43,3,3);
        ctx.fillStyle="#8a3a4a";ctx.fillRect(-9,-39,3,3);ctx.fillRect(6,-39,3,3);}
      else{ctx.fillStyle=skin;ctx.fillRect(-11,-27,4,3);ctx.fillRect(7,-27,4,3);}
    }
    // face
    var dx=e.dir==="left"?-2:e.dir==="right"?2:0;
    if(e.dir!=="up"){
      ctx.fillStyle="#141414";ctx.fillRect(-4+dx,-21,2,3);ctx.fillRect(2+dx,-21,2,3);
      if(extra==="glasses"){ctx.strokeStyle="#222";ctx.lineWidth=1;
        ctx.strokeRect(-6,-23,5,5);ctx.strokeRect(1,-23,5,5);}
      if(extra==="flower"){ctx.fillStyle="#8a4ab0";ctx.fillRect(5,-32,4,4);
        ctx.fillStyle="#e8c860";ctx.fillRect(6,-31,2,2);}
      if(extra==="elfbow"){ctx.fillStyle="#1c1c22";
        ctx.fillRect(-8,-38,6,5);ctx.fillRect(2,-38,6,5);ctx.fillRect(-2,-37,4,4);}
      if(extra==="crown"){ctx.fillStyle="#d8b45c";ctx.fillRect(-6,-37,12,4);
        ctx.fillRect(-6,-40,2,3);ctx.fillRect(-1,-41,2,4);ctx.fillRect(4,-40,2,3);}
    }
    ctx.restore();
  }
};
