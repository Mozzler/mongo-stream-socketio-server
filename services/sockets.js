const models = require('../models');

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
        this.sockets[socket.id].close();
      });
    });
  }

  addMongoListener(socket, data) {
    const collection = data.collection;
    const filter = data.filter;

    this.sockets[socket.id] = models[collection].watch(filter).on('change', data => {
      const {
        operationType,
        updateDescription,
        fullDocument,
        documentKey
      } = data;

      socket.emit('mongo_data', {operationType, fullDocument, updateDescription, documentKey});
    });
  }
}

module.exports = MongoSocketsService;
