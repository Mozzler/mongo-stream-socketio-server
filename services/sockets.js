const db = require('./db');
const ObjectID = require('mongodb').ObjectID;
const API = require('./web-api');
const { models, server_models, alphabet } = require('../constants');
const nanoid = require('nanoid/generate');
const _ = require('lodash');

class MongoSocketsService {
  constructor(io) {
    this.io = io;
    this.user_sockets = {};

    this.io.on('connection', (socket) => {
      console.log(`NEW SOCKET ${socket.id}`);

      socket.on('join_collection', async (data, cb) => {
        const user = await API.checkToken(data.token);
        
        if (user) {
          const permissionFilter = await API.getPermissionsFilter(data.token, data.model);

          if (permissionFilter) {
            data.permission_filter = permissionFilter;
          }

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

        const user_id = _.findKey(this.user_sockets, obj => {
          return Object.keys(obj).includes(socket.id);
        });
        
        if (this.user_sockets[user_id] && this.user_sockets[user_id][socket.id]) {
          Object.keys(this.user_sockets[user_id][socket.id].streams).forEach(stream_id => {
            this.user_sockets[user_id][socket.id].streams[stream_id].change_stream.close();
          });
  
          delete this.user_sockets[user_id][socket.id];
        }
      });

      socket.on('left_collection', ({user_id, stream_id}) => {
        console.log(`DISCONNECTED STREAM ${stream_id}`);

        if (this.user_sockets[user_id] &&
            this.user_sockets[user_id][socket.id] &&
            this.user_sockets[user_id][socket.id].streams[stream_id]) {
          this.user_sockets[user_id][socket.id].streams[stream_id].change_stream.close();
          delete this.user_sockets[user_id][socket.id].streams[stream_id];
        }
      });

      socket.on('token_refreshed_recreate', async ({user_id, token}) => {
        console.log('TOKEN WAS EXPIRED, TRYING TO REFRESH!');
        this.user_sockets[user_id][socket.id].token = token;

        const available_models = await API.getPermissionsFilter(this.user_sockets[user_id][socket.id].token, null, true);
      
        if (available_models) {
          this.handleSocketStreamsRecreation(user_id, socket.id, available_models);
        }
      });
    });

    this.subscribeToUserRoles();
  }

  handleConnection(socket, data, streamId) {
    if (!this.user_sockets[data.user_id]) {
      this.user_sockets[data.user_id] = {
        [socket.id]: {
          token: data.token,
          socket_obj: socket,
          streams: {}
        }
      }
    } else if (!this.user_sockets[data.user_id][socket.id]) {
      this.user_sockets[data.user_id][socket.id] = {
        token: data.token,
        socket_obj: socket,
        streams: {}
      }
    } else {
      this.user_sockets[data.user_id][socket.id].token = data.token;
    }
    
    this.addMongoListener(socket, data, streamId);
  }

  addMongoListener(socket, data, streamId) {
    const collection = models[data.model];
    const mongoCollection = db.get().collection(collection);
    const filter = data.filter;

    if (data.permission_filter) {
      filter[0].$match.$and.push(data.permission_filter);
    }

    this.castFilter(filter);
    console.log(`NEW STREAM ${streamId}`);

    this.user_sockets[data.user_id][socket.id].streams[streamId] = {
      model: data.model,
      filter: data.filter 
    };

    this.user_sockets[data.user_id][socket.id].streams[streamId].change_stream = mongoCollection.watch(
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

  subscribeToUserRoles() {
    const filter = [{
      $match: {
        $and: [
          {'updateDescription.updatedFields.roles': {$exists: true }},
          { operationType: 'update'}
        ]
      }
    }];

    db.get().collection(models.User).watch(
      filter,
    ).on('change', data => {
      console.log('USER ROLE WAS CHANGED !');
      const user_id = data.documentKey._id.toString();

      if (this.user_sockets[user_id] && Object.keys(this.user_sockets[user_id].length > 0)) {
        this.recreateUserStreams(user_id);
      }
    });
  }

  // WE NEED TO HANDLE SITUATION WHEN USER MAY BE LOGGED IN FROM MULTIPLE DEVICES
  // IN THIS CASE WE NEED SEPARATE STREAM RECREATION FOR MULTIPLE INDEPENDENT FLOWS
  // BASED ON AMOUNT OF CURRENT ONLINE DEVICES AND CHECK TOKENS ACCROSS ALL SOCKETS
  async recreateUserStreams(user_id) {
    for(let socket_id of Object.keys(this.user_sockets[user_id])) {
      const available_models = await API.getPermissionsFilter(this.user_sockets[user_id][socket_id].token, null, true);
      
      if (available_models) {
        this.handleSocketStreamsRecreation(user_id, socket_id, available_models);
      } else {
        // Send event to client to refresh user Token
        this.user_sockets[user_id][socket_id].socket_obj.emit('token_refresh_recreate');
      }
    }
  }

  handleSocketStreamsRecreation(user_id, socket_id, available_models) {
    let streamsToRecreate = [];

    _.forEach(this.user_sockets[user_id][socket_id].streams, (stream_obj, stream_id) => {
      const model = stream_obj.model;
      let permission_filter = available_models[server_models[models[model]]].permissionFilter;
      
      permission_filter = 
        (!Array.isArray(permission_filter) && 
        Object.keys(permission_filter).length > 0) ? permission_filter : null;
  
      streamsToRecreate.push({
        stream_id,
        socket: this.user_sockets[user_id][socket_id].socket_obj,
        data: {
          user_id,
          model: stream_obj.model,
          filter: stream_obj.filter,
          permission_filter
        }
      });

      stream_obj.change_stream.close();
    });

    _.forEach(streamsToRecreate, stream_data => {
      this.addMongoListener(stream_data.socket, stream_data.data, stream_data.stream_id);
    });
  }

  getAPI () {
    return API;
  }
}

module.exports = MongoSocketsService;
