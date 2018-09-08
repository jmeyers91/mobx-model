# @simplej/mobx-model

A MobX Model class for easily wrapping nested JSON models in MobX observable classes.

## Install

```
npm install @simplej/mobx-model
```

## Example

```js
import Model from '@simplej/mobx-model';

class User extends Model {
  static get schema() {
    return {
      id: Number,
      name: String,
      createdAt: Date,
      posts: [ Post ],
      bestFriend: User,
    };
  }
}

class Post extends Model {
  static get schema() {
    return {
      id: Number,
      title: String,
      content: String,
      createdAt: Date,
      author: User,
    };
  }
}

// optional: in case models need access to a parent or root store,
// you can pass it as the second argument to model constructors and `fromArray`
const store = {};

const user = new User({
  id: 1,
  name: 'Joe Schmoe',
  createdAt: '2018-08-20T18:43:37.504Z', // will be converted to a Date
  bestFriend: { // will be converted to a User instance
    id: 2,
    name: 'Sarah Spencer',
    createdAt: '2018-08-20T18:43:37.504Z',
  },
  posts: [ // will be converted to an array of Post instances
    {
      id: 10,
      title: 'Post title',
      content: 'Post content',
      createdAt: '2018-08-20T18:43:37.504Z'
    },
  ]
}, store);

user.patch({
  posts: [ // will be converted to an array of Post instances
    {
      id: 11,
      title: 'New post title',
      content: 'New post content',
      createdAt: '2018-08-20T18:43:37.504Z'
    },
  ]
});
```

## API

### Extend a model:

```
import Model from '@simplej/mobx-model`;
import Post from './Post';

class User extends Model {
  static get schema() {
    return {
      id: Number,
      age: Number,
      name: String,
      posts: [ Post ],
    };
  }
}
```

### Create a new Model instance:

`new Model(fields:Object?, store:Object?)`

```
const model = new Model({ ... }, store);
```

### Create an array of model instances:

`Model.fromArray(models:Array, store:Object?)`

```
const models = Model.fromArray([ ... ], store);
```

### Patch a model:

`Model#patch(fields:Object)`

```
model.patch({ ... });
```

## Custom deserializers

If you need to use custom deserializers in your schema, you can use an object with a `deserialize` method:

```js

const Range = {
  deserialize(rangeString) {
    const [ min, max ] = rangeString.split('-');
    return [+min, +max];
  }
};

class MyModel extends Model {
  static get schema() {
    return {
      id: Number,
      myRange: Range,
    };
  }
}

const model = new MyModel({
  id: 1,
  myRange: '10-20' // will be automatically converted to [10, 20]
});

model.patch({
  myRange: '200-300' // will be automatically converted to [200, 300]
});
```

