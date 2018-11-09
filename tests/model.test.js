import Model from '../dist/Model';
import { autorun } from 'mobx';

describe('Model', () => {
  test('Should be able to create a custom model', () => {
    class TestModel extends Model {}
    const model = new TestModel({});
  });

  test('Should parse primitives declared in the model schema', () => {
    class TestModel extends Model {
      static get schema() {
        return {
          number: Number,
          boolean: Boolean,
          string: String,
          date: Date,
        }
      }
    }
    const model = new TestModel({
      number: '23.5',
      boolean: 100,
      string: 'string',
      date: '2018-08-20T18:43:37.504Z'
    });

    expect(model.number).toEqual(23.5);
    expect(model.boolean).toEqual(true);
    expect(model.string).toEqual('string');
    expect(model.date.getTime()).toEqual(new Date('2018-08-20T18:43:37.504Z').getTime());
  });

  test('Should parse models declared in the model schema', () => {
    class TestClass1 extends Model {
      static get schema() {
        return {
          testClass2: TestClass2
        };
      }
    }

    class TestClass2 extends Model {
      static get schema() {
        return {
          id: Number
        };
      }
    }

    const model = new TestClass1({
      testClass2: {
        id: '100'
      }
    });

    expect(model.testClass2 instanceof TestClass2).toBeTruthy();
    expect(model.testClass2.id).toEqual(100);
  });

  test('Should parse model arrays defined in the model schema', () => {
    class Parent extends Model {
      static get schema() {
        return {
          children: [ Child ]
        };
      }
    }

    class Child extends Model {
      static get schema() {
        return {
          id: Number
        };
      }
    }

    const model = new Parent({
      children: [
        {id: '100'},
        {id: '101'},
        {id: '102'},
        {id: '103'},
      ]
    });

    expect(Array.isArray(model.children)).toBeTruthy();
    expect(model.children.length).toEqual(4);
    for(let child of model.children) {
      expect(child instanceof Child).toBeTruthy();
    }
  });

  test('Model properties defined in their schema should be observable', () => {
    class TestClass extends Model {
      static get schema() {
        return {
          key: String
        };
      }
    }

    const model = new TestClass({key: 'unchanged'});
    const values = [];

    autorun(() => {
      values.push(model.key);
    });

    model.key = 'changed';
    expect(values).toEqual(['unchanged', 'changed']);
  });

  test('Model nested object properties should be observable', () => {
    class TestClass extends Model {
      static get schema() {
        return {
          key: Object
        };
      }
    }

    const model = new TestClass({key: {subkey: 'unchanged'}});
    const values = [];

    autorun(() => {
      values.push(model.key.subkey);
    });

    model.key.subkey = 'changed';
    expect(values).toEqual(['unchanged', 'changed']);
  });

  test('Model nested array properties should be observable', () => {
    class TestClass extends Model {
      static get schema() {
        return {
          key: Array
        };
      }
    }

    const model = new TestClass({key: ['unchanged']});
    const values = [];

    autorun(() => {
      values.push(model.key[0]);
    });

    model.key[0] = 'changed';
    expect(values).toEqual(['unchanged', 'changed']);
  });

  test('Should be able to extend custom models with new schema pairs', () => {
    class Parent extends Model {
      static get schema() {
        return {
          key1: Number,
        };
      }
    }

    class Child extends Parent {
      static get schema() {
        return {
          ...Parent.schema,
          key2: String,
        };
      }
    }

    const parent = new Parent({ key1: 20 });

    const child = new Child({
      key1: 10,
      key2: 'string',
    });

    expect(child.key1).toEqual(10);
    expect(child.key2).toEqual('string');
  });
});
