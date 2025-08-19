// ===== GLOBALS =====
let balance = 40000;
let currentBet = 0;

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
let deck = [];

let dealerHand = [];
let playerHand = [];

const balanceSpan = document.getElementById('balance');
const dealerCardsDiv = document.getElementById('dealer-cards');
const playerCardsDiv = document.getElementById('player-cards');
const dealerTotalDiv = document.getElementById('dealer-total');
const playerTotalDiv = document.getElementById('player-total');
const messageDiv = document.getElementById('message');

const dealBtn = document.getElementById('deal-btn');
const hitBtn = document.getElementById('hit-btn');
const standBtn = document.getElementById('stand-btn');

const betInput = document.getElementById('bet-input');

// --- Mines
let minesGridDiv = document.getElementById('mines-grid');
let minesMessageDiv = document.getElementById('mines-message');
let minesBetInput = document.getElementById('mines-bet');
let cashOutBtn = document.getElementById('cashout-btn');

let minesCount = 3;
let minesBet = 0;
let minesGrid = [];
let minesRevealed = 0;
let minesMines = [];
let minesGameActive = false;

// --- Coin
const coinDiv = document.getElementById('coin');
const coinMessageDiv = document.getElementById('coin-message');
const coinBetInput = document.getElementById('coin-bet');

// --- Roulette
const rouletteBetInput = document.getElementById('roulette-bet');
const rouletteMessageDiv = document.getElementById('roulette-message');

// ===== UTIL =====
function createDeck() {
  deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function cardValue(card) {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return Number(card.rank);
}

function handTotal(hand) {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    total += cardValue(card);
    if (card.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function renderHand(hand, container, hideSecondCard = false) {
  container.innerHTML = '';
  hand.forEach((card, i) => {
    const div = document.createElement('div');
    div.className = 'card';
    if (hideSecondCard && i === 1) {
      div.textContent = '🂠';
      div.style.backgroundColor = '#333';
      div.style.color = '#ffcc00';
      div.style.fontSize = '2rem';
      div.style.textAlign = 'center';
      div.style.lineHeight = '90px';
    } else {
      div.textContent = `${card.rank}${card.suit}`;
    }
    container.appendChild(div);
  });
}

function updateBalanceDisplay() {
  balanceSpan.textContent = balance.toLocaleString();
}

function clearMessages() {
  messageDiv.textContent = '';
  minesMessageDiv.textContent = '';
  coinMessageDiv.textContent = '';
  rouletteMessageDiv.textContent = '';
}

// ===== BLACKJACK =====
function updateDisplay(hideDealerSecondCard = false) {
  updateBalanceDisplay();
  renderHand(playerHand, playerCardsDiv);
  renderHand(dealerHand, dealerCardsDiv, hideDealerSecondCard);
  playerTotalDiv.textContent = `Total: ${handTotal(playerHand)}`;
  if (hideDealerSecondCard) {
    dealerTotalDiv.textContent = `Total: ${cardValue(dealerHand[0])} + ?`;
  } else {
    dealerTotalDiv.textContent = `Total: ${handTotal(dealerHand)}`;
  }
}

function startGame() {
  const betAmount = Number(betInput.value);
  if (isNaN(betAmount) || betAmount <= 0) {
    messageDiv.textContent = "Please enter a valid bet amount.";
    return;
  }
  if (betAmount > balance) {
    messageDiv.textContent = "Not enough balance to place that bet.";
    return;
  }

  messageDiv.textContent = '';
  balance -= betAmount;
  dealerHand = [];
  playerHand = [];
  createDeck();
  shuffleDeck();
  playerHand.push(deck.pop(), deck.pop());
  dealerHand.push(deck.pop(), deck.pop());
  updateDisplay(true);
  dealBtn.disabled = true;
  hitBtn.disabled = false;
  standBtn.disabled = false;
  currentBet = betAmount;
}

function playerHit() {
  playerHand.push(deck.pop());
  if (handTotal(playerHand) > 21) {
    updateDisplay(false);
    messageDiv.textContent = 'Bust! You lose.';
    endRound();
    return;
  }
  updateDisplay(true);
}

function dealerPlay() {
  while (handTotal(dealerHand) < 17) {
    dealerHand.push(deck.pop());
  }
  updateDisplay(false);
}

function playerStand() {
  dealerPlay();
  const playerTotal = handTotal(playerHand);
  const dealerTotal = handTotal(dealerHand);

  if (dealerTotal > 21 || playerTotal > dealerTotal) {
    messageDiv.textContent = `You win! +$${(currentBet * 2).toLocaleString()}`;
    balance += currentBet * 2;
  } else if (playerTotal === dealerTotal) {
    messageDiv.textContent = "It's a tie! Bet returned.";
    balance += currentBet;
  } else {
    messageDiv.textContent = 'You lose.';
  }
  updateBalanceDisplay();
  endRound();
}

function endRound() {
  dealBtn.disabled = false;
  hitBtn.disabled = true;
  standBtn.disabled = true;
}

dealBtn.onclick = startGame;
hitBtn.onclick = playerHit;
standBtn.onclick = playerStand;

// ===== MINES =====
function setMineCount(count) {
  if (minesGameActive) return;
  minesCount = count;
  minesMessageDiv.textContent = `Selected ${count} mines.`;
}

function startMinesGame() {
  if (minesGameActive) return;
  const bet = Number(minesBetInput.value);
  if (!bet || bet <= 0 || bet > balance) {
    minesMessageDiv.textContent = 'Enter a valid bet.';
    return;
  }
  minesBet = bet;
  balance -= bet;
  updateBalanceDisplay();
  minesGrid = Array(25).fill('safe');
  minesRevealed = 0;
  minesMines = [];
  minesGameActive = true;
  cashOutBtn.style.display = 'inline-block';
  while (minesMines.length < minesCount) {
    let pos = Math.floor(Math.random() * 25);
    if (!minesMines.includes(pos)) minesMines.push(pos);
  }
  minesMines.forEach(pos => minesGrid[pos] = 'mine');
  renderMinesGrid();
}

function renderMinesGrid() {
  minesGridDiv.innerHTML = '';
  minesGrid.forEach((cell, i) => {
    const div = document.createElement('div');
    div.className = 'mine-box';
    if (cell === 'revealed-safe') {
      div.classList.add('revealed');
      div.textContent = '💎';
    } else if (cell === 'revealed-mine') {
      div.classList.add('revealed', 'mine');
      div.textContent = '💣';
    }
    div.onclick = () => {
      if (!minesGameActive || minesGrid[i].startsWith('revealed')) return;
      revealMine(i);
    };
    minesGridDiv.appendChild(div);
  });
}

function revealMine(index) {
  if (minesGrid[index] === 'mine') {
    minesGrid[index] = 'revealed-mine';
    minesGameActive = false;
    revealAllMines();
    minesMessageDiv.textContent = `BOOM! You hit a mine. You lose your bet of $${minesBet}.`;
    cashOutBtn.style.display = 'none';
  } else {
    if (!minesGrid[index].startsWith('revealed')) {
      minesGrid[index] = 'revealed-safe';
      minesRevealed++;
      renderMinesGrid();
      minesMessageDiv.textContent = `Safe tiles revealed: ${minesRevealed}. Potential cashout: $${calculateCashout().toLocaleString()}`;
    }
  }
}

function revealAllMines() {
  minesGrid.forEach((cell, i) => {
    if (minesGrid[i] === 'mine') minesGrid[i] = 'revealed-mine';
  });
  renderMinesGrid();
}

function calculateCashout() {
  if (!minesBet || minesRevealed === 0) return 0;

  let basePayout = 0;

  if (minesCount === 3) {
    basePayout = minesBet <= 10000 ? 500 : minesBet <= 25000 ? 1000 : minesBet <= 50000 ? 2000 : 4000;
  } else if (minesCount === 5) {
    basePayout = minesBet <= 10000 ? 900 : minesBet <= 25000 ? 1750 : minesBet <= 50000 ? 3500 : 7000;
  } else if (minesCount === 8) {
    basePayout = minesBet <= 10000 ? 1200 : minesBet <= 25000 ? 2400 : minesBet <= 50000 ? 4800 : 9600;
  } else if (minesCount === 12) {
    basePayout = minesBet <= 10000 ? 7000 : minesBet <= 25000 ? 14000 : minesBet <= 50000 ? 28000 : 56000;
  }

  return basePayout * minesRevealed;
}

function cashOut() {
  if (!minesGameActive) return;
  const winnings = calculateCashout();
  if (winnings > 0) {
    balance += winnings;
    minesMessageDiv.textContent = `You cashed out $${winnings.toLocaleString()}!`;
  } else {
    minesMessageDiv.textContent = 'No winnings to cash out.';
  }
  minesGameActive = false;
  cashOutBtn.style.display = 'none';
  updateBalanceDisplay();
  revealAllMines();
}

document.querySelectorAll('#mine-settings button').forEach(btn => {
  btn.onclick = () => setMineCount(Number(btn.textContent));
});
document.getElementById('start-mines-btn').onclick = startMinesGame;
cashOutBtn.onclick = cashOut;

// ===== COIN FLIP =====
function flipCoin(choice) {
  clearMessages();
  const bet = Number(coinBetInput.value);
  if (!bet || bet <= 0 || bet > balance) {
    coinMessageDiv.textContent = 'Enter a valid bet!';
    return;
  }

  balance -= bet;
  updateBalanceDisplay();
  coinDiv.classList.add('flipping');
  let sides = ['HEADS', 'TAILS'];
  let counter = 0;
  const interval = setInterval(() => {
    coinDiv.textContent = sides[counter % 2];
    counter++;
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    coinDiv.classList.remove('flipping');
    const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
    coinDiv.textContent = outcome.toUpperCase();
    if (outcome === choice) {
      let winnings = bet * 2;
      balance += winnings;
      coinMessageDiv.textContent = `You won $${winnings}!`;
    } else {
      coinMessageDiv.textContent = 'You lost.';
    }
    updateBalanceDisplay();
  }, 1800);
}

// ===== ROULETTE & NAV =====
function spinRoulette() {
  clearMessages();
  const bet = Number(rouletteBetInput.value);
  if (!bet || bet <= 0 || bet > balance) {
    rouletteMessageDiv.textContent = 'Enter a valid bet.';
    return;
  }

  const colorRadios = document.getElementsByName('roulette-color');
  let chosenColor = null;
  for (const radio of colorRadios) {
    if (radio.checked) chosenColor = radio.value;
  }
  if (!chosenColor) {
    rouletteMessageDiv.textContent = 'Select a color to bet on.';
    return;
  }

  balance -= bet;
  updateBalanceDisplay();
  const result = Math.random() < 0.5 ? 'red' : 'black';

  if (result === chosenColor) {
    const winnings = bet * 2;
    rouletteMessageDiv.textContent = `The ball landed on ${result.toUpperCase()}. You won $${winnings}!`;
    balance += winnings;
  } else {
    rouletteMessageDiv.textContent = `The ball landed on ${result.toUpperCase()}. You lost.`;
  }
  updateBalanceDisplay();
}

function showGame(name) {
  clearMessages();
  const games = ['blackjack', 'mines', 'coin', 'roulette'];
  games.forEach(g => {
    document.getElementById(g).classList.toggle('hidden', g !== name);
  });

  dealBtn.disabled = false;
  hitBtn.disabled = true;
  standBtn.disabled = true;
  messageDiv.textContent = 'Enter your bet and click "Deal" to start!';

  minesGameActive = false;
  cashOutBtn.style.display = 'none';
  minesGridDiv.innerHTML = '';
  minesMessageDiv.textContent = 'Select mine count and start the game.';

  coinDiv.textContent = 'HEADS';
  coinMessageDiv.textContent = 'Pick heads or tails and flip the coin!';

  rouletteMessageDiv.textContent = 'Choose red or black and spin!';
}

window.showGame = showGame;
window.flipCoin = flipCoin;
window.spinRoulette = spinRoulette;

window.onload = () => {
  showGame('blackjack');
  updateDisplay(false);
  updateBalanceDisplay();
};
