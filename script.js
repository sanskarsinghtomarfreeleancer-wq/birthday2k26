"use strict";

const PASSCODE=[1,1,1,1];
// Swap background music by changing this local asset path.
const MUSIC_FILE="Assets//Music//song.mp3";
const VOICE_NOTE_TEXT="Lovee, Happy birthday. You stayed, explored, and found every hidden corner. This note is for your patient heart.";
const SECTION_ORDER=["start","letters","memories","pause","stillus","ending"];
const SECTION_GRADIENTS={start:"linear-gradient(130deg,#4a1c3f 0%,#964a77 45%,#f3a6bd 100%)",letters:"linear-gradient(145deg,#5e294a 0%,#b05e8f 52%,#f2b7cd 100%)",memories:"linear-gradient(130deg,#3f1d3c 0%,#875084 48%,#f1a9c2 100%)",pause:"linear-gradient(150deg,#1d1221 0%,#33182f 48%,#483043 100%)",stillus:"linear-gradient(130deg,#422046 0%,#8f4e89 48%,#f2abc5 100%)",ending:"linear-gradient(135deg,#522843 0%,#9f5c7f 48%,#f6bfd1 100%)"};
const STORAGE_KEYS={eggs:"stillUsEggProgressV3",sections:"stillUsSectionProgressV3",vault:"stillUsVaultV3",hints:"stillUsHintProgressV1"};
const HAPPY_WORDS=new Set(["happy","love","laugh","home","glowing","always","birthday","favorite","calm"]);
const SAD_WORDS=new Set(["hardest","fear","stumbled","quiet","forgot","miss"]);
const TOTAL_EGGS=50;
const HINT_COOLDOWN_MS=10000;
const SUB_WAYPOINT_SESSION_KEY="stillUsSubWaypointSessionV1";
const SUB_WAYPOINT_HOVER_UNLOCK_MS=2200;
const SUB_WAYPOINT_REPEAT_CLICK_TARGET=4;
const SUB_WAYPOINT_REPEAT_CLICK_WINDOW_MS=4200;
const SUB_WAYPOINT_IDLE_UNLOCK_MS=45000;
const SUB_WAYPOINT_LONG_PRESS_MS=700;
const SUB_WAYPOINT_PATTERN=["letters","memories","letters","pause"];
const EXTRA_WAYPOINT_PRESS_MS=980;
const EXTRA_WAYPOINT_IDLE_MS=14000;
const EXTRA_WAYPOINT_SOUND_HOLD_MS=2200;
const EXTRA_WAYPOINT_NIGHT_START=23;
const EXTRA_WAYPOINT_NIGHT_END=5;
const EXTRA_WAYPOINT_SOUND_SUB_ID="memories-secret";
const EXTRA_WAYPOINT_PATIENCE_SUB_ID="pause-secret";
const EXTRA_WAYPOINT_NIGHT_SUB_ID="ending-secret";

const TEXT_CONTENT={lockCaption:"Somewhere between moments, your laughter became the sound I look for.",lockSubtitle:"Every number is a Our story",lockError:"That one was not ours. Try again, love.",lockSecret:"You found the every small thing hindden under big.",idleMessage:"Still here. Still yours.",lettersTitle:"Unsent Letters",memoriesTitle:"Little Frames of Us",pauseLine:"No words for a moment. Just breathe with me.",finalSecret:"You waited this long, so here is the soft truth: I would choose you in every timeline.",startLines:["Happy Birthday, my love.","This little world is stitched from the moments we never posted but never forgot.","Tonight, time slows down just for us :)"] ,stillUsLines:["Even when days get loud, your hand still feels like home.","We have changed, grown, stumbled, laughed, and somehow kept choosing each other.","Still us. Quietly. Wholeheartedly."],endingLines:["If I could gift you one thing, it would be the way I see you.","Brave. Tender. Glowing even on your hardest days.","Happy Birthday. Still us. Always us."],letters:[{time:"Drafted at 1:14 AM",message:"I miss your laugh even when you’re in the next room. It echoes in my chest, louder than silence. I look for it in walls, in pauses, in air. Being this close and still missing you feels illegal—like my heart forgot how distance works when you smile, time forgets me."},{time:"Drafted at 11:37 PM",message:"Some days I look at you and every old fear just dissolves. The doubts I carried for years suddenly feel small, almost embarrassed to exist. Your presence steadies me, rewrites my instincts, and reminds my heart that safety can be a person, not a place."},{time:"Drafted at 2:03 AM",message:"I know I am just dumb many time and overthink for no reason like hell and irritate you so much by being clingy overprotective and being old school I am actually scare to lose you that's why i do this kind of shit so please be with me and never leave me my love i am in love with you so har"}],
memories:[
  {image:"Assets/Image/Together/Pic 1.png", caption:"my kind of forever", whisper:"you looked at me and the whole cafe blurred"},
  {image:"Assets/Image/Together/Pic 2.png", caption:"perfectly ours", whisper:"our slowest walks somehow felt the fastest"},
  {image:"Assets/Image/Together/Pic 3.png", caption:"quiet mornings, loud hearts", whisper:"we learned silence can also say i love you"},
  {image:"Assets/Image/Together/Pic 4.png", caption:"still finding new reasons", whisper:"your smile still catches me off guard"}
]};

const state={enteredCode:[],isUnlocked:false,activeLayer:"a",currentGradient:"",appOpenedAt:Date.now(),wrongAttempts:0,decorativeSequence:"",foundEggs:new Set(),memoryEggRevealed:false,sectionCompletion:{start:true},maxUnlockedSection:0,currentSectionId:"start",vault:{memoryEggId:"egg01",passwordSalt:"",passwordCipher:"",passwordHash:"",allFoundAt:null,tempUnlockUntil:null,permanentAccess:false,permanentlyLocked:false},waypointVisited:new Set(),waypointTrail:[],letterHoverSet:new Set(),letterClickSet:new Set(),memoryHoverSet:new Set(),memoryClickSet:new Set(),popupClickCount:0,volumeChangeStamps:[],userVolume:0.8,previousVolumeBeforeMute:0.8,pauseDwellTimer:null,bottomReachedAt:null,secretHeartClicks:0,hintUsage:{},lastHintAt:0,subWaypointReached:new Set(),subWaypointUnlocked:new Set(),subWaypointClicks:{},subWaypointClickStamp:{},subWaypointPatternTrail:[],subWaypointPinnedParent:"",subWaypointManualOpenParent:"",subWaypointIdleTimerId:null,subWaypointHoverTimerId:null,subWaypointHoldTimerId:null,subWaypointPinTimerId:null,extraWaypointActiveSubId:"",extraWaypointIdleTimerId:null,extraWaypointHoldTimerId:null,extraWaypointSoundTimerId:null,extraWaypointSoundArmed:false,extraWaypointMomentFlags:{},extraWaypointSilentAwardFlags:{}};
const elements={};

document.addEventListener("DOMContentLoaded",init);

function init(){cacheElements();hydrateState();initLifetimePinFeature();applyTextContent();renderStoryContent();applySectionGradients();applyRevealStaggers();createFloatingHearts(elements.lockHearts,32,{min:10,max:24,dmin:16,dmax:30,delay:14,drift:70,omin:0.3,omax:0.72});createFloatingHearts(elements.globalHearts,50,{min:8,max:20,dmin:18,dmax:34,delay:20,drift:90,omin:0.22,omax:0.62});createSparkles(36);buildVisualizerBars();applySectionProgressVisuals();updateWaypointLocks();updateEggHud();setupPasscodeKeypad();setupWaypoints();setupSubWaypointSystem();setupSectionObserver();setupSectionInteractionTracking();setupSecretHeartEasterEgg();setupFinalWaypointLongPress();setupIdleWatcher();setupGlobalInteractionFX();setupVolumeControls();setupPopupInteractions();setupFakeIllusions();setupDragInteractions();setupLetterInteractions();setupMemoryInteractions();setupBackgroundInteractions();setupScrollEggs();setupResizeEggs();setupIndicatorInteractions();setupEmotionWordInteractions();setupEggHintSystem();initVoiceVaultControls();setBackgroundGradient(SECTION_GRADIENTS.start,true);markWaypointProgress("start");updateVoiceVaultState();if(state.vault.permanentlyLocked){activatePermanentLock();}}

function cacheElements(){elements.bgLayerA=document.getElementById("bg-layer-a");elements.bgLayerB=document.getElementById("bg-layer-b");elements.globalHearts=document.getElementById("global-hearts");elements.lockHearts=document.getElementById("lock-hearts");elements.sparkleField=document.getElementById("sparkle-field");elements.interactionLayer=document.getElementById("interaction-layer");elements.lockScreen=document.getElementById("lock-screen");elements.lockPanel=document.getElementById("lock-panel");elements.keypad=document.getElementById("keypad");elements.indicators=Array.from(document.querySelectorAll(".heart-indicator"));elements.errorMessage=document.getElementById("error-message");elements.unlockBurst=document.getElementById("unlock-burst");elements.lockSecretMessage=document.getElementById("lock-secret-message");elements.secretHeart=document.getElementById("secret-heart");elements.decorativeBow=document.querySelector(".decorative-bow");elements.polaroid=document.querySelector(".polaroid");elements.lockCaption=document.getElementById("lock-caption");elements.lockSubtitle=document.getElementById("lock-subtitle");elements.pauseLine=document.getElementById("pause-line");elements.idleMessage=document.getElementById("idle-message");elements.musicStatus=document.getElementById("music-status");elements.musicLabel=document.querySelector(".music-label");elements.lettersTitle=document.getElementById("letters-title");elements.memoriesTitle=document.getElementById("memories-title");elements.finalSecretLine=document.getElementById("final-secret-line");elements.startLines=document.getElementById("start-lines");elements.stillUsLines=document.getElementById("stillus-lines");elements.endingLines=document.getElementById("ending-lines");elements.lettersStack=document.getElementById("letters-stack");elements.memoryStack=document.getElementById("memory-stack");elements.sections=Array.from(document.querySelectorAll(".story-section"));elements.progressFill=document.getElementById("progress-fill");elements.waypointNav=document.getElementById("waypoint-nav");elements.waypointItems=Array.from(document.querySelectorAll(".waypoint-item"));elements.waypoints=Array.from(document.querySelectorAll(".waypoint"));elements.subWaypoints=Array.from(document.querySelectorAll(".sub-waypoint"));elements.subAnchors=Array.from(document.querySelectorAll(".sub-anchor-marker"));elements.finalWaypoint=document.getElementById("final-waypoint");elements.visualizer=document.getElementById("visualizer");elements.sweetPopup=document.getElementById("sweet-popup");elements.eggCountValue=document.getElementById("egg-count-value");elements.eggHint=document.getElementById("egg-hint");elements.hintButton=document.getElementById("egg-hint-btn");elements.eggFeedback=document.getElementById("egg-feedback");elements.volumeSlider=document.getElementById("volume-slider");elements.muteToggle=document.getElementById("mute-toggle");elements.voiceVaultSection=document.getElementById("voice-vault");elements.voiceVaultStatus=document.getElementById("voice-vault-status");elements.voiceVaultContent=document.getElementById("voice-vault-content");elements.voicePasswordPanel=document.getElementById("voice-password-panel");elements.voiceWindowTimer=document.getElementById("voice-window-timer");elements.voiceNoteCaption=document.getElementById("voice-note-caption");elements.playVoiceNote=document.getElementById("play-voice-note");elements.stopVoiceNote=document.getElementById("stop-voice-note");elements.vaultPasswordInput=document.getElementById("vault-password-input");elements.vaultPasswordSubmit=document.getElementById("vault-password-submit");elements.vaultPasswordFeedback=document.getElementById("vault-password-feedback");elements.fakeLoading=document.getElementById("fake-loading");elements.fakeLoadingClose=document.getElementById("fake-loading-close");elements.fakeError=document.getElementById("fake-error");elements.fakeErrorFix=document.getElementById("fake-error-fix");elements.fakeBug=document.getElementById("fake-bug");elements.permanentLockOverlay=document.getElementById("permanent-lock-overlay");elements.grainOverlay=document.getElementById("grain-overlay");}

function hydrateState(){const eggData=readJSON(STORAGE_KEYS.eggs,{found:[]});state.foundEggs=new Set((eggData.found||[]).filter(isValidEggId));const sectionData=readJSON(STORAGE_KEYS.sections,{completed:{start:true},maxUnlocked:0});state.sectionCompletion={start:true,...(sectionData.completed||{})};state.maxUnlockedSection=clamp(Number.isFinite(sectionData.maxUnlocked)?sectionData.maxUnlocked:0,0,SECTION_ORDER.length-1);const v=readJSON(STORAGE_KEYS.vault,null);if(v){state.vault={memoryEggId:isValidEggId(v.memoryEggId)?v.memoryEggId:"egg01",passwordSalt:typeof v.passwordSalt==="string"?v.passwordSalt:randomSalt(),passwordCipher:typeof v.passwordCipher==="string"?v.passwordCipher:"",passwordHash:typeof v.passwordHash==="string"?v.passwordHash:"",allFoundAt:Number.isFinite(v.allFoundAt)?v.allFoundAt:null,tempUnlockUntil:Number.isFinite(v.tempUnlockUntil)?v.tempUnlockUntil:null,permanentAccess:Boolean(v.permanentAccess),permanentlyLocked:Boolean(v.permanentlyLocked)};}else{state.vault.memoryEggId=`egg${String(randomInt(1,50)).padStart(2,"0")}`;state.vault.passwordSalt=randomSalt();}if(!state.vault.passwordCipher||!state.vault.passwordHash){generateVaultPassword();}const hintData=readJSON(STORAGE_KEYS.hints,{usage:{},lastHintAt:0});state.hintUsage=hintData&&typeof hintData.usage==="object"&&hintData.usage?hintData.usage:{};state.lastHintAt=Number.isFinite(hintData?.lastHintAt)?hintData.lastHintAt:0;const subData=readSessionJSON(SUB_WAYPOINT_SESSION_KEY,{reached:[],unlocked:[]});state.subWaypointReached=new Set((subData.reached||[]).filter((id)=>typeof id==="string"));state.subWaypointUnlocked=new Set((subData.unlocked||[]).filter((id)=>typeof id==="string"));saveEggState();saveSectionState();saveVaultState();saveHintState();saveSubWaypointSession();}

function generateVaultPassword(){const a=["moonlit","velvet","gentle","midnight","honey","rose","quiet","silver"];const b=["promise","heartbeat","memory","echo","garden","signal","chapter","bloom"];const phrase=`${pickRandom(a)} ${pickRandom(b)} ${randomInt(11,99)}`;state.vault.passwordCipher=encodePhrase(phrase);state.vault.passwordHash=hashString(`${normalizePassword(phrase)}|${state.vault.passwordSalt}`);} 

function saveEggState(){localStorage.setItem(STORAGE_KEYS.eggs,JSON.stringify({found:Array.from(state.foundEggs)}));}
function saveSectionState(){localStorage.setItem(STORAGE_KEYS.sections,JSON.stringify({completed:state.sectionCompletion,maxUnlocked:state.maxUnlockedSection}));}
function saveVaultState(){localStorage.setItem(STORAGE_KEYS.vault,JSON.stringify(state.vault));}
function saveHintState(){localStorage.setItem(STORAGE_KEYS.hints,JSON.stringify({usage:state.hintUsage,lastHintAt:state.lastHintAt}));}
function saveSubWaypointSession(){try{sessionStorage.setItem(SUB_WAYPOINT_SESSION_KEY,JSON.stringify({reached:Array.from(state.subWaypointReached),unlocked:Array.from(state.subWaypointUnlocked)}));}catch{}}
// Easter Egg Registry: exactly 50 unique IDs, globally tracked in localStorage.
const EASTER_EGGS=[
{id:"egg01",reward:"A tiny pulse answered your touch."},{id:"egg02",reward:"Rapid taps woke an old charm."},{id:"egg03",reward:"The decorative bow was never only decoration."},{id:"egg04",reward:"Holding still revealed hidden intent."},{id:"egg05",reward:"A long stare made the memory breathe."},{id:"egg06",reward:"Double tap confirmed this photo has history."},{id:"egg07",reward:"You moved the frame and shifted time."},{id:"egg08",reward:"The star key whispered first."},{id:"egg09",reward:"The hash key replied."},{id:"egg10",reward:"The sequence *#* opened a side trail."},
{id:"egg11",reward:"Even mistakes are part of this map."},{id:"egg12",reward:"Persistence got rewarded."},{id:"egg13",reward:"You unlocked it almost instantly."},{id:"egg14",reward:"You waited, and patience paid off."},{id:"egg15",reward:"No mistakes. Clean heartbeat."},{id:"egg16",reward:"One stumble, then exactly right."},{id:"egg17",reward:"The first heart indicator woke up."},{id:"egg18",reward:"All heart indicators responded."},{id:"egg19",reward:"The background answered your rhythm."},{id:"egg20",reward:"Lingering over the rail revealed a pulse."},
{id:"egg21",reward:"You visited every waypoint."},{id:"egg22",reward:"You found the non-obvious route."},{id:"egg23",reward:"Long press at the ending opened a whisper."},{id:"egg24",reward:"Quarter-way discovery logged."},{id:"egg25",reward:"Halfway mark discovered."},{id:"egg26",reward:"Three-quarter mark discovered."},{id:"egg27",reward:"You raced the page itself."},{id:"egg28",reward:"You stayed in silence long enough."},{id:"egg29",reward:"Silence still reacts when touched."},{id:"egg30",reward:"The first unsent letter softened."},
{id:"egg31",reward:"Every letter felt seen."},{id:"egg32",reward:"Every letter was opened emotionally."},{id:"egg33",reward:"One long hold unlocked unfinished emotion."},{id:"egg34",reward:"Every memory frame responded."},{id:"egg35",reward:"Every memory accepted your touch."},{id:"egg36",reward:"A moved memory changed perspective."},{id:"egg37",reward:"You tapped the whisper itself."},{id:"egg38",reward:"You caught a fleeting sweet message."},{id:"egg39",reward:"Three fleeting messages were captured."},{id:"egg40",reward:"Stillness for one minute unlocked a whisper."},
{id:"egg41",reward:"Deep stillness unlocked a second whisper."},{id:"egg42",reward:"Silence was treated like a clue."},{id:"egg43",reward:"Loud enough to light the room."},{id:"egg44",reward:"Rapid volume shifts triggered a reaction."},{id:"egg45",reward:"Mute and unmute counted as a ritual."},{id:"egg46",reward:"You survived the fake loading ritual."},{id:"egg47",reward:"You repaired a fake emotional overflow."},{id:"egg48",reward:"You caught the floating fake bug."},{id:"egg49",reward:"You squeezed the viewport to tiny size."},{id:"egg50",reward:"You stretched the viewport to cinema size."}
];
const EGG_LOOKUP=Object.fromEntries(EASTER_EGGS.map((e)=>[e.id,e]));
const EGG_HINTS={
egg01:"The tiniest heart on the lock panel can answer taps.",
egg02:"The hidden heart responds to a repeated rhythm.",
egg03:"The decorative bow is not only decoration.",
egg04:"Hold the bow a little longer instead of tapping.",
egg05:"Let your cursor rest on the lock photo for a few seconds.",
egg06:"Try a double click on the lock photo.",
egg07:"Drag the lock photo farther than a small nudge.",
egg08:"Decorative keypad symbols can be clues too.",
egg09:"Try the other decorative keypad symbol as well.",
egg10:"A short decorative keypad sequence opens one path.",
egg11:"A first wrong passcode still leaves a trace.",
egg12:"Persistence with wrong tries reveals another trace.",
egg13:"Very fast correct unlock gets noticed.",
egg14:"A delayed correct unlock also gets noticed.",
egg15:"A clean unlock run has a reward.",
egg16:"A one-mistake unlock run has a reward too.",
egg17:"The first heart indicator is touchable.",
egg18:"Touch every heart indicator one by one.",
egg19:"The background itself reacts to a double click.",
egg20:"Stay hovering on the waypoint rail patiently.",
egg21:"Visit every waypoint chapter at least once.",
egg22:"Use a non-linear waypoint route, not just top to bottom.",
egg23:"Long-press the final waypoint.",
egg24:"Scroll to roughly the first quarter.",
egg25:"Scroll to the halfway point.",
egg26:"Scroll to the three-quarter point.",
egg27:"Race from bottom back to top quickly.",
egg28:"Remain in the pause section for a while.",
egg29:"Touch the quiet line in the pause card.",
egg30:"Hover the first unsent letter card patiently.",
egg31:"Hover every unsent letter card.",
egg32:"Tap every unsent letter card.",
egg33:"Long-hold on a letter card.",
egg34:"Hover every memory polaroid.",
egg35:"Tap every memory polaroid.",
egg36:"Drag one memory card with intention.",
egg37:"The whisper text on memories is clickable.",
egg38:"Catch and tap one fleeting popup before it fades.",
egg39:"Catch and tap multiple fleeting popups.",
egg40:"Stillness for around one minute can unlock one.",
egg41:"Deeper stillness for around two minutes unlocks another.",
egg42:"Bring volume all the way down to silence.",
egg43:"Push volume almost all the way up.",
egg44:"Move the volume slider quickly several times.",
egg45:"Use the mute button ritual.",
egg46:"There is a fake loading moment you can dismiss.",
egg47:"There is a fake error moment you can fix.",
egg48:"A tiny fake bug appears sometimes. Catch it.",
egg49:"Try a very narrow viewport width.",
egg50:"Try a very wide cinematic viewport."
};
const EXTRA_WAYPOINT_IDS=["start-secret","letters-secret","memories-secret","pause-secret","stillus-secret","ending-secret"];
const EXTRA_WAYPOINT_LINES={
  "start-secret":{tap:"You found the first hidden breath.",hold:"Hold long enough and beginnings feel brave again.",idle:"Patience made the start glow softly."},
  "letters-secret":{tap:"An unsent line folded itself toward you.",hold:"Long press and the letter says: stay gentle.",idle:"Silence between words can still be love."},
  "memories-secret":{tap:"This memory listens before it speaks.",hold:"Keep holding; the old room gets warmer.",idle:"Stillness turns static into a heartbeat.",sound:"Tune the volume until the memory pulse settles."},
  "pause-secret":{tap:"Even pauses can answer quietly.",hold:"Hold here. Let the silence choose you back.",idle:"You waited. The quiet noticed."},
  "stillus-secret":{tap:"Still us, in smaller constellations too.",hold:"Press and hold. The line becomes a promise.",idle:"You stayed long enough to hear the softer yes."},
  "ending-secret":{tap:"Not every ending closes; some just exhale.",hold:"Hold this last point and it softens.",idle:"A patient ending feels like home.",night:"This one wakes late. Come back after 11 PM."}
};

function applyTextContent(){elements.lockCaption.textContent=TEXT_CONTENT.lockCaption;elements.lockSubtitle.textContent=TEXT_CONTENT.lockSubtitle;elements.errorMessage.textContent=TEXT_CONTENT.lockError;elements.lockSecretMessage.textContent=TEXT_CONTENT.lockSecret;elements.pauseLine.textContent=TEXT_CONTENT.pauseLine;elements.idleMessage.textContent=TEXT_CONTENT.idleMessage;elements.lettersTitle.textContent=TEXT_CONTENT.lettersTitle;elements.memoriesTitle.textContent=TEXT_CONTENT.memoriesTitle;elements.finalSecretLine.textContent=TEXT_CONTENT.finalSecret;}
function renderStoryContent(){renderLineGroup(elements.startLines,TEXT_CONTENT.startLines);renderLineGroup(elements.stillUsLines,TEXT_CONTENT.stillUsLines);renderLineGroup(elements.endingLines,TEXT_CONTENT.endingLines);renderLetters();renderMemories();}
function renderLineGroup(container,lines){container.innerHTML="";lines.forEach((lineText)=>{const line=document.createElement("p");line.className="reveal-line";if(lineText.includes(":)")){const parts=lineText.split(":)");line.classList.add("wiggle");appendEmotionText(line,parts[0]);line.append(createSmileNode());if(parts[1])appendEmotionText(line,parts[1]);}else{appendEmotionText(line,lineText);}container.append(line);});}
function appendEmotionText(parent,text){text.split(/(\s+)/).forEach((token)=>{if(!token.trim()){parent.append(document.createTextNode(token));return;}const cleaned=token.toLowerCase().replace(/[^a-z]/g,"");if(HAPPY_WORDS.has(cleaned)||SAD_WORDS.has(cleaned)){const span=document.createElement("span");span.className=`emotion-word ${HAPPY_WORDS.has(cleaned)?"happy":"sad"}`;span.textContent=token;parent.append(span);}else{parent.append(document.createTextNode(token));}});}
function createSmileNode(){const smile=document.createElement("span"),colon=document.createElement("span"),paren=document.createElement("span");smile.className="smile-morph";colon.className="smile-colon";paren.className="smile-paren";colon.textContent=":";paren.textContent=")";smile.append(colon,paren);return smile;}
function renderLetters(){elements.lettersStack.innerHTML="";TEXT_CONTENT.letters.forEach((entry,index)=>{const card=document.createElement("article"),time=document.createElement("p"),text=document.createElement("p");card.className="dm-card reveal-line interactive-letter";card.dataset.letterIndex=String(index);if(index%2!==0)card.classList.add("reply");card.style.setProperty("--card-tilt",`${(index%2===0?-2+index*0.5:2.1+index*0.3).toFixed(1)}deg`);time.className="dm-time";text.className="dm-text";time.textContent=entry.time;text.textContent=entry.message;card.append(time,text);elements.lettersStack.append(card);});}
function renderMemories(){elements.memoryStack.innerHTML="";const layout=[{left:"4%",top:"20px",tilt:"-7deg"},{left:"35%",top:"92px",tilt:"4deg"},{left:"63%",top:"28px",tilt:"-4deg"},{left:"18%",top:"248px",tilt:"6deg"}];TEXT_CONTENT.memories.forEach((memory,index)=>{const L=layout[index%layout.length],frame=document.createElement("figure"),image=document.createElement("img"),caption=document.createElement("figcaption"),whisper=document.createElement("span");frame.className="memory-polaroid reveal-line interactive-memory";frame.dataset.memoryIndex=String(index);frame.style.setProperty("--memory-left",L.left);frame.style.setProperty("--memory-top",L.top);frame.style.setProperty("--tilt",L.tilt);image.src=memory.image;image.alt=memory.caption;caption.textContent=memory.caption;whisper.className="whisper";whisper.textContent=memory.whisper;frame.append(image,caption,whisper);elements.memoryStack.append(frame);});}
function applySectionGradients(){Object.entries(SECTION_GRADIENTS).forEach(([id,g])=>{const s=document.getElementById(id);if(s)s.dataset.gradient=g;});}
function applyRevealStaggers(){elements.sections.forEach((section)=>{Array.from(section.querySelectorAll(".reveal-line")).forEach((line,index)=>{line.style.transitionDelay=`${index*120}ms`;});});}
function createFloatingHearts(container,count,cfg){container.innerHTML="";for(let i=0;i<count;i+=1){const h=document.createElement("span");h.className="float-heart";h.textContent="\u2665";h.style.left=`${randomBetween(0,100).toFixed(2)}%`;h.style.setProperty("--heart-size",`${randomBetween(cfg.min,cfg.max).toFixed(1)}px`);h.style.setProperty("--heart-duration",`${randomBetween(cfg.dmin,cfg.dmax).toFixed(2)}s`);h.style.setProperty("--heart-delay",`${randomBetween(0,cfg.delay).toFixed(2)}s`);h.style.setProperty("--heart-drift",`${randomBetween(-cfg.drift,cfg.drift).toFixed(1)}px`);h.style.setProperty("--heart-opacity",`${randomBetween(cfg.omin,cfg.omax).toFixed(2)}`);container.append(h);}}
function createSparkles(count){elements.sparkleField.innerHTML="";for(let i=0;i<count;i+=1){const s=document.createElement("span");s.className="sparkle";s.style.left=`${randomBetween(0,100).toFixed(2)}%`;s.style.top=`${randomBetween(0,100).toFixed(2)}%`;s.style.setProperty("--sparkle-duration",`${randomBetween(3.4,8.8).toFixed(2)}s`);s.style.setProperty("--sparkle-delay",`${randomBetween(0,6).toFixed(2)}s`);elements.sparkleField.append(s);}}
function setBackgroundGradient(gradient,immediate=false){if(gradient===state.currentGradient)return;const incoming=state.activeLayer==="a"?elements.bgLayerB:elements.bgLayerA;const outgoing=state.activeLayer==="a"?elements.bgLayerA:elements.bgLayerB;const t=immediate?"0ms":"";incoming.style.transitionDuration=t;outgoing.style.transitionDuration=t;incoming.style.background=gradient;incoming.style.opacity="1";outgoing.style.opacity="0";state.activeLayer=state.activeLayer==="a"?"b":"a";state.currentGradient=gradient;}
function updateEggHud(){elements.eggCountValue.textContent=String(state.foundEggs.size);elements.eggHint.textContent=state.foundEggs.size>=TOTAL_EGGS?"All eggs found. The Voice Note Vault is now active.":`Find hidden moments. ${TOTAL_EGGS-state.foundEggs.size} remaining.`;}
// Easter Egg unlock handler: reward UI + persistence + final vault trigger.
function unlockEgg(eggId,customText="",point=null){if(!isValidEggId(eggId)||state.foundEggs.has(eggId)||state.vault.permanentlyLocked)return false;state.foundEggs.add(eggId);saveEggState();updateEggHud();const egg=EGG_LOOKUP[eggId];showEggFeedback(`Egg ${state.foundEggs.size}/50 - ${customText||egg.reward}`);playEggRewardTone();spawnTinyRewardBurst(point);if(eggId===state.vault.memoryEggId&&!state.memoryEggRevealed){state.memoryEggRevealed=true;setTimeout(revealMemoryPasswordClue,600);} // lifetime PIN reveal when assigned egg is opened
if(state.vault.lifetimePinAssigned && eggId===state.vault.lifetimeEggId && !state.vault.lifetimePinShown){state.vault.lifetimePinShown=true;saveVaultState();showLifetimePinPopup(state.vault.lifetimePin);}if(state.foundEggs.size===TOTAL_EGGS)onAllEggsFound();return true;}
window.unlockEgg=unlockEgg;
function revealMemoryPasswordClue(){const password=decodePhrase(state.vault.passwordCipher);if(password)showEggFeedback(`Remember this. It's going to help you later. ${password}`);}
function onAllEggsFound(){const now=Date.now();if(!state.vault.allFoundAt){state.vault.allFoundAt=now;state.vault.tempUnlockUntil=now+48*60*60*1000;saveVaultState();}showEggFeedback("All 50 discovered. Voice Note Vault unlocked for 48 hours.");updateVoiceVaultState();}
function showEggFeedback(message){elements.eggFeedback.textContent=message;elements.eggFeedback.classList.add("show");setTimeout(()=>elements.eggFeedback.classList.remove("show"),3200);} 
function spawnTinyRewardBurst(point){const x=point?.x??window.innerWidth*0.5,y=point?.y??84;for(let i=0;i<10;i+=1){const p=document.createElement("span");p.className="tap-heart";p.textContent="\u2665";p.style.left=`${x+randomBetween(-50,50)}px`;p.style.top=`${y+randomBetween(-10,10)}px`;p.style.animationDelay=`${(i*0.02).toFixed(2)}s`;elements.interactionLayer.append(p);setTimeout(()=>p.remove(),760);}}
function playEggRewardTone(){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A(),n=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type="triangle";o.frequency.setValueAtTime(620,n);o.frequency.exponentialRampToValueAtTime(1040,n+0.2);g.gain.setValueAtTime(0.0001,n);g.gain.exponentialRampToValueAtTime(0.08,n+0.05);g.gain.exponentialRampToValueAtTime(0.0001,n+0.38);o.connect(g);g.connect(c.destination);o.start(n);o.stop(n+0.4);setTimeout(()=>c.close(),550);} 

// Hint Engine: gives a gentle clue for the next missing Easter Egg.
function setupEggHintSystem(){if(!elements.hintButton)return;elements.hintButton.addEventListener("click",requestEggHint);}
function requestEggHint(){if(state.vault.permanentlyLocked){showEggFeedback("Hints are sealed because this memory is locked.");return;}if(!state.isUnlocked){showEggFeedback("Unlock the passcode first. Hints wake after entry.");return;}if(state.foundEggs.size>=TOTAL_EGGS){showEggFeedback("No hint needed. You found every hidden moment.");return;}const now=Date.now(),remaining=Math.max(0,Math.ceil((HINT_COOLDOWN_MS-(now-state.lastHintAt))/1000));if(now-state.lastHintAt<HINT_COOLDOWN_MS){showEggFeedback(`Hint is resting. Try again in ${remaining}s.`);return;}const targetEggId=pickNextHintEggId();if(!targetEggId){showEggFeedback("No hint available right now.");return;}const hintText=EGG_HINTS[targetEggId]||"Try slower touches, holds, and repeated rituals.";state.lastHintAt=now;state.hintUsage[targetEggId]=(Number(state.hintUsage[targetEggId])||0)+1;saveHintState();elements.eggHint.textContent=`Hint: ${hintText}`;showEggFeedback(`Hint: ${hintText}`);playHintTone();}
function pickNextHintEggId(){for(let i=1;i<=TOTAL_EGGS;i+=1){const id=`egg${String(i).padStart(2,"0")}`;if(!state.foundEggs.has(id))return id;}return"";}
function playHintTone(){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A(),n=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.setValueAtTime(340,n);o.frequency.exponentialRampToValueAtTime(430,n+0.26);g.gain.setValueAtTime(0.0001,n);g.gain.exponentialRampToValueAtTime(0.04,n+0.06);g.gain.exponentialRampToValueAtTime(0.0001,n+0.34);o.connect(g);g.connect(c.destination);o.start(n);o.stop(n+0.36);setTimeout(()=>c.close(),520);}

function setupPasscodeKeypad(){elements.keypad.addEventListener("click",(event)=>{if(state.vault.permanentlyLocked)return;const key=event.target.closest(".keypad-key");if(!key||state.isUnlocked)return;const value=key.dataset.value||"";if(!/[0-9]/.test(value)){if(value==="*")unlockEgg("egg08","The star key shimmered.",pointerPointFromEvent(event));if(value==="#")unlockEgg("egg09","The hash key hummed.",pointerPointFromEvent(event));state.decorativeSequence=`${state.decorativeSequence}${value}`.slice(-3);if(state.decorativeSequence==="*#*")unlockEgg("egg10","Decorative sequence accepted.",pointerPointFromEvent(event));sparkIndicators();return;}if(state.enteredCode.length>=PASSCODE.length)return;state.enteredCode.push(Number(value));updateHeartIndicators();if(state.enteredCode.length===PASSCODE.length)verifyPasscode();});}
function updateHeartIndicators(){elements.indicators.forEach((indicator,index)=>indicator.classList.toggle("filled",index<state.enteredCode.length));}
function sparkIndicators(){elements.indicators.forEach((indicator)=>{indicator.classList.remove("spark");void indicator.offsetWidth;indicator.classList.add("spark");});}
function verifyPasscode(){const ok=PASSCODE.every((d,i)=>d===state.enteredCode[i]);if(ok){unlockExperience();return;}showWrongPasscodeState();}
function showWrongPasscodeState(){state.wrongAttempts+=1;if(state.wrongAttempts===1)unlockEgg("egg11","Even the first miss was noticed.");if(state.wrongAttempts===3)unlockEgg("egg12","Three misses unlocked stubborn tenderness.");elements.lockPanel.classList.remove("shake");void elements.lockPanel.offsetWidth;elements.lockPanel.classList.add("shake");elements.errorMessage.classList.add("visible");setTimeout(()=>elements.errorMessage.classList.remove("visible"),1600);setTimeout(resetPasscode,650);} 
function resetPasscode(){state.enteredCode=[];updateHeartIndicators();}
function unlockExperience(){if(state.isUnlocked||state.vault.permanentlyLocked)return;state.isUnlocked=true;const elapsed=Date.now()-state.appOpenedAt;if(elapsed<=12000)unlockEgg("egg13","Fast unlock speed detected.");if(elapsed>=45000)unlockEgg("egg14","You waited before unlocking.");if(state.wrongAttempts===0)unlockEgg("egg15","Perfect unlock run.");if(state.wrongAttempts===1)unlockEgg("egg16","One stumble then perfect recovery.");playUnlockTone();spawnHeartBurst();document.body.classList.remove("is-locked");document.body.classList.add("experience-active");elements.lockScreen.classList.add("unlocking");revealStartSection();startMusic();startSweetMessages();resetIdleTimer();startFakeBugLoop();setTimeout(()=>elements.lockScreen.setAttribute("aria-hidden","true"),900);} 
function revealStartSection(){document.getElementById("start")?.classList.add("in-view");markSectionComplete("start");}
function playUnlockTone(){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;const c=new A(),n=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type="sine";o.frequency.setValueAtTime(520,n);o.frequency.exponentialRampToValueAtTime(860,n+0.28);g.gain.setValueAtTime(0.0001,n);g.gain.exponentialRampToValueAtTime(0.11,n+0.06);g.gain.exponentialRampToValueAtTime(0.0001,n+0.45);o.connect(g);g.connect(c.destination);o.start(n);o.stop(n+0.48);setTimeout(()=>c.close(),700);} 
function spawnHeartBurst(){const r=elements.lockPanel.getBoundingClientRect(),x=r.left+r.width*0.72,y=r.top+r.height*0.52;for(let i=0;i<24;i+=1){const h=document.createElement("span"),a=randomBetween(0,Math.PI*2),d=randomBetween(80,220);h.className="burst-heart";h.textContent="\u2665";h.style.left=`${x}px`;h.style.top=`${y}px`;h.style.setProperty("--burst-x",`${Math.cos(a)*d}px`);h.style.setProperty("--burst-y",`${Math.sin(a)*d}px`);h.style.animationDelay=`${(i*0.015).toFixed(2)}s`;elements.unlockBurst.append(h);setTimeout(()=>h.remove(),1000);}}

function setupWaypoints(){elements.waypoints.forEach((waypoint)=>{const sectionId=waypoint.dataset.target||"";if(!sectionId)return;waypoint.addEventListener("click",(event)=>{if(state.vault.permanentlyLocked)return;if(event.shiftKey)revealHiddenSubWaypointsForParent(sectionId,{reason:"Admin reveal enabled.",award:false});registerSubWaypointClickPattern(sectionId);registerSubWaypointRepeatClicks(sectionId);pinSubWaypointPanel(sectionId,3400,false);const section=document.getElementById(sectionId);if(!section)return;const index=SECTION_ORDER.indexOf(sectionId);if(index>state.maxUnlockedSection){showEggFeedback("This chapter unlocks after interacting with the previous one.");return;}section.scrollIntoView({behavior:"smooth",block:"start"});state.waypointVisited.add(sectionId);if(state.waypointVisited.size===SECTION_ORDER.length)unlockEgg("egg21","All waypoints visited.");state.waypointTrail.push(sectionId);state.waypointTrail=state.waypointTrail.slice(-6);if(arraysMatch(state.waypointTrail,["start","memories","letters","pause","stillus","ending"]))unlockEgg("egg22","Zigzag waypoint route found.");refreshSubWaypointPanels();});waypoint.addEventListener("mouseenter",()=>{openSubWaypointPanel(sectionId);startSubWaypointHoverUnlock(sectionId);});waypoint.addEventListener("mouseleave",()=>{clearTimeout(state.subWaypointHoverTimerId);closeSubWaypointPanel(sectionId);});waypoint.addEventListener("focus",()=>openSubWaypointPanel(sectionId));waypoint.addEventListener("blur",()=>closeSubWaypointPanel(sectionId));setupMainWaypointLongPress(waypoint,sectionId);});let t=null;elements.waypointNav.addEventListener("mouseenter",()=>{clearTimeout(t);t=setTimeout(()=>unlockEgg("egg20","You lingered over the waypoint rail."),5000);});elements.waypointNav.addEventListener("mouseleave",()=>clearTimeout(t));}
function updateWaypointLocks(){elements.waypoints.forEach((w,i)=>{const locked=i>state.maxUnlockedSection,parent=w.dataset.target||"";w.classList.toggle("locked",locked);elements.subWaypoints.filter((sub)=>sub.dataset.parent===parent).forEach((sub)=>{sub.disabled=locked||isSubWaypointHiddenLocked(sub);});});refreshSubWaypointPanels();}
function setupSectionObserver(){const ob=new IntersectionObserver((entries)=>{entries.forEach((entry)=>{if(!entry.isIntersecting)return;const section=entry.target,id=section.id;section.classList.add("in-view");setBackgroundGradient(section.dataset.gradient||SECTION_GRADIENTS.start);state.currentSectionId=id;markWaypointProgress(id);document.body.classList.toggle("quiet-mode",id==="pause");if(id==="pause"){clearTimeout(state.pauseDwellTimer);state.pauseDwellTimer=setTimeout(()=>{if(state.currentSectionId==="pause")unlockEgg("egg28","You stayed inside the quiet section.");},8000);}else{clearTimeout(state.pauseDwellTimer);}});},{threshold:0.5});elements.sections.forEach((s)=>ob.observe(s));}
function setupSectionInteractionTracking(){SECTION_ORDER.forEach((id)=>{const s=document.getElementById(id);if(!s)return;const mark=()=>markSectionComplete(id);s.addEventListener("click",mark);s.addEventListener("mouseenter",mark);s.addEventListener("touchstart",mark,{passive:true});});elements.pauseLine.addEventListener("click",(e)=>{markSectionComplete("pause");unlockEgg("egg29","You touched the quiet line.",pointerPointFromEvent(e));});}
function markSectionComplete(sectionId){const i=SECTION_ORDER.indexOf(sectionId);if(i===-1)return;if(!state.sectionCompletion[sectionId]){state.sectionCompletion[sectionId]=true;document.getElementById(sectionId)?.classList.add("section-complete");state.maxUnlockedSection=Math.max(state.maxUnlockedSection,Math.min(i+1,SECTION_ORDER.length-1));saveSectionState();updateWaypointLocks();}}
function markWaypointProgress(sectionId){const idx=SECTION_ORDER.indexOf(sectionId);if(idx===-1)return;elements.waypoints.forEach((w)=>{const t=w.dataset.target||"";w.classList.toggle("completed",Boolean(state.sectionCompletion[t]));w.classList.toggle("active",t===sectionId);});elements.progressFill.style.height=`${((idx/(SECTION_ORDER.length-1))*100).toFixed(2)}%`;refreshSubWaypointPanels();}
function applySectionProgressVisuals(){SECTION_ORDER.forEach((id)=>{if(state.sectionCompletion[id])document.getElementById(id)?.classList.add("section-complete");});refreshSubWaypointProgressUI();}

// Sub-waypoint system: tiny child checkpoints for each main waypoint.
// Progress is stored in sessionStorage so it persists only for the current browser session.
function setupSubWaypointSystem(){applySubWaypointVisibility();setupSubWaypointButtons();setupSubWaypointAnchorObserver();setupSubWaypointIdleUnlockWatcher();setupExtraWaypointMoments();refreshSubWaypointProgressUI();refreshSubWaypointPanels();}
function setupSubWaypointButtons(){elements.subWaypoints.forEach((sub)=>{sub.addEventListener("click",()=>{if(state.vault.permanentlyLocked)return;if(isSubWaypointHiddenLocked(sub))return;const parentId=sub.dataset.parent||"",anchorId=sub.dataset.anchor||"",parentIndex=SECTION_ORDER.indexOf(parentId);if(parentIndex>state.maxUnlockedSection){showEggFeedback("This chapter unlocks after interacting with the previous one.");return;}const anchor=document.getElementById(anchorId);if(anchor)anchor.scrollIntoView({behavior:"smooth",block:"start"});markSectionComplete(parentId);markSubWaypointReached(sub.dataset.subId||"",parentId);setActiveSubWaypoint(sub.dataset.subId||"");handleExtraWaypointMoment(sub,"tap");});});}
// Natural scroll progression auto-activates and completes sub-waypoints when anchors cross the view center.
function setupSubWaypointAnchorObserver(){if(!elements.subAnchors.length)return;const observer=new IntersectionObserver((entries)=>{entries.forEach((entry)=>{if(!entry.isIntersecting)return;const anchorId=entry.target.id,sub=elements.subWaypoints.find((item)=>item.dataset.anchor===anchorId);if(!sub||isSubWaypointHiddenLocked(sub))return;const subId=sub.dataset.subId||"",parentId=sub.dataset.parent||"";markSubWaypointReached(subId,parentId);setActiveSubWaypoint(subId);});},{root:null,rootMargin:"-45% 0px -45% 0px",threshold:0});elements.subAnchors.forEach((anchor)=>observer.observe(anchor));}
function setupSubWaypointIdleUnlockWatcher(){const reset=()=>{resetSubWaypointIdleUnlockTimer();resetExtraWaypointIdleTimer();};["mousemove","touchstart","scroll","pointerdown"].forEach((eventName)=>document.addEventListener(eventName,reset,{passive:true}));["click","keydown"].forEach((eventName)=>document.addEventListener(eventName,reset));resetSubWaypointIdleUnlockTimer();}
function resetSubWaypointIdleUnlockTimer(){clearTimeout(state.subWaypointIdleTimerId);state.subWaypointIdleTimerId=setTimeout(()=>{if(!state.isUnlocked||state.vault.permanentlyLocked)return;revealHiddenSubWaypointsByRule("idle","You stayed still, and a small star opened.");},SUB_WAYPOINT_IDLE_UNLOCK_MS);}
function initLifetimePinFeature(){try{
  const now=Date.now();
  if(!state.vault.lifetimeStartAt){state.vault.lifetimeStartAt=now;state.vault.lifetimeDisableAt=now + 48*60*60*1000;saveVaultState();}
  // If disable time already passed and no PIN assigned yet, assign immediately
  if(Date.now() >= (state.vault.lifetimeDisableAt||0) && !state.vault.lifetimePinAssigned){assignLifetimePinToRandomEgg();}
  else if(!state.vault.lifetimePinAssigned){const ms=(state.vault.lifetimeDisableAt||0)-Date.now();if(ms>0){setTimeout(()=>{assignLifetimePinToRandomEgg();},ms+1000);}}
}catch(e){}
}

function assignLifetimePinToRandomEgg(){try{
  if(state.vault.lifetimePinAssigned) return;
  const pin=String(Math.floor(1000+Math.random()*9000));
  const eggObj=pickRandom(EASTER_EGGS)||EASTER_EGGS[0];
  const eggId=eggObj?.id||"egg01";
  state.vault.lifetimePin=pin;
  state.vault.lifetimeEggId=eggId;
  state.vault.lifetimePinAssigned=true;
  state.vault.lifetimePinShown=false;
  // add a subtle hint to the egg hint list so it's discoverable
  EGG_HINTS[eggId]= (EGG_HINTS[eggId] || "") + " A secret number hides here.";
  saveVaultState();
}catch(e){}
}

function showLifetimePinPopup(pin){try{
  if(!elements.sweetPopup) return;
  const prev=elements.sweetPopup.textContent;
  elements.sweetPopup.textContent=`Memorize this number for lifetime access: ${pin}`;
  elements.sweetPopup.classList.add("show","clickable");
  // auto-hide after 10s and restore previous content
  setTimeout(()=>{elements.sweetPopup.classList.remove("show","clickable");elements.sweetPopup.textContent=prev;},10000);
}catch(e){}
}

// Password Memory Mechanic: correct guess restores forever, wrong guess locks permanently.
function submitVaultPassword(){const raw=elements.vaultPasswordInput.value||"";const guessRaw=normalizePassword(raw);if(!guessRaw){elements.vaultPasswordFeedback.textContent="Please enter the remembered phrase.";return;} // numeric 1111 expiry check
if(guessRaw==="1111" && state.vault.lifetimeDisableAt && Date.now()>=state.vault.lifetimeDisableAt){elements.vaultPasswordFeedback.textContent="This numeric password has expired.";return;} // accept lifetime PIN if user memorized it from the egg
if(state.vault.lifetimePin && guessRaw===String(state.vault.lifetimePin)){state.vault.permanentAccess=true;saveVaultState();elements.vaultPasswordFeedback.textContent="Correct. Permanent access restored forever.";updateVoiceVaultState();return;}const hash=hashString(`${guessRaw}|${state.vault.passwordSalt}`);if(hash===state.vault.passwordHash){state.vault.permanentAccess=true;saveVaultState();elements.vaultPasswordFeedback.textContent="Correct. Permanent access restored forever.";updateVoiceVaultState();return;}state.vault.permanentlyLocked=true;saveVaultState();activatePermanentLock();}
function activatePermanentLock(){document.body.classList.add("perma-locked");elements.permanentLockOverlay.classList.remove("hidden-panel");stopVoiceNote();if(state.audioElement)state.audioElement.pause();if(state.fallbackOscillators?.length){state.fallbackOscillators.forEach((o)=>{try{o.stop();}catch{}});}}
function readSessionJSON(key,fallback){try{const raw=sessionStorage.getItem(key);if(!raw)return fallback;const parsed=JSON.parse(raw);return parsed??fallback;}catch{return fallback;}}
function readJSON(key,fallback){try{const raw=localStorage.getItem(key);if(!raw)return fallback;const parsed=JSON.parse(raw);return parsed??fallback;}catch{return fallback;}}
function isValidEggId(id){return /^egg\d{2}$/.test(id)&&Number(id.slice(3))>=1&&Number(id.slice(3))<=50;}
function pointerPointFromEvent(event){if(!event)return null;const x=Number.isFinite(event.clientX)?event.clientX:window.innerWidth*0.5,y=Number.isFinite(event.clientY)?event.clientY:window.innerHeight*0.5;return{x,y};}
function encodePhrase(v){return btoa(v.split("").reverse().join(""));}
function decodePhrase(v){try{return atob(v).split("").reverse().join("");}catch{return "";}}
function normalizePassword(v){return v.trim().toLowerCase().replace(/\s+/g," ");}
function hashString(v){let h=5381;for(let i=0;i<v.length;i+=1){h=((h<<5)+h)+v.charCodeAt(i);h&=0xffffffff;}return String(h>>>0);} 
function randomSalt(){return Math.random().toString(36).slice(2,10);} 
function randomBetween(min,max){return Math.random()*(max-min)+min;} 
function randomInt(min,max){return Math.floor(randomBetween(min,max+1));}
function pickRandom(values){return values[Math.floor(Math.random()*values.length)];}
function arraysMatch(a,b){if(a.length!==b.length)return false;for(let i=0;i<a.length;i+=1){if(a[i]!==b[i])return false;}return true;}
function clamp(v,min,max){return Math.min(max,Math.max(min,v));}
function pad2(v){return String(v).padStart(2,"0");}
