const schema = require("@colyseus/schema");
const Schema = schema.Schema;

class Action extends Schema {
  constructor({ type, label, value }) {
    super();

    this.type = type;
    this.label = label;
    this.value = value;
  }
}
schema.defineTypes(Action, {
  type: "string",
  label: "string",
  value: "number",
});

class Card extends Schema {
  constructor({ id, className, color, value, action }) {
    super();
    this.id = id;
    this.className = className;
    this.color = color;
    this.value = value;
    this.action = action;
  }
}
schema.defineTypes(Card, {
  id: "number",
  className: "string",
  color: "string",
  value: "number",
  action: Action,
});

module.exports = {
  Action,
  Card,
};
