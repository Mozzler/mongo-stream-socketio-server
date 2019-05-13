const db = require('./db');
const { models } = require('../constants');

class MongoSocketsService {
  constructor(io) {
    this.io = io;
    this.sockets = {};

    this.io.on('connection', (socket) => {
      console.log(`NEW SOCKET ${socket.id}`);

      socket.on('join_collection', (data) => {
        this.addMongoListener(socket, data);
      });

      socket.on('disconnect', () => {
        console.log(`DISCONNECTED SOCKET ${socket.id}`);
        this.sockets[socket.id].close();
      });
    });
  }

  addMongoListener(socket, data) {
    const collection = models[data.model];
    const filter = data.filter;
    const model = db.get().collection(collection);

    this.sockets[socket.id] = model.watch(filter, {fullDocument: 'updateLookup'}).on('change', data => {
      const {
        operationType,
        updateDescription,
        fullDocument,
        documentKey
      } = data;

      socket.emit('mongo_data', {operationType, fullDocument, updateDescription, documentKey});
    });
  }
};

module.exports = MongoSocketsService;
