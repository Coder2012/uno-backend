const schema = require('@colyseus/schema');
const Schema = schema.Schema;
const { Card } = require('./UnoCard');

class Player extends Schema {
  constructor({ id, name, friendlyId }) {
    super();

    this.id = id;
    this.friendlyId = friendlyId;
    this.name = name;
    this.isReady = false;
    this.isOwner = false;
    this.isPickupActive = false;
    this.isWinner = false;
    this.cards = new schema.ArraySchema();
    this.cardsLength = 0;
  }

  updateCards(cards) {
    this.cards.push(...cards);
    this.cardsLength = this.cards.length;
  }

  getCardIndex(cardId) {
    return this.cards.map((card) => card.id).indexOf(cardId);
  }

  hasCard(cardId) {
    return this.getCardIndex(cardId) > -1;
  }

  getCardById(cardId) {
    if (this.hasCard(cardId)) {
      const index = this.getCardIndex(cardId);
      return this.cards[index];
    }
    return null;
  }

  playCard(cardId) {
    let card = null;
    const index = this.getCardIndex(cardId);
    card = this.cards.splice(index, 1)[0];
    this.cardsLength = this.cards.length;
    return card;
  }
}

schema.defineTypes(Player, {
  id: 'string',
  friendlyId: 'string',
  name: 'string',
  isReady: 'boolean',
  isOwner: 'boolean',
  isWinner: 'boolean',
  isPickupActive: 'boolean',
  cards: [Card],
  cardsLength: 'number',
});

schema.filter(function (client, value, root) {
  return client.sessionId === this.id;
})(Player.prototype, 'id');

// schema.filter(function (client, value, root) {
//   return client.sessionId === this.id;
// })(Player.prototype, 'isOwner');

schema.filter(function (client, value, root) {
  return client.sessionId === this.id;
})(Player.prototype, 'cards');

module.exports = {
  Player,
};
