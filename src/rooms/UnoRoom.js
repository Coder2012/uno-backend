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
    this.debugCards();
    this.state.deckSize = this.deck.length;

    this.onMessage('start', (client, message) => {
      const isOwner = this.getPlayerById(client.sessionId);
      if (isOwner) {
        this.state.isRunning = true;
      }
      this.onStart();
    });

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
      this.choosePlayer();
    });
  }

  onJoin(client, options) {
    console.log(`Player joined: id=${client.id} name:${options.name}`);

    const player = new Player({ id: client.id, ...options });
    player.isOwner = !this.state.players.length;
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

  checkPlayerPenaltyCards() {
    const numCards = this.currentCard.action?.value;
    if (numCards) {
      this.getPlayerById(this.state.activePlayerId).updateCards(this.dealCards(numCards));
    }
  }

  updatePlayerTurn() {
    if (!this.state.activePlayerId) {
      this.state.activePlayerId = this.state.players[this.playerIndex].id;
      return;
    }

    switch (this.currentCard.action?.type) {
      case 'reverse':
        this.changeDirection();
        if (this.state.players.length > 2) {
          this.choosePlayer();
        }
        break;

      case 'skip':
        if (this.state.players.length > 2) {
          this.skipPlayer();
        }
        break;

      case 'drawTwo':
        this.choosePlayer();
        this.getPlayerById(this.state.activePlayerId).dealCards(2);
        this.choosePlayer();
        break;

      case 'wildDrawFour':
        this.choosePlayer();
        this.getPlayerById(this.state.activePlayerId).dealCards(2);
        this.choosePlayer();
        break;

      default:
        this.choosePlayer();
    }

    this.checkPlayerPenaltyCards();
  }

  changeDirection() {
    this.state.isClockwiseDirection = !this.state.isClockwiseDirection;
  }

  skipPlayer() {
    this.choosePlayer();
    this.choosePlayer();
  }

  choosePlayer() {
    this.playerIndex = this.state.isClockwiseDirection ? this.nextPlayer() : this.previousPlayer();
    this.state.activePlayerId = this.state.players[this.playerIndex].id;
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
      //this.state.deckSize = this.deck.length;
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

  onDispose() {}
};
