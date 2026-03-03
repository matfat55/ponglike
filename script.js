// ═══ AUDIO ═══
let _ac=null;const ac=()=>{if(!_ac)try{_ac=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}return _ac;};
const tone=(f,d,t='square',v=0.06,del=0)=>{setTimeout(()=>{try{const c=ac();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+d);o.start();o.stop(c.currentTime+d);}catch(_){}},del);};
const SFX={paddle:()=>tone(460,.04),wall:()=>tone(240,.025,'square',.035),score:()=>{tone(520,.07);tone(780,.1,'square',.04,70);},miss:()=>tone(120,.35,'sawtooth',.06),abil:()=>{tone(880,.05);tone(1100,.08,'square',.04,50);},boss:()=>{[110,85,65].forEach((f,i)=>tone(f,.22,'sawtooth',.07,i*160));},win:()=>{[523,659,784,1046].forEach((f,i)=>tone(f,.16,'square',.055,i*100));},sel:()=>tone(660,.04,'square',.045),multi:()=>{tone(600,.03,'square',.045);tone(900,.05,'square',.035,30);tone(1200,.07,'square',.025,60);},ghost:()=>{tone(200,.12,'sine',.045);tone(400,.16,'sine',.03,50);},wallp:()=>{tone(300,.05,'square',.045);tone(150,.08,'square',.035,30);},shrink:()=>{tone(1000,.03,'square',.045);tone(600,.06,'square',.035,25);},curve:()=>{tone(400,.05,'sine',.05);tone(600,.08,'sine',.035,40);},smash:()=>{tone(150,.12,'sawtooth',.07);tone(80,.2,'sawtooth',.05,40);},legendary:()=>{[880,1100,1320,1760].forEach((f,i)=>tone(f,.12,'sine',.05,i*80));},};

// ═══ CONSTANTS ═══
const GW=800,GH=500,BALL_SZ=10,PAD_W=12,BASE_PAD_H=72;
const PX_HOME=40,EX=GW-40,HORIZ=50,PTS_WIN=5,MAX_WAVE=12,TRAIL=16,BASE_SPD=340;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const rng=(a,b)=>a+Math.random()*(b-a);
const easeOut=t=>1-(1-t) ** 3;
function simBallY(bx,by,vx,vy,tx){if(vx<=0)return by;let px=bx,py=by,pvx=vx,pvy=vy;for(let i=0;i<500;i++){px+=pvx*.008;py+=pvy*.008;if(py<5){py=5;pvy=Math.abs(pvy);}if(py>GH-5){py=GH-5;pvy=-Math.abs(pvy);}if(px>=tx)return py;}return py;}

// ═══ DIFFICULTY RATINGS ═══
const DIFF_RANKS=['F','E','D','C','B','A','S','SS','SSS'];
const DIFF_COLORS={F:'#446644',E:'#558855',D:'#669966',C:'#88aa88',B:'#66aaff',A:'#5588ff',S:'#ffaa44',SS:'#ff6644',SSS:'#ff44ff'};
const DIFF_GLOW={F:'68,102,68',E:'85,136,85',D:'102,153,102',C:'136,170,136',B:'102,170,255',A:'85,136,255',S:'255,170,68',SS:'255,102,68',SSS:'255,68,255'};
// Reward tier per difficulty
const DIFF_REWARD={F:'common',E:'common',D:'uncommon',C:'uncommon',B:'rare',A:'rare',S:'epic',SS:'legendary',SSS:'secret'};
// Which upgrade rarities are AVAILABLE at each difficulty
const DIFF_TIERS={F:['common'],E:['common','uncommon'],D:['common','uncommon'],C:['common','uncommon','rare'],B:['uncommon','rare'],A:['uncommon','rare','epic'],S:['rare','epic','legendary'],SS:['epic','legendary','mythical'],SSS:['legendary','mythical','secret']};
const TIER_NAMES={common:'COMMON',uncommon:'UNCOMMON',rare:'RARE',epic:'EPIC',legendary:'LEGENDARY',mythical:'MYTHICAL',secret:'SECRET'};
const TIER_COLORS={common:'#667788',uncommon:'#55aa77',rare:'#5588ff',epic:'#ffaa44',legendary:'#ff5555',mythical:'#ff44ff',secret:'#00ffcc'};
const TIER_GLOW={common:'102,119,136',uncommon:'85,170,119',rare:'85,136,255',epic:'255,170,68',legendary:'255,85,85',mythical:'255,68,255',secret:'0,255,204'};
const TIER_ICON={common:'\u25C7',uncommon:'\u25C8',rare:'\u2605',epic:'\u2726',legendary:'\u2742',mythical:'\u2748',secret:'\u2756'};
const TIER_ORDER=['common','uncommon','rare','epic','legendary','mythical','secret'];

// ═══ PALETTES ═══
const PCOL={classic:{p:'#ffffff',g:'rgba(255,255,255,',t:[1,1,1]},oracle:{p:'#44ddff',g:'rgba(68,221,255,',t:[.27,.87,1]},inferno:{p:'#cc88ff',g:'rgba(204,136,255,',t:[.8,.53,1]},frost:{p:'#88ccff',g:'rgba(136,204,255,',t:[.53,.8,1]},storm:{p:'#ffee44',g:'rgba(255,238,68,',t:[1,.93,.27]},voidp:{p:'#ff44aa',g:'rgba(255,68,170,',t:[1,.27,.67]},};

// ═══ PADDLES ═══
const PADDLES=[
  {id:'classic',name:'STANDARD',hMul:1.1,desc:'No special tricks. Pure pong. Slightly larger paddle.',abil:'NONE',akey:'',ainfo:'',cd:999},
  {id:'oracle',name:'ORACLE',hMul:1,desc:'See the future. Reveals full ball trajectory for 8 seconds.',abil:'FORESIGHT',akey:'Q',ainfo:'See ball path 8s',cd:12},
  {id:'inferno',name:'PHANTOM',hMul:.95,desc:'Phase through. Ball becomes a ghost that pierces the enemy once.',abil:'PHASE',akey:'Q',ainfo:'Next hit pierces enemy',cd:6},
  {id:'frost',name:'GLACIER',hMul:1.05,desc:'Flash freeze. Enemy and ball freeze solid.',abil:'BLIZZARD',akey:'Q',ainfo:'Freeze all 1.8s',cd:8},
  {id:'storm',name:'STORM',hMul:.9,desc:'Next hit fires a stun bolt that freezes enemy paddle.',abil:'THUNDER',akey:'Q',ainfo:'Stun bolt on next hit',cd:6},
  {id:'voidp',name:'VOID',hMul:1,desc:'Drop a gravity well in the ball path. Warps trajectory.',abil:'GRAVITY WELL',akey:'Q',ainfo:'Gravity well 3s',cd:6},
];

// ═══ ENEMIES with difficulty ═══ (multiple per tier for variety)
const ENEMIES=[
  // F-tier
  {id:'basic',name:'ROOKIE',tag:'',diff:'F',mod:c=>{}},
  {id:'sleepy',name:'DROWSY',tag:'zz',diff:'F',mod:c=>{c.aiSpd*=.85;}},
  // E-tier
  {id:'wide',name:'WALL',tag:'=',diff:'E',mod:c=>{c.aiSpd*=.9;}},
  {id:'stubborn',name:'BRICK',tag:'[]',diff:'E',mod:c=>{c.aiSpd*=.85;}},
  // D-tier
  {id:'fast',name:'SPEEDSTER',tag:'>>',diff:'D',mod:c=>{c.aiSpd*=1.3;}},
  {id:'jitter',name:'TWITCHER',tag:'~~',diff:'D',mod:c=>{c.aiSpd*=1.15;c.jitter=true;}},
  // C-tier
  {id:'tricky',name:'TRICKSTER',tag:'~',diff:'C',mod:c=>{c.trickAng=true;}},
  {id:'mimic',name:'MIMIC',tag:'<>',diff:'C',mod:c=>{c.trickAng=true;c.aiSpd*=1.1;}},
  // B-tier
  {id:'ghost',name:'PHANTOM',tag:'?',diff:'B',mod:c=>{c.ghost=true;}},
  {id:'blinker',name:'BLINKER',tag:'*?',diff:'B',mod:c=>{c.ghost=true;c.aiSpd*=1.1;}},
  // A-tier
  {id:'tank',name:'FORTRESS',tag:'##',diff:'A',mod:c=>{c.aiSpd*=.85;}},
  {id:'jugg',name:'JUGGERNAUT',tag:'###',diff:'A',mod:c=>{c.aiReact=Math.min(c.aiReact+.08,.95);}},
  // S-tier
  {id:'sniper',name:'SNIPER',tag:'+',diff:'S',mod:c=>{c.aiReact=Math.min(c.aiReact+.14,.97);}},
  {id:'hunter',name:'HUNTER',tag:'>+',diff:'S',mod:c=>{c.aiReact=Math.min(c.aiReact+.1,.96);c.aiSpd*=1.2;}},
  // SS-tier
  {id:'accel',name:'CHAOS',tag:'!!',diff:'SS',mod:c=>{c.chaos=true;c.aiSpd*=1.1;}},
  {id:'warden',name:'WARDEN',tag:'!#',diff:'SS',mod:c=>{c.aiReact=Math.min(c.aiReact+.15,.97);c.chaos=true;c.trickAng=true;}},
  // SSS-tier (boss-only) - terrifying
  {id:'apex',name:'APEX',tag:'\u2620',diff:'SSS',mod:c=>{c.chaos=true;c.trickAng=true;c.aiReact=Math.min(c.aiReact+.2,.98);c.aiSpd*=1.3;}},
  {id:'void',name:'THE VOID',tag:'\u2588',diff:'SSS',mod:c=>{c.ghost=true;c.chaos=true;c.trickAng=true;c.aiReact=Math.min(c.aiReact+.18,.98);c.aiSpd*=1.25;}},
];

function getEnemiesForDiff(diff){return ENEMIES.filter(e=>e.diff===diff);}

// ═══ ENEMY ABILITIES ═══
// Each ability: id, name, desc, icon, cd (cooldown), dur (active duration), minDiff (minimum rank index to appear)
const E_ABILS={
  none:{id:'none',name:'',desc:'',icon:'',cd:999},
  dash:{id:'dash',name:'DASH',desc:'Surges to ball at 3x speed',icon:'\u21A0',cd:4,dur:.5},
  spin:{id:'spin',name:'SPIN RETURN',desc:'Curves the ball back mid-flight',icon:'\u21BB',cd:6,dur:0},
  blink:{id:'blink',name:'BLINK',desc:'Teleports to ball instantly',icon:'\u2607',cd:5,dur:0},
  bulk:{id:'bulk',name:'BULK UP',desc:'Paddle grows 1.4x for 2.5s',icon:'\u2B1B',cd:8,dur:2.5},
  pull:{id:'pull',name:'GRAVITY PULL',desc:'Drags ball back toward enemy',icon:'\u2299',cd:7,dur:2},
  lightning:{id:'lightning',name:'LIGHTNING',desc:'Channels lightning, stuns ball, launches it at you',icon:'\u26A1',cd:10,dur:1.2},
  voidpulse:{id:'voidpulse',name:'VOID PULSE',desc:'Reverses ball at 2x speed, pushes your paddle, freezes you',icon:'\u29BF',cd:9,dur:.3},
  rampage:{id:'rampage',name:'RAMPAGE',desc:'Fires 2 phantom balls at you that score if they pass',icon:'\u2622',cd:10,dur:2.5},
  accel:{id:'accel',name:'OVERDRIVE',desc:'Ball accelerates to 2x speed for 2s',icon:'\u00BB',cd:8,dur:2},
  clone:{id:'clone',name:'CLONE',desc:'Spawns a phantom copy of paddle that blocks too',icon:'\u2261',cd:12,dur:3},
};

// Map enemy IDs to their ability (F/E = none)
const ENEMY_ABIL_MAP={
  basic:'none',sleepy:'none',wide:'none',stubborn:'none',
  fast:'dash',jitter:'dash',
  tricky:'spin',mimic:'spin',
  ghost:'blink',blinker:'blink',
  tank:'bulk',jugg:'accel',
  sniper:'pull',hunter:'lightning',
  accel:'clone',warden:'lightning',
  apex:'voidpulse',void:'rampage',
};
function getEnemyAbil(enemyId){return E_ABILS[ENEMY_ABIL_MAP[enemyId]||'none']||E_ABILS.none;}

const E_UPS=[
  {id:'ef',name:'FASTER',desc:'Enemy speed +20%',icon:'\u00BB',fn:g=>{g.aiSpd*=1.2;}},
  {id:'es',name:'SMARTER',desc:'Enemy react +15%',icon:'\u25C6',fn:g=>{g.aiReact=Math.min(g.aiReact*1.15,.96);}},
  {id:'eb',name:'BALL SPD+',desc:'Ball base +8%',icon:'\u25CF',fn:g=>{g.bs*=1.08;}},
  {id:'ea',name:'AGGRO',desc:'Sharper returns',icon:'\u2220',fn:g=>{g.trickAng=true;}},
  {id:'eg',name:'GHOST',desc:'Enemy flickers invisible',icon:'?',fn:g=>{g.cfg.ghost=true;}},
];

// ═══ UPGRADE POOL (stat + ability upgrades) ═══
// type: 'stat' = number tweak, 'ability' = new passive mechanic
const ALL_CARDS=[
  // COMMON (stat)
  {id:'wider',name:'WIDE PADDLE',desc:'+30% paddle size',tier:'common',type:'stat',fn:s=>{s.ph*=1.3;}},
  {id:'swift',name:'QUICK FEET',desc:'+30% paddle speed',tier:'common',type:'stat',fn:s=>{s.pSpd*=1.3;}},
  {id:'heavy',name:'HEAVY BALL',desc:'+20% ball speed, enemy AI -15%',tier:'common',type:'stat',fn:s=>{s.bs*=1.2;s.aiMod*=.85;}},
  // UNCOMMON (stat + light ability)
  {id:'life',name:'EXTRA LIFE',desc:'+1 life',tier:'uncommon',type:'stat',fn:s=>{s.lives++;}},
  {id:'cd',name:'FAST CHARGE',desc:'-35% ability cooldown',tier:'uncommon',type:'stat',fn:s=>{s.cdMul*=.65;}},
  {id:'edge',name:'EDGE MASTER',desc:'Outer paddle hits send extreme angles',tier:'uncommon',type:'ability',fn:s=>{s.edge=true;}},
  {id:'reach',name:'LONG REACH',desc:'+50% horizontal paddle movement range',tier:'uncommon',type:'stat',fn:s=>{s.horizMul*=1.5;}},
  {id:'bounceback',name:'SNAPBACK',desc:'Ball speeds up 15% each time it bounces off a wall',tier:'uncommon',type:'ability',fn:s=>{s.rico=true;}},
  // RARE (strong stat + abilities)
  {id:'shield',name:'SAFETY NET',desc:'Auto-block your first missed ball each wave',tier:'rare',type:'ability',fn:s=>{s.shields++;}},
  {id:'freeze',name:'FREEZE FRAME',desc:'Enemy paddle freezes 0.8s every time you hit the ball',tier:'rare',type:'ability',fn:s=>{s.freeze=true;}},
  {id:'siphon',name:'SIPHON',desc:'Enemy AI gets 5% worse every time you score',tier:'rare',type:'ability',fn:s=>{s.siphon=true;}},
  {id:'turbo',name:'ADRENALINE',desc:'+40% paddle speed, +15% ball speed',tier:'rare',type:'stat',fn:s=>{s.pSpd*=1.4;s.bs*=1.15;}},
  {id:'fort',name:'IRON WILL',desc:'+2 lives, +10% paddle size',tier:'rare',type:'stat',fn:s=>{s.lives+=2;s.ph*=1.1;}},
  // EPIC (powerful abilities)
  {id:'magnet',name:'MAGNETISM',desc:'Ball curves toward your paddle when heading your way',tier:'epic',type:'ability',fn:s=>{s.magnet=true;}},
  {id:'double',name:'DOUBLE OR NOTHING',desc:'Every goal scores 2 points instead of 1',tier:'epic',type:'ability',fn:s=>{s.dblScore=true;}},
  {id:'vampire',name:'VAMPIRE',desc:'Heal 1 life every time you score a goal',tier:'epic',type:'ability',fn:s=>{s.vampire=true;}},
  {id:'afterimg',name:'AFTERIMAGE',desc:'A delayed ghost ball follows and scores separately',tier:'epic',type:'ability',fn:s=>{s.afterimage=true;}},
  {id:'shockwave',name:'TREMOR',desc:'Every hit pushes enemy paddle away from the ball',tier:'epic',type:'ability',fn:s=>{s.shockwave=true;}},
  {id:'gravity2',name:'DEAD ZONE',desc:'Ball constantly drifts toward the enemy goal',tier:'epic',type:'ability',fn:s=>{s.singularity=true;}},
  // LEGENDARY
  {id:'homing',name:'HUNTER BALL',desc:'Ball curves toward gaps in enemy defense',tier:'legendary',type:'ability',fn:s=>{s.homing=true;}},
  {id:'timewarp',name:'TIME WARP',desc:'Ball slows down near enemy, speeds up near you',tier:'legendary',type:'ability',fn:s=>{s.timewarp=true;}},
  {id:'multicast',name:'ECHO CAST',desc:'Your paddle ability triggers twice per use',tier:'legendary',type:'ability',fn:s=>{s.multicast=true;}},
  {id:'unstop',name:'JUGGERNAUT',desc:'+3 lives, +30% paddle, +30% speed, +15% ball',tier:'legendary',type:'stat',fn:s=>{s.lives+=3;s.ph*=1.3;s.pSpd*=1.3;s.bs*=1.15;}},
  {id:'sec_mirror',name:'MIRROR MATCH',desc:'Enemy copies YOUR position with a 0.4s delay. Fake them out.',tier:'legendary',type:'ability',fn:s=>{s.mirrorMatch=true;}},
  // MYTHICAL (game-changing)
  {id:'godmode',name:'TRANSCENDENCE',desc:'Ball phases through enemy paddle. Every hit scores.',tier:'mythical',type:'ability',fn:s=>{s.transcend=true;}},
  {id:'clone',name:'DOPPELGANGER',desc:'A phantom paddle mirrors you on the right side',tier:'mythical',type:'ability',fn:s=>{s.doppel=true;}},
  {id:'immortal',name:'UNDYING',desc:'+5 lives, auto-block first miss each wave',tier:'mythical',type:'stat',fn:s=>{s.lives+=5;s.shields+=1;}},
  {id:'warpspd',name:'LIGHTSPEED',desc:'Ball +50%, paddle +80%, cooldown -50%',tier:'mythical',type:'stat',fn:s=>{s.bs*=1.5;s.pSpd*=1.8;s.cdMul*=.5;}},
  {id:'sec_berserk',name:'BERSERKER',desc:'Each consecutive hit = +8% ball speed. Resets when enemy scores.',tier:'mythical',type:'ability',fn:s=>{s.berserker=true;}},
  // SECRET (combat abilities)
  {id:'sec_storm',name:'STORM CALLER',desc:'Every hit fires a stun bolt that freezes enemy paddle.',tier:'secret',type:'ability',fn:s=>{s.stormCaller=true;}},
  {id:'sec_phantom',name:'PHANTOM STRIKE',desc:'Ball teleports 20% closer to the goal on every hit.',tier:'secret',type:'ability',fn:s=>{s.phantomStrike=true;}},
  {id:'sec_over',name:'OVERCHARGE',desc:'Every 3rd consecutive hit, ball pierces through enemy paddle.',tier:'secret',type:'ability',fn:s=>{s.overcharge=true;}},
  {id:'sec_abs',name:'THE ABSOLUTE',desc:'Every secret ability combined. All stats boosted.',tier:'secret',type:'ability',fn:s=>{s.stormCaller=true;s.phantomStrike=true;s.berserker=true;s.overcharge=true;s.transcend=false;s.doppel=true;s.homing=true;s.multicast=true;s.magnet=true;s.dblScore=true;s.vampire=true;s.freeze=true;s.shockwave=true;s.edge=true;s.rico=true;s.lives+=5;s.pSpd*=1.5;s.bs*=1.1;s.cdMul*=.3;s.shields+=3;}},
  {id:'sec_master',name:'MASTER OF SKILL',desc:'Strip ALL abilities. Ball 50% faster. Your hits TRIPLE speed. Enemy hits reset. Every rally = permanent +20% base speed.',tier:'mythical',type:'ability',fn:s=>{s.masterSkill=true;s.bs*=1.5;s.freeze=false;s.afterimage=false;s.shockwave=false;s.homing=false;s.timewarp=false;s.multicast=false;s.transcend=false;s.doppel=false;s.singularity=false;s.magnet=false;s.dblScore=false;s.vampire=false;s.echoHit=false;s.voidWalk=false;s.stormCaller=false;s.phantomStrike=false;s.berserker=false;s.overcharge=false;s.cdMul=999;}},
];

function getCardsForTier(maxTier,count){
  const tierIdx=TIER_ORDER.indexOf(maxTier);
  const pool=ALL_CARDS.filter(c=>TIER_ORDER.indexOf(c.tier)<=tierIdx);
  // Weight toward higher tiers
  const weighted=[];
  pool.forEach(c=>{
    const ci=TIER_ORDER.indexOf(c.tier);
    // Higher tier = more weight at high difficulty
    const w=ci>=tierIdx?3:ci>=tierIdx-1?2:1;
    for(let i=0;i<w;i++)weighted.push(c);
  });
  const shuffled=[...weighted].sort(()=>Math.random()-.5);
  const seen=new Set();const result=[];
  for(const c of shuffled){if(!seen.has(c.id)){seen.add(c.id);result.push(c);if(result.length>=count)break;}}
  // If not enough, fill from pool
  if(result.length<count){for(const c of pool.sort(()=>Math.random()-.5)){if(!seen.has(c.id)){seen.add(c.id);result.push(c);if(result.length>=count)break;}}}
  return result;
}

function getCardsForDiff(diff,count){
  const tiers=DIFF_TIERS[diff]||['common'];
  const pool=ALL_CARDS.filter(c=>tiers.includes(c.tier));
  const weighted=[];
  const maxIdx=Math.max(...tiers.map(t=>TIER_ORDER.indexOf(t)));
  pool.forEach(c=>{
    const ci=TIER_ORDER.indexOf(c.tier);
    const w=ci>=maxIdx?4:ci>=maxIdx-1?2:1;
    for(let i=0;i<w;i++)weighted.push(c);
  });
  const shuffled=[...weighted].sort(()=>Math.random()-.5);
  const seen=new Set();const result=[];
  for(const c of shuffled){if(!seen.has(c.id)){seen.add(c.id);result.push(c);if(result.length>=count)break;}}
  if(result.length<count){for(const c of pool.sort(()=>Math.random()-.5)){if(!seen.has(c.id)){seen.add(c.id);result.push(c);if(result.length>=count)break;}}}
  return result;
}

function waveCfg(wv){
  const boss=wv>1&&wv%3===0;const rankIdx=Math.min(Math.floor(wv/1.5),DIFF_RANKS.length-1);
  const diff=boss?DIFF_RANKS[Math.min(rankIdx+1,DIFF_RANKS.length-1)]:DIFF_RANKS[rankIdx];
  let aiSpd,aiReact;
  if(rankIdx>=5){aiSpd=220+wv*30+(boss?80:0);aiReact=clamp(.25+wv*.07+(boss?.15:0),0,.97);}
  else{aiSpd=220+wv*22+(boss?50:0);aiReact=clamp(.06+wv*.025+(boss?.06:0),0,.4);}
  const eH=BASE_PAD_H;
  const pool=getEnemiesForDiff(diff);
  const enemy=pool.length>0?pool[Math.floor(Math.random()*pool.length)]:ENEMIES[0];
  const cfg={wv,boss,diff,aiSpd,aiReact,eH,enemy,trickAng:false,ghost:false,chaos:false,jitter:false};
  enemy.mod(cfg);return cfg;
}

// ═══ GAME STATE ═══
let curScreen='menu',padId='classic',wave=1,savedState=null,enemyUps=[],curCards=[],curEUp=null,curDiff=null,g=null,keysDown={},chosenOppCfg=null;

function addSparks(g,x,y,n=8,sp=120,col=null){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=30+Math.random()*sp;g.sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.15+Math.random()*.3,max:.45,col});}}

function resetBall(g,dir){g.rallyBase=g.bs;g.rallyHits=0;g.ballSpd=g.rallyBase;g.bx=GW/2;g.by=GH/2+rng(-60,60);g.bvx=0;g.bvy=0;g.pendingDir=dir;g.startPause=0.5;g.shUsed=false;g.combo=0;g.trail=[];g.curveNext=false;g.smashNext=false;g.ghostBall=false;g.ghostT=0;}

function newGame(pid,wv,sv,eUps,oppCfg){
  const pad=PADDLES.find(p=>p.id===pid);const cfg=oppCfg||waveCfg(wv);
  const am=sv?.aiMod??1,bs=sv?.bs??BASE_SPD;
  const _iDir=(Math.random()>.5?1:-1);const ng={padId:pid,pad,cfg,t:0,bx:GW/2,by:GH/2+rng(-40,40),bvx:0,bvy:0,pendingDir:_iDir,startPause:0.5,bs,rallyBase:bs,ballSpd:bs,rallyHits:0,trail:[],
    px:PX_HOME,py:GH/2,ph:sv?.ph??BASE_PAD_H*pad.hMul,pSpd:sv?.pSpd??420,horizMul:sv?.horizMul??1,ey:GH/2,eH:cfg.eH,eHBase:cfg.eH,aiSpd:cfg.aiSpd*am,aiMod:am,aiReact:cfg.aiReact,pScore:0,eScore:0,lives:sv?.lives??3,shields:sv?.shields??0,shUsed:false,cdMul:sv?.cdMul??1,
    // Abilities (passive)
    edge:sv?.edge??false,rico:sv?.rico??false,magnet:sv?.magnet??false,dblScore:sv?.dblScore??false,vampire:sv?.vampire??false,
    freeze:sv?.freeze??false,afterimage:sv?.afterimage??false,shockwave:sv?.shockwave??false,
    homing:sv?.homing??false,timewarp:sv?.timewarp??false,multicast:sv?.multicast??false,
    transcend:sv?.transcend??false,doppel:sv?.doppel??false,singularity:sv?.singularity??false,
    // Secret abilities
    aiCap:sv?.aiCap??false,triScore:sv?.triScore??false,echoHit:sv?.echoHit??false,voidWalk:sv?.voidWalk??false,
    // New secret combat abilities
    stormCaller:sv?.stormCaller??false,phantomStrike:sv?.phantomStrike??false,mirrorMatch:sv?.mirrorMatch??false,
    berserker:sv?.berserker??false,overcharge:sv?.overcharge??false,
    berserkerStacks:0,_berserkerBase:sv?.bs??BASE_SPD,mirrorBuf:[],
    // Active state
    abCD:0,curveNext:false,multiBalls:[],ghostBall:false,ghostT:0,placedWall:null,wallT:0,shrinkT:0,smashNext:false,
    freezeT:0,afterBall:null,shockT:0,
    // New paddle ability states
    foresightT:0, // Oracle: time left showing ball path
    phaseNext:false, // Phantom: next hit pierces
    blizzardT:0, // Frost: freeze everything
    thunderNext:false, // Storm: next hit spawns lightning
    bolts:[], // Storm: active lightning bolt projectiles
    gravWell:null,gravWellT:0, // Void: gravity well position + timer
    // Master of Skill state
    masterSkill:sv?.masterSkill??false,
    siphon:sv?.siphon??false,
    phaseNext:false,
    _masterBaseSpd:0, // stores speed before player hit boost
    _masterHitBoosted:false, // whether player hit boost is active
    shake:0,shX:0,shY:0,flash:0,flashCol:[1,1,1],ghostA:1,combo:0,sparks:[],hitFlash:0,scoreFlash:0,scoreFlashSide:0,chromaShift:0,
    done:false,result:null,doneT:0,trickAng:cfg.trickAng,chaos:cfg.chaos,jitter:cfg.jitter||false,
    // Enemy ability state
    eAbil:getEnemyAbil(cfg.enemy.id),eAbilCD:2,eAbilActive:0,eAbilPhase:'idle',
    // Lightning-specific: channel time, stun time, bolt coords
    ltChannel:0,ltStun:0,ltBoltX:0,ltBoltY:0,ltBolts:[],
    // Bulk-specific
    bulkT:0,bulkScale:1,
    // Pull-specific
    pullT:0,
    // Timestop-specific
    tsT:0,tsBallVx:0,tsBallVy:0,
    // Voidpulse-specific
    vpT:0,vpX:0,vpY:0,
    // Blink flash
    blinkFlash:0,
    // Spin return
    spinNext:false,spinCurveT:0,
    // Dash
    dashT:0,dashSpd:0,
    overdriveT:0,cloneT:0,cloneY:0,
    // Paddle velocity tracking (for momentum transfer)
    prevPy:GH/2,pVelY:0,
    // AI target caching (anti-jitter)
    aiTgt:GH/2,aiTgtTimer:0,aiRandOff:0,aiBallDir:0,
  };
  // Apply AI cap (secret)
  if(ng.aiCap){ng.aiReact=Math.min(ng.aiReact,.5);ng.aiSpd*=.6;}
  if(eUps)for(const eu of eUps)eu.fn(ng);
  if(ng.aiCap){ng.aiReact=Math.min(ng.aiReact,.5);ng.aiSpd=Math.min(ng.aiSpd,250);}
  return ng;
}

function saveGame(g){return{bs:g.bs,ph:g.ph,pSpd:g.pSpd,cdMul:g.cdMul,edge:g.edge,rico:g.rico,shields:g.shields,lives:g.lives,aiMod:g.aiMod,horizMul:g.horizMul,magnet:g.magnet,dblScore:g.dblScore,vampire:g.vampire,freeze:g.freeze,afterimage:g.afterimage,shockwave:g.shockwave,homing:g.homing,timewarp:g.timewarp,multicast:g.multicast,transcend:g.transcend,doppel:g.doppel,singularity:g.singularity,aiCap:g.aiCap,triScore:g.triScore,echoHit:g.echoHit,voidWalk:g.voidWalk,stormCaller:g.stormCaller,phantomStrike:g.phantomStrike,mirrorMatch:g.mirrorMatch,berserker:g.berserker,overcharge:g.overcharge,masterSkill:g.masterSkill,siphon:g.siphon};}

// ═══ UPDATE ═══
function update(dt){
  if(!g)return;if(g.done){g.doneT+=dt;return;}
  g.t+=dt;
  if(g.abCD>0)g.abCD-=dt;
  if(g.shake>0){g.shake-=dt;const i=g.shake*20;g.shX=(Math.random()-.5)*i;g.shY=(Math.random()-.5)*i;}else{g.shX=0;g.shY=0;}
  if(g.flash>0)g.flash-=dt*4;if(g.hitFlash>0)g.hitFlash-=dt*6;if(g.scoreFlash>0)g.scoreFlash-=dt*2;if(g.chromaShift>0)g.chromaShift-=dt*5;
  g.ghostA=g.cfg.ghost?.15+Math.abs(Math.sin(g.t*6))*.65:1;
  // Start-of-point pause: ball frozen, waiting to launch
  if(g.startPause>0){g.startPause-=dt;if(g.startPause<=0){const spd=g.rallyBase*Math.pow(1.05,g.rallyHits);g.ballSpd=spd;g.bvx=g.pendingDir*spd;g.bvy=rng(-160,160);}}
  if(g.ghostT>0){g.ghostT-=dt;if(g.ghostT<=0)g.ghostBall=false;}
  if(g.wallT>0){g.wallT-=dt;if(g.wallT<=0)g.placedWall=null;}
  if(g.shrinkT>0){g.shrinkT-=dt;}
  if(g.freezeT>0){g.freezeT-=dt;}
  if(g.shockT>0)g.shockT-=dt;
  // Compute enemy paddle height: shrink halves, bulk grows slightly, all capped
  if(g.shrinkT>0)g.eH=g.eHBase*.5;
  else if(g.bulkT>0)g.eH=g.eHBase*1.4;
  else g.eH=g.eHBase;
  g.eH=Math.min(g.eH,BASE_PAD_H*1.4); // hard cap so paddle never gets huge
  for(let i=g.sparks.length-1;i>=0;i--){const p=g.sparks[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy*=.92;p.life-=dt;if(p.life<=0)g.sparks.splice(i,1);}

  // New ability timers
  if(g.foresightT>0)g.foresightT-=dt;
  if(g.blizzardT>0)g.blizzardT-=dt;
  if(g.gravWellT>0){g.gravWellT-=dt;if(g.gravWellT<=0)g.gravWell=null;}
  // Gravity well: direction-based behavior
  if(g.gravWell&&g.gravWellT>0){
    const dx=g.gravWell.x-g.bx,dy=g.gravWell.y-g.by;
    const dist=Math.max(Math.hypot(dx,dy),15);
    if(g.bvx<0){
      // Ball heading toward player: strong pull to loop ball around well
      const force=3200/(dist+30);
      g.bvx+=dx/dist*force*dt;g.bvy+=dy/dist*force*dt;
      // If ball passes through well center, push it right (toward enemy)
      if(dist<20){g.bvx=Math.abs(g.bvx)+100*dt;}
    }else{
      // Ball heading toward enemy: curve it to dodge enemy paddle
      const force=1800/(dist+40);
      // Perpendicular deflection (curve around enemy, not straight into them)
      const perp=g.by<g.ey?-1:1;
      g.bvy+=perp*force*dt*0.7;
      g.bvx+=dx/dist*force*dt*0.3;
      // Prevent vertical sticking: if ball is too vertical, push horizontal
      const ratio=Math.abs(g.bvy)/(Math.abs(g.bvx)+1);
      if(ratio>3)g.bvx+=Math.sign(g.bvx)*200*dt;
    }
  }
  // Lightning bolts (Storm): move toward enemy, STUN on contact (never score directly)
  for(let i=g.bolts.length-1;i>=0;i--){
    const b=g.bolts[i];b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
    b.trail.push({x:b.x,y:b.y});if(b.trail.length>8)b.trail.shift();
    // Zigzag
    b.zig-=dt;if(b.zig<=0){b.zig=.12+Math.random()*.1;b.vy=(Math.random()-.5)*250;}
    if(b.y<10){b.y=10;b.vy=Math.abs(b.vy);}
    if(b.y>GH-10){b.y=GH-10;b.vy=-Math.abs(b.vy);}
    // Hit enemy paddle = STUN it (freeze for 0.7s), not score
    if(b.x>EX-PAD_W/2-4&&b.x<EX+PAD_W/2+4&&b.y>g.ey-g.eH/2-4&&b.y<g.ey+g.eH/2+4){
      g.freezeT=Math.max(g.freezeT,0.7);
      g.shake=.08;g.flash=.12;g.flashCol=[1,.93,.27];
      addSparks(g,EX,g.ey,14,100,[1,.93,.27]);
      tone(400,.06,'square',.04);tone(200,.1,'square',.03,30);
      g.bolts.splice(i,1);continue;
    }
    // Fizzle out at edges (never score)
    if(b.x>GW||b.x<0||b.life<=0){g.bolts.splice(i,1);}
  }

  // Mirror Match (secret): enemy copies player Y with 0.4s delay
  if(g.mirrorMatch){
    g.mirrorBuf.push({t:g.t,y:g.py});
    while(g.mirrorBuf.length>0&&g.mirrorBuf[0].t<g.t-.4)g.mirrorBuf.shift();
    if(g.mirrorBuf.length>0)g._mirrorY=g.mirrorBuf[0].y;
  }
  // Berserker: reset stacks when enemy scores (handled in scoring section)

  const rallyMul=Math.pow(1.05,g.rallyHits);g.ballSpd=g.rallyBase*rallyMul;

  // Time warp: ball speed modifier based on x position
  let twMul=1;
  if(g.timewarp){
    const nx=g.bx/GW; // 0=left, 1=right
    if(g.bvx>0)twMul=lerp(1.15,0.7,nx); // speeds near player, slows near enemy
    else twMul=lerp(0.75,1.2,nx);
  }
  // Blizzard: slow ball in enemy half
  if(g.blizzardT>0&&g.bx>GW*.4)twMul*=0.3;

  // Player - compute velocity from last frame position
  const sp=g.pSpd,hMax=HORIZ*g.horizMul;
  if(keysDown['w']||keysDown['arrowup'])g.py-=sp*dt;
  if(keysDown['s']||keysDown['arrowdown'])g.py+=sp*dt;
  // VoidWalk: paddle teleports toward ball
  if(g.voidWalk&&g.bvx<0){g.py=lerp(g.py,g.by,dt*12);}
  g.py=clamp(g.py,g.ph/2,GH-g.ph/2);
  if(keysDown['a']||keysDown['arrowleft'])g.px-=sp*.55*dt;
  if(keysDown['d']||keysDown['arrowright'])g.px+=sp*.55*dt;
  if(!keysDown['a']&&!keysDown['arrowleft']&&!keysDown['d']&&!keysDown['arrowright'])g.px=lerp(g.px,PX_HOME,dt*4);
  g.px=clamp(g.px,PX_HOME-hMax,PX_HOME+hMax);
  // Track paddle velocity for momentum transfer on hit
  g.pVelY=(g.py-g.prevPy)/Math.max(dt,0.001);
  g.prevPy=g.py;

  // Ball movement with time warp (skip during timestop/lightning stun)
  const ballFrozen=g.tsT>0||g.eAbilPhase==='strike'||g.startPause>0;
  if(!ballFrozen){g.trail.push({x:g.bx,y:g.by});if(g.trail.length>TRAIL)g.trail.shift();}

  if(!ballFrozen){
    g.bx+=g.bvx*dt*twMul;g.by+=g.bvy*dt*twMul;
    if(g.curveNext&&g.bvx>0){g.bvy+=Math.sign(g.bvy||1)*320*dt;g.bvy=clamp(g.bvy,-g.ballSpd*1.8,g.ballSpd*1.8);}
    if(g.magnet&&g.bvx<0)g.bvy+=Math.sign(g.py-g.by)*45*dt;
    // Homing: drift toward gap in enemy defense
    if(g.homing&&g.bvx>0&&g.bx>GW*.4){
      const gap=g.by<g.ey?g.ey-g.eH/2-20:g.ey+g.eH/2+20;
      g.bvy+=Math.sign(gap-g.by)*60*dt;
    }
    // Singularity: pull toward enemy goal
    if(g.singularity&&g.bvx>0){g.bvx+=50*dt;g.bvy*=.998;}
  }

  const bs2=BALL_SZ/2,col=PCOL[g.padId];
  if(g.by-bs2<0){g.by=bs2;g.bvy=Math.abs(g.bvy);SFX.wall();addSparks(g,g.bx,0,4,60,col.t);ricoB(g);}
  if(g.by+bs2>GH){g.by=GH-bs2;g.bvy=-Math.abs(g.bvy);SFX.wall();addSparks(g,g.bx,GH,4,60,col.t);ricoB(g);}
  if(g.placedWall){const w=g.placedWall,wW=8,wH=60;if(g.bx+bs2>w.x-wW/2&&g.bx-bs2<w.x+wW/2&&g.by+bs2>w.y-wH/2&&g.by-bs2<w.y+wH/2){g.bvx=-g.bvx;g.bx=g.bvx>0?w.x+wW/2+bs2+1:w.x-wW/2-bs2-1;SFX.wall();addSparks(g,g.bx,g.by,10,80,col.t);}}

  const cs=Math.hypot(g.bvx,g.bvy);
  // Only normalize when no ability is actively warping ball physics
  const skipNorm=g.tsT>0||g.eAbilPhase==='strike'||g.pullT>0||g.spinCurveT>0;
  if(!skipNorm&&cs>1){const maxSpd=g.ballSpd*2.8;if(cs>maxSpd){const r=maxSpd/cs;g.bvx*=r;g.bvy*=r;}else{const r=lerp(1,g.ballSpd/cs,dt*5);g.bvx*=r;g.bvy*=r;}}

  // Player hit
  if(g.bvx<0){
    const pL=g.px-PAD_W/2-2,pR=g.px+PAD_W/2+2,pT=g.py-g.ph/2,pB=g.py+g.ph/2;
    if(!(g.bx-bs2>pR||g.bx+bs2<pL||g.by+bs2<pT||g.by-bs2>pB)){
      let spd=g.ballSpd*1.03;
      let piercing=false;
      if(g.smashNext){spd=g.ballSpd*2.5;g.smashNext=false;g.shake=.25;g.chromaShift=1.2;addSparks(g,g.px+PAD_W,g.by,28,220,col.t);g.flash=.4;g.flashCol=col.t;SFX.smash();piercing=true;}
      if(g.transcend)piercing=true;
      if(g.phaseNext){g.phaseNext=false;piercing=true;g.shake=.12;g.chromaShift=.5;g.flash=.2;g.flashCol=[.8,.53,1];addSparks(g,g.bx,g.by,16,120,[.8,.53,1]);tone(700,.06,'sine',.04);}
      // Flat wall reflection: reverse horizontal, preserve vertical
      g.bvx=Math.abs(g.bvx);
      // Transfer paddle velocity to ball (the only thing that changes vertical direction)
      g.bvy+=clamp(g.pVelY*0.45,-spd*0.7,spd*0.7);
      // Edge master upgrade: add extra angle kick at paddle edges
      if(g.edge){const rel=clamp((g.by-g.py)/(g.ph/2),-1,1);if(Math.abs(rel)>.6)g.bvy+=rel*spd*0.4;}
      // Normalize to target speed
      const curSpd=Math.hypot(g.bvx,g.bvy);
      if(curSpd>0.1){const r=spd/curSpd;g.bvx*=r;g.bvy*=r;}
      // Ensure bvx always points right (away from player)
      g.bvx=Math.abs(g.bvx);
      // Clamp bvy so ball doesn't go near-vertical
      const maxVy=spd*0.92;
      if(Math.abs(g.bvy)>maxVy){g.bvy=Math.sign(g.bvy)*maxVy;g.bvx=Math.sqrt(spd*spd-g.bvy*g.bvy);}
      g.bx=pR+bs2+1;
      const finalAng=Math.atan2(g.bvy,g.bvx); // used by afterimage
      g.combo++;g.rallyHits++;g.flash=Math.max(g.flash,.18);g.hitFlash=1;g.shake=Math.max(g.shake,.03);
      SFX.paddle();addSparks(g,g.px+PAD_W/2,g.by,5,80,col.t);
      // Master of Skill: your hit = triple ball speed, every rally hit = +20% base permanently
      if(g.masterSkill){
        g._masterBaseSpd=g.ballSpd;g._masterHitBoosted=true;
        g.bs*=1.2; // permanent 20% base increase per rally hit
        const boosted=g.ballSpd*3;
        g.bvx=Math.sign(g.bvx)*Math.abs(g.bvx)/Math.hypot(g.bvx,g.bvy)*boosted;
        g.bvy=g.bvy/Math.hypot(g.bvx,g.bvy)*boosted;
        g.shake=Math.max(g.shake,.1);g.chromaShift=Math.max(g.chromaShift,.3);
      }
      // Freeze
      if(g.freeze)g.freezeT=0.8;
      // Shockwave
      if(g.shockwave){const push=(g.by<g.ey)?-60:60;g.ey+=push;g.shockT=0.3;addSparks(g,EX,g.ey,8,100,[1,.5,.2]);}
      // Echo hit (secret): spawn 2 multi balls every hit
      if(g.echoHit){for(let i=0;i<2;i++){const eAng=(i===0?1:-1)*(Math.PI*(.2+Math.random()*.2));const eSpd=Math.hypot(g.bvx,g.bvy)*.9;const ba=Math.atan2(g.bvy,g.bvx);g.multiBalls.push({x:g.bx,y:g.by,vx:Math.cos(ba+eAng)*eSpd,vy:Math.sin(ba+eAng)*eSpd,life:3,trail:[]});}addSparks(g,g.bx,g.by,10,80,col.t);}
      // Afterimage
      if(g.afterimage){
        const aSpd=spd*.85;const aAng=finalAng+(Math.random()-.5)*.3;
        g.afterBall={x:g.bx,y:g.by,vx:Math.abs(Math.cos(aAng)*aSpd),vy:Math.sin(aAng)*aSpd,life:2.5,trail:[]};
      }
      // Thunder: spawn 1 stun bolt on hit (stuns enemy paddle, doesn't score)
      if(g.thunderNext){
        g.thunderNext=false;
        const bSpd=g.ballSpd*1.5;
        g.bolts.push({x:g.bx,y:g.by,vx:bSpd,vy:rng(-100,100),life:4,trail:[],zig:.12});
        g.shake=.08;g.flash=.15;g.flashCol=[1,.93,.27];g.chromaShift=.3;
        addSparks(g,g.bx,g.by,12,120,[1,.93,.27]);
        tone(100,.1,'sawtooth',.06);tone(250,.06,'square',.04,30);
      }
      // Storm Caller (secret): 1 stun bolt on every hit
      if(g.stormCaller){
        const bSpd=g.ballSpd*1.4;
        g.bolts.push({x:g.bx,y:g.by,vx:bSpd,vy:rng(-120,120),life:4,trail:[],zig:.12});
        addSparks(g,g.bx,g.by,6,80,[1,.93,.27]);
      }
      // Phantom Strike (secret): ball teleports 20% closer to goal on hit
      if(g.phantomStrike&&g.bvx>0){
        const jump=(GW-g.bx)*0.2;
        g.bx+=jump;
        addSparks(g,g.bx,g.by,8,60,col.t);
      }
      // Berserker (secret): each consecutive hit makes ball faster
      if(g.berserker){
        g.berserkerStacks=(g.berserkerStacks||0)+1;
        g.bs=g._berserkerBase*(1+g.berserkerStacks*0.08);
        g.ballSpd=g.bs*Math.pow(1.05,g.rallyHits);
      }
      // Overcharge (secret): every 3rd consecutive hit, ball pierces
      if(g.overcharge){
        if(g.combo>0&&g.combo%3===0){
          piercing=true;g._pierce=true;
          g.shake=.1;g.chromaShift=.5;g.flash=.2;g.flashCol=[.8,.4,1];
          addSparks(g,g.bx,g.by,16,140,[.8,.4,1]);
          tone(600,.06,'square',.04);tone(900,.08,'square',.03,30);
        }
      }
      // Set piercing flag on ball
      g._pierce=piercing;
    }
  }
  if(g.curveNext&&g.bx>GW*.65)g.curveNext=false;

  // Enemy hit
  const canBlock=g.freezeT<=0;
  if(g.bvx>0&&g.bx+bs2>EX-PAD_W/2-2&&g.bx-bs2<EX+PAD_W/2+2&&g.by+bs2>g.ey-g.eH/2&&g.by-bs2<g.ey+g.eH/2&&canBlock){
    if(!g._pierce){
      const rel=clamp((g.by-g.ey)/(g.eH/2),-1,1);const am=g.trickAng?.45:.35;
      g.bvx=-Math.abs(Math.cos(rel*Math.PI*am)*g.ballSpd);g.bvy=Math.sin(rel*Math.PI*am)*g.ballSpd;
      g.bx=EX-PAD_W/2-bs2-2;g.combo=0;g.rallyHits++;
      if(g.chaos)g.bs=Math.min(g.bs*1.04,600);
      SFX.paddle();g.shake=.02;addSparks(g,EX-PAD_W/2,g.by,4,60);
      // Master of Skill: enemy hit resets ball to base speed, +20% base permanently
      if(g.masterSkill&&g._masterHitBoosted){
        g._masterHitBoosted=false;
        g.bs*=1.2; // permanent 20% base increase per rally hit
        const resetSpd=g.bs*Math.pow(1.05,g.rallyHits);
        const cur=Math.hypot(g.bvx,g.bvy);
        if(cur>0.1){const r=resetSpd/cur;g.bvx*=r;g.bvy*=r;}
      }
      // Spin return: if queued, apply curve to the return
      if(g.spinNext){g.spinNext=false;g.spinCurveT=.6;g._spinDir=Math.random()>.5?1:-1;addSparks(g,EX,g.by,6,50,[.8,.8,.3]);}
    }
  }
  g._pierce=false;

  // Doppelganger (phantom paddle on right)
  if(g.doppel&&g.bvx>0){
    const dpX=EX-60,dpT=g.py-g.ph*.4,dpB=g.py+g.ph*.4;
    if(g.bx+bs2>dpX-PAD_W/2&&g.bx-bs2<dpX+PAD_W/2&&g.by>dpT&&g.by<dpB&&g.bx<GW*.75){
      g.bvx=-Math.abs(g.bvx);g.bx=dpX-PAD_W/2-bs2-1;addSparks(g,dpX,g.by,6,60,col.t);SFX.paddle();
    }
  }

  // Clone (enemy ability) - second enemy paddle
  if(g.cloneT>0&&g.bvx>0){
    const clX=EX-35;
    if(g.bx+bs2>clX-PAD_W/2-2&&g.bx-bs2<clX+PAD_W/2+2&&g.by+bs2>g.cloneY-g.eH/2&&g.by-bs2<g.cloneY+g.eH/2){
      g.bvx=-Math.abs(g.bvx);g.bx=clX-PAD_W/2-bs2-2;
      SFX.paddle();addSparks(g,clX-PAD_W/2,g.by,4,40,[.5,.5,1]);
    }
  }

  // After-image ball
  if(g.afterBall){
    const ab=g.afterBall;ab.life-=dt;ab.x+=ab.vx*dt;ab.y+=ab.vy*dt;
    ab.trail.push({x:ab.x,y:ab.y});if(ab.trail.length>6)ab.trail.shift();
    if(ab.y-bs2<0){ab.y=bs2;ab.vy=Math.abs(ab.vy);}
    if(ab.y+bs2>GH){ab.y=GH-bs2;ab.vy=-Math.abs(ab.vy);}
    if(ab.x+bs2>GW){g.pScore+=1;g.shake=.04;SFX.score();addSparks(g,GW,ab.y,6,80,[.6,.4,1]);g.scoreFlash=.5;g.scoreFlashSide=1;if(g.pScore>=PTS_WIN){g.done=true;g.result='win';}g.afterBall=null;}
    else if(ab.x-bs2<0||ab.life<=0)g.afterBall=null;
  }

  // Multi balls
  for(let i=g.multiBalls.length-1;i>=0;i--){const mb=g.multiBalls[i];mb.life-=dt;mb.x+=mb.vx*dt;mb.y+=mb.vy*dt;mb.trail.push({x:mb.x,y:mb.y});if(mb.trail.length>6)mb.trail.shift();if(mb.y-bs2<0){mb.y=bs2;mb.vy=Math.abs(mb.vy);}if(mb.y+bs2>GH){mb.y=GH-bs2;mb.vy=-Math.abs(mb.vy);}
    // Score right (player scores)
    if(mb.x+bs2>GW){g.pScore+=g.triScore?3:g.dblScore?2:1;g.shake=.06;SFX.score();addSparks(g,GW,mb.y,10,100,[.4,1,.5]);g.scoreFlash=1;g.scoreFlashSide=1;if(g.vampire&&g.lives<6)g.lives++;if(g.pScore>=PTS_WIN){g.done=true;g.result='win';}g.multiBalls.splice(i,1);continue;}
    // Score left (enemy scores - rampage balls)
    if(mb.x-bs2<0&&mb.vx<0){g.eScore++;g.shake=.15;SFX.miss();addSparks(g,0,mb.y,10,80,[1,.3,.3]);g.scoreFlash=.5;g.scoreFlashSide=-1;g.flash=.2;g.flashCol=[1,.2,.2];if(g.eScore>=PTS_WIN){g.done=true;g.result='lose';g.lives--;}g.multiBalls.splice(i,1);continue;}
    if(mb.life<=0){g.multiBalls.splice(i,1);continue;}
    // Enemy paddle blocks rightward balls
    if(mb.vx>0&&mb.x+bs2>EX-PAD_W/2&&mb.x-bs2<EX+PAD_W/2&&mb.y+bs2>g.ey-g.eH/2&&mb.y-bs2<g.ey+g.eH/2){mb.vx=-Math.abs(mb.vx);mb.x=EX-PAD_W/2-bs2-1;}
    // Player paddle blocks leftward balls
    if(mb.vx<0&&mb.x-bs2<g.px+PAD_W/2+2&&mb.x+bs2>g.px-PAD_W/2-2&&mb.y+bs2>g.py-g.ph/2&&mb.y-bs2<g.py+g.ph/2){mb.vx=Math.abs(mb.vx);mb.x=g.px+PAD_W/2+bs2+1;SFX.paddle();addSparks(g,g.px+PAD_W/2,mb.y,4,40,col.t);}
  }

  // Scoring
  if(g.bx-bs2<0){
    if(g.shields>0&&!g.shUsed){g.shUsed=true;g.shields--;SFX.paddle();addSparks(g,20,g.by,18,140,[.5,.7,1]);resetBall(g,1);}
    else{g.eScore++;g.shake=.24;g.chromaShift=.7;SFX.miss();addSparks(g,0,g.by,16,120,[1,.3,.3]);g.scoreFlash=1;g.scoreFlashSide=-1;g.flash=.3;g.flashCol=[1,.2,.2];
      // Berserker: reset stacks on enemy score
      if(g.berserker){g.berserkerStacks=0;g.bs=g._berserkerBase;g.ballSpd=g.bs;}
      if(g.eScore>=PTS_WIN){g.done=true;g.result='lose';g.lives--;}else resetBall(g,1);}}
  if(g.bx+bs2>GW){g.pScore+=g.triScore?3:g.dblScore?2:1;g.shake=.12;SFX.score();addSparks(g,GW,g.by,16,120,[.4,1,.5]);g.scoreFlash=1;g.scoreFlashSide=1;g.flash=.2;g.flashCol=[.4,1,.5];if(g.vampire&&g.lives<6)g.lives++;
    if(g.siphon){g.aiReact=Math.max(g.aiReact*0.95,0.02);g.aiSpd=Math.max(g.aiSpd*0.97,80);}
    if(g.pScore>=PTS_WIN){g.done=true;g.result='win';}else resetBall(g,-1);}

  // AI (frozen = no move, but not during lightning channel)
  const eLtChanneling=g.eAbil.id==='lightning'&&g.eAbilPhase==='channel';
  if(g.freezeT<=0&&!eLtChanneling){
    let tgt=GH/2;
    // Detect ball direction change - reset target immediately
    const ballDir=g.bvx>0?1:g.bvx<0?-1:0;
    if(ballDir!==g.aiBallDir){g.aiBallDir=ballDir;g.aiTgtTimer=0;}
    // Update AI target on a timer instead of every frame (prevents jitter)
    g.aiTgtTimer-=dt;
    if(g.aiTgtTimer<=0){
      g.aiTgtTimer=0.12+Math.random()*0.06; // recompute every ~120-180ms
      if(g.bvx>0&&!g.ghostBall){
        const perf=simBallY(g.bx,g.by,g.bvx,g.bvy,EX);
        g.aiRandOff=(1-g.aiReact)*40*(Math.random()-.5);
        g.aiTgt=lerp(g.by,perf,g.aiReact)+g.aiRandOff;
      }else if(g.ghostBall&&g.bvx>0){
        g.aiTgt=GH/2+Math.sin(g.t*2.5)*130;
      }else{
        // Ball heading away: drift smoothly toward center, not snap
        g.aiTgt=lerp(g.aiTgt,GH/2,0.15);
      }
      g.aiTgt=clamp(g.aiTgt,g.eH/2,GH-g.eH/2);
    }
    tgt=g.aiTgt;
    // Mirror Match (secret): enemy copies player Y with delay
    if(g.mirrorMatch&&g._mirrorY!==undefined)tgt=g._mirrorY;
    tgt=clamp(tgt,g.eH/2,GH-g.eH/2);const diff=tgt-g.ey;
    // Dash override
    const curAiSpd=g.dashT>0?g.dashSpd:g.aiSpd;
    // Dead zone prevents micro-jitter when near target
    if(Math.abs(diff)>2){
      g.ey+=Math.sign(diff)*Math.min(Math.abs(diff),curAiSpd*dt);
    }
    // Jitter effect
    if(g.jitter)g.ey+=Math.sin(g.t*18)*2.5;
    g.ey=clamp(g.ey,g.eH/2,GH-g.eH/2);
  }

  // ═══ ENEMY ABILITY SYSTEM ═══
  if(g.eAbil.id!=='none'){
    // Cooldown tick
    if(g.eAbilCD>0)g.eAbilCD-=dt;
    if(g.dashT>0)g.dashT-=dt;
    if(g.blinkFlash>0)g.blinkFlash-=dt*4;
    if(g.bulkT>0){g.bulkT-=dt;}
    if(g.overdriveT>0){g.overdriveT-=dt;g.ballSpd=g.bs*Math.pow(1.05,g.rallyHits)*2;if(g.overdriveT<=0)g.ballSpd=g.bs*Math.pow(1.05,g.rallyHits);}
    if(g.cloneT>0){g.cloneT-=dt;g.cloneY=lerp(g.cloneY,g.by,dt*3);g.cloneY=clamp(g.cloneY,g.eH/2,GH-g.eH/2);}
    if(g.spinCurveT>0){g.spinCurveT-=dt;const ease=g.spinCurveT/.6;g.bvy+=g._spinDir*280*ease*dt;g.bvy=clamp(g.bvy,-g.ballSpd*1.5,g.ballSpd*1.5);}

    // Pull active - decelerates ball and curves toward enemy
    if(g.pullT>0){
      g.pullT-=dt;
      if(g.bvx>0)g.bvx-=200*dt; // decelerate if going toward enemy
      g.bvx-=40*dt; // gentle constant pull leftward
      g.bvx=Math.max(g.bvx,-g.ballSpd*1.2); // cap leftward speed
      const pullY=g.ey-g.by;g.bvy+=Math.sign(pullY)*35*dt; // slight vertical pull
    }

    // Timestop active
    if(g.tsT>0){
      g.tsT-=dt;
      g.bvx=0;g.bvy=0; // ball frozen
      if(g.tsT<=0){
        // Release: ball continues with stored velocity
        g.bvx=g.tsBallVx;g.bvy=g.tsBallVy;
      }
    }

    // Voidpulse active
    if(g.vpT>0){g.vpT-=dt;}

    // Lightning phases
    if(g.eAbilPhase==='channel'){
      g.ltChannel-=dt;
      // Generate crackling bolt segments
      if(Math.random()<dt*30){
        const bx=g.bx,by=g.by;const segs=[];let lx=EX,ly=g.ey;
        for(let i=0;i<8;i++){const nx=lerp(lx,bx,(i+1)/8)+(Math.random()-.5)*40;const ny=lerp(ly,by,(i+1)/8)+(Math.random()-.5)*30;segs.push({x1:lx,y1:ly,x2:nx,y2:ny});lx=nx;ly=ny;}
        g.ltBolts.push({segs,life:.12});g.ltBoltX=bx;g.ltBoltY=by;
      }
      if(g.ltChannel<=0){
        // STRIKE: stun ball and launch at player
        g.eAbilPhase='strike';g.ltStun=.5;
        // Generate massive bolt on impact
        const segs=[];let lx=EX,ly=g.ey;
        for(let i=0;i<12;i++){const nx=lerp(lx,g.bx,(i+1)/12)+(Math.random()-.5)*25;const ny=lerp(ly,g.by,(i+1)/12)+(Math.random()-.5)*20;segs.push({x1:lx,y1:ly,x2:nx,y2:ny});lx=nx;ly=ny;}
        g.ltBolts.push({segs,life:.35});
        g.shake=.2;g.flash=.3;g.flashCol=[.5,.6,1];g.chromaShift=.6;
        addSparks(g,g.bx,g.by,24,200,[.5,.6,1]);
        tone(180,.15,'sawtooth',.08);tone(90,.25,'sawtooth',.06,60);
        // Store ball pos for stun
        g.ltBoltX=g.bx;g.ltBoltY=g.by;
      }
    }
    if(g.eAbilPhase==='strike'){
      g.ltStun-=dt;
      // Ball fully stunned - zero velocity, position jitters
      g.bvx=0;g.bvy=0;
      if(g.ltStun<=0){
        // LAUNCH: ball flies at player with insane momentum
        const launchSpd=g.ballSpd*2.5;
        const spread=rng(-.5,.5);
        g.bvx=-launchSpd*Math.cos(spread);
        g.bvy=launchSpd*Math.sin(spread);
        g.eAbilPhase='idle';
        g.shake=.2;addSparks(g,g.bx,g.by,20,180,[.6,.7,1]);
        tone(600,.06,'square',.05);tone(300,.1,'square',.04,40);
      }
    }

    // Bolt lifetime decay
    for(let i=g.ltBolts.length-1;i>=0;i--){g.ltBolts[i].life-=dt;if(g.ltBolts[i].life<=0)g.ltBolts.splice(i,1);}

    // ── AI DECIDES WHEN TO USE ABILITY ──
    if(g.eAbilCD<=0&&g.eAbilPhase==='idle'){
      const ab=g.eAbil;const ballApproaching=g.bvx>0&&g.bx>GW*.3;
      const ballClose=g.bvx>0&&g.bx>GW*.55;
      const ballFar=g.bx<GW*.4;
      let shouldCast=false;

      switch(ab.id){
        case'dash':
          // Dash only when ball is close AND enemy is far from where ball will land
          if(ballClose&&Math.abs(g.ey-g.by)>g.eH*0.8){shouldCast=true;}
          break;
        case'spin':
          // Queue spin when enemy is about to hit ball (ball very close to paddle)
          if(g.bvx>0&&g.bx>GW*.7&&Math.abs(g.by-g.ey)<g.eH){g.spinNext=true;shouldCast=true;}
          break;
        case'blink':
          // Blink when ball is about to score and they can't reach it
          if(g.bvx>0&&g.bx>GW*.6&&Math.abs(g.ey-g.by)>g.eH*0.7){shouldCast=true;}
          break;
        case'bulk':
          // Bulk up when ball is heading toward them at mid range
          if(ballApproaching&&g.bx>GW*.45&&g.bx<GW*.7){shouldCast=true;}
          break;
        case'pull':
          // Pull when ball has passed them and is heading toward their goal
          if(g.bvx>0&&g.bx>GW*.75){shouldCast=true;}
          break;
        case'lightning':
          // Channel when ball is safely on player side heading away
          if(g.bvx<0&&g.bx<GW*.35){shouldCast=true;}
          break;
        case'voidpulse':
          // Void pulse when ball is very close and about to pass them
          if(g.bvx>0&&g.bx>GW*.7&&Math.abs(g.by-g.ey)<g.eH*1.5){shouldCast=true;}
          break;
        case'rampage':
          // Fire rampage when ball is heading toward player (safe to attack)
          if(g.bvx<0&&g.bx<GW*.4){shouldCast=true;}
          break;
        case'accel':
          // Overdrive when ball is heading toward player
          if(g.bvx<0&&g.bx<GW*.5){shouldCast=true;}
          break;
        case'clone':
          // Clone when ball is heading toward them
          if(ballApproaching&&g.bx>GW*.4){shouldCast=true;}
          break;
      }

      if(shouldCast){
        g.eAbilCD=ab.cd;
        // Execute ability
        switch(ab.id){
          case'dash':
            g.dashT=ab.dur;g.dashSpd=g.aiSpd*3.5;
            addSparks(g,EX,g.ey,8,60,[1,.8,.5]);
            tone(500,.04,'square',.04);
            break;
          case'spin':
            // Queued - activates on next enemy hit
            tone(300,.06,'sine',.03);
            break;
          case'blink':
            // Instant teleport
            addSparks(g,EX,g.ey,10,80,[.7,.5,1]);
            g.ey=clamp(g.by,g.eH/2,GH-g.eH/2);
            g.blinkFlash=1;
            addSparks(g,EX,g.ey,10,80,[.7,.5,1]);
            tone(800,.03,'sine',.04);tone(1200,.05,'sine',.03,20);
            break;
          case'bulk':
            g.bulkT=ab.dur;
            addSparks(g,EX,g.ey,12,60,[1,.4,.3]);
            tone(150,.12,'sawtooth',.05);tone(100,.18,'sawtooth',.04,40);
            break;
          case'pull':
            g.pullT=ab.dur;
            tone(200,.1,'sine',.04);tone(150,.15,'sine',.03,50);
            break;
          case'lightning':
            g.eAbilPhase='channel';g.ltChannel=.7;
            tone(80,.3,'sawtooth',.04);tone(120,.4,'sawtooth',.03,100);
            break;
          case'voidpulse':
            g.vpT=.6;g.vpX=EX;g.vpY=g.ey;
            // Reverse ball at 2x speed + push player paddle + brief freeze
            g.bvx=-Math.abs(g.bvx)*2;
            g.bvy+=(Math.random()-.5)*300;
            g.py+=g.by<GH/2?160:-160;g.py=clamp(g.py,g.ph/2,GH-g.ph/2);
            g.freezeT=Math.max(g.freezeT,0.5); // freeze enemy briefly for drama
            g.shake=.25;g.flash=.3;g.flashCol=[.6,.2,.8];g.chromaShift=.7;
            addSparks(g,EX-40,g.ey,24,200,[.6,.2,.8]);
            tone(100,.2,'sawtooth',.07);tone(60,.3,'sawtooth',.05,80);
            break;
          case'rampage':
            for(let i=0;i<2;i++){
              const spd=g.ballSpd*1.4;
              const ang=(-0.2+(i*0.4))+(Math.random()-.5)*.15;
              g.multiBalls.push({x:EX-20,y:g.ey+(i===0?-30:30),vx:-Math.cos(ang)*spd,vy:Math.sin(ang)*spd,life:2.5,trail:[]});
            }
            g.shake=.15;g.flash=.2;g.flashCol=[1,.2,.2];g.chromaShift=.5;
            addSparks(g,EX-20,g.ey,20,160,[1,.3,.3]);
            tone(80,.2,'sawtooth',.08);tone(150,.15,'square',.06,40);tone(60,.25,'sawtooth',.05,100);
            break;
          case'accel':
            // Overdrive: ball accelerates to 2x speed for 2s
            g.overdriveT=2;
            g.shake=.1;g.flash=.15;g.flashCol=[1,.6,.2];
            addSparks(g,g.bx,g.by,16,140,[1,.6,.2]);
            tone(300,.08,'square',.05);tone(500,.06,'square',.04,30);
            break;
          case'clone':
            // Clone: phantom paddle appears offset from enemy
            g.cloneT=3;g.cloneY=g.ey;
            addSparks(g,EX-30,g.ey,12,80,[.5,.5,1]);
            tone(400,.06,'sine',.04);tone(600,.08,'sine',.03,30);
            break;
        }
      }
    }
  }
}

function ricoB(gg){if(!gg.rico)return;const s=Math.hypot(gg.bvx,gg.bvy);const n=Math.min(s*1.08,gg.bs*2.5);gg.bvx*=n/s;gg.bvy*=n/s;}

// ═══ DRAW ═══
let _sp=null;function getSP(ctx){if(_sp)return _sp;const c=document.createElement('canvas');c.width=4;c.height=4;const x=c.getContext('2d');x.fillStyle='rgba(0,0,0,0.08)';x.fillRect(0,0,4,1);x.fillStyle='rgba(0,0,0,0.02)';x.fillRect(0,2,4,1);_sp=ctx.createPattern(c,'repeat');return _sp;}

function draw(ctx,cw,ch){
  if(!g)return;const sx=cw/GW,sy=ch/GH;ctx.clearRect(0,0,cw,ch);ctx.save();
  const chroma=g.chromaShift*3;ctx.translate(g.shX*sx,g.shY*sy);ctx.scale(sx,sy);
  const col=PCOL[g.padId];const dCol=DIFF_COLORS[g.cfg.diff]||'#fff';
  ctx.fillStyle='#030303';ctx.fillRect(-10,-10,GW+20,GH+20);
  const vg=ctx.createRadialGradient(GW/2,GH/2,GW*.18,GW/2,GH/2,GW*.74);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(.6,'rgba(0,0,0,0.1)');vg.addColorStop(1,'rgba(0,0,0,0.6)');ctx.fillStyle=vg;ctx.fillRect(0,0,GW,GH);

  if(g.flash>0){const[r,g2,b]=g.flashCol;ctx.fillStyle=`rgba(${r*255|0},${g2*255|0},${b*255|0},${g.flash*.055})`;ctx.fillRect(0,0,GW,GH);}
  if(g.scoreFlash>0){const sf=g.scoreFlash,side=g.scoreFlashSide;const grd=ctx.createLinearGradient(side>0?GW:0,0,side>0?GW-280:280,0);const[r,g2,b]=g.flashCol;grd.addColorStop(0,`rgba(${r*255|0},${g2*255|0},${b*255|0},${sf*.07})`);grd.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grd;ctx.fillRect(0,0,GW,GH);}

  // Time warp zone indicators
  if(g.timewarp){
    ctx.fillStyle='rgba(100,50,200,0.035)';ctx.fillRect(GW*.65,0,GW*.35,GH);
    ctx.fillStyle='rgba(200,100,50,0.035)';ctx.fillRect(0,0,GW*.35,GH);
  }

  ctx.shadowColor=col.g+'0.25)';ctx.shadowBlur=3;ctx.fillStyle='#888';for(let y=6;y<GH;y+=20)ctx.fillRect(GW/2-1.5,y,3,12);ctx.shadowBlur=0;

  // Scores
  ctx.textAlign='center';ctx.textBaseline='top';ctx.font='bold 80px "Share Tech Mono",monospace';
  ctx.shadowColor=col.g+'0.22)';ctx.shadowBlur=22;ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fillText(g.pScore,GW/2-100,16);ctx.fillText(g.eScore,GW/2+100,16);
  ctx.shadowBlur=8;ctx.fillStyle='#fff';ctx.fillText(g.pScore,GW/2-100,16);ctx.fillText(g.eScore,GW/2+100,16);ctx.shadowBlur=0;

  // Difficulty badge in top center
  ctx.font='bold 10px "Share Tech Mono",monospace';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle=dCol;
  ctx.shadowColor=dCol;ctx.shadowBlur=6;ctx.fillText(g.cfg.diff+(g.cfg.boss?' BOSS':''),GW/2,4);ctx.shadowBlur=0;

  // Placed wall
  if(g.placedWall){const w=g.placedWall,pulse=.5+.5*Math.sin(g.t*5);ctx.shadowColor=col.g+'0.6)';ctx.shadowBlur=16*pulse;ctx.fillStyle=col.g+(.4+.3*pulse)+')';ctx.fillRect(w.x-4,w.y-30,8,60);ctx.shadowBlur=0;}

  // Player paddle
  const pGlow=g.hitFlash>0?20:6;ctx.shadowColor=col.g+'0.6)';ctx.shadowBlur=pGlow;ctx.fillStyle=col.p;
  ctx.fillRect(g.px-PAD_W/2,g.py-g.ph/2,PAD_W,g.ph);ctx.shadowBlur=28;ctx.fillStyle=col.g+(g.hitFlash>0?.06:.02)+')';ctx.fillRect(g.px-PAD_W/2-6,g.py-g.ph/2-6,PAD_W+12,g.ph+12);ctx.shadowBlur=0;
  if(g.smashNext||g.curveNext||g.thunderNext){const p=.2+.2*Math.sin(g.t*11);ctx.strokeStyle=col.g+p+')';ctx.lineWidth=1.5;ctx.shadowColor=col.g+'0.35)';ctx.shadowBlur=10;ctx.strokeRect(g.px-PAD_W/2-5,g.py-g.ph/2-5,PAD_W+10,g.ph+10);ctx.shadowBlur=0;}

  // Doppelganger paddle
  if(g.doppel){const dpX=EX-60;ctx.globalAlpha=.3+.15*Math.sin(g.t*3);ctx.shadowColor=col.g+'0.4)';ctx.shadowBlur=12;ctx.fillStyle=col.p;ctx.fillRect(dpX-PAD_W/2,g.py-g.ph*.4,PAD_W,g.ph*.8);ctx.shadowBlur=0;ctx.globalAlpha=1;}

  // Enemy paddle
  ctx.globalAlpha=g.ghostA;const eSh=g.shrinkT>0;const frozen=g.freezeT>0;
  ctx.shadowColor=frozen?'rgba(100,150,255,0.4)':eSh?'rgba(255,80,80,0.3)':'rgba(255,255,255,0.35)';ctx.shadowBlur=frozen?8:eSh?3:4;
  ctx.fillStyle=frozen?'#88aaff':eSh?'#866':'#ddd';ctx.fillRect(EX-PAD_W/2,g.ey-g.eH/2,PAD_W,g.eH);ctx.shadowBlur=0;ctx.globalAlpha=1;
  if(eSh){ctx.globalAlpha=.12+.08*Math.sin(g.t*20);ctx.fillStyle='#f44';for(let i=0;i<4;i++){ctx.fillRect(EX-35,g.ey+Math.sin(g.t*11+i*2.3)*g.eH*1.5,70,1);}ctx.globalAlpha=1;}
  if(frozen){ctx.globalAlpha=.15+.08*Math.sin(g.t*8);ctx.fillStyle='#88ccff';ctx.fillRect(EX-24,g.ey-g.eH/2-8,48,g.eH+16);ctx.globalAlpha=1;}
  // Clone paddle (enemy ability)
  if(g.cloneT>0){const clX=EX-35;const ca2=Math.min(g.cloneT,.5)*2;
    ctx.globalAlpha=ca2*.4;ctx.fillStyle='#88f';ctx.shadowColor='rgba(100,100,255,0.4)';ctx.shadowBlur=8;
    ctx.fillRect(clX-PAD_W/2,g.cloneY-g.eH/2,PAD_W,g.eH);
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Overdrive glow on ball
  if(g.overdriveT>0){const oa=Math.min(g.overdriveT,.5)*2;
    ctx.globalAlpha=oa*.3;ctx.fillStyle='#ff8800';ctx.shadowColor='rgba(255,136,0,0.6)';ctx.shadowBlur=16;
    ctx.beginPath();ctx.arc(g.bx,g.by,BALL_SZ+5+Math.sin(g.t*12)*3,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }

  // Ball trail
  if(g.trail.length>2){const[tr,tg,tb]=col.t;for(let i=1;i<g.trail.length;i++){const t=i/g.trail.length,pt=g.trail[i],pp=g.trail[i-1];const alpha=t*t*.2,sz=BALL_SZ*(.2+t*.55);ctx.globalAlpha=alpha;ctx.fillStyle=`rgb(${tr*255|0},${tg*255|0},${tb*255|0})`;for(let s=0;s<2;s++){const st=s/2;ctx.fillRect(lerp(pp.x,pt.x,st)-sz/2,lerp(pp.y,pt.y,st)-sz/2,sz,sz);}}ctx.globalAlpha=1;}

  // Ball
  const ghostAlpha=g.ghostBall?(.28+.2*Math.sin(g.t*10)):1;ctx.globalAlpha=ghostAlpha;
  if(chroma>.3){ctx.globalAlpha=ghostAlpha*.15;ctx.fillStyle='#f55';ctx.fillRect(g.bx-BALL_SZ/2-chroma,g.by-BALL_SZ/2,BALL_SZ,BALL_SZ);ctx.fillStyle='#55f';ctx.fillRect(g.bx-BALL_SZ/2+chroma,g.by-BALL_SZ/2,BALL_SZ,BALL_SZ);ctx.globalAlpha=ghostAlpha;}
  ctx.shadowColor=col.g+'0.5)';ctx.shadowBlur=g.smashNext?22:10;ctx.fillStyle=col.g+(g.smashNext?.08:.04)+')';ctx.fillRect(g.bx-BALL_SZ,g.by-BALL_SZ,BALL_SZ*2,BALL_SZ*2);
  ctx.shadowBlur=g.smashNext?16:6;ctx.fillStyle=col.p;ctx.fillRect(g.bx-BALL_SZ/2,g.by-BALL_SZ/2,BALL_SZ,BALL_SZ);ctx.shadowBlur=0;
  if(g.ghostBall){ctx.globalAlpha=ghostAlpha*.1;ctx.fillStyle=col.p;ctx.fillRect(g.bx-BALL_SZ/2+Math.sin(g.t*14)*3,g.by-BALL_SZ/2+Math.cos(g.t*16)*3,BALL_SZ,BALL_SZ);}ctx.globalAlpha=1;

  // Afterimage ball
  if(g.afterBall){const ab=g.afterBall;const a=Math.min(ab.life,1)*.35;
    for(let i=0;i<ab.trail.length;i++){const t=i/ab.trail.length;ctx.globalAlpha=t*.06*a;ctx.fillStyle=col.p;const sz=BALL_SZ*(.2+t*.3);ctx.fillRect(ab.trail[i].x-sz/2,ab.trail[i].y-sz/2,sz,sz);}
    ctx.globalAlpha=a;ctx.shadowColor=col.g+'0.2)';ctx.shadowBlur=6;ctx.fillStyle=col.p;ctx.fillRect(ab.x-BALL_SZ/2,ab.y-BALL_SZ/2,BALL_SZ,BALL_SZ);ctx.shadowBlur=0;ctx.globalAlpha=1;}

  // Multi balls
  for(const mb of g.multiBalls){const a=Math.min(mb.life,1)*.55;for(let i=0;i<mb.trail.length-1;i++){const t=i/mb.trail.length;ctx.globalAlpha=t*.08*a;ctx.fillStyle=col.p;const sz=BALL_SZ*(.2+t*.35);ctx.fillRect(mb.trail[i].x-sz/2,mb.trail[i].y-sz/2,sz,sz);}ctx.globalAlpha=a;ctx.shadowColor=col.g+'0.3)';ctx.shadowBlur=4;ctx.fillStyle=col.p;ctx.fillRect(mb.x-BALL_SZ/2,mb.y-BALL_SZ/2,BALL_SZ,BALL_SZ);ctx.shadowBlur=0;}ctx.globalAlpha=1;

  // Sparks
  for(const p of g.sparks){const t=p.life/p.max;ctx.globalAlpha=t*.7;const c=p.col;if(c){ctx.fillStyle=`rgb(${c[0]*255|0},${c[1]*255|0},${c[2]*255|0})`;ctx.shadowColor=ctx.fillStyle;}else{ctx.fillStyle='#fff';ctx.shadowColor='#fff';}ctx.shadowBlur=3+t*5;const sz=1.5+t*3;ctx.fillRect(p.x-sz/2,p.y-sz/2,sz,sz);}ctx.shadowBlur=0;ctx.globalAlpha=1;

  // ══ ABILITY VFX ══
  // Curve active: spiral particles swirling around ball
  if(g.curveNext){
    for(let i=0;i<6;i++){const a=g.t*8+i*Math.PI/3,r=18+Math.sin(g.t*12+i)*6;
    ctx.globalAlpha=.25+.15*Math.sin(g.t*10+i);ctx.fillStyle=col.p;ctx.shadowColor=col.g+'0.5)';ctx.shadowBlur=8;
    ctx.fillRect(g.bx+Math.cos(a)*r-1.5,g.by+Math.sin(a)*r-1.5,3,3);}ctx.shadowBlur=0;ctx.globalAlpha=1;
    // Predicted curve trajectory (simulates actual physics)
    ctx.beginPath();ctx.strokeStyle=col.g+'0.1)';ctx.lineWidth=1;ctx.setLineDash([3,5]);
    let px=g.bx,py=g.by,pvx=Math.abs(g.bvx)||g.ballSpd,pvy=g.bvy,cdir=Math.sign(g.bvy||1);
    ctx.moveTo(px,py);
    for(let i=0;i<40;i++){px+=pvx*.008;py+=pvy*.008;pvy+=cdir*320*.008;
    if(py<5||py>GH-5)pvy=-pvy;ctx.lineTo(px,py);if(px>GW*.7)break;}
    ctx.stroke();ctx.setLineDash([]);
  }
  // Ghost/Vanish: ethereal echoes + distortion rings
  if(g.ghostBall){
    for(let i=0;i<3;i++){const off=Math.sin(g.t*6+i*2)*12;
    ctx.globalAlpha=.06;ctx.fillStyle=col.p;ctx.shadowColor=col.g+'0.2)';ctx.shadowBlur=14;
    ctx.fillRect(g.bx-BALL_SZ/2+off*(i+1)*.4,g.by-BALL_SZ/2+Math.cos(g.t*7+i)*6,BALL_SZ,BALL_SZ);}
    ctx.globalAlpha=.04+.02*Math.sin(g.t*10);ctx.strokeStyle=col.p;ctx.lineWidth=.8;
    ctx.beginPath();ctx.arc(g.bx,g.by,20+Math.sin(g.t*8)*5,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(g.bx,g.by,34+Math.cos(g.t*6)*8,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Placed wall: energy field with pulse beams
  if(g.placedWall){const w=g.placedWall,pulse=.5+.5*Math.sin(g.t*6);
    // Vertical energy beams
    for(let i=0;i<3;i++){ctx.globalAlpha=.04+.03*Math.sin(g.t*14+i*3);ctx.fillStyle=col.p;
    ctx.fillRect(w.x-15+i*12,w.y-40,1,80);}
    // Deterministic crackling arcs (time-based, not random)
    ctx.globalAlpha=.15*pulse;ctx.strokeStyle=col.p;ctx.lineWidth=.5;ctx.shadowColor=col.g+'0.6)';ctx.shadowBlur=6;
    for(let i=0;i<2;i++){ctx.beginPath();let lx=w.x,ly=w.y-28+i*56;ctx.moveTo(lx,ly);
    for(let j=0;j<4;j++){lx+=Math.sin(g.t*11+j*7+i*13)*12;ly+=Math.cos(g.t*9+j*5+i*11)*6;ctx.lineTo(lx,ly);}ctx.stroke();}
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Shrink active: glitch scan lines + hex containment
  if(g.shrinkT>0){const si=g.shrinkT/2.5;
    ctx.globalAlpha=.12*si;ctx.fillStyle='#f44';
    for(let i=0;i<5;i++){const y=g.ey+Math.sin(g.t*12+i*2.7)*g.eH*1.5,w=45+Math.sin(g.t*8+i*4)*25;
    ctx.fillRect(EX-w/2,y,w,1);}
    // Hexagonal containment around shrunk paddle
    ctx.strokeStyle='rgba(255,60,60,'+(0.08*si)+')';ctx.lineWidth=.5;ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3+g.t*2,r=g.eH*.9+10;
    const px=EX+Math.cos(a)*r*.35,py=g.ey+Math.sin(a)*r;
    i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}ctx.closePath();ctx.stroke();
    ctx.globalAlpha=1;
  }
  // Smash charged: scrolling speed lines + pulsing aura
  if(g.smashNext){
    ctx.globalAlpha=.07+.04*Math.sin(g.t*20);ctx.fillStyle=col.p;
    for(let i=0;i<8;i++){const y=g.py+Math.sin(g.t*6+i*1.9)*g.ph;const len=50+Math.sin(g.t*10+i*3)*30;
    ctx.fillRect(g.px+10,y,len,1);}
    // Pulsing aura
    ctx.strokeStyle=col.g+(.08+.05*Math.sin(g.t*15))+')';ctx.lineWidth=2;ctx.shadowColor=col.g+'0.4)';ctx.shadowBlur=12;
    ctx.strokeRect(g.px-PAD_W/2-8+Math.sin(g.t*30)*1.5,g.py-g.ph/2-8,PAD_W+16,g.ph+16);
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Freeze active: orbiting ice crystal particles
  if(g.freezeT>0){const fR=g.eHBase*.6;
    ctx.globalAlpha=.25*Math.min(g.freezeT,1);ctx.fillStyle='#aaddff';ctx.shadowColor='rgba(120,180,255,0.4)';ctx.shadowBlur=4;
    for(let i=0;i<6;i++){const a=g.t*3+i*Math.PI/3,r=fR+Math.sin(g.t*5+i)*10;
    const sz=1.5+Math.sin(i*2.3)*.8;ctx.fillRect(EX+Math.cos(a)*r*.3-sz/2,g.ey+Math.sin(a)*r-sz/2,sz,sz);}
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Singularity: gravity funnel pulling toward enemy goal
  if(g.singularity&&g.bvx>0){
    ctx.globalAlpha=.04;ctx.strokeStyle=col.p;ctx.lineWidth=.5;
    for(let i=0;i<4;i++){const r=20+i*16+Math.sin(g.t*4+i)*5;const cx=lerp(g.bx,GW,0.6+i*.1);
    ctx.beginPath();ctx.arc(cx,g.by,r,Math.PI*.65,Math.PI*1.35);ctx.stroke();}
    // Pull line from ball to goal
    ctx.globalAlpha=.03;ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(g.bx,g.by);ctx.lineTo(GW,g.by);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=1;
  }
  // Homing: tracking crosshair on target
  if(g.homing&&g.bvx>0&&g.bx>GW*.4){
    const gap=g.by<g.ey?g.ey-g.eH/2-20:g.ey+g.eH/2+20;
    ctx.globalAlpha=.1+.05*Math.sin(g.t*8);ctx.strokeStyle=col.p;ctx.lineWidth=.5;
    ctx.beginPath();ctx.arc(EX,gap,8,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(EX-12,gap);ctx.lineTo(EX+12,gap);ctx.moveTo(EX,gap-12);ctx.lineTo(EX,gap+12);ctx.stroke();
    ctx.globalAlpha=1;
  }
  // Time warp: flowing zone particles
  if(g.timewarp){
    ctx.globalAlpha=.05;
    for(let i=0;i<5;i++){const x=GW*.72+Math.sin(g.t*1.5+i*1.7)*GW*.12;const y=(g.t*40+i*97)%GH;
    ctx.fillStyle='#a060ff';ctx.fillRect(x,y,1,4+Math.sin(g.t*3+i)*3);}
    for(let i=0;i<5;i++){const x=GW*.08+Math.sin(g.t*1.8+i*2.1)*GW*.12;const y=(g.t*50+i*83)%GH;
    ctx.fillStyle='#ffa040';ctx.fillRect(x,y,1,4+Math.sin(g.t*4+i)*3);}
    ctx.globalAlpha=1;
  }
  // Doppelganger shimmer
  if(g.doppel){const dpX=EX-60;
    ctx.globalAlpha=.03+.02*Math.sin(g.t*7);ctx.strokeStyle=col.p;ctx.lineWidth=.5;
    ctx.strokeRect(dpX-PAD_W/2-3,g.py-g.ph*.45,PAD_W+6,g.ph*.9);ctx.globalAlpha=1;
  }
  // VoidWalk: teleport streaks
  if(g.voidWalk&&g.bvx<0){
    ctx.globalAlpha=.06;ctx.strokeStyle='#0fc';ctx.lineWidth=.5;
    ctx.beginPath();ctx.moveTo(g.bx,g.by);ctx.lineTo(g.px,g.py);ctx.stroke();
    ctx.globalAlpha=1;
  }
  // EchoHit: ambient resonance arcs from paddle face
  if(g.echoHit){const epx=g.px+PAD_W/2;
    ctx.globalAlpha=.02+.01*Math.sin(g.t*5);ctx.strokeStyle=col.p;ctx.lineWidth=.5;
    ctx.beginPath();ctx.arc(epx,g.py,30+Math.sin(g.t*6)*8,-.4,.4);ctx.stroke();
    ctx.beginPath();ctx.arc(epx,g.py,50+Math.cos(g.t*4)*10,-.3,.3);ctx.stroke();
    ctx.globalAlpha=1;
  }

  // ══ NEW PADDLE ABILITY VFX ══
  // Foresight (Oracle): show full predicted ball path
  if(g.foresightT>0){
    const fa=Math.min(g.foresightT,1);
    ctx.globalAlpha=fa*.25;ctx.strokeStyle='#44ddff';ctx.lineWidth=1.5;ctx.shadowColor='rgba(68,221,255,0.4)';ctx.shadowBlur=6;
    ctx.setLineDash([4,4]);
    // Forward path
    ctx.beginPath();
    let fpx=g.bx,fpy=g.by,fvx=g.bvx,fvy=g.bvy;
    ctx.moveTo(fpx,fpy);
    for(let i=0;i<600;i++){fpx+=fvx*.005;fpy+=fvy*.005;
      if(fpy<5){fpy=5;fvy=Math.abs(fvy);}if(fpy>GH-5){fpy=GH-5;fvy=-Math.abs(fvy);}
      ctx.lineTo(fpx,fpy);if(fpx<0||fpx>GW)break;}
    ctx.stroke();
    // Impact marker
    if(fpx>=0&&fpx<=GW){
      ctx.beginPath();ctx.arc(fpx,fpy,8+Math.sin(g.t*6)*3,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(fpx-12,fpy);ctx.lineTo(fpx+12,fpy);ctx.moveTo(fpx,fpy-12);ctx.lineTo(fpx,fpy+12);ctx.stroke();
    }
    ctx.setLineDash([]);ctx.shadowBlur=0;ctx.globalAlpha=1;
    // Floating eye icon near paddle
    ctx.globalAlpha=fa*.6;ctx.fillStyle='#44ddff';ctx.font='14px "Share Tech Mono",monospace';ctx.textAlign='center';
    ctx.fillText('\u{1F441}',g.px,g.py-g.ph/2-12);ctx.globalAlpha=1;
  }
  // Gravity well (Void) - visible swirling well
  if(g.gravWell&&g.gravWellT>0){const ga=Math.min(g.gravWellT,.5)*2;
    const gw=g.gravWell;const pulse=.5+.5*Math.sin(g.t*6);
    ctx.globalAlpha=ga*.2;ctx.strokeStyle='#ff44aa';ctx.lineWidth=1.5;ctx.shadowColor='rgba(255,68,170,0.5)';ctx.shadowBlur=12;
    for(let i=0;i<3;i++){const r=10+i*14+Math.sin(g.t*4+i*2)*4;
      ctx.beginPath();ctx.arc(gw.x,gw.y,r,g.t*(3-i)+i,g.t*(3-i)+i+Math.PI*1.4);ctx.stroke();}
    ctx.globalAlpha=ga*.25*pulse;ctx.fillStyle='#ff44aa';ctx.beginPath();ctx.arc(gw.x,gw.y,6+pulse*3,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=ga*.1;ctx.strokeStyle='#ff44aa';ctx.lineWidth=.5;ctx.setLineDash([2,4]);
    ctx.beginPath();ctx.moveTo(g.bx,g.by);ctx.lineTo(gw.x,gw.y);ctx.stroke();
    ctx.setLineDash([]);ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Phase indicator (Phantom)
  if(g.phaseNext){
    ctx.globalAlpha=.15+.1*Math.sin(g.t*10);ctx.strokeStyle='#cc88ff';ctx.lineWidth=1.5;ctx.shadowColor='rgba(204,136,255,0.5)';ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(g.bx,g.by,BALL_SZ+6+Math.sin(g.t*8)*3,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Blizzard zone (Frost)
  if(g.blizzardT>0){const ba=Math.min(g.blizzardT,.5)*2;
    // Ice overlay on enemy half
    ctx.globalAlpha=ba*.06;ctx.fillStyle='#88ccff';ctx.fillRect(GW*.4,0,GW*.6,GH);
    // Snowflake particles
    ctx.globalAlpha=ba*.25;ctx.fillStyle='#aaddff';ctx.shadowColor='rgba(170,221,255,0.4)';ctx.shadowBlur=4;
    for(let i=0;i<12;i++){
      const sx=GW*.4+((g.t*30+i*67)%(GW*.6));const sy=(g.t*50+i*43)%GH;
      const ssz=2+Math.sin(i*2.3+g.t*3);
      ctx.fillRect(sx-ssz/2,sy-ssz/2,ssz,ssz);
    }
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Thunder charged indicator (Storm)
  if(g.thunderNext){
    ctx.globalAlpha=.15+.1*Math.sin(g.t*15);ctx.strokeStyle='#ffee44';ctx.lineWidth=1.5;ctx.shadowColor='rgba(255,238,68,0.5)';ctx.shadowBlur=12;
    // Electric arcs around paddle
    for(let i=0;i<3;i++){
      ctx.beginPath();let lx=g.px+PAD_W/2,ly=g.py-g.ph/2+g.ph*(i+.5)/3;
      for(let j=0;j<5;j++){lx+=8+Math.sin(g.t*20+j*5+i*7)*4;ly+=Math.sin(g.t*18+j*3+i*5)*8;ctx.lineTo(lx,ly);}
      ctx.stroke();
    }
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Lightning bolts (Storm projectiles)
  for(const b of g.bolts){const ba=Math.min(b.life,1);
    // Trail
    for(let i=1;i<b.trail.length;i++){const t2=i/b.trail.length;
      ctx.globalAlpha=t2*.3*ba;ctx.strokeStyle='#ffee44';ctx.lineWidth=2;ctx.shadowColor='rgba(255,238,68,0.5)';ctx.shadowBlur=6;
      ctx.beginPath();ctx.moveTo(b.trail[i-1].x,b.trail[i-1].y);ctx.lineTo(b.trail[i].x,b.trail[i].y);ctx.stroke();
    }
    // Bolt head
    ctx.globalAlpha=ba;ctx.fillStyle='#fff';ctx.shadowColor='rgba(255,238,68,0.8)';ctx.shadowBlur=14;
    ctx.beginPath();ctx.arc(b.x,b.y,3,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }
  ctx.globalAlpha=1;

  // ══ ENEMY ABILITY VFX ══
  // Dash: fading afterimage ghost copies of enemy paddle
  if(g.dashT>0){const da=Math.min(g.dashT/.3,1);
    for(let i=1;i<=3;i++){const yOff=Math.sin(g.t*20+i*2)*i*8;
    ctx.globalAlpha=.08*da*(1-i*.25);ctx.fillStyle='#ffa';ctx.shadowColor='rgba(255,255,160,0.3)';ctx.shadowBlur=6;
    ctx.fillRect(EX-PAD_W/2,g.ey-g.eH/2+yOff,PAD_W,g.eH);}
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Blink: flash at old/new position
  if(g.blinkFlash>0){
    ctx.globalAlpha=g.blinkFlash*.3;ctx.fillStyle='#a7f';ctx.shadowColor='rgba(170,120,255,0.6)';ctx.shadowBlur=20;
    ctx.fillRect(EX-30,g.ey-g.eH/2-10,60,g.eH+20);ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Bulk: pulsing glow and thick border on enlarged paddle
  if(g.bulkT>0){const bp=Math.sin(g.t*8)*.3+.7;
    ctx.globalAlpha=.08*bp;ctx.fillStyle='#f64';ctx.shadowColor='rgba(255,100,60,0.4)';ctx.shadowBlur=16;
    ctx.fillRect(EX-PAD_W-4,g.ey-g.eH/2-4,PAD_W*2+8,g.eH+8);ctx.shadowBlur=0;
    ctx.globalAlpha=.12*bp;ctx.strokeStyle='#f84';ctx.lineWidth=1.5;
    ctx.strokeRect(EX-PAD_W/2-6,g.ey-g.eH/2-6,PAD_W+12,g.eH+12);ctx.globalAlpha=1;
  }
  // Pull: gravity tendrils from enemy to ball
  if(g.pullT>0){const pa=Math.min(g.pullT/1,1)*.2;
    ctx.globalAlpha=pa;ctx.strokeStyle='#6af';ctx.lineWidth=.8;ctx.shadowColor='rgba(100,160,255,0.3)';ctx.shadowBlur=6;
    for(let i=0;i<3;i++){
      ctx.beginPath();const ox=EX-20,oy=g.ey+(i-1)*g.eH*.3;
      for(let j=0;j<=6;j++){const t2=j/6;
      const nx=lerp(ox,g.bx,t2)+Math.sin(g.t*10+i*2+j*1.7)*12*(1-t2);
      const ny=lerp(oy,g.by,t2)+Math.cos(g.t*12+i*3+j*1.3)*8*(1-t2);
      j===0?ctx.moveTo(nx,ny):ctx.lineTo(nx,ny);}
      ctx.stroke();
    }
    // Pull vortex at ball
    ctx.beginPath();ctx.arc(g.bx,g.by,14+Math.sin(g.t*9)*4,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Spin return: smooth swirl indicator on ball
  if(g.spinCurveT>0){const sa=g.spinCurveT/.6;
    ctx.globalAlpha=.2*sa;ctx.strokeStyle='#ff8';ctx.lineWidth=1;ctx.shadowColor='rgba(255,255,120,0.2)';ctx.shadowBlur=4;
    ctx.beginPath();ctx.arc(g.bx,g.by,12+Math.sin(g.t*6)*5,g.t*8,g.t*8+Math.PI*1.5);ctx.stroke();
    ctx.beginPath();ctx.arc(g.bx,g.by,7+Math.cos(g.t*5)*3,g.t*-6,g.t*-6+Math.PI);ctx.stroke();
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Lightning channel: growing energy field around enemy + crackling bolts
  if(g.eAbilPhase==='channel'){const cp=1-g.ltChannel/.7;
    // Enemy glow intensifies
    ctx.globalAlpha=.1+cp*.2;ctx.fillStyle='#4af';ctx.shadowColor='rgba(80,160,255,0.6)';ctx.shadowBlur=20+cp*20;
    ctx.fillRect(EX-PAD_W/2-10,g.ey-g.eH/2-10,PAD_W+20,g.eH+20);ctx.shadowBlur=0;
    // Electric field arcs (time-based, smooth rotation)
    ctx.strokeStyle='rgba(120,180,255,'+(0.1+cp*0.15)+')';ctx.lineWidth=.5;
    for(let i=0;i<3;i++){const r=20+cp*40+i*15;const a0=g.t*4+i*2.1;
      ctx.beginPath();ctx.arc(EX,g.ey,r,a0,a0+Math.PI*(.3+cp*.3));ctx.stroke();}
    // Charging indicator bar
    ctx.globalAlpha=.6;ctx.fillStyle='#08f';ctx.fillRect(EX-25,g.ey-g.eH/2-16,50*cp,3);
    ctx.strokeStyle='#4af';ctx.lineWidth=.5;ctx.strokeRect(EX-25,g.ey-g.eH/2-16,50,3);
    ctx.globalAlpha=1;
  }
  // Lightning strike: ball stunned + electric cage
  if(g.eAbilPhase==='strike'){const sp=Math.max(g.ltStun/.5,0);
    // Ball electric cage (rotating hex)
    ctx.globalAlpha=.2+.15*Math.sin(g.t*40);ctx.strokeStyle='#8cf';ctx.lineWidth=1;ctx.shadowColor='rgba(130,200,255,0.5)';ctx.shadowBlur=10;
    ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3+g.t*12,r=12+Math.sin(g.t*20+i)*4;
    const px=g.bx+Math.cos(a)*r+Math.sin(g.t*55)*1.5,py=g.by+Math.sin(a)*r+Math.cos(g.t*50)*1.5;i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);}
    ctx.closePath();ctx.stroke();
    // Inner crackle (deterministic jagged lines)
    ctx.strokeStyle='#fff';ctx.lineWidth=.5;ctx.globalAlpha=.3*sp;
    for(let i=0;i<3;i++){ctx.beginPath();const sx=g.bx+Math.sin(g.t*22+i*4)*8,sy=g.by+Math.cos(g.t*19+i*5)*8;
    ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.sin(g.t*31+i*7)*12,sy+Math.cos(g.t*27+i*9)*12);ctx.stroke();}
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Lightning bolts (shared by channel + strike)
  for(const bolt of g.ltBolts){const ba=bolt.life/.35;
    ctx.globalAlpha=ba*.7;ctx.strokeStyle='#adf';ctx.lineWidth=1.5+ba;ctx.shadowColor='rgba(160,200,255,0.7)';ctx.shadowBlur=8;
    ctx.beginPath();bolt.segs.forEach((s,i)=>{i===0?ctx.moveTo(s.x1,s.y1):0;ctx.lineTo(s.x2,s.y2);});ctx.stroke();
    // Core (brighter, thinner)
    ctx.strokeStyle='#fff';ctx.lineWidth=.5;ctx.shadowBlur=4;
    ctx.beginPath();bolt.segs.forEach((s,i)=>{i===0?ctx.moveTo(s.x1,s.y1):0;ctx.lineTo(s.x2,s.y2);});ctx.stroke();
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Timestop: frozen ball with time distortion rings
  if(g.tsT>0){const ta=Math.min(g.tsT/1,1);
    ctx.globalAlpha=.1*ta;ctx.strokeStyle='#4dd';ctx.lineWidth=1;ctx.shadowColor='rgba(60,200,200,0.3)';ctx.shadowBlur=8;
    for(let i=0;i<3;i++){const r=18+i*14+Math.sin(g.t*3+i)*4;
    ctx.beginPath();ctx.arc(g.bx,g.by,r,0,Math.PI*2);ctx.stroke();}
    // Frozen crystal effect
    ctx.globalAlpha=.15*ta;ctx.fillStyle='#8ff';
    for(let i=0;i<4;i++){const a=g.t*.5+i*Math.PI/2,r=10;
    ctx.fillRect(g.bx+Math.cos(a)*r-1,g.by+Math.sin(a)*r-1,2,2);}
    // Clock-like tick marks
    ctx.strokeStyle='rgba(100,220,220,'+(0.08*ta)+')';ctx.lineWidth=.5;
    for(let i=0;i<12;i++){const a=i*Math.PI/6;
    ctx.beginPath();ctx.moveTo(g.bx+Math.cos(a)*22,g.by+Math.sin(a)*22);
    ctx.lineTo(g.bx+Math.cos(a)*26,g.by+Math.sin(a)*26);ctx.stroke();}
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Voidpulse: expanding shockwave ring
  if(g.vpT>0){const vp=1-g.vpT/.6,r=vp*GW*.4;
    ctx.globalAlpha=.15*(1-vp);ctx.strokeStyle='#a4f';ctx.lineWidth=2+vp*3;ctx.shadowColor='rgba(160,60,255,0.4)';ctx.shadowBlur=12;
    ctx.beginPath();ctx.arc(g.vpX,g.vpY,r,0,Math.PI*2);ctx.stroke();
    ctx.lineWidth=.5;ctx.beginPath();ctx.arc(g.vpX,g.vpY,r*.7,0,Math.PI*2);ctx.stroke();
    // Distortion lines
    ctx.globalAlpha=.06*(1-vp);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();
    ctx.moveTo(g.vpX+Math.cos(a)*10,g.vpY+Math.sin(a)*10);
    ctx.lineTo(g.vpX+Math.cos(a)*r*1.1,g.vpY+Math.sin(a)*r*1.1);ctx.stroke();}
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
  // Enemy ability cooldown indicator (right side near enemy)
  if(g.eAbil.id!=='none'){
    const eaRdy=g.eAbilCD<=0&&g.eAbilPhase==='idle';
    const eaFill=eaRdy?1:Math.max(0,1-g.eAbilCD/g.eAbil.cd);
    ctx.fillStyle='#151515';ctx.fillRect(EX+16,g.ey-20,3,40);
    ctx.fillStyle=eaRdy?'#f44':'#333';if(eaRdy){ctx.shadowColor='rgba(255,80,80,0.4)';ctx.shadowBlur=4;}
    ctx.fillRect(EX+16,g.ey+20-40*eaFill,3,40*eaFill);ctx.shadowBlur=0;
    ctx.fillStyle=eaRdy?'#f88':'#554';ctx.font='6px "Share Tech Mono",monospace';ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillText(g.eAbil.icon,EX+22,g.ey);
  }

  // HUD
  ctx.fillStyle=col.p;ctx.shadowColor=col.g+'0.5)';ctx.shadowBlur=3;for(let i=0;i<Math.max(0,g.lives);i++)ctx.fillRect(14+i*12,GH-14,5,5);ctx.shadowBlur=0;
  if(g.shields>0){ctx.fillStyle='#6688aa';ctx.font='8px "Share Tech Mono",monospace';ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('SAVE x'+g.shields,14,GH-19);}
  if(g.rallyHits>0){const spdPct=Math.round((Math.pow(1.05,g.rallyHits)-1)*100);const spdA=g.rallyHits>=4?.5+.2*Math.sin(g.t*6):.35;ctx.fillStyle=col.g+spdA+')';ctx.font='8px "Share Tech Mono",monospace';ctx.textAlign='right';ctx.textBaseline='alphabetic';ctx.fillText('SPD +'+spdPct+'%',GW-14,GH-20);}
  ctx.fillStyle='#665';ctx.font='7.5px "Share Tech Mono",monospace';ctx.textAlign='center';ctx.textBaseline='alphabetic';
  const eL=g.cfg.enemy.id!=='basic'?' '+g.cfg.enemy.tag+g.cfg.enemy.name:'';
  const eAL=g.eAbil.id!=='none'?' ['+g.eAbil.name+']':'';
  ctx.fillText('W'+g.cfg.wv+(g.cfg.boss?' BOSS':'')+eL+eAL,GW/2,GH-4);
  const cdMax=g.pad.cd*(g.cdMul??1),rdy=g.abCD<=0,fill=rdy?1:1-g.abCD/cdMax;
  if(g.padId!=='classic'){
  ctx.fillStyle='#151515';ctx.fillRect(14,GH-32,100,3);if(rdy){ctx.shadowColor=col.g+'0.4)';ctx.shadowBlur=6;}
  ctx.fillStyle=rdy?col.p:'#333';ctx.fillRect(14,GH-32,100*fill,3);ctx.shadowBlur=0;
  }
  ctx.fillStyle=rdy?'#ccc':'#555';ctx.font='8px "Share Tech Mono",monospace';ctx.textAlign='left';if(g.padId!=='classic'){ctx.fillText('[Q] '+g.pad.abil+(rdy?' RDY':' '+g.abCD.toFixed(1)+'s'),14,GH-37);}
  if(g.combo>=3){ctx.fillStyle=col.g+(.4+.25*Math.sin(g.t*5))+')';ctx.font='10px "Share Tech Mono",monospace';ctx.textAlign='right';ctx.textBaseline='alphabetic';ctx.fillText(g.combo+'x',GW-14,GH-6);}

  // Active abilities indicator (right side)
  const passives=[];
  if(g.freeze)passives.push('FRZ');if(g.afterimage)passives.push('AFT');if(g.shockwave)passives.push('SHK');
  if(g.homing)passives.push('HOM');if(g.timewarp)passives.push('TW');if(g.doppel)passives.push('DPL');
  if(g.singularity)passives.push('SNG');if(g.transcend)passives.push('TRS');if(g.magnet)passives.push('MAG');
  if(g.multicast)passives.push('2x');if(g.dblScore)passives.push('x2');if(g.vampire)passives.push('VMP');
  if(g.aiCap)passives.push('\u2756AI-');if(g.triScore)passives.push('x3');if(g.echoHit)passives.push('ECO');if(g.voidWalk)passives.push('VWK');
  if(g.stormCaller)passives.push('\u26A1SC');if(g.phantomStrike)passives.push('\u2606PS');if(g.mirrorMatch)passives.push('\u2194MR');if(g.berserker)passives.push('BRK'+(g.berserkerStacks||0));if(g.overcharge)passives.push('OVR');if(g.masterSkill)passives.push('\u2694MST');
  if(passives.length>0){ctx.fillStyle='#776';ctx.font='7px "Share Tech Mono",monospace';ctx.textAlign='right';ctx.textBaseline='top';
    passives.forEach((p,i)=>ctx.fillText(p,GW-10,8+i*10));}

  // Start-of-point direction indicator
  if(g.startPause>0&&!g.done){
    const aDir=g.pendingDir||1;const pulse=.5+.5*Math.sin(g.t*10);
    // Arrow body
    ctx.save();ctx.translate(GW/2,GH/2);ctx.globalAlpha=.55*pulse;
    ctx.strokeStyle=col.p;ctx.fillStyle=col.p;ctx.shadowColor=col.g+'0.6)';ctx.shadowBlur=14;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(aDir*-36,0);ctx.lineTo(aDir*36,0);ctx.stroke();
    // Arrowhead
    ctx.beginPath();ctx.moveTo(aDir*36,0);ctx.lineTo(aDir*24,-9);ctx.lineTo(aDir*24,9);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
    // Direction label
    ctx.fillStyle=col.g+(.4*pulse)+')';ctx.font='8px "Share Tech Mono",monospace';ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText((aDir>0?'SERVE →':'← SERVE'),GW/2,GH/2+20);
  }

  const sp=getSP(ctx);if(sp){ctx.fillStyle=sp;ctx.fillRect(0,0,GW,GH);}
  if(Math.random()<.02){ctx.fillStyle='rgba(255,255,255,0.004)';ctx.fillRect(0,0,GW,GH);}

  // Done
  if(g.done){const da=Math.min(g.doneT*3.5,1);ctx.fillStyle=`rgba(0,0,0,${da*.9})`;ctx.fillRect(0,0,GW,GH);ctx.textAlign='center';ctx.textBaseline='middle';const ts=.75+easeOut(Math.min(g.doneT*4,1))*.25;ctx.save();ctx.translate(GW/2,GH/2-20);ctx.scale(ts,ts);ctx.shadowColor=col.g+'0.5)';ctx.shadowBlur=30*da;ctx.fillStyle=`rgba(255,255,255,${da})`;ctx.font='bold 60px "Share Tech Mono",monospace';if(g.result==='win')ctx.fillText('CLEAR',0,0);else{ctx.fillText(g.lives>0?'FAULT':'GAME OVER',0,0);if(g.lives>0){ctx.shadowBlur=4;ctx.fillStyle=`rgba(200,180,160,${da})`;ctx.font='12px "Share Tech Mono",monospace';ctx.fillText(g.lives+' '+(g.lives===1?'LIFE':'LIVES'),0,36);}}ctx.restore();if(g.doneT>.4){const pa=Math.min((g.doneT-.4)*3,1);ctx.shadowBlur=3;ctx.fillStyle=`rgba(180,170,150,${pa})`;ctx.font='10px "Share Tech Mono",monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('ENTER / CLICK',GW/2,GH/2+48);}ctx.shadowBlur=0;if(sp){ctx.fillStyle=sp;ctx.fillRect(0,0,GW,GH);}}
  ctx.restore();
}

// ═══ SCREEN MANAGEMENT ═══
const $=id=>document.getElementById(id);
function showScreen(id){['menu-screen','cards-screen','opp-screen','go-screen','vic-screen','dev-screen'].forEach(s=>{$(s).classList.toggle('hidden',s!==id);});$('cv').style.display=id===null?'block':'none';curScreen=id;}

function startWave(pid,wn){g=newGame(pid,wn,savedState,enemyUps,chosenOppCfg);chosenOppCfg=null;padId=pid;showScreen(null);if(g.cfg.boss)setTimeout(SFX.boss,80);}

function doAbility(){
  if(!g||g.done||g.abCD>0)return;const cd=g.pad.cd*g.cdMul,col=PCOL[g.padId];
  if(g.padId==='classic')return; // Standard has no ability
  const cast=()=>{switch(g.padId){
    case'oracle':g.foresightT=8;g.abCD=cd;SFX.abil();tone(800,.06,'sine',.04);tone(1200,.1,'sine',.03,40);break;
    case'inferno':g.phaseNext=true;g.abCD=cd;SFX.abil();tone(600,.06,'sine',.04);tone(900,.08,'sine',.03,20);g.shake=.04;g.flash=.1;g.flashCol=[.8,.53,1];addSparks(g,g.px+PAD_W,g.py,10,80,[.8,.53,1]);break;
    case'frost':g.blizzardT=1.8;g.freezeT=1.8;g.abCD=cd;SFX.abil();tone(1200,.08,'sine',.04);tone(800,.12,'sine',.03,30);tone(400,.18,'sine',.02,80);addSparks(g,GW/2,GH/2,24,200,[.53,.8,1]);g.shake=.1;g.flash=.2;g.flashCol=[.53,.8,1];break;
    case'storm':g.thunderNext=true;g.abCD=cd;SFX.abil();tone(100,.1,'sawtooth',.05);tone(200,.08,'square',.04,40);break;
    case'voidp': {
      // Place gravity well ahead of ball in its path
      const wellDist=150;
      const wellX=clamp(g.bx+Math.sign(g.bvx)*wellDist,60,GW-60);
      const wellY=clamp(g.by+g.bvy/Math.abs(g.bvx||1)*wellDist,40,GH-40);
      g.gravWell={x:wellX,y:wellY};g.gravWellT=3;
      g.abCD=cd;SFX.abil();tone(80,.2,'sine',.06);tone(120,.15,'sine',.04,60);
      addSparks(g,wellX,wellY,14,80,[1,.27,.67]);g.shake=.05;g.flash=.1;g.flashCol=[1,.27,.67];break;
    }
  }};
  cast();
  if(g.multicast)setTimeout(()=>{if(g&&!g.done){g.abCD=0;cast();}},300);
}

function handleContinue(){
  if(!g||!g.done)return;const result=g.result,lives=g.lives;
  if(result==='win'){
    savedState=saveGame(g);const clearedDiff=g.cfg.diff;g=null;const nw=wave+1;
    if(nw>MAX_WAVE){SFX.win();showVictory();return;}
    wave=nw;
    const rewardTier=DIFF_REWARD[clearedDiff]||'common';
    curCards=getCardsForDiff(clearedDiff,3);
    curEUp=E_UPS[Math.floor(Math.random()*E_UPS.length)];
    curDiff=clearedDiff;
    showUpgradeScreen(rewardTier,clearedDiff);
  }else{g=null;if(lives<=0)showGameOver();else{savedState={...savedState,lives};showOpponentSelect();}}
}

// ═══ BUILD UI ═══
function buildPadGrid(){const grid=$('pad-grid');grid.innerHTML='';PADDLES.forEach(p=>{const c=PCOL[p.id];const d=document.createElement('div');d.className='pad-card';d.style.setProperty('--pc',c.p);d.innerHTML=`<div class="cdot" style="background:${c.p}"></div><div class="pn">${p.name}</div><div class="pd">${p.desc}</div><div class="ps"><div class="pa">[${p.akey}] ${p.abil}</div><div class="pi">${p.ainfo}</div></div><div class="pt">PLAY</div>`;d.onclick=()=>{savedState=null;wave=1;enemyUps=[];padId=p.id;SFX.sel();showOpponentSelect();};grid.appendChild(d);});}

function showUpgradeScreen(rewardTier,clearedDiff){
  $('rank-display').innerHTML='';
  // Difficulty badge
  const dc=DIFF_COLORS[clearedDiff]||'#fff';const dg=DIFF_GLOW[clearedDiff]||'255,255,255';
  const tc=TIER_COLORS[rewardTier]||'#fff';const tg=TIER_GLOW[rewardTier]||'255,255,255';
  $('diff-display').innerHTML=`<div class="diff-badge" style="background:rgba(${dg},0.1);border:1px solid ${dc};color:${dc}">${clearedDiff} CLEARED</div>`+
    `<div style="font-size:8px;letter-spacing:4px;margin-top:4px;color:${tc};text-shadow:0 0 8px rgba(${tg},0.3)">${TIER_ICON[rewardTier]} ${TIER_NAMES[rewardTier]} REWARDS ${TIER_ICON[rewardTier]}</div>`;

  if(rewardTier==='legendary'||rewardTier==='mythical')SFX.legendary();
  if(rewardTier==='secret'){SFX.legendary();setTimeout(()=>SFX.legendary(),200);}

  const wb=$('e-warn-box');
  if(curEUp)wb.innerHTML=`<div class="e-warn"><div style="color:#a66;font-size:7.5px;letter-spacing:5px;margin-bottom:5px;">ENEMY ALSO UPGRADES</div><div style="color:#f66;font-size:14px;font-weight:700;letter-spacing:3px;">${curEUp.icon} ${curEUp.name}</div><div style="color:#b88;font-size:9px;margin-top:4px;">${curEUp.desc}</div></div>`;
  else wb.innerHTML='';

  const nd=DIFF_RANKS[Math.min(Math.floor(wave/1.5),DIFF_RANKS.length-1)];const ndc=DIFF_COLORS[nd]||'#fff';
  let info=`WAVE ${wave-1} CLEARED \u00B7 SELECT YOUR REWARD`;
  if(enemyUps.length>0)info+=` \u00B7 ${enemyUps.length} ENEMY BUFF${enemyUps.length>1?'S':''}`;
  $('next-wave-info').innerHTML=info;

  const grid=$('card-grid');grid.innerHTML='';
  curCards.forEach(c=>{
    const tc2=TIER_COLORS[c.tier];const tg2=TIER_GLOW[c.tier];
    const isAbility=c.type==='ability';
    const d=document.createElement('div');d.className='up-card';d.style.setProperty('--rc',tc2);
    d.innerHTML=`${isAbility?`<div class="ab-tag" style="background:rgba(${tg2},0.15);color:${tc2};border:1px solid rgba(${tg2},0.2)">ABILITY</div>`:`<div class="ab-tag" style="background:rgba(255,255,255,0.04);color:#aa9;border:1px solid rgba(255,255,255,0.05)">STAT</div>`}<div class="ri" style="color:${tc2}">${TIER_ICON[c.tier]}</div><div class="cn">${c.name}</div><div class="cd">${c.desc}</div><div class="cr" style="color:${tc2}">${TIER_NAMES[c.tier]}</div>`;
    d.onmouseenter=()=>{d.style.borderColor=tc2;d.style.boxShadow=`0 0 28px rgba(${tg2},.12),inset 0 0 24px rgba(${tg2},.04)`;};
    d.onmouseleave=()=>{d.style.borderColor='#161616';d.style.boxShadow='none';};
    d.onclick=()=>{const t={...(savedState??{})};c.fn(t);savedState=t;SFX.sel();if(curEUp)enemyUps.push(curEUp);showOpponentSelect();};
    grid.appendChild(d);
  });
  showScreen('cards-screen');
}

function showGameOver(){$('go-info').textContent=`WAVE ${wave} \u00B7 ${PADDLES.find(p=>p.id===padId)?.name}`;$('go-buffs').textContent=enemyUps.length>0?`ENEMY HAD ${enemyUps.length} UPGRADE${enemyUps.length>1?'S':''}`:' ';showScreen('go-screen');}

// ═══ OPPONENT SELECTION ═══
function generateOpponents(wv){
  const baseRankIdx=Math.min(Math.floor(wv/1.5),DIFF_RANKS.length-1);
  const opponents=[];

  // EASY: one rank below base, never boss
  const easyRank=Math.max(0,baseRankIdx-1);
  const easyDiff=DIFF_RANKS[easyRank];
  const easyPool=getEnemiesForDiff(easyDiff);
  const easyEnemy=easyPool[Math.floor(Math.random()*easyPool.length)]||ENEMIES[0];
  const eAiSpd=200+wv*20,eReact=clamp(.04+wv*.02,0,.35),eEH=BASE_PAD_H;
  const easyCfg={wv,boss:false,diff:easyDiff,aiSpd:eAiSpd,aiReact:eReact,eH:eEH,enemy:easyEnemy,trickAng:false,ghost:false,chaos:false,jitter:false};
  easyEnemy.mod(easyCfg);
  opponents.push({cfg:easyCfg,label:'EASY',labelCol:'#4a7'});

  // NORMAL: base rank, boss on schedule
  const normBoss=wv>2&&wv%3===0;
  const normDiff=normBoss?DIFF_RANKS[Math.min(baseRankIdx+1,DIFF_RANKS.length-1)]:DIFF_RANKS[baseRankIdx];
  const normPool=getEnemiesForDiff(normDiff);
  const normEnemy=normPool[Math.floor(Math.random()*normPool.length)]||ENEMIES[Math.min(baseRankIdx,ENEMIES.length-1)];
  // Below A rank: slow and dumb. A+ keeps real stats.
  const normRankIdx=DIFF_RANKS.indexOf(normDiff);
  let nAiSpd,nReact;
  if(normRankIdx>=5){ // A rank index=5
    nAiSpd=220+wv*30+(normBoss?80:0);nReact=clamp(.25+wv*.07+(normBoss?.15:0),0,.96);
  }else{
    nAiSpd=220+wv*22+(normBoss?50:0);nReact=clamp(.06+wv*.025+(normBoss?.06:0),0,.4);
  }
  const nEH=BASE_PAD_H;
  const normCfg={wv,boss:normBoss,diff:normDiff,aiSpd:nAiSpd,aiReact:nReact,eH:nEH,enemy:normEnemy,trickAng:false,ghost:false,chaos:false,jitter:false};
  normEnemy.mod(normCfg);
  opponents.push({cfg:normCfg,label:'NORMAL',labelCol:'#77a'});

  // HARD: two ranks above, frequent boss
  const hardRank=Math.min(baseRankIdx+2,DIFF_RANKS.length-1);
  const hardBoss=wv>1;
  const hardDiff=DIFF_RANKS[hardRank];
  const hardPool=getEnemiesForDiff(hardDiff);
  const hardEnemy=hardPool[Math.floor(Math.random()*hardPool.length)]||ENEMIES[Math.min(hardRank*2,ENEMIES.length-1)];
  let hAiSpd,hReact;
  if(hardRank>=5){ // A rank+
    hAiSpd=240+wv*35+(hardBoss?100:0);hReact=clamp(.3+wv*.08+(hardBoss?.2:0),0,.97);
  }else{
    hAiSpd=230+wv*25+(hardBoss?60:0);hReact=clamp(.08+wv*.03+(hardBoss?.08:0),0,.45);
  }
  const hEH=BASE_PAD_H;
  const hardCfg={wv,boss:hardBoss,diff:hardDiff,aiSpd:hAiSpd,aiReact:hReact,eH:hEH,enemy:hardEnemy,trickAng:false,ghost:false,chaos:false,jitter:false};
  hardEnemy.mod(hardCfg);
  opponents.push({cfg:hardCfg,label:'HARD',labelCol:'#d55'});

  return opponents;
}

function showOpponentSelect(){
  $('opp-wave-num').textContent=wave;
  const opps=generateOpponents(wave);

  const wb=$('opp-enemy-warn');
  if(enemyUps.length>0)wb.innerHTML=`<div style="color:#a66;font-size:8px;letter-spacing:3px;">${enemyUps.length} ENEMY BUFF${enemyUps.length>1?'S':''} ACTIVE</div>`;
  else wb.innerHTML='';

  const grid=$('opp-grid');grid.innerHTML='';

  opps.forEach(({cfg,label,labelCol})=>{
    const dc=DIFF_COLORS[cfg.diff]||'#fff';
    const dg=DIFF_GLOW[cfg.diff]||'255,255,255';
    const availTiers=DIFF_TIERS[cfg.diff]||['common'];

    const d=document.createElement('div');d.className='opp-card';
    d.style.setProperty('--dc',dc);

    let html=`<div style="font-size:8px;letter-spacing:5px;color:${labelCol};margin-bottom:8px;font-weight:700;">${label}</div>`;
    html+=`<div class="opp-diff" style="color:${dc}">${cfg.diff}</div>`;
    if(cfg.boss)html+=`<div class="opp-boss">\u2605 BOSS \u2605</div>`;
    html+=`<div class="opp-name">${cfg.enemy.name}</div>`;
    html+=`<div class="opp-tag">${cfg.enemy.tag||'\u00A0'}</div>`;

    // Enemy ability
    const eab=getEnemyAbil(cfg.enemy.id);
    if(eab.id!=='none'){
      html+=`<div style="margin:4px 0 6px;padding:4px 8px;border:1px solid rgba(255,80,80,0.15);border-radius:2px;background:rgba(255,40,40,0.04);">`;
      html+=`<div style="font-size:6.5px;letter-spacing:3px;color:#a66;margin-bottom:2px;">ABILITY</div>`;
      html+=`<div style="font-size:10px;color:#f88;letter-spacing:2px;">${eab.icon} ${eab.name}</div>`;
      html+=`<div style="font-size:7px;color:#a88;margin-top:2px;">${eab.desc}</div>`;
      html+=`</div>`;
    }

    // Stats
    const spdR=Math.min(Math.round(cfg.aiSpd/80),9);
    const iqR=Math.min(Math.round(cfg.aiReact*10),9);
    const szR=Math.min(Math.round(cfg.eH/20),9);
    html+=`<div class="opp-stats"><div class="opp-stat">SPD ${spdR}</div><div class="opp-stat">IQ ${iqR}</div><div class="opp-stat">SZ ${szR}</div></div>`;

    // Reward rarity tiers display
    html+=`<div class="opp-reward-box">`;
    html+=`<div class="opp-reward-label">POSSIBLE RARITIES</div>`;
    html+=`<div class="opp-tiers">`;
    availTiers.forEach(tier=>{
      const tc=TIER_COLORS[tier];const tg=TIER_GLOW[tier];
      const icon=TIER_ICON[tier];
      html+=`<div class="opp-tier-pill" style="color:${tc};border-color:color-mix(in srgb,${tc} 25%,#111);background:rgba(${tg},0.06)">${icon} ${TIER_NAMES[tier]}</div>`;
    });
    html+=`</div></div>`;

    html+=`<div class="opp-fight">FIGHT</div>`;

    d.innerHTML=html;
    d.onmouseenter=()=>{d.style.borderColor=dc;d.style.boxShadow=`0 0 30px rgba(${dg},.12),inset 0 0 20px rgba(${dg},.03)`;};
    d.onmouseleave=()=>{d.style.borderColor='#161616';d.style.boxShadow='none';};
    d.onclick=()=>{chosenOppCfg=cfg;SFX.sel();startWave(padId,wave);};
    grid.appendChild(d);
  });

  showScreen('opp-screen');
}
function showVictory(){const c=PCOL[padId];$('vic-title').style.textShadow=`0 0 30px ${c.g}0.3), 0 0 60px ${c.g}0.1)`;$('vic-info').textContent=`${PADDLES.find(p=>p.id===padId)?.name} \u00B7 COMPLETE`;showScreen('vic-screen');}

// ═══ INPUT ═══
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();keysDown[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k==='q')doAbility();if(e.key==='Enter')handleContinue();});
window.addEventListener('keyup',e=>{keysDown[e.key.toLowerCase()]=false;});
$('cv').addEventListener('click',()=>handleContinue());
$('go-retry').onclick=()=>{savedState=null;wave=1;enemyUps=[];chosenOppCfg=null;SFX.sel();showOpponentSelect();};
$('go-menu').onclick=()=>{savedState=null;wave=1;enemyUps=[];chosenOppCfg=null;showScreen('menu-screen');};
$('vic-again').onclick=()=>{savedState=null;wave=1;enemyUps=[];chosenOppCfg=null;showScreen('menu-screen');};

// ═══ DEV MODE ═══
let devPad='classic',devEnemy='basic',devBoss=false,devWave=6;
function showDevScreen(){
  // Build paddle selector
  const pg=$('dev-pad-grid');pg.innerHTML='';
  PADDLES.forEach(p=>{
    const c=PCOL[p.id];
    const d=document.createElement('div');
    d.style.cssText=`padding:8px 12px;cursor:pointer;border:1px solid ${devPad===p.id?c.p:'#1a1a1a'};border-radius:3px;background:${devPad===p.id?'rgba(255,255,255,0.04)':'#050508'};display:flex;align-items:center;gap:10px;transition:all 0.15s;`;
    d.innerHTML=`<div style="width:6px;height:6px;border-radius:50%;background:${c.p};box-shadow:0 0 6px ${c.p};flex-shrink:0;"></div><div><div style="font-size:10px;font-weight:700;letter-spacing:3px;color:${devPad===p.id?c.p:'#aaa'}">${p.name}</div><div style="font-size:7px;color:#776;letter-spacing:2px;margin-top:2px;">[Q] ${p.abil} - ${p.ainfo}</div></div>`;
    d.onclick=()=>{devPad=p.id;SFX.sel();showDevScreen();};
    d.onmouseenter=()=>{if(devPad!==p.id)d.style.borderColor='#333';};
    d.onmouseleave=()=>{if(devPad!==p.id)d.style.borderColor='#1a1a1a';};
    pg.appendChild(d);
  });
  // Build enemy selector
  const eg=$('dev-enemy-grid');eg.innerHTML='';
  ENEMIES.forEach(e=>{
    const dc=DIFF_COLORS[e.diff]||'#fff';
    const eab=getEnemyAbil(e.id);
    const sel=devEnemy===e.id;
    const d=document.createElement('div');
    d.style.cssText=`padding:6px 10px;cursor:pointer;border:1px solid ${sel?dc:'#1a1a1a'};border-radius:3px;background:${sel?'rgba(255,255,255,0.03)':'#050508'};display:flex;align-items:center;gap:8px;transition:all 0.15s;`;
    d.innerHTML=`<div style="font-size:9px;font-weight:900;color:${dc};width:28px;text-align:center;letter-spacing:1px;">${e.diff}</div><div style="flex:1;"><div style="font-size:9px;font-weight:700;letter-spacing:2px;color:${sel?'#eee':'#999'}">${e.name} <span style="color:#665;font-size:7px;">${e.tag}</span></div>${eab.id!=='none'?`<div style="font-size:6.5px;color:#a66;letter-spacing:1.5px;margin-top:1px;">${eab.icon} ${eab.name}</div>`:''}</div>`;
    d.onclick=()=>{devEnemy=e.id;SFX.sel();showDevScreen();};
    d.onmouseenter=()=>{if(!sel)d.style.borderColor='#333';};
    d.onmouseleave=()=>{if(!sel)d.style.borderColor='#1a1a1a';};
    eg.appendChild(d);
  });
  // Options
  const opts=$('dev-opts');opts.innerHTML='';
  // Boss toggle
  const bossD=document.createElement('div');
  bossD.style.cssText=`padding:8px 12px;cursor:pointer;border:1px solid ${devBoss?'#f66':'#1a1a1a'};border-radius:3px;background:${devBoss?'rgba(255,40,40,0.06)':'#050508'};transition:all 0.15s;`;
  bossD.innerHTML=`<div style="font-size:9px;font-weight:700;letter-spacing:3px;color:${devBoss?'#f66':'#666'};">\u2605 BOSS MODE: ${devBoss?'ON':'OFF'}</div>`;
  bossD.onclick=()=>{devBoss=!devBoss;SFX.sel();showDevScreen();};
  opts.appendChild(bossD);
  // Wave slider
  const wvD=document.createElement('div');
  wvD.style.cssText='padding:8px 12px;border:1px solid #1a1a1a;border-radius:3px;background:#050508;';
  wvD.innerHTML=`<div style="font-size:9px;font-weight:700;letter-spacing:3px;color:#999;margin-bottom:6px;">WAVE LEVEL: ${devWave}</div><input type="range" min="1" max="12" value="${devWave}" style="width:100%;accent-color:#f66;" id="dev-wave-slider">`;
  opts.appendChild(wvD);
  setTimeout(()=>{const sl=$('dev-wave-slider');if(sl)sl.oninput=e=>{devWave=parseInt(e.target.value);sl.parentElement.querySelector('div').textContent='WAVE LEVEL: '+devWave;};},0);

  showScreen('dev-screen');
}

function devLaunch(){
  const enemy=ENEMIES.find(e=>e.id===devEnemy)||ENEMIES[0];
  const wv=devWave;const boss=devBoss;
  const rankIdx=Math.min(Math.floor(wv/1.5),DIFF_RANKS.length-1);
  const diff=boss?DIFF_RANKS[Math.min(rankIdx+1,DIFF_RANKS.length-1)]:enemy.diff;
  const diffIdx=DIFF_RANKS.indexOf(diff);
  let aiSpd,aiReact;
  if(diffIdx>=5){aiSpd=220+wv*30+(boss?80:0);aiReact=clamp(.25+wv*.07+(boss?.15:0),0,.97);}
  else{aiSpd=220+wv*22+(boss?50:0);aiReact=clamp(.06+wv*.025+(boss?.06:0),0,.4);}
  const eH=BASE_PAD_H;
  const cfg={wv,boss,diff,aiSpd,aiReact,eH,enemy,trickAng:false,ghost:false,chaos:false,jitter:false};
  enemy.mod(cfg);
  savedState=null;wave=wv;enemyUps=[];chosenOppCfg=cfg;padId=devPad;
  g=newGame(devPad,wv,null,[],cfg);chosenOppCfg=null;showScreen(null);
  if(boss)setTimeout(SFX.boss,80);
}

$('dev-go').onclick=()=>{SFX.sel();devLaunch();};
$('dev-back').onclick=()=>{SFX.sel();showScreen('menu-screen');};

// ═══ GAME LOOP ═══
const cv=$('cv'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;let last=performance.now();
function resize(){cv.width=window.innerWidth;cv.height=window.innerHeight;}resize();window.addEventListener('resize',resize);
function loop(now){const dt=Math.min((now-last)/1000,.04);last=now;if(curScreen===null&&g){update(dt);draw(ctx,cv.width,cv.height);}requestAnimationFrame(loop);}
buildPadGrid();showScreen('menu-screen');requestAnimationFrame(loop);
