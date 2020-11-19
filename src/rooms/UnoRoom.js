const colyseus = require('colyseus');
const UnoRoomState = require('./schema/UnoRoomState').unoRoomState;
const { createCards } = require('../utils/cards');
const { Player } = require('./schema/UnoPlayer');

const { INITIAL_CARDS_NUM } = require('../rooms/constants');

exports.UnoRoom = class extends colyseus.Room {
  constructor() {
    super();

    this.currentCard = null;
    this.playerIndex = 0;
  }

  onCreate(options) {
    this.setPatchRate(50);
    this.setState(new UnoRoomState());
    this.deck = createCards();
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

      if (/^wild.*/.test(this.currentCard.action?.type)) {
        client.send('getColor');
        return;
      }

      if (!this.isValidCard(this.currentCard)) return;
      this.playCard(player, cardId);
    });

    this.onMessage('colorSelected', (client, colorId) => {
      const player = this.getPlayerById(client.sessionId);
      this.playCard(player, this.currentCard.id, colorId);
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

  getCard(id) {
    const player = this.getPlayerById(id);
    player.updateCards(this.getRandomCard());
  }

  onStart() {
    this.state.players.forEach((player) => {
      player.updateCards(this.dealCards(INITIAL_CARDS_NUM));
    });
    this.updatePlayerTurn();
  }

  playCard(player, cardId, colorId = null) {
    this.currentCard.color = colorId;
    player.playCard(cardId);
    this.state.stack.push(this.currentCard);
    this.updatePlayerTurn();
  }

  isValidCard(card) {
    const lastCard = this.state.stack[this.state.stack.length - 1];

    if (!lastCard) return true;
    else if (card.color === lastCard.color) return true;
    else if (!card.color) return true;
    // hack for wild cards
    else if (card.value && card.value === lastCard.value) return true;
    else if (card.action && card.action?.type === lastCard.action?.type) return true;

    return false;
  }

  requiresColorChoice(card) {
    return /^wild.*/.test(card.action.type);
  }

  updatePlayerTurn() {
    if (!this.state.activePlayerId) {
      this.state.activePlayerId = this.state.players[this.playerIndex].id;
      console.log('player turn:', this.state.activePlayerId);
    } else {
      // next player
      this.playerIndex = this.playerIndex === this.state.players.length - 1 ? 0 : this.playerIndex + 1;
      console.log('index', this.playerIndex);
      this.state.activePlayerId = this.state.players[this.playerIndex].id;
    }
  }

  dealCards(value) {
    let cards = [];
    for (let i = 0; i < value; i++) {
      // cards.push(this.getRandomCard());
      cards.push(this.deck.splice(this.deck.length - 1, 1)[0]);
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

  onDispose() {}
};
