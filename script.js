const board = document.getElementById("board");
const statusText = document.getElementById("status");
const handPlayer = document.getElementById("hand-player");
const handBot = document.getElementById("hand-bot");

const moveSound = new Audio("sounds/move.wav");
const errorSound = new Audio("sounds/error.wav");
const captureSound = new Audio("sounds/capture.wav");

const KANJI = {
  FU:"歩", KY:"香", KE:"桂", GI:"銀", KI:"金",
  KA:"角", HI:"飛", OU:"王",
  TO:"と", NY:"杏", NK:"圭", NG:"全", UM:"馬", RY:"龍"
};

const VALUE = {
  FU:1, KY:3, KE:3, GI:4, KI:5,
  KA:8, HI:9, OU:100,
  TO:5, NY:5, NK:5, NG:5, UM:10, RY:11
};

let turn="player";
let selected=null;
let selectedHand=null;

let state=Array(81).fill(null);
let hands={player:[],bot:[]};

/* ===== Startposition ===== */
function put(i,t,o){state[i]={type:t,owner:o};}

for(let i=0;i<9;i++){ put(18+i,"FU","bot"); put(54+i,"FU","player"); }
put(0,"KY","bot"); put(8,"KY","bot");
put(72,"KY","player"); put(80,"KY","player");
put(1,"KE","bot"); put(7,"KE","bot");
put(73,"KE","player"); put(79,"KE","player");
put(2,"GI","bot"); put(6,"GI","bot");
put(74,"GI","player"); put(78,"GI","player");
put(3,"KI","bot"); put(5,"KI","bot");
put(75,"KI","player"); put(77,"KI","player");
put(4,"OU","bot"); put(76,"OU","player");
put(16,"KA","bot"); put(64,"KA","player");
put(10,"HI","bot"); put(70,"HI","player");

/* ===== Board ===== */
for(let i=0;i<81;i++){
  const s=document.createElement("div");
  s.className="square";
  s.onclick=()=>clickSquare(i);
  board.appendChild(s);
}
render();

/* ===== Render ===== */
function render(){
  document.querySelectorAll(".square").forEach((s,i)=>{
    s.innerHTML="";
    const p=state[i];
    if(p){
      const d=document.createElement("div");
      d.className="piece";
      if(p.owner==="bot")d.classList.add("enemy");
      if(p.promoted)d.classList.add("promoted");
      d.textContent=KANJI[p.type];
      s.appendChild(d);
    }
  });
  handPlayer.textContent=hands.player.map(p=>KANJI[p]).join(" ");
  handBot.textContent=hands.bot.map(p=>KANJI[p]).join(" ");
}

/* ===== Player ===== */
function clickSquare(i){
  if(turn!=="player")return;

  const p=state[i];

  if(selected===null){
    if(p && p.owner==="player") selected=i;
    else illegal();
    return;
  }

  if(!legalMove(selected,i)){
    illegal(); selected=null; return;
  }

  doMove(selected,i,"player");
  selected=null;
  endPlayerTurn();
}

function endPlayerTurn(){
  render();
  turn="bot";
  thinking();
  setTimeout(botMove,1000);
}

/* ===== Bot Thinking ===== */
let dots=0;
function thinking(){
  statusText.textContent="考え中";
  dots=0;
  botThinkInterval=setInterval(()=>{
    dots=(dots+1)%4;
    statusText.textContent="考え中" + "・".repeat(dots);
  },300);
}

/* ===== Bot ===== */
function botMove(){
  clearInterval(botThinkInterval);

  let bestScore=-9999;
  let bestMove=null;

  for(let i=0;i<81;i++){
    const p=state[i];
    if(p && p.owner==="bot"){
      for(let t=0;t<81;t++){
        if(!legalMove(i,t))continue;

        const backupFrom=state[i];
        const backupTo=state[t];

        let gain=0;
        if(state[t]) gain=VALUE[state[t].type];

        state[t]=state[i];
        state[i]=null;

        const score=gain + evaluateBoard();

        state[i]=backupFrom;
        state[t]=backupTo;

        if(score>bestScore){
          bestScore=score;
          bestMove=[i,t];
        }
      }
    }
  }

  if(bestMove){
    doMove(bestMove[0],bestMove[1],"bot");
  }

  turn="player";
  statusText.textContent="プレイヤー ノ ターン";
  render();
}

/* ===== Bewertung ===== */
function evaluateBoard(){
  let score=0;
  state.forEach(p=>{
    if(!p)return;
    const v=VALUE[p.type];
    score += p.owner==="bot" ? v : -v;
  });
  return score;
}

/* ===== Moves ===== */
function doMove(f,t,who){
  if(state[t]){
    captureSound.play();
    hands[who].push(demote(state[t].type));
  }else moveSound.play();

  state[t]=state[f];
  state[f]=null;
  promoteIfPossible(t);
}

function demote(t){
  return {TO:"FU",NY:"KY",NK:"KE",NG:"GI",UM:"KA",RY:"HI"}[t]||t;
}

function promoteIfPossible(i){
  const p=state[i];
  if(["FU","KY","KE","GI","KA","HI"].includes(p.type)){
    if((p.owner==="player"&&i<27)||(p.owner==="bot"&&i>53)){
      p.type={FU:"TO",KY:"NY",KE:"NK",GI:"NG",KA:"UM",HI:"RY"}[p.type];
      p.promoted=true;
    }
  }
}

/* ===== Regeln ===== */
function legalMove(f,t){
  const p=state[f];
  if(state[t] && state[t].owner===p.owner)return false;
  const dx=(t%9)-(f%9);
  const dy=Math.floor(t/9)-Math.floor(f/9);
  const dir=p.owner==="player"?-1:1;

  switch(p.type){
    case "FU": return dx===0 && dy===dir;
    case "KY": return dx===0 && dy*dir>0;
    case "KE": return Math.abs(dx)===1 && dy===2*dir;
    case "GI": return Math.abs(dx)<=1 && dy*dir!==0;
    case "KI":
    case "TO":case "NY":case "NK":case "NG":
      return Math.abs(dx)<=1 && dy*dir>=-1;
    case "KA": return Math.abs(dx)===Math.abs(dy);
    case "HI": return dx===0||dy===0;
    case "OU": return Math.abs(dx)<=1 && Math.abs(dy)<=1;
    case "UM": return Math.abs(dx)===Math.abs(dy)||Math.abs(dx)+Math.abs(dy)===1;
    case "RY": return dx===0||dy===0||Math.abs(dx)+Math.abs(dy)===1;
  }
  return false;
}

function illegal(){
  errorSound.play();
  statusText.textContent="イリーガル ナ ムーブ";
}
