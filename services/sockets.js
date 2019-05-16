const db = require('./db');
const ObjectID = require('mongodb').ObjectID;
const API = require('./web-api');
const { models } = require('../constants');
const nanoid = require('nanoid/generate');
const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

class MongoSocketsService {
  constructor(io) {
    this.io = io;
    this.sockets = {};

    this.io.on('connection', (socket) => {
      console.log(`NEW SOCKET ${socket.id}`);

      socket.on('join_collection', async (data, cb) => {
        const user = await API.checkToken(data.token);
        const permissionFilter = await API.getPermissionsFilter(data.token, data.model);

        if (permissionFilter) {
          //data.filter[0].$match.$and.push(permissionFilter);
        }

        if (user) {
          const streamId = `${socket.id}-${nanoid(alphabet, 6)}`;
          this.handleConnection(socket, data, streamId);

          cb({
            streamId,
            error: false
          });
        } else {
          cb({
            streamId: null,
            error: true
          });
        }
      });

      socket.on('disconnect', () => {
        console.log(`DISCONNECTED SOCKET ${socket.id}`);
        if (this.sockets[socket.id] && this.sockets[socket.id].streams) {
          Object.keys(this.sockets[socket.id].streams).forEach(stream_id => {
            this.sockets[socket.id].streams[stream_id].close();
            delete this.sockets[socket.id].streams[stream_id];
          });
        }
      });

      socket.on('left_collection', (streamId) => {
        console.log(`DISCONNECTED STREAM ${streamId}`);
        if (this.sockets[socket.id] &&
            this.sockets[socket.id].streams &&
            this.sockets[socket.id].streams[streamId]) {
          this.sockets[socket.id].streams[streamId].close();
          delete this.sockets[socket.id].streams[streamId];
        }
      });
    });
  }

  handleConnection(socket, data, streamId) {
    if (!this.sockets[socket.id]) {
      this.sockets[socket.id] = {
        token: data.token,
        streams: {}
      };
    } else {
      this.sockets[socket.id].token = data.token;
    }
    
    this.addMongoListener(socket, data, streamId);
  }

  addMongoListener(socket, data, streamId) {
    const collection = models[data.model];
    const mongoCollection = db.get().collection(collection);
    const filter = data.filter;

    this.castFilter(filter);

    console.log(`NEW STREAM ${streamId}`);
    this.sockets[socket.id].streams[streamId] = mongoCollection.watch(
      filter,
      {fullDocument: 'updateLookup'}
    ).on('change', data => {
      const {
        operationType,
        updateDescription,
        fullDocument,
        documentKey
      } = data;

      socket.emit('mongo_data', {operationType, fullDocument, updateDescription, documentKey});
    });
  }

  castFilter(filter) {
    const iterate = (obj) => {
      Object.keys(obj).forEach(key => {
        console.log(`KEY: ${key} - VALUE: ${obj[key]}`);

        if (typeof obj[key] != 'number' && ObjectID.isValid(obj[key])) {
          obj[key] = ObjectID(obj[key]);
        }
  
        if (typeof obj[key] === 'object' && !(obj[key] instanceof ObjectID)) {
          iterate(obj[key])
        }
      });
    };
    iterate(filter);
  }
};

module.exports = MongoSocketsService;
