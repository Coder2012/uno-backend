const schema = require('@colyseus/schema');
const Schema = schema.Schema;
const { Card } = require('./UnoCard');

class Player extends Schema {
  constructor({ id, name }) {
    super();

    this.id = id;
    this.name = name;
    this.isReady = false;
    this.cards = new schema.ArraySchema();
  }

  update(cards) {
    console.log(cards.length);
    this.cards.push(...cards);
    this.cardsLength = this.cards.length;
  }
}

schema.defineTypes(Player, {
  id: 'string',
  name: 'string',
  isReady: 'boolean',
  cards: [Card],
  cardsLength: 'number',
});

schema.filter(function (client, value, root) {
  return client.sessionId === this.id;
})(Player.prototype, 'id');

schema.filter(function (client, value, root) {
  console.log('client: ', client.sessionId);
  return client.sessionId === this.id;
})(Player.prototype, 'cards');

module.exports = {
  Player,
};
