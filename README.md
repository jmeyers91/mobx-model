# @simplej/mobx-model

A simple MobX Model class for easily wrapping nested JSON models in MobX observable classes.

## Install

```
npm install @simplej/mobx-model
```

## Usage

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
    };
  }
}

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
});

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

Create a new Model instance:

```
const model = new Model(store, { ... });
```

Create an array of model instances:

```
const models = Model.fromArray(store, [ ... ]);
```

Patch a model:

```
model.patch({ ... });
```

## Custom deserializers

If you need to use custom deserializers in your schema, you can use an object with a `deserialize` method:

const Range = {
  deserialize(store, rangeString) {
    const [ min, max ] = rangeString.split('-');
    return [+min, +max];
  }
}

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
})
