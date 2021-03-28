const schema = require('@colyseus/schema');
const { Card } = require('./UnoCard');
const { Player } = require('./UnoPlayer');

class UnoRoomState extends schema.Schema {
  constructor() {
    super();
    this.players = new schema.ArraySchema();
    this.stack = new schema.ArraySchema();
    this.isRunning = false;
    this.activePlayerId = null;
    this.activeFriendlyId = null;
    this.isPlayersReady = false;
    this.isDirectionClockwise = true;
  }
}

schema.defineTypes(UnoRoomState, {
  players: [Player],
  stack: [Card],
  deckSize: 'number',
  isRunning: 'boolean',
  activePlayerId: 'string',
  activeFriendlyId: 'string',
  isPlayersReady: 'boolean',
  isDirectionClockwise: 'boolean',
});

exports.unoRoomState = UnoRoomState;
