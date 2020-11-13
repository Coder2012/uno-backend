const schema = require('@colyseus/schema');
const Schema = schema.Schema;
const { Card } = require('./UnoCard');

class Player extends Schema {
  constructor({ id, name }) {
    super();

    this.id = id;
    this.name = name;
    this.isReady = false;
    this.isOwner = false;
    this.cards = new schema.ArraySchema();
    this.cardsLength = 0;
  }

  updateCards(cards) {
    console.log(cards.length);
    this.cards.push(...cards);
    this.cardsLength = this.cards.length;
    console.log('after');
  }

  playCard(cardId) {
    let card = null;
    const index = this.cards.map((card) => card.id).indexOf(cardId);
   
    if (index > -1) {
      card = this.cards.splice(index, 1)[0];
      this.cardsLength = this.cards.length;
    }
    return card;
  }
}

schema.defineTypes(Player, {
  id: 'string',
  name: 'string',
  isReady: 'boolean',
  isOwner: 'boolean',
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
