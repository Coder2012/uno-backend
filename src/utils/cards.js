const { Action, Card } = require("../rooms/schema/UnoCard");
let id;

/*
108 cards as follows
19 Blue cards – 0-9
19 Green cards – 0-9
19 Red cards – 0-9
19 Yellow cards – 0-9
8 Draw Two cards – 2 each in blue, green, red, and yellow
8 Reverse cards – 2 each in blue, green, red, and yellow
8 Skip cards – 2 each in blue, green, red, and yellow
4 Wild cards
4 Wild Draw Four cards
*/

const actions = [
  new Action({
    type: "drawTwo",
    label: "Draw two",
    value: 2,
  }),
  new Action({
    type: "reverse",
    label: "Reverse",
    value: 0,
  }),
  new Action({
    type: "skip",
    label: "Skip",
    value: 0,
  }),
];

const wildActions = [
  new Action({
    type: "wild",
    label: "Change colour",
    value: 0,
  }),
  new Action({
    type: "wildDrawFour",
    label: "Draw four",
    value: 4,
  }),
];

const getCard = ({ color = null, value = null, action = null }) => {
  const className = `${color || ""}${value !== null ? value : ""}${
    action ? action.type : ""
  }`;

  return new Card({
    id: id++,
    className,
    color,
    value,
    action,
  });
};

const getNumberCards = (start, end, color) => {
  const arr = [];
  for (let index = start; index <= end; index++) {
    const card = getCard({ color, value: index });
    arr.push(card);
  }
  return arr;
};

const getActionCards = ({ amount, color, action }) => {
  const arr = [];
  for (let i = 0; i < amount; i++) {
    arr.push(getCard({ color, action }));
  }
  return arr;
};

const createCards = () => {
  id = 1;
  const cards = [];
  const colors = ["blue", "green", "red", "yellow"];

  for (const color of colors) {
    cards.push(...getNumberCards(0, 9, color));
    cards.push(...getNumberCards(1, 9, color));

    for (const action of actions) {
      cards.push(...getActionCards({ amount: 2, color, action }));
    }
  }

  for (const action of wildActions) {
    cards.push(...getActionCards({ amount: 4, action }));
  }

  return cards;
};

module.exports = {
  createCards,
};
