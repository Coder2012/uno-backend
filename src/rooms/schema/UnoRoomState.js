const schema = require('@colyseus/schema');
const { Card } = require('./UnoCard');
const { Player } = require('./UnoPlayer');

class UnoRoomState extends schema.Schema {
  constructor() {
    super();
    this.players = new schema.ArraySchema();
    this.stack = new schema.ArraySchema();
    this.isRunning = false;
  }
}

schema.defineTypes(UnoRoomState, {
  players: [Player],
  stack: [Card],
  deckSize: 'number',
  isRunning: 'boolean',
});

exports.unoRoomState = UnoRoomState;
