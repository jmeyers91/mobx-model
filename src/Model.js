import { extendObservable } from 'mobx';

export default class Model {
  static create(store, object) {
    const Constructor = this;
    return new Constructor(store, object);
  }

  // Takes an array of serialized models and returns an array of wrapped models
  // Returns `null` if the input isn't an array.
  static fromArray(store, array) {
    return Array.isArray(array)
      ? array.map(object => this.create(store, object))
      : null;
  }

  // Turns the schema object into an array of [key, deserializeFn] pairs.
  // This value is cached.
  static get deserializers() {
    if(!this.schema) return [];
    if(!this._deserializers) {
      this._deserializers = Object.entries(this.schema).map(([ key, deserialize ]) => {
        if(deserialize.isDeserializeFn) return [key, deserialize];
        if(Array.isArray(deserialize)) return [key, hasMany(deserialize[0])];
        return [key, hasOne(deserialize)];
      });
    }
    return this._deserializers;
  }

  // Creates observable properties for the model using the keys defined in the schema
  // so you won't have to add @observable class properties for keys declared in the schema.
  // This value is cached.
  static get initialObservables() {
    if(!this._initialObservables) {
      this._initialObservables = this.deserializers.reduce((observables, [ key ]) => {
        observables[key] = null;
        return observables;
      }, {});
    }
    return this._initialObservables;
  }

  constructor(store, fields) {
    if(!store) throw new Error(`You must pass a store reference when creating a ${this.constructor.name}`);
    fields = fields || {};
    extendObservable(this, this.constructor.initialObservables);
    this.store = store;
    this.patch(fields);
  }

  // Patches the model with the passed fields.
  // Only fields that exist in the model's schema will be applied.
  patch(fields) {
    const patch = {};
    const { deserializers } = this.constructor;
    for(let [ key, deserialize ] of deserializers) {
      if(key in fields) {
        patch[key] = deserialize(this.store, fields[key]);
      }
    }
    Object.assign(this, patch);
  }
}

export function hasMany(ModelClass) {
  const deserialize = hasOne(ModelClass);
  return (store, values) => {
    return Array.isArray(values)
      ? values.map(value => deserialize(store, value))
      : null;
  };
}

export function hasOne(ModelClass) {
  let deserializeFn;

  if(ModelClass === String) {
    deserializeFn = parsers.string;
  } else if(ModelClass === Boolean) {
    deserializeFn = parsers.boolean;
  } else if(ModelClass === Number) {
    deserializeFn = parsers.number;
  } else if(ModelClass === Date) {
    deserializeFn = parsers.date;
  } else if(ModelClass.deserialize) {
    deserializeFn = parsers.customDeserializer(ModelClass.deserialize);
  } else if(isModelClass(ModelClass)) {
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

const parsers = {
  string: (_, value) => value != null ? value : null,
  boolean: (_, value) => !!value,
  number: (_, value) => value != null ? +value : null,
  date: (_, value) => value != null ? new Date(value) : null,
  customDeserializer: deserialize => (store, value) => deserialize(store, value),
  customModel: ModelClass => (store, value) => {
    if(value == null) return null;
    if(value instanceof ModelClass) return value;
    return new ModelClass(store, value);
  },
};
