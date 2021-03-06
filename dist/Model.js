'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.hasMany = hasMany;
exports.hasOne = hasOne;

var _mobx = require('mobx');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var modelDeserializers = new Map();
var modelObservables = new Map();

var Model = function () {
  _createClass(Model, null, [{
    key: 'create',
    value: function create(fields, store) {
      var Constructor = this;
      return new Constructor(fields, store);
    }

    // Takes an array of serialized models and returns an array of wrapped models
    // Returns `null` if the input isn't an array.

  }, {
    key: 'fromArray',
    value: function fromArray(array, store) {
      var _this = this;

      return Array.isArray(array) ? array.map(function (fields) {
        return _this.create(fields, store);
      }) : null;
    }

    // Turns the schema object into an array of [key, deserializeFn] pairs.
    // This value is cached.

  }, {
    key: 'deserializers',
    get: function get() {
      if (!this.schema) return [];
      if (!modelDeserializers.has(this)) {
        var deserializers = Object.entries(this.schema).map(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
              key = _ref2[0],
              deserialize = _ref2[1];

          if (deserialize.isDeserializeFn) return [key, deserialize];
          if (Array.isArray(deserialize)) return [key, hasMany(deserialize[0])];
          return [key, hasOne(deserialize)];
        });
        modelDeserializers.set(this, deserializers);
      }
      return modelDeserializers.get(this);
    }

    // Creates observable properties for the model using the keys defined in the schema
    // so you won't have to add @observable class properties for keys declared in the schema.
    // This value is cached.

  }, {
    key: 'initialObservables',
    get: function get() {
      if (!modelObservables.has(this)) {
        var observables = this.deserializers.reduce(function (observables, _ref3) {
          var _ref4 = _slicedToArray(_ref3, 1),
              key = _ref4[0];

          observables[key] = null;
          return observables;
        }, {});
        modelObservables.set(this, observables);
      }
      return modelObservables.get(this);
    }
  }]);

  function Model(fields, store) {
    _classCallCheck(this, Model);

    (0, _mobx.extendObservable)(this, this.constructor.initialObservables);
    this.store = store;
    this.patch(fields);
  }

  // Deserializes the passed fields using the model's schema and Patches the model with them.
  // Only fields that exist in the model's schema will be applied.


  _createClass(Model, [{
    key: 'patch',
    value: function patch(fields) {
      if (!fields) return;

      var patch = {};
      var deserializers = this.constructor.deserializers;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = deserializers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _ref5 = _step.value;

          var _ref6 = _slicedToArray(_ref5, 2);

          var key = _ref6[0];
          var deserialize = _ref6[1];

          if (key in fields) {
            var value = fields[key];
            if (value == null) {
              patch[key] = null;
            } else {
              patch[key] = deserialize(value, this.store);
            }
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      Object.assign(this, patch);
    }
  }]);

  return Model;
}();

exports.default = Model;
function hasMany(ModelClass) {
  var deserialize = hasOne(ModelClass);
  return function (values, store) {
    return Array.isArray(values) ? values.map(function (value) {
      return deserialize(value, store);
    }) : null;
  };
}

function hasOne(ModelClass) {
  var deserializeFn = void 0;

  if (ModelClass === String) {
    deserializeFn = parsers.string;
  } else if (ModelClass === Boolean) {
    deserializeFn = parsers.boolean;
  } else if (ModelClass === Number) {
    deserializeFn = parsers.number;
  } else if (ModelClass === Date) {
    deserializeFn = parsers.date;
  } else if (ModelClass === Object) {
    deserializeFn = parsers.object;
  } else if (ModelClass === Array) {
    deserializeFn = parsers.array;
  } else if (ModelClass.deserialize) {
    deserializeFn = parsers.customDeserializer(ModelClass.deserialize);
  } else if (isModelClass(ModelClass)) {
    deserializeFn = parsers.customModel(ModelClass);
  } else {
    throw new Error('Invalid model class', ModelClass);
  }

  deserializeFn.isDeserializeFn = true;
  return deserializeFn;
}

function isModelClass(ModelClass) {
  return ModelClass.prototype instanceof Model;
}

var parsers = {
  string: function string(value) {
    return value;
  },
  boolean: function boolean(value) {
    return !!value;
  },
  number: function number(value) {
    return +value;
  },
  date: function date(value) {
    return new Date(value);
  },
  object: function object(value) {
    return value;
  },
  array: function array(value) {
    return value;
  },
  customDeserializer: function customDeserializer(deserialize) {
    return function (value, store) {
      return deserialize(value, store);
    };
  },
  customModel: function customModel(ModelClass) {
    return function (value, store) {
      if (value instanceof ModelClass) return value;
      return new ModelClass(value, store);
    };
  }
};