const jsonLogic = require('json-logic-js');
const rawData = { applyLogic: true, formVersion: '2.0.0' };
const trigger = { "==": [{ "var": "data.applyLogic" }, true] };
const result = jsonLogic.apply(trigger, { data: rawData });
console.log("Result:", result);
