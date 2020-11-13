const colyseus = require('colyseus');
const UnoRoomState = require('./schema/UnoRoomState').unoRoomState;
const { createCards } = require('../utils/cards');
const { Player } = require('./schema/UnoPlayer');

const { INITIAL_CARDS_NUM } = require('../rooms/constants');

exports.UnoRoom = class extends colyseus.Room {
  onCreate(options) {
    console.log('create the room');
    this.setState(new UnoRoomState());
    // this.state.cards.push(...createCards());
    this.deck = createCards();
    this.state.deckSize = this.deck.length;

    this.onMessage('start', (client, message) => {
      const isOwner = this.getPlayerById(client.sessionId);
      if (isOwner) {
        console.log('start game');
        this.state.isRunning = true;
      }
      this.onStart();
    });

    this.onMessage('playCard', (client, cardId) => {
      console.log('playCard recieved:', client.sessionId);
      const card = this.getPlayerById(client.sessionId).playCard(cardId);
      console.log('received card', card);
      this.state.stack.push(card);
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
    this.state.players.forEach(player => {
      player.updateCards(this.dealCards(INITIAL_CARDS_NUM))
    })
  }

  dealCards(value) {
    let cards = [];
    for (let i = 0; i < value; i++) {
      cards.push(this.getRandomCard());
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
