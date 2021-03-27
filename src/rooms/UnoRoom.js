const colyseus = require('colyseus');
const UnoRoomState = require('./schema/UnoRoomState').unoRoomState;
const { createCards } = require('../utils/cards');
const { Player } = require('./schema/UnoPlayer');

const { INITIAL_CARDS_NUM } = require('../rooms/constants');

exports.UnoRoom = class extends (
  colyseus.Room
) {
  constructor() {
    super();

    this.currentCard = null;
    this.playerIndex = 0;
  }

  debugCards() {
    for (const card in this.deck) {
      if (this.deck.hasOwnProperty(card)) {
        const element = this.deck[card];
        console.log(element.id, element.className);
      }
    }
  }

  onCreate(options) {
    this.setPatchRate(50);
    this.setState(new UnoRoomState());
    this.deck = createCards();
    // this.debugCards();
    this.state.deckSize = this.deck.length;

    this.onMessage('start', (client, message) => {
      if(this.isEveryoneReady()) {
        this.state.isRunning = this.getPlayerById(client.sessionId).isOwner;
        this.onStart();
      }
    });

    this.onMessage('ready', (client, message) => {
      this.getPlayerById(client.sessionId).isReady = true;
    })

    this.onMessage('playCard', (client, cardId) => {
      console.log('playCard recieved:', client.sessionId);
      const player = this.getPlayerById(client.sessionId);

      // it's not your turn!
      if (player.id !== this.state.activePlayerId) return;

      this.currentCard = player.getCardById(cardId);

      if (this.requiresColorChoice()) {
        client.send('getColor');
        return;
      }

      // if player can't go, they need to pickup a card
      if (!this.isValidCard(this.currentCard)) return;
      this.playCard(player, cardId);
    });

    this.onMessage('colorSelected', (client, colorId) => {
      const player = this.getPlayerById(client.sessionId);
      this.playCard(player, this.currentCard.id, colorId);
    });

    this.onMessage('getCard', (client) => {
      const player = this.getPlayerById(client.sessionId);
      player.updateCards(this.dealCards());
    });

    this.onMessage('pass', (client) => {
      this.choosePlayer();
    })
  }

  onJoin(client, options) {
    console.log(`Player joined: id=${client.id} name:${options.name}`);

    const player = new Player({ id: client.id, friendlyId: client.id.slice(0, 3), ...options });
    player.isReady = player.isOwner = !this.state.players.length;
    this.state.players.push(player);
  }

  onLeave(client, consented) {
    console.log(`Player left: id=${client.id}`);
  }

  onStart() {
    this.state.players.forEach((player) => {
      player.updateCards(this.dealCards(INITIAL_CARDS_NUM));
    });
    this.updatePlayerTurn();
  }

  playCard(player, cardId, colorId = null) {
    if (colorId) this.currentCard.color = colorId;
    player.playCard(cardId);
    this.state.stack.push(this.currentCard);
    this.updatePlayerTurn();
  }

  isValidCard() {
    const card = this.currentCard;
    const lastCard = this.state.stack[this.state.stack.length - 1];

    if (!lastCard) return true;
    else if (card.color === lastCard.color) return true;
    else if (!card.color) return true;
    // hack for wild cards
    else if (card.value && card.value === lastCard.value) return true;
    else if (card.action && card.action?.type === lastCard.action?.type) return true;

    return false;
  }

  requiresColorChoice() {
    return /^wild.*/.test(this.currentCard.action?.type);
  }

  updatePlayerTurn() {
    let index = undefined;

    if (!this.state.activePlayerId) {
      this.setActivePlayer(this.playerIndex);
      return;
    }

    switch (this.currentCard.action?.type) {
      case 'reverse':
        this.changeDirection();
        if (this.state.players.length === 2) {
          this.skipPlayer();
        }else{
          this.choosePlayer();
        }
        break;

      case 'skip':
        this.skipPlayer();
        break;

      case 'drawTwo':
        index = this.state.isClockwiseDirection ? this.nextPlayer() : this.previousPlayer();
        this.getPlayerById(this.state.players[index].id).updateCards(this.dealCards(2));
        this.skipPlayer();
        break;

      case 'wildDrawFour':
        index = this.state.isClockwiseDirection ? this.nextPlayer() : this.previousPlayer();
        this.getPlayerById(this.state.players[index].id).updateCards(this.dealCards(4));
        this.skipPlayer();
        break;

      default:
        this.choosePlayer();
    }
  }

  changeDirection() {
    this.state.isClockwiseDirection = !this.state.isClockwiseDirection;
  }

  skipPlayer() {
    if(this.state.players.length === 2) return;
    this.choosePlayer();
    this.choosePlayer();
  }

  choosePlayer() {
    this.playerIndex = this.state.isClockwiseDirection ? this.nextPlayer() : this.previousPlayer();
    this.setActivePlayer(this.playerIndex);
  }

  nextPlayer() {
    return this.playerIndex === this.state.players.length - 1 ? 0 : this.playerIndex + 1;
  }

  previousPlayer() {
    return this.playerIndex === 0 ? this.state.players.length - 1 : this.playerIndex - 1;
  }

  dealCards(value = 1) {
    let cards = [];
    for (let i = 0; i < value; i++) {
      cards.push(this.getRandomCard());
      // cards.push(this.deck.splice(this.deck.length - 1, 1)[0]);
      this.state.deckSize = this.deck.length;
    }
    return cards;
  }

  getRandomCard() {
    const rnd = Math.floor(Math.random() * this.deck.length);
    const card = this.deck.splice(rnd, 1)[0];
    this.state.deckSize = this.deck.length;
    return card;
  }

  getPlayerById(id) {
    return this.state.players.find((player) => player.id === id);
  }

  setActivePlayer(index) {
    this.disableCardPickup();
    this.state.activePlayerId = this.state.players[index].id;
    
    const player = this.getPlayerById(this.state.activePlayerId);
    player.isPickupActive = true;
    this.state.activeFriendlyId = player.friendlyId;
  }

  disableCardPickup() {
    this.state.players.forEach(player => player.isPickupActive = false);
  }

  isEveryoneReady() {
    return this.state.players.length > 1 && this.state.players.every(player => player.isReady);
  }

  onDispose() {}
};
