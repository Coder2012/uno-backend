const colyseus = require('colyseus');
const UnoRoomState = require('./schema/UnoRoomState').unoRoomState;
const { createCards } = require('../utils/cards');
const { Player } = require('./schema/UnoPlayer');

exports.UnoRoom = class extends colyseus.Room {
  onCreate(options) {
    console.log('create the room');
    this.setState(new UnoRoomState());
    // this.state.cards.push(...createCards());
    this.deck = createCards();
    this.state.deckSize = this.deck.length;

    this.onMessage('ready', (client, message) => {
      console.log('ready recieved:', message);
    });

    this.onMessage('getCard', (client, message) => {
      console.log('getCard recieved:', client.sessionId);
      this.getCard(client.sessionId);
    });
  }

  onJoin(client, options) {
    console.log(`Player joined: id=${client.id} name:${options.name}`);

    const player = new Player({ id: client.id, ...options });
    this.state.players.push(player);
  }

  onLeave(client, consented) {
    console.log(`Player left: id=${client.id}`);
  }

  getCard(id) {
    const player = this.getPlayerById(id);
    player.update(this.getRandomCard());
  }

  getRandomCard() {
    const rnd = Math.floor(Math.random() * this.deck.length);
    const card = this.deck.splice(rnd, 1);
    this.state.deckSize = this.deck.length;
    return card;
  }

  getPlayerById(id) {
    return this.state.players.find(player => player.id === id);
  }

  onDispose() {}
};
