import { extendObservable } from 'mobx';

const modelDeserializers = new Map();
const modelObservables = new Map();

export default class Model {
  static create(fields, store) {
    const Constructor = this;
    return new Constructor(fields, store);
  }

  // Takes an array of serialized models and returns an array of wrapped models
  // Returns `null` if the input isn't an array.
  static fromArray(array, store) {
    return Array.isArray(array)
      ? array.map(fields => this.create(fields, store))
      : null;
  }

  // Turns the schema object into an array of [key, deserializeFn] pairs.
  // This value is cached.
  static get deserializers() {
    if(!this.schema) return [];
    if(!modelDeserializers.has(this)) {
      const deserializers = Object.entries(this.schema).map(([ key, deserialize ]) => {
        if(deserialize.isDeserializeFn) return [key, deserialize];
        if(Array.isArray(deserialize)) return [key, hasMany(deserialize[0])];
        return [key, hasOne(deserialize)];
      });
      modelDeserializers.set(this, deserializers);
    }
    return modelDeserializers.get(this);
  }

  // Creates observable properties for the model using the keys defined in the schema
  // so you won't have to add @observable class properties for keys declared in the schema.
  // This value is cached.
  static get initialObservables() {
    if(!modelObservables.has(this)) {
      const observables = this.deserializers.reduce((observables, [ key ]) => {
        observables[key] = null;
        return observables;
      }, {});
      modelObservables.set(this, observables);
    }
    return modelObservables.get(this);
  }

  constructor(fields, store) {
    extendObservable(this, this.constructor.initialObservables);
    this.store = store;
    this.patch(fields);
  }

  // Deserializes the passed fields using the model's schema and Patches the model with them.
  // Only fields that exist in the model's schema will be applied.
  patch(fields) {
    if(!fields) return;

    const patch = {};
    const { deserializers } = this.constructor;
    for(let [ key, deserialize ] of deserializers) {
      if(key in fields) {
        const value = fields[key];
        if(value == null) {
          patch[key] = null;
        } else {
          patch[key] = deserialize(value, this.store);
        }
      }
    }
    Object.assign(this, patch);
  }
}

export function hasMany(ModelClass) {
  const deserialize = hasOne(ModelClass);
  return (values, store) => {
    return Array.isArray(values)
      ? values.map(value => deserialize(value, store))
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
  } else if(ModelClass === Object) {
    deserializeFn = parsers.object;
  } else if(ModelClass === Array) {
    deserializeFn = parsers.array;
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
  string: value => value,
  boolean: value => !!value,
  number: value => +value,
  date: value => new Date(value),
  object: value => value,
  array: value => value,
  customDeserializer: deserialize => (value, store) => deserialize(value, store),
  customModel: ModelClass => (value, store) => {
    if(value instanceof ModelClass) return value;
    return new ModelClass(value, store);
  },
};
