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

  model2.listenTo(model1, "change:"+field1, function(){
    model2.set(field2, model1.get(field1));
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

module.exports = {
  binding: binding,
  oneWayBinding: oneWayBinding,
  computedProperty: computedProperty
};