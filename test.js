var Backbone = require("backbone");
var assert = require("assert");

var binding = function(model1, field1, model2, field2){
  if(field2===undefined){
    field2 = field1;
  }
  oneWayBinding(model1, field1, model2, field2);
  oneWayBinding(model2, field2, model1, field1);

}

var oneWayBinding = function(model1, field1, model2, field2){
  if(field2===undefined){
    field2 = field1;
  }
  model2.set(field2, model1.get(field1));

  model1.on("change:"+field1, function(options){
    model1.trigger("propagate:"+field1, {
      visited: {model1: true}
    });
  });

  model2.listenTo(model1, "propagate:"+field1, function(options){
    var visited = options.visited;
    if(!visited[model2.cid]){
      model2.set(field2, model1.get(field1));
      visited[model2.cid] = true;
      model2.trigger("propagate:"+field1, {
        visited: visited
      });
    }
  });

}

var computedProperty = function(model, field, deps, fn){
  function onDependencyChanged(m, v, options){
    var resovledDeps = deps.map(function(dep){
      var depModel, depField;
      if(Array.isArray(dep)){
        depModel = dep[0];
        depField = dep[1];
      } else {
        depModel = model;
        depField = dep;
      }
      return depModel.get(depField);
    });

    options = options || {};
    var visited = options.visited || {};
    if(visited[model.cid] === true){
      throw new Error("Cycular dependencies detected!");
    };
    visited[model.cid] = true;
    model.set(field, fn.apply(null, resovledDeps), {
      visited: visited
    });
  }

  deps.forEach(function(dep){
    var depModel, depField;
    if(Array.isArray(dep)){
      depModel = dep[0];
      depField = dep[1];
    } else {
      depModel = model;
      depField = dep;
    }
    model.listenTo(depModel, "change:" + depField, onDependencyChanged);
    onDependencyChanged();
  });

}

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
});
