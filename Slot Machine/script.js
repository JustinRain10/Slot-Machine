const SYMBOLS = [
  { name: "sanabro",       image: "images/sanabro.jpg",         value: 12 }, // top prize — jackpot --------
  { name: "groupActivity", image: "images/group activity.jpg",  value: 7  },
  { name: "foot",          image: "images/foot.jpg",            value: 4  },
  { name: "hk",            image: "images/hk.jpg",              value: 2.5 },
  { name: "barko",         image: "images/barko.jpg",           value: 2  },
  { name: "porpis",        image: "images/porpis.jpg",          value: 1.5 },
];

/*
List rani og photos sa slot machine. 
Ang "value" field nagrepresentar 
sa multiplier para sa payout kung makuha nimo ang 
3 ka parehas nga symbols sa usa ka row.
*/

// Pangitaon niya ang sumbol nga naay pinakataas  -----------------------
// nga value paara mahibal-an kung unsa ang jackpot na symbol
const JACKPOT_SYMBOL = SYMBOLS.reduce((best, s) => (s.value > best.value ? s : best), SYMBOLS[0]);

// Multiplier ni siya para sa 2 photos nga match sa usa ka row. ---------------------
const TWO_MATCH_MULTIPLIER = 0.2;

// Amo ni siyang background images.
const BACKGROUND_IMAGES = [
  "images/chirs.jpg",
  "images/nature.jpg",
];

// Kani dire kay para balance, bet, ug auto spin settings.
const STARTING_BALANCE = 5000;
const MIN_BET = 500;
const MAX_BET = 5000;
const BET_STEP = 500;
const AUTO_SPIN_DELAY = 700; // pause (ms) between auto spins

let balance = STARTING_BALANCE;
let currentBet = MIN_BET;
let isSpinning = false;
let autoSpinActive = false;


// Names sa reel containers sa HTML, para ma-access nato sila sa JS.
const reelIds = ["reel0", "reel1", "reel2"];

// Kani dire kay para ma-access nato ang mga slot elements sa kada reel.
const reels = reelIds.map((id) => {
  const container = document.getElementById(id);
  return {
    container,
    top: container.querySelector(".slot-top"),
    mid: container.querySelector(".slot-mid"),
    bottom: container.querySelector(".slot-bottom"),
  };
});

// Kani dire kay para ma-access nato ang mga dashboard elements sa HTML,  
// para ma-update nato sila sa JS.
const balanceEl = document.getElementById("balance");
const betDisplayEl = document.getElementById("betDisplay");
const lastWinEl = document.getElementById("lastWin");
const messageEl = document.getElementById("message");
const spinBtn = document.getElementById("spinBtn");
const betUpBtn = document.getElementById("betUp");
const betDownBtn = document.getElementById("betDown");
const autoSpinBtn = document.getElementById("autoSpinBtn");
const paytableList = document.getElementById("paytableList");
const bgCollageEl = document.getElementById("bgCollage");


// Ga pick ni syag random photo from the symbol list and gina return niya --------------------
function getRandomSymbol() { 
  const index = Math.floor(Math.random() * SYMBOLS.length);
  return SYMBOLS[index];
}

// Ginahimo niya ang plain number like 1500 to $1,500 ug gina round up sad niya 
function formatMoney(amount) {
  return "$" + Math.round(amount).toLocaleString("en-US");
}

// Ga butang ni siya ug photo sa isa ka slot. First gina clear out niya unsay naa
// sa slot and then kung ang image naay path ga build  siyag img na tag ug wala ------------------------
// photo name as plain text ra
function renderSymbolInSlot(slotEl, symbol) {
  slotEl.innerHTML = ""; // clear previous content

  if (symbol.image && symbol.image.trim() !== "") {
    const img = document.createElement("img");
    img.src = symbol.image;
    img.alt = symbol.name;
    img.className = "symbol-img";
    slotEl.appendChild(img);
  } else {
    slotEl.textContent = symbol.name;
  }
}

// Fill all 3 slots with random na photos =========== -------------------------------
function renderReel(reel) {
  renderSymbolInSlot(reel.top, getRandomSymbol());
  renderSymbolInSlot(reel.mid, getRandomSymbol());
  renderSymbolInSlot(reel.bottom, getRandomSymbol());
}

// About rani sa win hightlight if daog ka
function clearHighlights() {
  reels.forEach((reel) => {
    reel.top.classList.remove("win-highlight");
    reel.mid.classList.remove("win-highlight");
    reel.bottom.classList.remove("win-highlight");
  });
}

// Ga update siya sa balance and current bet on scrren 
function updateDashboard() {
  balanceEl.textContent = formatMoney(balance);
  betDisplayEl.textContent = formatMoney(currentBet);
}

// Change rasag message text on scrren apil iyang color 
function setMessage(text, type = "") {
  messageEl.textContent = text;
  messageEl.className = "message" + (type ? " " + type : "");
}

// Turn auto spin on/off and update the button's look accordingly and gina lock niya 
// and  bet button while auto spin 
function setAutoSpin(active) {
  autoSpinActive = active;
  autoSpinBtn.classList.toggle("btn-active", active);
  autoSpinBtn.textContent = active ? "■ Stop Auto" : "↻ Auto Spin";
  betUpBtn.disabled = active || isSpinning;
  betDownBtn.disabled = active || isSpinning;
}

// Build thumbnail for one photo para sa winning combinations 
function createThumb(symbol) {
  const thumb = document.createElement("span");
  thumb.className = "thumb";

  if (symbol.image && symbol.image.trim() !== "") {
    const img = document.createElement("img");
    img.src = symbol.image;
    img.alt = symbol.name;
    thumb.appendChild(img);
  } else {
    thumb.textContent = symbol.name;
  }
  return thumb;
}

// If walay background images mahimong color white among background kung naa i 
// clear out niya para ma butangan ug bg images
function buildBackgroundCollage() {
  if (!bgCollageEl || BACKGROUND_IMAGES.length === 0) return;

  bgCollageEl.innerHTML = "";
  BACKGROUND_IMAGES.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    bgCollageEl.appendChild(img);
  });
}

// Clear out prizelist/winning combinations then ga himo syag ----------------------
//copy sa symbols soryted from highest to lowest value
function buildPaytable() {
  paytableList.innerHTML = "";
  const sortedSymbols = [...SYMBOLS].sort((a, b) => b.value - a.value);

// Every photo in sorted lsit ga build syag one row with 3 
// copies of photo,s ttumbnail and text which is ga show 
// pila iyang value for those photo
  sortedSymbols.forEach((symbol) => {
    const li = document.createElement("li");

    const thumbs = document.createElement("span");
    thumbs.className = "combo-thumbs";
    thumbs.appendChild(createThumb(symbol));
    thumbs.appendChild(createThumb(symbol));
    thumbs.appendChild(createThumb(symbol));

    const payout = document.createElement("span");
    payout.className = "payout-value";
    payout.textContent = `${symbol.value}x`;

    li.appendChild(thumbs);
    li.appendChild(payout);
    paytableList.appendChild(li);
  });

  // adds one more row na ga show ug ? inside boxes for a 2 pair photo 
  // and iyang payout text
  const li = document.createElement("li");
  const thumbs = document.createElement("span");
  thumbs.className = "combo-thumbs";
  const wildThumb1 = document.createElement("span");
  wildThumb1.className = "thumb";
  wildThumb1.textContent = "?";
  const wildThumb2 = document.createElement("span");
  wildThumb2.className = "thumb";
  wildThumb2.textContent = "?";
  thumbs.appendChild(wildThumb1);
  thumbs.appendChild(wildThumb2);

  const payout = document.createElement("span");
  payout.className = "payout-value";
  payout.textContent = `${TWO_MATCH_MULTIPLIER}x`;

  li.appendChild(thumbs);
  li.appendChild(payout);
  paytableList.appendChild(li);
}







// kani is +bet button. Kung mag increase kag bet dili sya  ...=---------------------
// above sa maximum na bet basically limit sya.
function increaseBet() {
  if (isSpinning) return;
  currentBet = Math.min(MAX_BET, currentBet + BET_STEP);
  updateDashboard();
}

// sya rani sa increase but for -bet, lower the bet pero
// dili lapas sa minimun na 
function decreaseBet() {
  if (isSpinning) return;
  currentBet = Math.max(MIN_BET, currentBet - BET_STEP);
  updateDashboard();
}

// Para sa spining rani sya if ga spin pa.
//if wala kay money i turn of nya ang auto spin
function spin() {
  if (isSpinning) return;

  if (balance < currentBet) {
    setMessage("Not enough money to spin.", "lose");
    if (autoSpinActive) setAutoSpin(false);
    return;
  }

// kani gina disable raniya ang spin and bet buttons
//while ga spin pa  
  isSpinning = true;
  spinBtn.disabled = true;
  betUpBtn.disabled = true;
  betDownBtn.disabled = true;
  clearHighlights();

  // Deduct the bet up front
  balance -= currentBet;
  updateDashboard();
  setMessage("Spinning...");

  // Adds ug spinnning blur and every miliseconds ga add sya photo
  //but doesnt decide the result yet
  reels.forEach((reel) => reel.container.classList.add("spinning"));

  const flickerIntervals = reels.map((reel) => {
    return setInterval(() => renderReel(reel), 80);
  });

  // Sets up tulo ka empty list para dire i hold ang final result na photos ---------------------
  const topResults = [];
  const middleResults = [];
  const bottomResults = [];
  const stopDelays = [800, 1200, 1600];

// Gina stop niya ang flicker animation ug ga pick ug 3 photo for each row
// and those are the final result 
  reels.forEach((reel, i) => {
    setTimeout(() => {
      clearInterval(flickerIntervals[i]);

      // Each row is rolled independently
      const topSymbol = getRandomSymbol();
      const midSymbol = getRandomSymbol();
      const bottomSymbol = getRandomSymbol();

      renderSymbolInSlot(reel.top, topSymbol);
      renderSymbolInSlot(reel.mid, midSymbol);
      renderSymbolInSlot(reel.bottom, bottomSymbol);

      topResults[i] = topSymbol;
      middleResults[i] = midSymbol;
      bottomResults[i] = bottomSymbol;

      reel.container.classList.remove("spinning");

      // Once the last reel has landed, evaluate all three rows
      if (i === reels.length - 1) {
        setTimeout(() => evaluateResult(topResults, middleResults, bottomResults), 200);
      }
    }, stopDelays[i]);
  });
}

// Takes a row with 3 photos and calls them abc
// then of they match  it shows pila imong daog
//and shows what kind of win was it =====------------------------------------
function evaluateRow(rowSymbols) {
  const [a, b, c] = rowSymbols;

  if (a.name === b.name && b.name === c.name) {
    // 3-of-a-kind: full jackpot payout
    return {
      winAmount: currentBet * a.value,
      matchedReelIndexes: [0, 1, 2],
      isJackpot: a.name === JACKPOT_SYMBOL.name,
      kind: "triple",
    };

  } else if (a.name === b.name) {
    return { winAmount: currentBet * TWO_MATCH_MULTIPLIER, matchedReelIndexes: [0, 1], kind: "pair" };
  } else if (b.name === c.name) {
    return { winAmount: currentBet * TWO_MATCH_MULTIPLIER, matchedReelIndexes: [1, 2], kind: "pair" };
  } else if (a.name === c.name) {
    return { winAmount: currentBet * TWO_MATCH_MULTIPLIER, matchedReelIndexes: [0, 2], kind: "pair" };
  }

  return { winAmount: 0, matchedReelIndexes: [], kind: "none" };
}

//Builds a small list describing 3 rows 
function evaluateResult(topResults, middleResults, bottomResults) {
  const rows = [
    { key: "top", label: "top row", results: topResults },
    { key: "mid", label: "middle row", results: middleResults },
    { key: "bottom", label: "bottom row", results: bottomResults },
  ];

  let totalWin = 0;
  const messages = [];


  rows.forEach((row) => {
    const outcome = evaluateRow(row.results);
    if (outcome.winAmount <= 0) return;

    totalWin += outcome.winAmount;

    // Highlight only the matching slots on this specific row
    outcome.matchedReelIndexes.forEach((i) => {
      reels[i][row.key].classList.add("win-highlight");
    });

    // Ga build syag message based sa unsa na row ang daog
// and adds it onthe message lsit
    if (outcome.kind === "triple") {
      messages.push(
        outcome.isJackpot
          ? `PALDO on the ${row.label}! Grabe! ${formatMoney(outcome.winAmount)}!`
          : `Three in a row on the ${row.label}: ${formatMoney(outcome.winAmount)}!`
      );
    } else {
      messages.push(`Pair on the ${row.label}: ${formatMoney(outcome.winAmount)}.`);
    }
  });

//if any row won it shows a joined mesages together like "padayun lang"
  const winAmount = totalWin;

  if (messages.length > 0) {
    setMessage(messages.join(" "), "win");
  } else {
    setMessage("Padayun lang.", "");
  }

// add ur total winings sa imong balance
//and updates the last win
  balance += winAmount;
  lastWinEl.textContent = formatMoney(winAmount);
  updateDashboard();

  // MArks the spin as finished and turns the spin button back on 
  isSpinning = false;
  spinBtn.disabled = false;
  betUpBtn.disabled = autoSpinActive;
  betDownBtn.disabled = autoSpinActive;

  // If wala na kay kwarta mag show syag message and turns off the auto spin button
  if (balance < currentBet) {
    setMessage("Not enough money.", "lose");
    if (autoSpinActive) setAutoSpin(false);
    return;
  }

  //If auto spin is on gina lock niya ang regular spin button--------------------------
  if (autoSpinActive) {
    spinBtn.disabled = true;
    setTimeout(() => {
      if (autoSpinActive) spin();
    }, AUTO_SPIN_DELAY);
  }
}

// Auto Sspin dire
//Kung ang auto spin is off gina check niya imong balacne
// if napakay money 
function toggleAutoSpin() {
  if (isSpinning && !autoSpinActive) return; // ignore mid-spin unless we're stopping

  if (!autoSpinActive) {
    if (balance < currentBet) {
      setMessage("Not enough money to start auto spin.", "lose");
      return;
    }
    setAutoSpin(true);
    if (!isSpinning) spin();
  } else {
    setAutoSpin(false);
    setMessage("Auto spin stopped.");
  }
}

//Tells buttons what to do when clicked
spinBtn.addEventListener("click", spin);
betUpBtn.addEventListener("click", increaseBet);
betDownBtn.addEventListener("click", decreaseBet);
autoSpinBtn.addEventListener("click", toggleAutoSpin);

//Kani sya is just a startup checklist  that runs one time
//when u open the page para ready na ang tanan
function init() {
  updateDashboard();
  buildBackgroundCollage();
  buildPaytable();
  reels.forEach((reel) => renderReel(reel));
}

init();