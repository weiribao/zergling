var Backbone = require("backbone");
var zerg = require("./main");
var assert = require("assert");

var binding = zerg.binding;
var onewayBinding = zerg.onewayBinding;
var computedProperty = zerg.computedProperty;

// tests

var m1 = new Backbone.Model({
  name: 'm1',
  income: 100
})
var m2 = new Backbone.Model({
  name: 'm2',
  income: 200
})

var m3 = new Backbone.Model({
  name: 'm3',
  income: 200
})

binding(m1, 'income', m2);
binding(m2, 'income', m3);
binding(m3, 'income', m1);

assert.equal(m2.get("income"), 100);
assert.equal(m3.get("income"), 100);

m1.set("income", 300);

assert(m2.get("income")===300);

m2.set("income", 888);

assert.equal(m1.get("income"), 888);

m2.set("income", 500);

assert(m1.get("income")===500);
assert.equal(m3.get("income"), 500);


m1.set("income", 9);

assert.equal(m2.get("income"), 9);
assert.equal(m3.get("income"), 9);

var m4 = new Backbone.Model();
computedProperty(m4, "total", [[m1, "income"], [m2, "income"], [m3, "income"]], function(income1, income2, income3){
  return income1 + income2 + income3;
})
assert.equal(m4.get("total"), 27);

m1.set("income", 12);
assert.equal(m4.get("total"), 36);

var m5 = new Backbone.Model({
  name: 'm5'
}); 
var m6 = new Backbone.Model({
  name: 'm6'
}); 
computedProperty(m5, "income", [[m6, "income"]], function(income){
  return income + 1;
})
computedProperty(m6, "income", [[m5, "income"]], function(income){
  return income + 1;
})

assert.throws(function(){
  m5.set("income", 3);
}, /Cycular dependencies detected!/);
