const schema = require('@colyseus/schema');
const { Player } = require('./UnoPlayer');

class UnoRoomState extends schema.Schema {
  constructor() {
    super();
    this.players = new schema.ArraySchema();
  }
}

schema.defineTypes(UnoRoomState, {
  players: [Player],
  deckSize: 'number',
});

exports.unoRoomState = UnoRoomState;
