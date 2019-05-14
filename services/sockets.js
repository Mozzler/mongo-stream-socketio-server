const db = require('./db');
const API = require('./web-api');
const { models } = require('../constants');
const nanoid = require('nanoid/generate');
const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';

class MongoSocketsService {
  constructor(io) {
    this.io = io;
    //this.streams = {};
    this.sockets = {};

    this.io.on('connection', (socket) => {
      console.log(`NEW SOCKET ${socket.id}`);

      socket.on('join_collection', async (data, cb) => {
        let user = await API.checkToken(data.token); //move it to sockets connection!!!!

        if (user) {
          if (!this.sockets[socket.id]) {
            this.sockets[socket.id] = {
              token: data.token,
              streams: {}
            };
          } else {
            this.sockets[socket.id].token = data.token;
          }

          console.log('USER', user)

          console.log(data.model)
          const records = await db.get().collection(models[data.model]).find().toArray();
                  
          let streamId = `${socket.id}-${nanoid(alphabet, 6)}`;
          this.addMongoListener(socket, data, streamId);

          cb({
            streamId,
            records
          });
        } else {
          console.log('Some troubles with token!')
        }
      });

      socket.on('disconnect', () => {
        console.log(`DISCONNECTED SOCKET ${socket.id}`);
        
        Object.keys(this.streams).forEach(stream_id => {
          if (stream_id.indexOf(socket.id) >= 0) {
            this.streams[stream_id].close();
            delete this.streams[stream_id];
          }
        });
      });

      socket.on('left_collection', (data) => {
        console.log(`DISCONNECTED STREAM ${data.streamId}`);
        
        this.streams[data.streamId].close();
        delete this.streams[data.streamId];
      });
    });
  }

  addMongoListener(socket, data, streamId) {
    const collection = models[data.model];
    const filter = data.filter;
    const model = db.get().collection(collection);

    this.streams[streamId] = model.watch(filter, {fullDocument: 'updateLookup'}).on('change', data => {
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
