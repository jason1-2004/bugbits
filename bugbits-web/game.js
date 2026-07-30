(function(){
"use strict";


// BugBits v2.0 - Complete Game Engine
(function(){
'use strict';

var cvs,ctx,state='welcome',selBug=-1,nectar=0,essence=0;
var playerBase={},enemyBase={};
var pB=[],eB=[],flw=[],pts=[];
var curWorld=0,mapW=500,mapH=300,gTime=0,lastTS=0,gSpd=1;
var camX=0,camY=0,tCamX=0,tCamY=0,camZoom=1,hintTimer=0,hintMsg='';
var fpsShow=false,fpsCount=0,fpsTime=0,curFPS=60;
var unlocked=[],completed=[],beatenBosses=[];
var CHAPTERS=[],LEVELS=[],WORLDS=[],BOSSES=[];
var done=[],curLv=null,selectedLevel=-1,selLv=-1,nGoal=0,dLim=0,dTimer=0;

// === NEW: Path System, Bug Placement & Wormhole State ===
var lanes=[];             // Lane objects with waypoints
var wormholes=[];          // Wormhole portals {x,y,toX,toY,active,cd,color}
var placementMode=false;  // Placement mode active
var placingBugId=null;    // Bug type being placed on path
var placePoints=[];       // Valid placement points along paths
var selBugObj=null;       // Currently selected placed bug
var selectedWormhole=-1;   // Selected wormhole index
var wormholeMode=false;   // Wormhole placement mode
var pathOpacity=0.4;      // Path visual opacity

// === UTILITY ===
var rnd=Math.random;
function dist(a,b){return Math.hypot(a.x-(b.x||0),a.y-(b.y||0))}
function bgd(id){for(var i=0;i<BUGS.length;i++)if(BUGS[i].id===id)return BUGS[i];return null}
function fmtT(s){var m=Math.floor(s/60),ss=s%60;return String(m).padStart(2,'0')+':'+String(ss).padStart(2,'0')}

// === ICONS FOR BUG TYPES ===
var BUG_ICONS=['\\u{1F41C}','\\u{1F41D}','\\u{1F41E}','\\u{1F41B}','\\u{1F41D}','\\u{1F41E}','\\u{1F41C}','\\u{1F41B}','\\u{1F41E}','\\u{1F41B}','\\u{1F41D}','\\u{1F41C}','\\u{1F41E}','\\u{1F41B}','\\u{1F41D}','\\u{1F41C}','\\u{1F41E}','\\u{1F41B}','\\u{1F41D}','\\u{1F41C}','\\u{1F41E}','\\u{1F41B}','\\u{1F41C}','\\u{1F98C}','\\u{1F577}'];

// === BUG DATA ===
var BUGS=[
{id:'ant',nm:'Ant',hp:15,dm:5,rng:0,spd:22,co:0,rl:15,fl:false,gth:true,r:5,sd:0,hid:0,ard:0,sp:null,cl:'#8B4513'},
{id:'militant',nm:'Militant',hp:18,dm:6,rng:0,spd:18,co:2,rl:15,fl:false,gth:true,r:6,sd:0,hid:0,ard:0,sp:null,cl:'#A0522D'},
{id:'bee',nm:'Bee',hp:20,dm:5,rng:0,spd:25,co:3,rl:15,fl:true,gth:true,r:7,sd:0,hid:0,ard:0,sp:null,cl:'#FFD700'},
{id:'wildbee',nm:'Wild Bee',hp:25,dm:7,rng:0,spd:20,co:4,rl:15,fl:true,gth:true,r:8,sd:0,hid:0,ard:0,sp:'crit',cl:'#DAA520'},
{id:'littlebeetle',nm:'Little Beetle',hp:12,dm:4,rng:0,spd:28,co:3,rl:10,fl:false,gth:true,r:15,sd:0,hid:0,ard:0,sp:null,cl:'#8FBC8F'},
{id:'rhinobeetle',nm:'Rhino Beetle',hp:40,dm:12,rng:0,spd:15,co:5,rl:15,fl:false,gth:true,r:16,sd:0,hid:0,ard:0,sp:'fast',cl:'#8B4513'},
{id:'stagbeetle',nm:'Stag Beetle',hp:50,dm:18,rng:0,spd:12,co:10,rl:30,fl:false,gth:true,r:17,sd:0,hid:0,ard:0,sp:'dbl',cl:'#654321'},
{id:'stinkbug',nm:'Stink Bug',hp:25,dm:8,rng:0,spd:15,co:3,rl:10,fl:false,gth:true,r:25,sd:5,hid:0,ard:0,sp:null,cl:'#556B2F'},
{id:'toxicbug',nm:'Toxic Bug',hp:30,dm:10,rng:0,spd:18,co:6,rl:15,fl:false,gth:true,r:26,sd:8,hid:0,ard:0,sp:'slow',cl:'#2E8B57'},
{id:'caterpillar',nm:'Caterpillar',hp:60,dm:15,rng:0,spd:10,co:7,rl:30,fl:false,gth:true,r:35,sd:0,hid:3,ard:0,sp:'crp',cl:'#32CD32'},
{id:'poisonpillar',nm:'Poison Pillar',hp:80,dm:20,rng:0,spd:8,co:12,rl:45,fl:false,gth:false,r:35,sd:10,hid:5,ard:0,sp:'cnt',cl:'#800080'},
{id:'bigbangbug',nm:'Big Bang Bug',hp:100,dm:30,rng:60,spd:5,co:8,rl:60,fl:false,gth:true,r:35,sd:0,hid:0,ard:0,sp:'aoe',cl:'#FF4500'},
{id:'spider',nm:'Spider',hp:35,dm:12,rng:50,spd:30,co:12,rl:45,fl:false,gth:true,r:35,sd:0,hid:0,ard:0,sp:'aur',cl:'#2F2F2F'},
{id:'wasp',nm:'Wasp',hp:22,dm:8,rng:40,spd:35,co:4,rl:10,fl:true,gth:false,r:35,sd:0,hid:0,ard:0,sp:null,cl:'#FFA500'},
{id:'bomberbee',nm:'Bomber Bee',hp:35,dm:15,rng:50,spd:25,co:7,rl:30,fl:true,gth:false,r:35,sd:5,hid:0,ard:0,sp:'burn',cl:'#FF6347'},
{id:'waterbeetle',nm:'Water Beetle',hp:45,dm:14,rng:0,spd:20,co:3,rl:7,fl:false,gth:true,r:35,sd:3,hid:0,ard:0,sp:null,cl:'#4682B4'},
{id:'giantwaterbeetle',nm:'Giant Water Beetle',hp:80,dm:25,rng:0,spd:12,co:9,rl:30,fl:false,gth:true,r:35,sd:5,hid:0,ard:0,sp:null,cl:'#4169E1'},
{id:'beetlehero',nm:'Beetle Hero',hp:120,dm:35,rng:0,spd:10,co:15,rl:90,fl:false,gth:false,r:35,sd:10,hid:5,ard:5,sp:'arm',cl:'#228B22'},
{id:'toxichero',nm:'Toxic Hero',hp:100,dm:30,rng:0,spd:12,co:15,rl:90,fl:true,gth:false,r:35,sd:15,hid:5,ard:3,sp:'pso',cl:'#006400'},
{id:'wasphero',nm:'Wasp Hero',hp:110,dm:32,rng:0,spd:14,co:15,rl:90,fl:true,gth:false,r:35,sd:8,hid:3,ard:8,sp:'chain',cl:'#FF8C00'},
{id:'tick',nm:'Tick',hp:150,dm:40,rng:0,spd:8,co:0,rl:15,fl:false,gth:false,r:35,sd:15,hid:10,ard:10,sp:null,cl:'#8B0000'}
];
// === EXTENDED INSECTS (new) ===
BUGS.push(
{id:'fire_beetle',nm:'Fire Beetle',hp:25,dm:8,rng:0,spd:15,co:4,rl:20,fl:false,gth:true,r:10,sd:0,hid:0,ard:0,sp:'burn',cl:'#FF4500'},
{id:'venom_spider',nm:'Venom Spider',hp:30,dm:6,rng:40,spd:20,co:5,rl:25,fl:false,gth:true,r:12,sd:0,hid:0,ard:0,sp:'pso',cl:'#4B0082'},
{id:'ice_wasp',nm:'Ice Wasp',hp:20,dm:7,rng:50,spd:30,co:6,rl:20,fl:true,gth:false,r:10,sd:0,hid:0,ard:0,sp:'slow',cl:'#87CEEB'},
{id:'thunder_mantis',nm:'Thunder Mantis',hp:35,dm:12,rng:0,spd:25,co:7,rl:25,fl:false,gth:true,r:14,sd:0,hid:0,ard:0,sp:'chain',cl:'#FFD700'}
);

// Extended icons for new insects
BUG_ICONS.push('\\u{1F98C}','\\u{1F577}','\\u{1F998}','\\u{1F999}');

// === WORLD DATA (extended with toolkit info) ===
WORLDS=[
{name:'Meadow Fields',bg:'#2d5a27',pc:'#4CAF50',gc:'#81C784',icon:'\\u{1F33F}'},
{name:'Wetlands Lakes',bg:'#1a4a3a',pc:'#0288D1',gc:'#4FC3F7',icon:'\\u{1F30A}'},
{name:'Desert Sands',bg:'#8B6914',pc:'#FFB74D',gc:'#FFE082',icon:'\\u{1F3DC}'},
{name:'Dark Forest',bg:'#1a2e1a',pc:'#2E7D32',gc:'#1B5E20',icon:'\\u{1F332}',slowGround:true},
{name:'Crystal Caves',bg:'#1a1a3e',pc:'#7E57C2',gc:'#B39DDB',icon:'\\u{1F48E}',crystalTerrain:true},
{name:'Volcanic Lands',bg:'#3d0a0a',pc:'#FF5722',gc:'#FF8A65',icon:'\\u{1F30B}',volcano:true},
{name:'Void Realm',bg:'#0a0a1a',pc:'#6200EA',gc:'#9C27B0',icon:'\\u{1F573}',voidTheme:true},
{name:'Sky Gardens',bg:'#1a3a5c',pc:'#42A5F5',gc:'#90CAF9',icon:'\\u{26C5}',floating:true},
{name:'Iron Thicket',bg:'#2a2a2a',pc:'#78909C',gc:'#B0BEC5',icon:'\\u{1F528}',metalTerrain:true}
];

// === NEW: WORLD PATH DATA (Waypoint-based lanes like original game) ===
// Each world has multiple lanes, each lane is an array of waypoints forming the road
var WORLD_PATHS=[
  // World 0: Meadow Fields
  {lanes:[
    [{x:50,y:75},{x:95,y:70},{x:140,y:78},{x:185,y:72},{x:230,y:80},{x:275,y:75},{x:320,y:82},{x:365,y:76},{x:410,y:84},{x:455,y:78},{x:500,y:85},{x:545,y:80},{x:590,y:88}],
    [{x:50,y:150},{x:100,y:140},{x:150,y:155},{x:200,y:145},{x:250,y:160},{x:300,y:150},{x:350,y:165},{x:400,y:155},{x:450,y:170},{x:500,y:160},{x:550,y:175},{x:590,y:165}],
    [{x:50,y:225},{x:95,y:230},{x:140,y:220},{x:185,y:235},{x:230,y:225},{x:275,y:240},{x:320,y:230},{x:365,y:245},{x:410,y:235},{x:455,y:250},{x:500,y:240},{x:545,y:255},{x:590,y:245}]
  ]},
  // World 1: Wetlands Lakes
  {lanes:[
    [{x:50,y:70},{x:90,y:60},{x:130,y:85},{x:170,y:55},{x:210,y:90},{x:250,y:65},{x:290,y:95},{x:330,y:70},{x:370,y:100},{x:410,y:75},{x:450,y:105},{x:490,y:80},{x:530,y:110},{x:570,y:85},{x:590,y:100}],
    [{x:50,y:150},{x:100,y:130},{x:150,y:170},{x:200,y:140},{x:250,y:180},{x:300,y:150},{x:350,y:190},{x:400,y:160},{x:450,y:200},{x:500,y:170},{x:550,y:210},{x:590,y:185}],
    [{x:50,y:230},{x:85,y:245},{x:120,y:215},{x:160,y:250},{x:200,y:225},{x:240,y:255},{x:280,y:235},{x:320,y:260},{x:360,y:240},{x:400,y:265},{x:440,y:245},{x:480,y:270},{x:520,y:250},{x:560,y:275},{x:590,y:260}]
  ]},
  // World 2: Desert Sands
  {lanes:[
    [{x:50,y:80},{x:105,y:75},{x:160,y:85},{x:215,y:78},{x:270,y:88},{x:325,y:80},{x:380,y:90},{x:435,y:82},{x:490,y:92},{x:545,y:85},{x:590,y:90}],
    [{x:50,y:150},{x:110,y:145},{x:170,y:158},{x:230,y:148},{x:290,y:162},{x:350,y:152},{x:410,y:168},{x:470,y:155},{x:530,y:172},{x:590,y:160}],
    [{x:50,y:220},{x:100,y:228},{x:150,y:215},{x:200,y:232},{x:250,y:222},{x:300,y:238},{x:350,y:228},{x:400,y:242},{x:450,y:232},{x:500,y:248},{x:550,y:238},{x:590,y:250}]
  ]},
  // World 3: Dark Forest
  {lanes:[
    [{x:50,y:65},{x:80,y:55},{x:115,y:75},{x:145,y:45},{x:180,y:70},{x:215,y:40},{x:250,y:78},{x:285,y:50},{x:320,y:85},{x:360,y:60},{x:400,y:90},{x:435,y:70},{x:475,y:95},{x:510,y:80},{x:550,y:100},{x:590,y:85}],
    [{x:50,y:150},{x:90,y:135},{x:130,y:165},{x:170,y:140},{x:210,y:175},{x:250,y:148},{x:290,y:180},{x:330,y:155},{x:370,y:185},{x:410,y:162},{x:450,y:190},{x:490,y:170},{x:530,y:195},{x:570,y:178},{x:590,y:185}],
    [{x:50,y:235},{x:82,y:245},{x:118,y:225},{x:152,y:250},{x:190,y:232},{x:225,y:255},{x:262,y:240},{x:298,y:260},{x:335,y:245},{x:372,y:265},{x:410,y:250},{x:448,y:268},{x:485,y:255},{x:525,y:272},{x:565,y:260},{x:590,y:268}]
  ]},
  // World 4: Crystal Caves
  {lanes:[
    [{x:50,y:75},{x:88,y:60},{x:130,y:90},{x:168,y:50},{x:210,y:85},{x:250,y:55},{x:295,y:88},{x:335,y:58},{x:378,y:92},{x:420,y:62},{x:465,y:95},{x:508,y:68},{x:550,y:98},{x:590,y:78}],
    [{x:50,y:150},{x:95,y:135},{x:145,y:168},{x:195,y:140},{x:245,y:175},{x:295,y:148},{x:345,y:180},{x:395,y:155},{x:445,y:185},{x:495,y:160},{x:545,y:190},{x:590,y:172}],
    [{x:50,y:225},{x:90,y:240},{x:135,y:212},{x:178,y:245},{x:225,y:218},{x:268,y:250},{x:315,y:225},{x:358,y:255},{x:405,y:230},{x:448,y:260},{x:495,y:238},{x:540,y:265},{x:590,y:250}]
  ]},
  // World 5: Volcanic Lands
  {lanes:[
    [{x:50,y:70},{x:82,y:55},{x:120,y:85},{x:155,y:42},{x:195,y:78},{x:230,y:38},{x:270,y:82},{x:305,y:45},{x:345,y:88},{x:382,y:52},{x:422,y:92},{x:460,y:58},{x:500,y:96},{x:540,y:65},{x:590,y:88}],
    [{x:50,y:150},{x:86,y:130},{x:128,y:168},{x:168,y:125},{x:212,y:172},{x:255,y:132},{x:298,y:178},{x:340,y:140},{x:385,y:182},{x:428,y:148},{x:472,y:188},{x:515,y:155},{x:558,y:192},{x:590,y:170}],
    [{x:50,y:230},{x:90,y:245},{x:135,y:215},{x:178,y:252},{x:225,y:222},{x:268,y:258},{x:315,y:228},{x:358,y:262},{x:405,y:235},{x:448,y:268},{x:495,y:242},{x:540,y:272},{x:590,y:258}]
  ]},
  // World 6: Void Realm
  {lanes:[
    [{x:50,y:60},{x:100,y:50},{x:150,y:75},{x:200,y:45},{x:250,y:70},{x:300,y:40},{x:350,y:68},{x:400,y:38},{x:450,y:72},{x:500,y:42},{x:550,y:78},{x:590,y:55}],
    [{x:50,y:150},{x:105,y:140},{x:160,y:170},{x:215,y:145},{x:270,y:175},{x:325,y:150},{x:380,y:180},{x:435,y:155},{x:490,y:185},{x:545,y:160},{x:590,y:180}],
    [{x:50,y:240},{x:95,y:250},{x:145,y:228},{x:195,y:255},{x:245,y:235},{x:295,y:260},{x:345,y:240},{x:395,y:265},{x:445,y:245},{x:495,y:268},{x:545,y:252},{x:590,y:270}]
  ]},
  // World 7: Sky Gardens
  {lanes:[
    [{x:50,y:85},{x:90,y:95},{x:130,y:78},{x:170,y:88},{x:210,y:72},{x:250,y:85},{x:290,y:68},{x:330,y:82},{x:370,y:65},{x:410,y:80},{x:450,y:62},{x:490,y:78},{x:530,y:58},{x:570,y:75},{x:590,y:65}],
    [{x:50,y:150},{x:95,y:160},{x:140,y:145},{x:185,y:155},{x:230,y:140},{x:275,y:152},{x:320,y:138},{x:365,y:148},{x:410,y:135},{x:455,y:145},{x:500,y:132},{x:545,y:142},{x:590,y:135}],
    [{x:50,y:215},{x:85,y:225},{x:120,y:210},{x:155,y:220},{x:190,y:205},{x:225,y:218},{x:260,y:202},{x:295,y:215},{x:330,y:198},{x:365,y:212},{x:400,y:195},{x:435,y:208},{x:470,y:192},{x:505,y:205},{x:540,y:190},{x:575,y:200},{x:590,y:195}]
  ]},
  // World 8: Iron Thicket
  {lanes:[
    [{x:50,y:70},{x:80,y:80},{x:110,y:62},{x:145,y:85},{x:175,y:55},{x:210,y:78},{x:245,y:48},{x:280,y:72},{x:315,y:42},{x:350,y:68},{x:385,y:38},{x:420,y:65},{x:455,y:35},{x:490,y:62},{x:525,y:32},{x:560,y:58},{x:590,y:40}],
    [{x:50,y:150},{x:85,y:162},{x:120,y:142},{x:158,y:168},{x:195,y:145},{x:232,y:172},{x:270,y:148},{x:308,y:175},{x:345,y:152},{x:382,y:178},{x:420,y:155},{x:458,y:182},{x:495,y:160},{x:532,y:185},{x:570,y:165},{x:590,y:178}],
    [{x:50,y:230},{x:78,y:218},{x:110,y:238},{x:142,y:222},{x:178,y:242},{x:212,y:228},{x:248,y:248},{x:282,y:232},{x:318,y:252},{x:352,y:238},{x:388,y:255},{x:422,y:242},{x:458,y:260},{x:492,y:248},{x:528,y:265},{x:562,y:252},{x:590,y:268}]
  ]}
];

// Wormhole blueprints available in different worlds
var WORMHOLE_BLUEPRINTS=[
  {id:'wormhole_basic',nm:'Basic Wormhole',cost:30,desc:'Teleports bugs from entry to exit',color:'#9C27B0'},
  {id:'wormhole_dual',nm:'Dual Wormhole',cost:60,desc:'Two-way teleport between points',color:'#E040FB'},
  {id:'wormhole_chaos',nm:'Chaos Wormhole',cost:100,desc:'Random teleport across the map',color:'#FF1744'}
];

var CHAPTER_NAMES=[
'Meadow Awakening','Wetland Expedition','Desert Exploration','Forest Trial',
'Crystal Depths','Volcanic Fury','Void Confrontation','Sky Ascension','Final Evolution'
];
var CHAPTER_DESCS=[
'Begin your journey in the peaceful meadows. Learn to gather and build your army.',
'Venture into the treacherous wetlands where aquatic threats lurk.',
'Traverse the scorching desert sands to find rare resources.',
'Navigate the dark forest where ambushes are constant.',
'Explore the mysterious crystal caves filled with powerful enemies.',
'Conquer the volcanic lands and face fire-breathing foes.',
'Battle through the void realm against cosmic threats.',
'Ascend to the sky gardens - your final training ground.',
'Evolution complete! Face the ultimate challenge.'
];

// Build chapters from WORLDS
CHAPTERS=[];
for(var ci=0;ci<WORLDS.length;ci++){
 CHAPTERS.push({nm:CHAPTER_NAMES[ci]||('World '+(ci+1)),ds:CHAPTER_DESCS[ci]||'',bg:WORLDS[ci].bg||'#2d5a27',wld:ci});
}

// Boss definitions (original 10 + 3 new)
BOSSES=[
{id:'boss_antswarm',nm:'Ant Swarm King',hp:800,dm:12,spd:8,cl:'#8B4513',wp:0},
{id:'boss_beetles',nm:'Beetle Titan',hp:1200,dm:18,spd:5,cl:'#654321',wp:1},
{id:'boss_wasps',nm:'Wasp Empress',hp:1000,dm:15,spd:12,cl:'#FFA500',wp:2},
{id:'boss_spiders',nm:'Spider Matriarch',hp:1500,dm:20,spd:7,cl:'#2F2F2F',wp:3},
{id:'boss_stags',nm:'Stag Legion',hp:1800,dm:22,spd:6,cl:'#4a3520',wp:4},
{id:'boss_toxics',nm:'Toxic Overlord',hp:2000,dm:25,spd:8,cl:'#006400',wp:5},
{id:'boss_heroes',nm:'Hero Alliance',hp:2500,dm:28,spd:10,cl:'#228B22',wp:6},
{id:'boss_dragons',nm:'Insect Dragons',hp:3000,dm:30,spd:12,cl:'#FF4500',wp:7},
{id:'boss_tickqueen',nm:'Tick Queen',hp:3500,dm:35,spd:6,cl:'#8B0000',wp:8},
{id:'boss_final',nm:'The Hive Mind',hp:5000,dm:40,spd:8,cl:'#9C27B0',wp:8}
];

// Extended bosses from new data
BOSSES.push(
{id:'boss_magma',nm:'Magma Titan',hp:4000,dm:25,spd:5,cl:'#FF5722',wp:6},
{id:'boss_crystal',nm:'Crystal Dragonfly',hp:3000,dm:20,spd:20,cl:'#7E57C2',wp:5},
{id:'boss_void',nm:'Void Scarab',hp:3500,dm:22,spd:8,cl:'#6200EA',wp:7}
);

// Level data - generated from chapters + extended content
LEVELS=[];
var lvlIdx=0;
for(var ch=0;ch<CHAPTERS.length;ch++){
 var chLevels=[];
 // Each chapter has 3 main levels + 1 special
 for(var lv=1;lv<=3;lv++){
  var tp=['battle','defense','gather'][lv-1];
  var objMap={battle:'LEVELOBJ_DESTROY',defense:'LEVELOBJ_SURVIVE'+String(lv*2),gather:'LEVELOBJ_GATHER'+String(lv*30)};
  var gc=lv*30;var inNec=lv*10;
  var wld=CHAPTERS[ch].wld;
  var psPool=['ant','bee','littlebeetle','wildbee','stinkbug','toxicbug','rhinobeetle','stagbeetle','militant','wasp','bomberbee','spider','caterpillar','waterbeetle'];
  var ewPool=['ant','bee','militant','wasp','wildbee','stinkbug','toxicbug','littlebeetle','rhinobeetle','spider','bomberbee','caterpillar','waterbeetle'];
  if(ch>=3){psPool.push('bigbangbug','poisonpillar');ewPool.push('bigbangbug','poisonpillar')}
  if(ch>=5){psPool.push('beetlehero','toxichero','wasphero','tick');ewPool.push('beetlehero','toxichero')}
  if(ch>=7){psPool.push('fire_beetle','venom_spider','ice_wasp','thunder_mantis');ewPool.push('beetlehero','wasphero','tick')}
  var pc=psPool.slice(0,2+ch);
  var ec=ewPool.slice(0,3+ch);
  chLevels.push({
   x:'l'+ch+String(lv).padStart(2,'0'),ch:ch+1,wld:wld,tp:tp,
   obj:objMap[tp],desc:'Chapter '+(ch+1)+' Mission '+lv+' - '+tp,
   ln:Math.min(3+ch,5),gc:gc,in:inNec,fc:5+ch*2,
   ps:pc,ew:ec,isBoss:false
  });
 }
 // Boss fight level
 chLevels.push({
  x:'b'+ch,ch:ch+1,wld:wld,tp:(ch===CHAPTERS.length-1)?'boss_final':'finalBoss',
  obj:'LEVELOBJ_BOSS',desc:'Face the Chapter '+((ch)+1)+' Boss!',
  ln:Math.min(3+ch,5),gc:0,in:(ch+1)*10,fc:3+ch,
  ps:[],ew:['bigbangbug','spider','bomberbee','caterpillar'],isBoss:true
 });
 LEVELS=LEVELS.concat(chLevels);
}

// Challenge modes
var challs=[
{x:'c1',ch:10,wld:6,tp:'finalBoss',obj:'CHALLENGE_ARMY',desc:'Army Clash: Build the ultimate defense',ln:4,gc:50,in:40,fc:10,
 ps:['beetlehero','stagbeetle','rhinobeetle','caterpillar'],ew:['bigbangbug','bomberbee','beetlehero','toxichero']},
{x:'c2',ch:10,wld:7,tp:'finalBoss',obj:'CHALLENGE_SPEED',desc:'Speed Run: Beat the clock!',ln:3,gc:100,in:60,fc:5,
 ps:['bee','wildbee','wasp','ice_wasp'],ew:['wasphero','wasp','bomberbee','venom_spider']},
{x:'c3',ch:10,wld:5,tp:'finalBoss',obj:'CHALLENGE_TANK',desc:'Tank Army: Survive with minimal units',ln:3,gc:80,in:30,fc:8,
 ps:['giantwaterbeetle','tick','beetlehero','rhinobeetle'],ew:['bigbangbug','spider','caterpillar','poisonpillar']},
{x:'c4',ch:10,wld:8,tp:'finalBoss',obj:'CHALLENGE_NOVICE',desc:'Novice Challenge: Only basic bugs allowed',ln:3,gc:100,in:80,fc:15,
 ps:['ant','bee','littlebeetle','wildbee','stinkbug'],ew:['wildbee','wasp','bomberbee','spider','caterpillar']},
{x:'c5',ch:10,wld:4,tp:'finalBoss',obj:'CHALLENGE_CHAOS',desc:'Chaos Mode: Everything fights everything',ln:5,gc:150,in:100,fc:20,
 ps:['fire_beetle','venom_spider','ice_wasp','thunder_mantis','beetlehero'],ew:['bigbangbug','toxichero','wasphero','bomberbee','spider']}
];
LEVELS=LEVELS.concat(challs);

// Unlock schedule based on essence
var UNLOCK_REQS=[
{id:'militant',req:5},{id:'rhinobeetle',req:10},{id:'stinkbug',req:15},
{id:'wildbee',req:20},{id:'toxicbug',req:30},{id:'wasp',req:40},
{id:'rhinobeetle',req:10},{id:'bomberbee',req:50},{id:'spider',req:60},
{id:'waterbeetle',req:35},{id:'caterpillar',req:70},{id:'stagbeetle',req:80},
{id:'bigbangbug',req:90},{id:'poisonpillar',req:100},{id:'giantwaterbeetle',req:65},
{id:'tick',req:75},{id:'beetlehero',req:120},{id:'toxichero',req:130},{id:'wasphero',req:140},
// Extended unlocks
{id:'fire_beetle',req:150},{id:'venom_spider',req:160},{id:'ice_wasp',req:170},{id:'thunder_mantis',req:180}
];
// === BUG CREATION ===
function mkBug(def,tx,ty,team){
 return{
  id:def.id,x:tx,y:ty,team:team,alive:true,
  hp:def.hp,maxHp:def.hp,
  speed:def.spd||20,damage:def.dm||0,rng:def.rng||0,
  sdm:def.sd||0,hid:def.hid||0,ard:def.ard||0,
  phase:rnd()*6.28,atkCd:0,gather:0,lane:-1,
  radius:def.r||5,color:def.cl||'#fff',icon:def.id,
  canFly:def.fl||false,canGath:def.gth||false,
  spEff:def.sp||null,
  burnT:0,poisonT:0,aCD:0,
  rangedDmg:def.rng>0?Math.ceil(def.dm*def.rng/80)||def.dm:def.dm,
  _slowT:0,_auraBuff:0
 };
}

// === PARTICLES ===
function spawnP(x,y,n,color,spd,life){
 for(var i=0;i<n;i++){
  var ang=rnd()*6.28,sp=spd*(.3+rnd()*.7);
  pts.push({x:x,y:y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,
   life:life*(.5+rnd()*.5),ml:life,color:color,sz:2+rnd()*3});
 }
}

// === MOVEMENT & COMBAT ===
function moveToward(obj,tx,ty,spd,dt){
 var dx=tx-obj.x,dy=ty-obj.y,d=Math.hypot(dx,dy);
 if(d<1)return;
 var mv=Math.min(spd*dt,d);
 obj.x+=(dx/d)*mv;obj.y+=(dy/d)*mv;
}

function takeDmg(entity,d){
 if(entity.spEff==='arm'&&entity.team==='p')d=Math.max(1,Math.ceil(d*.5));
 entity.hp-=d;
 spawnP(entity.x,entity.y,3,'#FF5722',25,.3);
 if(entity.hp<=0){entity.hp=0;entity.alive=false;
  if(entity.spEff==='crp'&&entity.team==='p'){
   for(var ci=0;ci<3;ci++){
    var nd=BUGS[Math.floor(rnd()*3)];
    pB.push(mkBug(nd,entity.x+rnd(-10,10),entity.y+rnd(-10,10),'p'));
   }
  }
 }
}

function doAttack(atk,tgt){
 var dmg=atk.damage;
 if(atk.spEff==='crit'&&rnd()<0.4){dmg*=2;spawnP(tgt.x,tgt.y,6,'#FFEB3B',50,.5)}
 if(atk.spEff==='dbl'){takeDmg(tgt,dmg);takeDmg(tgt,dmg)}
 else takeDmg(tgt,dmg);
 if(atk.spEff==='pso')tgt.poisonT=4;
 if(atk.spEff==='burn')tgt.burnT=3;
 if(atk.spEff==='cnt'&&!tgt.isBase){takeDmg(atk,2);atk.aCD=3}
}

function doRanged(atk,tgt){
 var dmg=atk.rangedDmg||atk.damage;
 if(atk.spEff==='chain'){
  takeDmg(tgt,Math.floor(dmg*1.2));
  var arr=tgt.team==='p'?eB:pB;
  for(var i=0;i<arr.length;i++){
   if(arr[i]!==tgt&&arr[i].alive&&dist(arr[i],tgt)<80){
    takeDmg(arr[i],Math.floor(dmg*.6));
    spawnP(arr[i].x,arr[i].y,4,'#E040FB',40,.5);
   }
  }
 }else{takeDmg(tgt,dmg)}
 if(atk.spEff==='slow'&&tgt.speed!==undefined){tgt._slowT=3;spawnP(tgt.x,tgt.y,4,'#F48FB1',30,.4)}
 if(atk.spEff==='aur'&&atk.team==='p'){
  for(var i=0;i<pB.length;i++){
   if(pB[i]!==atk&&pB[i].alive&&dist(pB[i],atk)<100)pB[i]._auraBuff=.5;
  }
 }
 if(atk.spEff==='aoe'){
  var tarr=atk.team==='p'?eB:pB;
  for(var j=0;j<tarr.length;j++){
   if(tarr[j]!==tgt&&tarr[j].alive&&dist(tarr[j],tgt)<60)takeDmg(tarr[j],2);
  }
 }
}

// === NEW: Path-following movement (like original game WAYPOINT system) ===
function getPathForLane(laneIdx, worldIdx){
  var wp=WORLD_PATHS[worldIdx||0];
  if(!wp||!wp.lanes||laneIdx>=wp.lanes.length)return null;
  return wp.lanes[laneIdx];
}

function getClosestPathPoint(entity, laneIdx){
  var path=getPathForLane(laneIdx, curWorld);
  if(!path||path.length===0)return null;
  var minD=Infinity, best=0;
  for(var i=0;i<path.length;i++){
    var d=dist(entity,path[i]);
    if(d<minD){minD=d;best=i;}
  }
  return {idx:best, pt:path[best], dist:minD};
}

function moveAlongPath(entity, laneIdx, dt, reverse){
  var path=getPathForLane(laneIdx, curWorld);
  if(!path||path.length<2)return null;
  if(entity.pathIdx===undefined)entity.pathIdx=reverse?path.length-1:0;
  if(entity.pathTarget===undefined)entity.pathTarget=reverse?path.length-2:1;
  
  var target=reverse?entity.pathIdx-1:entity.pathIdx+1;
  if(target<0||target>=path.length){
    // Reached end of path
    entity.pathIdx=reverse?0:path.length-1;
    return null; // signal that end of path reached
  }
  
  var curPt=path[entity.pathIdx];
  var nextPt=path[target];
  if(!curPt||!nextPt)return null;
  
  var spd=entity.speed||20;
  if(entity.spEff==='fast')spd*=1.5;
  if(entity._slowT&&entity._slowT>0)spd*=0.5;
  if(WORLDS[curWorld]&&WORLDS[curWorld].slowGround&&!entity.canFly)spd*=0.7;
  
  moveToward(entity,nextPt.x,nextPt.y,spd,dt);
  
  if(dist(entity,nextPt)<5){
    entity.pathIdx=target;
    entity.pathTarget=reverse?target-1:target+1;
  }
  return {curPt:curPt, nextPt:nextPt, progress:1-target/path.length};
}

// === NEW: Bug Placement System ===
function enterPlacementMode(bugId){
  if(state!=='playing'&&state!=='bossfight')return;
  var bd=bgd(bugId);
  if(!bd)return;
  if(bd.co>nectar){showHint('Not enough nectar!');return;}
  var cd=playerBase.coolDown[bugId];
  if(cd&&performance.now()-cd<bd.rl*1000){showHint('Cooling down!');return;}
  placementMode=true;
  placingBugId=bugId;
  wormholeMode=false;
  // Calculate valid placement points (midpoints of each lane)
  placePoints=[];
  var wp=WORLD_PATHS[curWorld||0];
  if(wp&&wp.lanes){
    for(var li=0;li<wp.lanes.length;li++){
      var lane=wp.lanes[li];
      if(lane.length<2)continue;
      // Generate placement points along the lane (every 2nd waypoint)
      for(var pi=1;pi<lane.length-1;pi+=2){
        placePoints.push({x:lane[pi].x,y:lane[pi].y, lane:li, wpIdx:pi});
      }
    }
  }
  showHint('Click on a path to place '+bd.nm+'. Right-click to cancel.');
  document.getElementById('cvs').style.cursor='crosshair';
}

function placeBugOnPath(wx, wy){
  if(!placementMode||!placingBugId)return;
  // Find nearest placement point
  var minD=40, bestPt=null;
  for(var i=0;i<placePoints.length;i++){
    var d=Math.hypot(wx-placePoints[i].x, wy-placePoints[i].y);
    if(d<minD){minD=d;bestPt=placePoints[i];}
  }
  if(!bestPt){
    showHint('Click closer to a path!');
    return;
  }
  // Check if already occupied
  for(var i=0;i<pB.length;i++){
    if(pB[i].alive&&pB[i].isPlaced&&pB[i].lane===bestPt.lane&&
       Math.abs(pB[i].pathIdx-bestPt.wpIdx)<2){
      showHint('This spot is occupied!');
      return;
    }
  }
  var bd=bgd(placingBugId);
  if(!bd)return;
  if(bd.co>nectar){showHint('Not enough nectar!');return;}
  var cd=playerBase.coolDown[placingBugId];
  if(cd&&performance.now()-cd<bd.rl*1000){showHint('Still cooling down!');return;}
  playerBase.coolDown[placingBugId]=performance.now();
  nectar-=bd.co;
  
  var b=mkBug(bd,bestPt.x,bestPt.y,'p');
  b.lane=bestPt.lane;
  b.pathIdx=bestPt.wpIdx;
  b.isPlaced=true;  // This bug stays on the path as a defensive tower
  b.placementLock=true; // Don't auto-move
  pB.push(b);
  
  spawnP(b.x,b.y,5,'#4CAF50',30,0.5);
  placementMode=false;
  placingBugId=null;
  placePoints=[];
  document.getElementById('cvs').style.cursor='default';
  buildPanel(null);
  updateHUD();
  showHint(bd.nm+' placed on path!');
}

// === NEW: Wormhole System ===
function enterWormholeMode(){
  if(state!=='playing'&&state!=='bossfight')return;
  if(essence<30){showHint('Need 30 essence for a basic wormhole!');return;}
  placementMode=false;
  placingBugId=null;
  wormholeMode='placing_entry';
  showHint('Click to place wormhole ENTRY point. Right-click to cancel.');
  document.getElementById('cvs').style.cursor='cell';
}

function placeWormhole(wx, wy){
  if(wormholeMode==='placing_entry'){
    wormholes.push({x:wx,y:wy,toX:0,toY:0,active:false,phase:0,cd:0,color:'#9C27B0'});
    wormholeMode='placing_exit';
    showHint('Now click to place wormhole EXIT point.');
  }else if(wormholeMode==='placing_exit'){
    if(wormholes.length>0){
      var wh=wormholes[wormholes.length-1];
      wh.toX=wx; wh.toY=wy; wh.active=true; wh.phase=0;
      essence-=30;
      localStorage.setItem('bb_e',String(essence));
      wormholeMode=false;
      showHint('Wormhole placed! Bugs entering it will teleport to the exit.');
      document.getElementById('cvs').style.cursor='default';
    }
  }
}

function updateWormholes(dt){
  for(var i=0;i<wormholes.length;i++){
    var wh=wormholes[i];
    wh.phase+=dt*2;
    if(wh.cd>0)wh.cd-=dt;
    // Check if any bug is near the wormhole entry
    if(wh.active&&wh.cd<=0){
      // Check player bugs
      for(var bi=0;bi<pB.length;bi++){
        var b=pB[bi];
        if(b.alive&&!b.isPlaced&&dist(b,wh)<15&&b.team==='p'){
          b.x=wh.toX+(Math.random()-0.5)*10;
          b.y=wh.toY+(Math.random()-0.5)*10;
          wh.cd=0.5;
          spawnP(wh.x,wh.y,8,'#9C27B0',40,0.6);
          spawnP(wh.toX,wh.toY,8,'#E040FB',40,0.6);
          break;
        }
      }
      // Check enemy bugs
      for(var bi=0;bi<eB.length;bi++){
        var b=eB[bi];
        if(b.alive&&dist(b,wh)<15&&b.team==='e'){
          b.x=wh.toX+(Math.random()-0.5)*10;
          b.y=wh.toY+(Math.random()-0.5)*10;
          wh.cd=0.5;
          spawnP(wh.x,wh.y,8,'#9C27B0',40,0.6);
          spawnP(wh.toX,wh.toY,8,'#E040FB',40,0.6);
          break;
        }
      }
    }
  }
}

function drawWormholes(ctx){
  for(var i=0;i<wormholes.length;i++){
    var wh=wormholes[i];
    var pulse=1+Math.sin(wh.phase)*0.15;
    var r=12*pulse;
    
    // Draw entry
    if(wh.active){
      // Entry portal
      ctx.save();
      ctx.shadowColor=wh.color; ctx.shadowBlur=15;
      var grad=ctx.createRadialGradient(wh.x,wh.y,1,wh.x,wh.y,r);
      grad.addColorStop(0,'#fff'); grad.addColorStop(0.3,wh.color); grad.addColorStop(1,'transparent');
      ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(wh.x,wh.y,r,0,6.28); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='bold 14px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('W',wh.x,wh.y);
      ctx.restore();
      
      // Exit portal
      ctx.save();
      ctx.shadowColor=wh.color; ctx.shadowBlur=10;
      var grad2=ctx.createRadialGradient(wh.toX,wh.toY,1,wh.toX,wh.toY,r);
      grad2.addColorStop(0,'#fff'); grad2.addColorStop(0.3,'#E040FB'); grad2.addColorStop(1,'transparent');
      ctx.fillStyle=grad2; ctx.beginPath(); ctx.arc(wh.toX,wh.toY,r*0.8,0,6.28); ctx.fill();
      ctx.strokeStyle='#E040FB'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font='bold 12px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('>',wh.toX,wh.toY);
      ctx.restore();
    }else{
      // Placing entry (inactive)
      ctx.save();
      ctx.globalAlpha=0.6;
      ctx.fillStyle=wh.color; ctx.beginPath(); ctx.arc(wh.x,wh.y,r,0,6.28); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='bold 14px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('?',wh.x,wh.y);
      ctx.restore();
    }
  }
}

// === LEVEL INITIALIZATION ===
function initLevel(lv){
 state='playing';curLv=lv;selBug=-1;gTime=0;gSpd=1;bossTimer=0;aiTimers={};
 var w=WORLDS[curWorld]||WORLDS[0];
 mapW=(lv.lanes||3)*120+100;mapH=300;
 nGoal=lv.gc||0;dLim=lv.dt||0;dTimer=dLim;
 pB=[];eB=[];flw=[];pts=[];lanes=[];
 playerBase={x:40,y:mapH/2,hp:200,maxHp:200,team:'p',nectar:lv.in*10||50,radius:30,coolDown:{}};
 enemyBase={x:mapW-40,y:mapH/2,hp:200,maxHp:200,team:'e',radius:30,color:'#D32F2F'};

 if(lv.isBoss||lv.isBossFinal){
  enemyBase.hp=1000+curWorld*500;enemyBase.maxHp=enemyBase.hp;
  enemyBase.isBoss=true;enemyBase.color=BOSSES[curWorld]||BOSSES[BOSSES.length-1]||{cl:'#FF1744'};
  if(!enemyBase.color)enemyBase.color='#FF1744';
  else enemyBase.color=enemyBase.color.cl||'#FF1744';
  nectar=lv.in*5||50;
 }else{
  enemyBase.hp=200;enemyBase.maxHp=200;
  nectar=lv.in*10||50;
 }
 playerBase.nectar=nectar;

 // Build lanes using pre-defined paths (like original WAYPOINT system)
 var nl=Math.min(lv.lanes||3, (WORLD_PATHS[curWorld]&&WORLD_PATHS[curWorld].lanes)?WORLD_PATHS[curWorld].lanes.length:3);
 for(var li=0;li<nl;li++){
  var lane={wps:[],idx:li,pU:[],eU:[]};
  // Use predefined path if available, otherwise generate simple lane
  var pathData=WORLD_PATHS[curWorld]&&WORLD_PATHS[curWorld].lanes&&WORLD_PATHS[curWorld].lanes[li];
  if(pathData&&pathData.length>0){
   for(var p=0;p<pathData.length;p++){
    lane.wps.push({x:pathData[p].x,y:pathData[p].y,next:null});
   }
  }else{
   var sy=(mapH/(nl+1))*(li+1);
   for(var s=0;s<=12;s++){
    var t=s/12;
    var wx=playerBase.x+(enemyBase.x-playerBase.x)*t;
    var wb=Math.sin(t*Math.PI*(1.5+li*0.5))*20;
    lane.wps.push({x:wx,y:sy+wb,next:null});
   }
  }
  for(var j=0;j<lane.wps.length-1;j++)lane.wps[j].next=lane.wps[j+1];
  lanes.push(lane);
 }

 // Flowers (nectar sources)
 for(var fi=0;fi<(lv.fc||8);fi++){
  flw.push({x:playerBase.x+40+rnd()*(mapW*0.5),y:20+rnd()*(mapH-40),amt:3,mxAmt:3,reG:0,r:12,pulse:0,regTime:15+rnd()*10});
 }

 // Player starting bugs
 if(lv.ps){
  for(var si=0;si<lv.ps.length;si++){
   var bd=bgd(lv.ps[si]);if(!bd)continue;
   var ln=si%nl;
   var by=lanes[ln]?lanes[ln].wps[Math.floor(lanes[ln].wps.length/2)].y:mapH/2;
   pB.push(mkBug(bd,playerBase.x+20+rnd(-5,15),by+rnd(-15,15),'p'));
  }
  nectar=Math.max(nectar,(lv.np||0)*5);
  playerBase.nectar=nectar;
 }

 // AI spawn timers
 var ev=lv.ew||['ant'];
 for(var wi=0;wi<ev.length;wi++){
  var key=ev[wi]+'_'+wi;
  aiTimers[key]={t:0,int:Math.max(6,12+wi*4),mx:15+wi*3};
 }

 tCamX=mapW/2;tCamY=mapH/2;camX=tCamX;camY=tCamY;camZoom=1.2;
 curLv=lv;
 buildPanel(null);
 showHint('Click a bug to select. Right-click to move. Scroll to zoom.');
}

// === HINT / UI HELPERS ===
function hidePanels(){var els=document.querySelectorAll('.pnl');for(var i=0;i<els.length;i++)els[i].classList.remove('active')}
function showHint(msg){hintMsg=msg;hintTimer=6;var popup=document.getElementById('hint-pop');if(popup){popup.classList.add('active');document.getElementById('hint-text').textContent=msg}}
function hideHint(){var popup=document.getElementById('hint-pop');if(popup)popup.classList.remove('active')}

function switchScreen(name){hidePanels();var t=document.getElementById(name);if(t)t.classList.add('active')}

function buildPanel(lv){
 var panel=document.getElementById('bug-panel');if(!panel)return;panel.innerHTML='';
 var avail=['ant','bee','littlebeetle','wildbee','stinkbug','toxicbug','rhinobeetle','stagbeetle','militant','spider','wasp','bomberbee','caterpillar','poisonpillar','waterbeetle','giantwaterbeetle','tick','bigbangbug'];
 for(var ui=0;ui<unlocked.length;ui++){var uid=unlocked[ui];var bd=bgd(uid);if(bd&&avail.indexOf(uid)<0)avail.push(uid)}
 for(var i=0;i<avail.length;i++){
  var bid=avail[i];var bd=bgd(bid);if(!bd)continue;
  var btn=document.createElement('button');btn.className='bbtn';
  var iconIdx=BUGS.indexOf(bd);
  btn.innerHTML=(BUG_ICONS[iconIdx]||'')+'<span class=bcost>'+bd.co+'</span>';
  btn.title=bd.nm+(bd.sp?' ['+bd.sp+']':'')+' (Cost: '+bd.co+', CD: '+bd.rl+'s)';
  (function(id){btn.addEventListener('click',function(){spawnBug(id)})})(bid);
  panel.appendChild(btn);
 }
}

function updateBugPanel(){
 var btns=document.querySelectorAll('.bbtn');
 for(var i=0;i<btns.length;i++){
  var cs=parseFloat(btns[i].querySelector('.bcost')?.textContent||0);
  if(nectar>=cs)btns[i].classList.remove('dis');else btns[i].classList.add('dis');
 }
}

function spawnBug(bid){
 if(state!=='playing'&&state!=='bossfight')return;
 var bd=bgd(bid);if(!bd)return;
 if(bd.co>nectar){showHint('Not enough nectar!');return;}
 var cd=playerBase.coolDown[bid];
 if(cd&&performance.now()-cd<bd.rl*1000){showHint('Cooling down!');return;}
 // Check if we should enter placement mode instead
 if(lanes.length>0&&bd.canGath===false){
  enterPlacementMode(bid);
  return;
 }
 playerBase.coolDown[bid]=performance.now();nectar-=bd.co;
 var ln=Math.min(Math.floor(rnd(0,lanes.length)),lanes.length-1);
 var by=lanes[ln]?lanes[ln].wps[Math.floor(lanes[ln].wps.length/2)].y:mapH/2;
 var b=mkBug(bd,playerBase.x+20+rnd(-5,15),by+rnd(-20,20),'p');
 b.lane=ln;b.pathIdx=1;b.isPlaced=false;
 pB.push(b);buildPanel(null);updateHUD();
}

function spawnEB(bid,ln){
 var bd=bgd(bid);if(!bd)return;
 var laneIdx=ln!==undefined?ln:Math.floor(rnd(0,lanes.length));
 var path=getPathForLane(laneIdx,curWorld);
 if(path&&path.length>0){
  var lastPt=path[path.length-1];
  var b=mkBug(bd,lastPt.x+rnd(-8,8),lastPt.y+rnd(-8,8),'e');
  b.lane=laneIdx;b.pathIdx=path.length-1;b.isPlaced=false;
 }else{
  var ly=lanes[laneIdx]&&lanes[laneIdx].wps.length>1?lanes[laneIdx].wps[Math.floor(lanes[laneIdx].wps.length/2)].y:mapH/2;
  var b=mkBug(bd,enemyBase.x-20+rnd(-5,15),ly+rnd(-15,15),'e');
  b.lane=laneIdx;b.pathIdx=1;b.isPlaced=false;
 }
 eB.push(b);spawnP(b.x,b.y,3,'#FF5722',20,.3);
}
// === AI ===
function updateAI(dt){
 if(!curLv)return;var nl=lanes.length;var ev=curLv.ew||[];
 for(var i=0;i<ev.length;i++){
  var key=ev[i]+'_'+i;
  if(!aiTimers[key])aiTimers[key]={t:0,int:Math.max(6,12+i*5),mx:20};
  aiTimers[key].t+=dt*gSpd;
  var intMult=1+gTime*0.002;
  if(aiTimers[key].t>=aiTimers[key].int*intMult&&aiTimers[key].mx>0){
   aiTimers[key].t=0;aiTimers[key].mx--;
   spawnEB(ev[i],i%nl);
  }
 }
 if(curLv.isBoss||curLv.isBossFinal){
  bossTimer+=(dt*gSpd);
  if(bossTimer>5){bossTimer=0;
   var extras=['bigbangbug','bomberbee','caterpillar','wasp','spider','beetlehero'];
   spawnEB(extras[Math.floor(rnd()*extras.length)],Math.floor(rnd(0,nl)));
  }
 }
 if(curLv.type==='timeatk'){
  var diff=Math.min(gTime/60,ev.length);
  for(var i=0;i<Math.ceil(diff);i++)spawnEB(ev[Math.floor(rnd(0,ev.length))],Math.floor(rnd(0,nl)));
 }
}

// Update player bugs
function updatePlayerBugs(dt){
 for(var i=0;i<pB.length;i++){
  var b=pB[i];if(!b.alive)continue;b.phase+=dt*4;
  if(b.atkCd>0)b.atkCd-=dt;if(b.poisonT>0){b.poisonT-=dt;if(Math.floor(b.poisonT*10)%3===0)b.hp-=0.5}
  if(b.burnT>0){b.burnT-=dt;if(Math.floor(b.burnT*10)%4===0)b.hp-=1}
  var effSpd=b.speed;
  if(b.spEff==='fast')effSpd*=1.5;
  if(b._slowT&&b._slowT>0)effSpd*=0.5;
  if(WORLDS[curWorld]&&WORLDS[curWorld].slowGround&&!b.canFly)effSpd*=0.7;
  
  // PLACED BUGS (defensive towers) - stay on path and attack nearby enemies
  if(b.isPlaced){
   // Find nearest enemy bug on the same lane or nearby
   var ne=null,cd2=Infinity;
   for(var ei=0;ei<eB.length;ei++){
    if(!eB[ei].alive)continue;
    var dd=dist(b,eB[ei]);
    if(dd<cd2){cd2=dd;ne=eB[ei];}
   }
   if(ne){
    var reach=(b.rng||0)+b.radius+(ne.radius||10)+5;
    if(cd2<=reach){
     if(b.atkCd<=0){
      b.atkCd=1.5/(b.damage>0?b.damage:2);
      if(b.rng>0)doRanged(b,ne);else doAttack(b,ne);
      spawnP(b.x,ne.y,2,'#FF9800',15,0.3);
     }
    }else if(b.rng>0){
     // Ranged units can attack further
     if(cd2<=(b.rng||0)+50&&b.atkCd<=0){
      b.atkCd=1/(b.damage>0?b.damage:2);
      doRanged(b,ne);
     }
    }
   }
   continue; // Don't move placed bugs
  }
  
  // PATH-FOLLOWING: Attack bugs follow their lane path toward enemy
  if(!b.canGath&&lanes.length>0&&b.lane>=0&&b.lane<lanes.length){
   // Follow path toward enemy base
   var path=getPathForLane(b.lane,curWorld);
   if(path&&path.length>0){
    if(b.pathIdx===undefined||b.pathIdx>=path.length-1){
     b.pathIdx=path.length-1; // Reached end near enemy base
    }
    // Check for enemies nearby first
    var ne=null,cd2=Infinity;
    for(var ei=0;ei<eB.length;ei++){
     if(!eB[ei].alive)continue;
     var dd=dist(b,eB[ei]);
     if(dd<cd2){cd2=dd;ne=eB[ei];}
    }
    if(ne&&cd2<250){
     var reach=(b.rng||0)+b.radius+(ne.radius||10)+5;
     if(cd2<=reach){
      if(b.atkCd<=0){
       b.atkCd=1/(b.damage>0?b.damage:2);
       if(b.rng>0)doRanged(b,ne);else doAttack(b,ne);
      }
     }else{moveToward(b,ne.x,ne.y,effSpd,dt)}
    }else{
     // Move along path toward enemy base
     var res=moveAlongPath(b,b.lane,dt,false);
     if(res===null&&b.pathIdx>=path.length-1){
      // Attack enemy base
      if(dist(b,enemyBase)<enemyBase.radius+b.radius+8){
       if(b.atkCd<=0){b.atkCd=0.5;takeDmg(enemyBase,b.damage);}
      }
     }
    }
    continue;
   }
  }
  
  // GATHERER BUGS: Original gathering behavior
  if(b.canGath&&b.gather<5){
   var nf=null,nd=Infinity;
   for(var fi=0;fi<flw.length;fi++){if(flw[fi].amt>0){var dd=dist(b,flw[fi]);if(dd<nd){nd=dd;nf=flw[fi]}}}
   if(nf){moveToward(b,nf.x,nf.y,effSpd,dt);
    if(dist(b,nf)<15){nf.amt--;b.gather++;
     if(nf.amt<=0)nf.reG=0;continue;
    }
   }
  }
  if(b.gather>0){moveToward(b,playerBase.x,playerBase.y,effSpd*0.8,dt);
   if(dist(b,playerBase)<40){playerBase.nectar+=b.gather;nectar=playerBase.nectar;b.gather=0;continue;}
  }
  // Find nearest enemy
  var ne=null,cd2=Infinity;
  for(var ei=0;ei<eB.length;ei++){if(!eB[ei].alive)continue;var dd=dist(b,eB[ei]);if(dd<cd2){cd2=dd;ne=eB[ei]}}
  var dbe=dist(b,enemyBase);
  if(cd2<dbe&&cd2<250)ne=enemyBase;
  if(ne){
   var reach=(b.rng||0)+b.radius+(ne.radius||20)+5;
   if(cd2<=reach){
    if(b.atkCd<=0){b.atkCd=1/(b.damage>0?b.damage:2);
     if(b.rng>0)doRanged(b,ne);else doAttack(b,ne);
    }
   }else{moveToward(b,ne.x,ne.y,effSpd,dt)}
  }else{
   moveToward(b,enemyBase.x,b.y,effSpd*0.6,dt);
   if(dist(b,enemyBase)<enemyBase.radius+b.radius+5){
    if(b.atkCd<=0){b.atkCd=0.5;if(b.rng>0)takeDmg(enemyBase,b.rangedDmg||b.damage);else takeDmg(enemyBase,b.damage);}
   }
  }
 }
}

// Update enemy bugs
function updateEnemyBugs(dt){
 for(var i=0;i<eB.length;i++){
  var b=eB[i];if(!b.alive)continue;b.phase+=dt*4;
  if(b.atkCd>0)b.atkCd-=dt;if(b.poisonT>0){b.poisonT-=dt;if(Math.floor(b.poisonT*10)%3===0)b.hp-=0.5}
  if(b.burnT>0){b.burnT-=dt;if(Math.floor(b.burnT*10)%4===0)b.hp-=1}
  var effSpd=b.speed;
  if(b.spEff==='fast')effSpd*=1.5;
  if(b._slowT&&b._slowT>0)effSpd*=0.5;
  
  // PATH-FOLLOWING: Enemy bugs follow the lane path toward player base (reverse direction)
  if(lanes.length>0&&b.lane>=0&&b.lane<lanes.length){
   var path=getPathForLane(b.lane,curWorld);
   if(path&&path.length>0){
    if(b.pathIdx===undefined||b.pathIdx<0){
     b.pathIdx=0; // Start from beginning (enemy side)
    }
    // Check for player bugs nearby
    var ne=null,cd2=Infinity;
    for(var ai=0;ai<pB.length;ai++){if(!pB[ai].alive)continue;var dd=dist(b,pB[ai]);if(dd<cd2){cd2=dd;ne=pB[ai]}}
    var dpb=dist(b,playerBase);
    if(ne&&cd2<250){
     var reach=(b.rng||0)+b.radius+(ne.radius||10)+5;
     if(cd2<=reach){
      if(b.atkCd<=0){b.atkCd=1/(b.damage>0?b.damage:2);
       if(b.rng>0)doRanged(b,ne);else doAttack(b,ne);
      }
     }else{moveToward(b,ne.x,ne.y,effSpd,dt)}
     continue;
    }
    // Move along path in reverse (toward player base)
    if(b.pathIdx===undefined)b.pathIdx=path.length-1;
    var targetIdx=b.pathIdx-1;
    if(targetIdx>=0){
     var curPt=path[b.pathIdx];
     var nextPt=path[targetIdx];
     if(curPt&&nextPt){
      moveToward(b,nextPt.x,nextPt.y,effSpd,dt);
      if(dist(b,nextPt)<5){b.pathIdx=targetIdx;}
     }
    }else{
     // Reached player base side - attack directly
     if(dist(b,playerBase)<playerBase.radius+b.radius+8){
      if(b.atkCd<=0){b.atkCd=0.5;takeDmg(playerBase,b.damage);}
     }else{moveToward(b,playerBase.x,playerBase.y,effSpd,dt);}
    }
    continue;
   }
  }
  
  // FALLBACK: Original direct movement
  var ne=null,cd2=Infinity;
  for(var ai=0;ai<pB.length;ai++){if(!pB[ai].alive)continue;var dd=dist(b,pB[ai]);if(dd<cd2){cd2=dd;ne=pB[ai]}}
  var dpb=dist(b,playerBase);
  if(cd2<dpb&&cd2<250)ne=playerBase;
  if(ne){
   var reach=(b.rng||0)+b.radius+(ne.radius||20)+5;
   if(cd2<=reach){
    if(b.atkCd<=0){b.atkCd=1/(b.damage>0?b.damage:2);
     if(b.rng>0)doRanged(b,ne);else doAttack(b,ne);
    }
   }else{moveToward(b,ne.x,ne.y,effSpd,dt)}
  }else{
   moveToward(b,playerBase.x,b.y,effSpd*0.6,dt);
   if(dist(b,playerBase)<playerBase.radius+b.radius+5){
    if(b.atkCd<=0){b.atkCd=0.5;if(b.rng>0)takeDmg(playerBase,b.rangedDmg||b.damage);else takeDmg(playerBase,b.damage);}
   }
  }
 }
}

// Flowers & particles
function updateFlowers(dt){for(var fi=0;fi<flw.length;fi++){var f=flw[fi];if(f.amt<f.mxAmt){f.reG+=dt;if(f.reG>=f.regTime){f.reG=0;f.amt=Math.min(f.amt+1,f.mxAmt)}}f.pulse+=dt*2}}
function updateParticles(dt){for(var i=pts.length-1;i>=0;i--){pts[i].x+=pts[i].vx*dt;pts[i].y+=pts[i].vy*dt;pts[i].life-=dt;if(pts[i].life<=0)pts.splice(i,1)}}

// Win/Lose check
function checkWinLose(){
 if(playerBase.hp<=0){showResults(false);return}
 if(curLv&&(curLv.isBoss||curLv.isBossFinal)){if(enemyBase.hp<=0){showResults(true);return}}
 if(curLv&&curLv.tp!=='gather'&&!curLv.isBoss&&!curLv.isBossFinal){if(enemyBase&&enemyBase.hp<=0){showResults(true);return}}
 if(dLim>0&&dTimer<=0){showResults(gTime<600);return}
 if(nGoal>0&&nectar>=nGoal){showResults(true);return}
}
// === RESULTS ===
function showResults(victory){
 state=victory?'victory':'defeat';hideHint();
 var title=document.getElementById('res-title');var stats=document.getElementById('res-stats');
 title.textContent=victory?'MISSION COMPLETE!':'DEFEAT...';
 title.style.color=victory?'#4CAF50':'#F44336';
 var essGain=victory?Math.floor(10+gTime*0.1):Math.floor(2+gTime*0.05);
 essence+=essGain;localStorage.setItem('bb_e',String(essence));
 var html='Time: '+fmtT(gTime)+'<br>Nectar: '+Math.floor(nectar)+'<br>';
 html+=(victory?'+':'-')+' Essence: '+essGain+'<br>Total Essence: '+essence+'<br>';
 if(victory&&curLv){done.push(curLv.x);localStorage.setItem('bb_d',JSON.stringify(done));selLv=LEVELS.indexOf(curLv)}
 stats.innerHTML=html;document.getElementById('results').classList.add('active');
}

// === RENDERING ===
function drawBase(ctx,base,color){
 ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(base.x+3,base.y+5,base.radius,base.radius*0.6,0,0,6.28);ctx.fill();
 var grad=ctx.createRadialGradient(base.x-5,base.y-5,2,base.x,base.y,base.radius);
 grad.addColorStop(0,'#fff');grad.addColorStop(.4,color);grad.addColorStop(1,'#222');
 ctx.fillStyle=grad;ctx.beginPath();ctx.arc(base.x,base.y,base.radius,0,6.28);ctx.fill();
 ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
 var hpPct=base.hp/base.maxHp;
 ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(base.x-base.radius,base.y-base.radius-12,base.radius*2,8);
 ctx.fillStyle=hpPct>.5?'#4CAF50':hpPct>.25?'#FF9800':'#F44336';
 ctx.fillRect(base.x-base.radius+1,base.y-base.radius-11,(base.radius*2-2)*hpPct,6);
 ctx.fillStyle='#fff';ctx.font=(base.isBoss?'bold 11px':'bold 10px')+' Arial';ctx.textAlign='center';
 ctx.fillText(base.isBoss?'BOSS':base.team==='p'?'HOME':'ENEMY',base.x,base.y+4);
 // Glow for boss
 if(base.isBoss){ctx.shadowColor=base.color||'#f00';ctx.shadowBlur=20;ctx.strokeStyle=base.color||'#f00';ctx.lineWidth=2;ctx.stroke();ctx.shadowBlur=0}
}

function drawBug(ctx,b){
 if(!b.alive)return;ctx.save();ctx.translate(b.x,b.y);
 ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(2,3,b.radius,b.radius*0.6,0,0,6.28);ctx.fill();
 var w=Math.sin(b.phase)*1.5;var col=b.color;
 if(b.burnT>0)col='#FF5722';if(b.poisonT>0)col='#76FF03';if(b._slowT&&b._slowT>0)col='#F48FB1';
 ctx.fillStyle=col;
 if(b.canFly){ctx.beginPath();ctx.ellipse(w,-2,b.radius*1.2,b.radius*0.7,0,0,6.28);ctx.fill()}
 else{ctx.beginPath();ctx.arc(w,0,b.radius,0,6.28);ctx.fill()}
 // Special effects
 if(b.spEff==='arm'){ctx.strokeStyle='#aaa';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,b.radius+3,0,6.28);ctx.stroke()}
 if(b.spEff==='aur'){ctx.shadowColor='#FFFF00';ctx.shadowBlur=8}
 if(b.spEff==='burn'||b.spEff==='aoe'){spawnP(b.x,b.y,0,'#FF5722',30,.5)}
 ctx.restore();
 // HP bar
 if(b.hp<b.maxHp){var hpP=b.hp/b.maxHp;ctx.save();ctx.translate(b.x,b.y);
  ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(-b.radius,-b.radius-8,b.radius*2,4);
  ctx.fillStyle=hpP>.5?'#4CAF50':'#F44336';ctx.fillRect(-b.radius+0.5,-b.radius-7.5,(b.radius*2-1)*hpP,3);
  ctx.restore()}
}

function drawTerrain(ctx,w){
 var grad=ctx.createLinearGradient(0,0,0,mapH);
 if(w.bgGrad){for(var bi=0;bi<w.bgGrad.length;bi++)grad.addColorStop(bi/(w.bgGrad.length-1),w.bgGrad[bi])}
 else{grad.addColorStop(0,w.bg);grad.addColorStop(1,w.ground||w.bg)}
 ctx.fillStyle=grad;ctx.fillRect(0,0,mapW,mapH);
 // Crystal terrain
 if(w.crystalTerrain){ctx.fillStyle='rgba(200,150,255,.15)';
  for(var i=0;i<40;i++){var cx=(i*47)%mapW,cy=(i*31)%mapH;ctx.beginPath();ctx.moveTo(cx,cy-8);ctx.lineTo(cx+6,cy);ctx.lineTo(cx-6,cy);ctx.fill();}
 }
 // Volcano terrain
 if(w.volcano){ctx.fillStyle='rgba(255,87,34,.2)';
  for(var i=0;i<25;i++){ctx.beginPath();ctx.arc((i*53+20)%mapW,(i*37+10)%mapH,3+rnd()*5,0,6.28);ctx.fill();}
  // Lava spots
  ctx.fillStyle='rgba(255,0,0,.3)';
  for(var i=0;i<8;i++){var lx=(i*71+10)%mapW,ly=(i*43+20)%mapH;ctx.beginPath();ctx.arc(lx,ly,5+rnd()*8,0,6.28);ctx.fill();}
 }
 // Void terrain
 if(w.voidTheme){ctx.fillStyle='rgba(100,0,200,.1)';
  for(var i=0;i<30;i++){ctx.beginPath();ctx.arc((i*59)%mapW,(i*41)%mapH,2+rnd()*4,0,6.28);ctx.fill();}
 }
 // Lane lines
 ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;
 for(var li=0;li<lanes.length;li++){if(lanes[li].wps.length<2)continue;ctx.beginPath();
  ctx.moveTo(lanes[li].wps[0].x,lanes[li].wps[0].y);
  for(var wi=1;wi<lanes[li].wps.length;wi++)ctx.lineTo(lanes[li].wps[wi].x,lanes[li].wps[wi].y);
  ctx.stroke();
 }
}

function render(){
 ctx.save();ctx.translate(cvs.width/2,cvs.height/2);ctx.scale(camZoom,camZoom);ctx.translate(-camX,-camY);
 drawTerrain(ctx,WORLDS[curWorld]||WORLDS[0]);
 // Flowers
 for(var fi=0;fi<flw.length;fi++){var f=flw[fi];var alpha=f.amt>0?1:.3;ctx.globalAlpha=alpha;
  ctx.fillStyle=f.amt>0?'#FF69B4':'#888';ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,6.28);ctx.fill();
  for(var p=0;p<5;p++){var ang=(p/5)*6.28+f.pulse;ctx.fillStyle=f.amt>0?'#FF8CBA':'#666';ctx.beginPath();ctx.arc(f.x+Math.cos(ang)*8,f.y+Math.sin(ang)*8,4,0,6.28);ctx.fill();}
  if(f.amt>0){ctx.fillStyle='#FFD700';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('\\u2B50',f.x,f.y-18);}
  ctx.globalAlpha=1;
 }
 drawBase(ctx,playerBase,'#4CAF50');
 if(enemyBase)drawBase(ctx,enemyBase,enemyBase.color||'#D32F2F');
 // Enemy bugs
 for(var ei=0;ei<eB.length;ei++){if(eB[ei].alive)drawBug(ctx,eB[ei])}
 // Player bugs
 for(var pi=0;pi<pB.length;pi++){if(pB[pi].alive)drawBug(ctx,pB[pi])}
 // Particles
 for(var pi=0;pi<pts.length;pi++){var pp=pts[pi];var alpha=pp.life/pp.ml;ctx.globalAlpha=alpha;ctx.fillStyle=pp.color;ctx.beginPath();ctx.arc(pp.x,pp.y,pp.sz*alpha,0,6.28);ctx.fill()}
 ctx.globalAlpha=1;
 // Selection circle
 if(selBug>=0&&selBug<pB.length&&pB[selBug].alive){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(pB[selBug].x,pB[selBug].y,pB[selBug].radius+6,0,6.28);ctx.stroke();ctx.setLineDash([])}
 ctx.restore();
 // HUD overlays
 if(nGoal>0&&state==='playing'){var pr=Math.min(1,nectar/nGoal);ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(cvs.width*.25,50,cvs.width*.5,14);ctx.fillStyle='#FFD700';ctx.fillRect(cvs.width*.25,50,cvs.width*.5*pr,14);ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(Math.floor(nectar)+'/'+nGoal,cvs.width/2,61);ctx.textAlign='start'}
 if(dLim>0&&dTimer>0&&state==='playing'){var secs=Math.ceil(dTimer);ctx.fillStyle='rgba(0,0,0,.7)';ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.fillText(Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0'),cvs.width/2,cvs.height/2+80);ctx.textAlign='start'}
 if(fpsShow){ctx.fillStyle='#0f0';ctx.font='12px monospace';ctx.fillText('FPS:'+curFPS,10,20)}
}

// === GAME LOOP ===
function loop(ts){
 var rawDt=Math.min(.05,(ts-lastTS)/1000);lastTS=ts;fpsCount++;fpsTime+=rawDt;
 if(fpsTime>=1){curFPS=fpsCount;fpsCount=0;fpsTime=0}
 if(state==='playing'||state==='bossfight'){
  var dt=rawDt*gSpd;gTime+=dt;
  updatePlayerBugs(dt);updateEnemyBugs(dt);updateAI(dt);updateWormholes(dt);updateFlowers(dt);updateParticles(dt);
  if(dLim>0)dTimer-=rawDt*gSpd;if(dTimer<=0&&dLim>0)dTimer=0;
  tCamX+=(mapW/2-tCamX)*rawDt*2;tCamY+=(mapH/2-tCamY)*rawDt*2;
  camX+=(tCamX-camX)*rawDt*3;camY+=(tCamY-camY)*rawDt*3;
  checkWinLose();updateHUD();
 }
 if(hintTimer>0){hintTimer-=rawDt;if(hintTimer<=0)hideHint()}
 render();requestAnimationFrame(loop);
}

function updateHUD(){
 document.getElementById('nectar-disp').textContent='N: '+Math.floor(nectar)+' / '+nGoal;
 document.getElementById('timer').textContent=fmtT(gTime);
 document.getElementById('essence-disp').textContent='\\u2726 '+essence;
 updateBugPanel();
}
// === INPUT HANDLING ===
var mouseDown=false,dSX=0,dSY=0,mouseX=0,mouseY=0;
function screenToWorld(sx,sy){return{x:(sx-cvs.width/2)/camZoom+tCamX,y:(sy-cvs.height/2)/camZoom+tCamY}}

function setupInput(){
 cvs.addEventListener('contextmenu',function(e){e.preventDefault()});
 cvs.addEventListener('wheel',function(e){var z=e.deltaY>0?.9:1.1;camZoom=Math.max(.3,Math.min(3,camZoom*z))});
 document.addEventListener('keydown',function(e){
  if(e.key==='Escape')togglePause();
  if(e.key===' '){e.preventDefault();gSpd=gSpd===1?2:gSpd===2?3:1;document.getElementById('spd-btn').textContent='x'+gSpd;}
 });
}

cvs.addEventListener('mousedown',function(e){mouseX=e.clientX;mouseY=e.clientY;if(state!=='playing'&&state!=='bossfight')return;if(e.button===2){handleRightClick(e.clientX,e.clientY)}else if(e.button===0){mouseDown=true;dSX=e.clientX;dSY=e.clientY}});
cvs.addEventListener('mouseup',function(e){if(mouseDown&&e.button===0){if(Math.abs(e.clientX-dSX)<8&&Math.abs(e.clientY-dSY)<8)handleLeftClick(e.clientX,e.clientY)}mouseDown=false});
cvs.addEventListener('mousemove',function(e){mouseX=e.clientX;mouseY=e.clientY});

function handleLeftClick(sx,sy){if(state!=='playing'&&state!=='bossfight')return;var wp=screenToWorld(sx,sy);selBug=-1;for(var i=pB.length-1;i>=0;i--){if(!pB[i].alive)continue;if(dist(pB[i],wp)<pB[i].radius+8){selBug=i;break}}}

function handleRightClick(sx,sy){if(state!=='playing'&&state!=='bossfight')return;var wp=screenToWorld(sx,sy);if(selBug>=0&&selBug<pB.length&&pB[selBug].alive){moveToward(pB[selBug],wp.x,wp.y,pB[selBug].speed*1.5,.1);spawnP(wp.x,wp.y,5,(WORLDS[curWorld]||WORLDS[0]).pc,40,.4)}}

// === MENU FUNCTIONS ===
function goStart(){var wo=document.getElementById('welcome-overlay');wo.classList.add('fade-out');setTimeout(function(){wo.style.display='none';document.getElementById('main-menu').style.display='flex';document.getElementById('main-menu').classList.add('active')},800)}

function showStorySelect(){state='story';hidePanels();document.getElementById('story-select').style.display='flex';document.getElementById('story-select').classList.add('active');var grid=document.getElementById('chapter-grid');if(!grid)return;grid.innerHTML='';
CHAPTERS.forEach(function(ch,idx){var card=document.createElement('div');card.className='chcard';card.style.background='linear-gradient(135deg,'+ch.bg+',rgba(0,0,0,.5))';card.innerHTML='<h3 style=color:#8bc34a;margin-bottom:5px>Chapter '+(idx+1)+': '+ch.nm+'</h3><p style=color:#ccc;font-size:13px>'+ch.ds+'</p>';card.addEventListener('click',(function(i){return function(){showLevelList(i)}})(idx));grid.appendChild(card)})}

function showLevelList(chIdx){
 state='level-select';
 var sel=document.getElementById('level-select');sel.style.display='flex';sel.classList.add('active');
 document.getElementById('story-select').classList.remove('active');
 var title=document.getElementById('ls-title');var desc=document.getElementById('ls-desc');var grid=document.getElementById('level-grid');
 if(!title||!desc||!grid)return;
 var ch=LEVELS.filter(function(lv){return lv.ch===chIdx+1});
 title.textContent=CHAPTERS[chIdx].nm;desc.textContent=CHAPTERS[chIdx].ds;grid.innerHTML='';
 var typeNames={gather:'Gather',defense:'Defense',battle:'Battle',finalBoss:'Boss',boss_final:'BOSS FIGHT',custom:'Custom'};
 ch.forEach(function(lv,i){
  var card=document.createElement('div');card.className='lv-card';
  var tname=typeNames[lv.tp]||lv.tp;
  var isCompleted=done.indexOf(lv.x)>=0;
  var cls=lv.tp==='gather'?'gather':lv.tp==='defense'?'defense':lv.tp==='battle'?'battle':lv.tp==='finalBoss'?'finalBoss':lv.tp==='boss_final'?'boss_final':'custom';
  card.innerHTML='<span class=lv-type '+cls+'>'+tname+'</span> <strong>L'+String(i+1).padStart(2,'0')+': '+lv.obj+'</strong>'+(isCompleted?' \\u2713':'');
  card.addEventListener('click',(function(idx){return function(){selectedLevel=idx;initLevel(ch[idx])}})(i));
  grid.appendChild(card)
 })
}

function startLevel(lv){hidePanels();selectedLevel=-1;curWorld=lv.wld||0;document.getElementById('hud').classList.remove('hidden');initLevel(lv)}
function nextLevel(){var idx=selLv+1;if(idx<LEVELS.length){selLv=idx;initLevel(LEVELS[idx])}else{showStorySelect()}}
// === SPECIAL GAME MODES ===
function renderCollection(){
 var gallery=document.getElementById('bug-gallery');if(!gallery)return;gallery.innerHTML='';
 BUGS.forEach(function(b,i){
  var card=document.createElement('div');card.className='bcard'+(unlocked.indexOf(b.id)>=0?'':' lk');
  var spArr=['Burn','Chain','Slow','Fast','Crit','Poison','Counter','Armor','Double','Corpse','Aura','AOE'];
  var spMap={burn:0,chain:1,slow:2,fast:3,crit:4,pso:5,cnt:6,arm:7,dbl:8,crp:9,aur:10,aoe:11};
  var spL=b.sp&&spMap[b.sp]!=undefined?spArr[spMap[b.sp]]:'';
  card.innerHTML='<div style=\"font-size:28px\">'+BUG_ICONS[i%BUG_ICONS.length]+'</div><div style=\"color:'+b.cl+';font-weight:bold;font-size:13px;margin:4px 0;\">'+b.nm+'</div><div style=\"color:#aaa;font-size:11px;\">HP:'+b.hp+' DMG:'+b.dm+' SPD:'+b.spd+' Co:'+b.co+(b.sp?' ['+b.sp+']':'')+'</div>';
  if(unlocked.indexOf(b.id)>=0)gallery.appendChild(card);
 })
}

function renderBossList(){
 var list=document.getElementById('boss-list');if(!list)return;list.innerHTML='';
 BOSSES.forEach(function(boss,i){
  var div=document.createElement('div');var beaten=beatenBosses.indexOf(i)>=0;
  div.className='boss-item'+(beaten?' beaten':'');
  div.innerHTML='<span>Boss #'+(i+1)+': '+boss.nm+' (HP:'+boss.hp+')</span><span style=\"color:'+boss.cl+'\">'+(beaten?' \\u2713':'')+'</span>';
  div.addEventListener('click',(function(idx){return function(){if(!beaten)startBossFight(idx)}})(i));
  list.appendChild(div)
 })
}

function startBossFight(idx){
 var boss=BOSSES[idx];if(!boss)return;
 hidePanels();document.getElementById('hud').classList.remove('hidden');
 state='bossfight';currentWorld=idx%BOSSES.length;mapW=400;mapH=250;
 nectar=100;nGoal=0;dLim=0;dTimer=0;gTime=0;pB=[];eB=[];flw=[];pts=[];bossTimer=0;aiTimers={};
 lanes=[{wps:[],idx:0,pU:[],eU:[]}];
 for(var i=0;i<10;i++)lanes[0].wps.push({x:70+i*30,y:125+Math.sin(i*.5)*20,next:i<9?lanes[0].wps[i+1]:null});
 curLv={type:'boss',ew:['bigbangbug','bomberbee']};
 tCamX=200;tCamY=125;camZoom=1.5;camX=tCamX;camY=tCamY;
 playerBase={x:50,y:125,hp:200,maxHp:200,team:'p',nectar:100,radius:30,coolDown:{}};
 enemyBase={x:350,y:125,hp:boss.hp,maxHp:boss.hp,team:'e',radius:40,isBoss:true,color:boss.cl};
 for(var i=0;i<5;i++)flw.push({x:150+rnd()*200,y:40+rnd()*170,amt:3,mxAmt:3,reG:0,r:12,pulse:0,regTime:15+rnd()*10});
 buildPanel(null);showHint('Boss: '+boss.nm+' HP:'+boss.hp);
}

function updateBossFight(dt){
 if(enemyBase.isBoss){
  if(bossTimer>8){bossTimer=0;spawnEB(['bigbangbug','bomberbee','wasp','caterpillar'][Math.floor(rnd()*4)],Math.floor(rnd(0,3)));}
  if(enemyBase.hp<=0){
   beatenBosses.push(parseInt(localStorage.getItem('bb_bi')||'0')+1);
   localStorage.setItem('bb_b',JSON.stringify(beatenBosses));
   showResults(true);return;
  }
 }
 checkWinLose();
}

function startSandbox(){
 hidePanels();document.getElementById('hud').classList.remove('hidden');
 state='playing';curWorld=0;mapW=500;mapH=300;
 var initNec=parseInt(document.getElementById('sb-nectar')?.value||'100');
 var diff=document.getElementById('sb-difficulty')?.value||'normal';
 playerBase={x:50,y:150,hp:200,maxHp:200,team:'p',nectar:initNec,radius:30,coolDown:{}};
 enemyBase={x:450,y:150,hp:200,maxHp:200,team:'e',radius:30};
 nectar=initNec;nGoal=9999;dLim=0;dTimer=0;gTime=0;pB=[];eB=[];flw=[];pts=[];bossTimer=0;aiTimers={};
 lanes=[];
 var nLanes=WORLD_PATHS[0]&&WORLD_PATHS[0].lanes?WORLD_PATHS[0].lanes.length:3;
 for(var li=0;li<nLanes;li++){
  var lane={wps:[],idx:li,pU:[],eU:[]};
  var pathData=WORLD_PATHS[0].lanes[li];
  for(var p=0;p<pathData.length;p++){
   lane.wps.push({x:pathData[p].x,y:pathData[p].y,next:null});
  }
  for(var j=0;j<lane.wps.length-1;j++)lane.wps[j].next=lane.wps[j+1];
  lanes.push(lane);
 }
 for(var i=0;i<8;i++)flw.push({x:100+rnd()*300,y:40+rnd()*220,amt:3,mxAmt:3,reG:0,r:12,pulse:0,regTime:15+rnd()*10});
 tCamX=250;tCamY=150;camZoom=1.3;camX=tCamX;camY=tCamY;
 curLv={type:'sandbox'};buildPanel(null);
 var desc='Sandbox Mode - free build! '+initNec+' nectar';
 if(diff==='easy')desc+=' (Easy)';else if(diff==='hard')desc+=' (Hard)';
 showHint(desc);
}

function startTimeAttack(){
 hidePanels();document.getElementById('hud').classList.remove('hidden');
 state='playing';curWorld=0;mapW=400;mapH=250;
 var dur=parseInt(document.getElementById('tatk-duration')?.value||'10')*60;
 playerBase={x:50,y:125,hp:200,maxHp:200,team:'p',nectar:50,radius:30,coolDown:{}};
 enemyBase={x:350,y:125,hp:200,maxHp:200,team:'e',radius:30};
 nectar=50;nGoal=0;dLim=dur;dTimer=dur;gTime=0;pB=[];eB=[];flw=[];pts=[];bossTimer=0;aiTimers={};
 lanes=[];
 var nLanes=WORLD_PATHS[0]&&WORLD_PATHS[0].lanes?WORLD_PATHS[0].lanes.length:3;
 for(var li=0;li<nLanes;li++){
  var lane={wps:[],idx:li,pU:[],eU:[]};
  var pathData=WORLD_PATHS[0].lanes[li];
  for(var p=0;p<pathData.length;p++){
   lane.wps.push({x:pathData[p].x,y:pathData[p].y,next:null});
  }
  for(var j=0;j<lane.wps.length-1;j++)lane.wps[j].next=lane.wps[j+1];
  lanes.push(lane);
 }
 for(var i=0;i<5;i++)flw.push({x:120+rnd()*200,y:50+rnd()*150,amt:3,mxAmt:3,reG:0,r:12,pulse:0,regTime:15+rnd()*10});
 tCamX=200;tCamY=125;camZoom=1.4;camX=tCamX;camY=tCamY;
 curLv={type:'timeatk',ew:['ant','bee','militant','wasp','bomberbee','caterpillar','spider','beetlehero']};
 buildPanel(null);showHint('Survive '+dur/60+' minutes!');
}

// === CUSTOM BATTLE ===
function startCustomBattle(){
 hidePanels();document.getElementById('hud').classList.remove('hidden');
 state='playing';curWorld=0;
 var size=document.getElementById('cm-size')?.value||'medium';
 var mapSizes={small:[300,200],medium:[500,300],large:[700,400]};
 var ms=mapSizes[size]||[500,300];mapW=ms[0];mapH=ms[1];
 var pBugs=parseInt(document.getElementById('cm-playerbugs')?.value||'5');
 var eBugs=parseInt(document.getElementById('cm-enemybugs')?.value||'5');
 var initNec=parseInt(document.getElementById('cm-nectar')?.value||'50');
 var goal=parseInt(document.getElementById('cm-goal')?.value||'100');
 var timeLim=parseInt(document.getElementById('cm-time')?.value||'0');
 playerBase={x:30,y:mapH/2,hp:200,maxHp:200,team:'p',nectar:initNec,radius:25,coolDown:{}};
 enemyBase={x:mapW-30,y:mapH/2,hp:200,maxHp:200,team:'e',radius:25};
 nectar=initNec;nGoal=goal;dLim=timeLim;dTimer=timeLim;gTime=0;pB=[];eB=[];flw=[];pts=[];aiTimers={};bossTimer=0;
 lanes=[];
 var nLanes=WORLD_PATHS[0]&&WORLD_PATHS[0].lanes?WORLD_PATHS[0].lanes.length:3;
 for(var li=0;li<nLanes;li++){
  var lane={wps:[],idx:li,pU:[],eU:[]};
  var pathData=WORLD_PATHS[0].lanes[li];
  for(var p=0;p<pathData.length;p++){
   lane.wps.push({x:pathData[p].x,y:pathData[p].y,next:null});
  }
  for(var j=0;j<lane.wps.length-1;j++)lane.wps[j].next=lane.wps[j+1];
  lanes.push(lane);
 }
 for(var i=0;i<6;i++)flw.push({x:80+rnd()*(mapW-160),y:20+rnd()*(mapH-40),amt:3,mxAmt:3,reG:0,r:12,pulse:0,regTime:15+rnd()*10});
 tCamX=mapW/2;tCamY=mapH/2;camZoom=1.2;camX=tCamX;camY=tCamY;
 // Spawn initial player bugs
 var basicBugs=['ant','bee','littlebeetle','rhinobeetle','stinkbug','toxicbug','wildbee','wasp','bomberbee','spider','waterbeetle','caterpillar','bigbangbug'];
 for(var i=0;i<pBugs&&i<basicBugs.length;i++){pB.push(mkBug(bgd(basicBugs[i]),50+rnd()*20,mapH/2+rnd(-30,30),'p'));}
 // Enemy AI
 var ewPool=['ant','bee','militant','wasp','bomberbee','caterpillar','spider','rhinobeetle','stinkbug','toxicbug'];
 for(var i=0;i<ewPool.length;i++){aiTimers[ewPool[i]+'_'+i]={t:0,int:8+i*3,mx:eBugs+10}}
 curLv={type:'custom',ew:ewPool};buildPanel(null);showHint('Custom Battle! Goal: '+goal+' nectar'+(timeLim>0?' | Time limit: '+timeLim+'s':''));
}

// === PAUSE ===
function togglePause(){
 if(state==='playing'){state='paused';document.getElementById('pause-pnl').style.display='flex';document.getElementById('pause-pnl').classList.add('active')}
 else if(state==='paused'){state='playing';document.getElementById('pause-pnl').classList.remove('active')}
}

// === SAVE / LOAD ===
function loadSave(){
 try{essence=parseInt(localStorage.getItem('bb_e')||'0');unlocked=JSON.parse(localStorage.getItem('bb_u')||'[\"ant\",\"bee\",\"littlebeetle\",\"wildbee\",\"militant\",\"rhinobeetle\",\"stagbeetle\",\"stinkbug\",\"toxicbug\",\"spider\",\"wasp\",\"bomberbee\",\"caterpillar\",\"poisonpillar\",\"waterbeetle\",\"giantwaterbeetle\",\"beetlehero\",\"wasphero\",\"toxichero\",\"tick\",\"bigbangbug\"]');completed=JSON.parse(localStorage.getItem('bb_d')||'[]');beatenBosses=JSON.parse(localStorage.getItem('bb_b')||'[]')}catch(e){essence=0;unlocked=['ant','bee','littlebeetle','wildbee','militant','rhinobeetle','stagbeetle','stinkbug','toxicbug','spider','wasp','bomberbee','caterpillar','poisonpillar','waterbeetle','giantwaterbeetle','beetlehero','wasphero','toxichero','tick','bigbangbug'];completed=[];beatenBosses=[]}
}

function checkUnlocks(){
 for(var i=0;i<UNLOCK_REQS.length;i++){
  var ur=UNLOCK_REQS[i];
  if(!unlocked.includes(ur.id)&&essence>=ur.req){unlocked.push(ur.id);localStorage.setItem('bb_u',JSON.stringify(unlocked));showHint('Unlocked: '+ur.id+'!');}
 }
}

function resetSaves(){
 localStorage.removeItem('bb_e');localStorage.removeItem('bb_u');localStorage.removeItem('bb_d');localStorage.removeItem('bb_b');
 essence=0;unlocked=['ant','bee','littlebeetle','wildbee','militant','rhinobeetle','stagbeetle','stinkbug','toxicbug','spider','wasp','bomberbee','caterpillar','poisonpillar','waterbeetle','giantwaterbeetle','beetlehero','wasphero','toxichero','tick','bigbangbug'];completed=[];beatenBosses=[];
 showHint('All saves reset!');
}
// === EVOLUTION SYSTEM ===
window.showEvoTab=function(tab){
 document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('act')});
 if(tab==='fuse'){
  document.getElementById('evo-fuse').style.display='grid';
  document.getElementById('evo-upgrade').style.display='none';
  document.querySelector('.tab-row .tab-btn').classList.add('act');
  renderEvolutionFuse();
 }else{
  document.getElementById('evo-fuse').style.display='none';
  document.getElementById('evo-upgrade').style.display='grid';
  document.querySelectorAll('.tab-btn')[1].classList.add('act');
  renderEvolutionUpgrade();
 }
};

function renderEvolutionFuse(){
 var container=document.getElementById('evo-fuse');if(!container)return;container.innerHTML='';
 var recipes=[
  {name:'Fire Ant',cost:20,desc:'Ant + Wild Bee => Fire Beetle',bugs:['ant','wildbee'],result:'fire_beetle'},
  {name:'Venom Ant',cost:25,desc:'Spider + Stink Bug => Venom Spider',bugs:['spider','stinkbug'],result:'venom_spider'},
  {name:'Ice Bee',cost:30,desc:'Wasp + Bee => Ice Wasp',bugs:['wasp','bee'],result:'ice_wasp'},
  {name:'Thunder Beetle',cost:35,desc:'Rhino Beetle + Stag Beetle => Thunder Mantis',bugs:['rhinobeetle','stagbeetle'],result:'thunder_mantis'}
 ];
 recipes.forEach(function(r){
  var canCraft=r.bugs.every(function(bid){return unlocked.includes(bid)})&&essence>=r.cost;
  var card=document.createElement('div');card.className='evo-card'+(canCraft?'':' locked');
  card.innerHTML='<div class=evo-name>'+r.name+'</div><div class=evo-desc>'+r.desc+'</div><div class=evo-cost>'+(canCraft?'Cost: '+r.cost+' \\u2726 - Click to craft!':'Locked')+'</div>';
  if(canCraft)card.addEventListener('click',(function(rec){return function(){if(essence>=rec.cost){for(var i=0;i<rec.bugs.length;i++){}essence-=rec.cost;localStorage.setItem('bb_e',String(essence));unlocked.push(rec.result);localStorage.setItem('bb_u',JSON.stringify(unlocked));showHint('Evolved '+rec.name+'!');renderEvolutionFuse()}}})(r));
  container.appendChild(card);
 })
}

function renderEvolutionUpgrade(){
 var container=document.getElementById('evo-upgrade');if(!container)return;container.innerHTML='';
 var upgrades=[
  {name:'Super Ant',orig:'ant',cost:50,desc:'HP+50%, DMG+30%',stat:'+50% HP, +30% DMG'},
  {name:'Mega Bee',orig:'bee',cost:60,desc:'Speed+40%, New attack speed',stat:'+40% Speed, Faster attack'},
  {name:'Armored Beetle',orig:'rhinobeetle',cost:45,desc:'Defense doubled',stat:'Armor x2'},
  {name:'Poison Titan',orig:'caterpillar',cost:80,desc:'Poison AoE + extra damage',stat:'Poison AoE+50% dmg'}
 ];
 upgrades.forEach(function(u){
  var canUpgrade=unlocked.includes(u.orig)&&essence>=u.cost;
  var card=document.createElement('div');card.className='evo-card'+(canUpgrade?'':' locked');
  card.innerHTML='<div class=evo-name>'+u.name+'</div><div class=evo-desc>From: '+u.orig+'</div><div class=evo-desc>'+u.stat+'</div><div class=evo-cost>'+(canUpgrade?'Cost: '+u.cost+' \\u2726':'Locked')+'</div>';
  container.appendChild(card);
 })
}

// === GAME LOOP OVERRIDE FOR BOSS ===
var originalLoop=loop;

// === MAIN INITIALIZATION ===
window.addEventListener('DOMContentLoaded',function(){
 cvs=document.getElementById('cvs');ctx=cvs.getContext('2d');
 cvs.width=window.innerWidth;cvs.height=window.innerHeight;
 setupInput();loadSave();

 // Menu buttons with data-screen attribute
 document.querySelectorAll('[data-screen]').forEach(function(btn){btn.addEventListener('click',function(){
  var screen=btn.dataset.screen;
  if(screen==='story')showStorySelect();
  else if(screen==='collection'){switchScreen('collection');renderCollection()}
  else if(screen==='bossrush'){switchScreen('bossrush');renderBossList()}
  else if(screen==='evo-tree'){switchScreen('evo-tree');renderEvolutionFuse()}
  else switchScreen(screen);
 })});

 // Mission button
 document.getElementById('start-mission')?.addEventListener('click',function(){if(selectedLevel>=0&&selectedLevel<LEVELS.length){initLevel(LEVELS[selectedLevel])}});
 // Pause/resume
 document.getElementById('resume-btn')?.addEventListener('click',togglePause);
 document.getElementById('sp-btn')?.addEventListener('click',togglePause);
 // Wormhole button
 document.getElementById('wh-btn')?.addEventListener('click',function(){
  if(state==='playing'||state==='bossfight')enterWormholeMode();
 });
 // Place button (rapid placement mode toggle)
 document.getElementById('place-btn')?.addEventListener('click',function(){
  if(state==='playing'||state==='bossfight'){
   if(placementMode){placementMode=false;placingBugId=null;placePoints=[];document.getElementById('cvs').style.cursor='default';showHint('Placement cancelled.');}
   else showHint('Click a bug in the panel to place it on a path!');
  }
 });
 // Restart/abort
 document.getElementById('restart-btn')?.addEventListener('click',function(){if(selLv>=0)initLevel(LEVELS[selLv])});
 document.getElementById('abort-btn')?.addEventListener('click',function(){hidePanels();switchScreen('main-menu')});
 // Next level
 document.getElementById('next-lvl')?.addEventListener('click',nextLevel);
 // Sandbox start
 document.getElementById('sb-start')?.addEventListener('click',startSandbox);
 // Time attack start
 document.getElementById('tatk-start')?.addEventListener('click',startTimeAttack);
 // Custom battle start
 document.getElementById('cm-start')?.addEventListener('click',startCustomBattle);
 // Options
 document.getElementById('opt-fps')?.addEventListener('change',function(){fpsShow=this.checked});
 document.getElementById('opt-reset-save')?.addEventListener('click',resetSaves);

 // Speed button
 document.addEventListener('keydown',function(e){
  if(state==='playing'||state==='bossfight'&&(e.key===' ')){
   gSpd=gSpd===1?2:gSpd===2?3:1;
   var sb=document.getElementById('spd-btn');if(sb)sb.textContent='x'+gSpd;
  }
 });

 // Resize handler
 window.addEventListener('resize',function(){cvs.width=window.innerWidth;cvs.height=window.innerHeight})

 lastTS=performance.now();requestAnimationFrame(loop);
});

})(); // end IIFE
})();