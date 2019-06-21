const MongoClient = require('mongodb').MongoClient;
const state = {
  db: null,
};

module.exports = {
  connect: async (uri, dbName) => {
    const client = new MongoClient(uri, { useNewUrlParser: true });

    try {
      await client.connect();
      state.db = client.db(dbName);
    } catch (err) {
      console.log(err.stack);
      process.exit(1)
    }
  },
  close: async () => {
    if (state.db) {
      await state.db.close();
    }
  },
  get: () => state.db
};
