const { WEB_API_URL } = require('../config/config');
let { models, server_models } = require('../constants');
const axios = require('axios');

axios.defaults.baseURL = WEB_API_URL;

function getOptions(token) {
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
}

let urls = {
  users: 'users',
  streams: 'metadata/streams'
};

module.exports = {
  setDefaults (server, routes, constants) {
    axios.defaults.baseURL = server;
    urls = routes;

    [ models, server_models ] = constants;
  },
  checkToken: async (token) => {
    try {
      const response = await axios.get(urls.users, getOptions(token));
      return response.data.items[0];
    } catch(err) {
      return null;
    }
  },
  getPermissionsFilter: async (token, model, is_raw) => {
    try {
      const { data: {models: available_models} } = await axios.get(urls.streams, getOptions(token));
      
      if (is_raw) {
        return available_models;
      } else {
        const filter =  available_models[server_models[models[model]]].permissionFilter;
        
        if (!Array.isArray(filter) && Object.keys(filter).length > 0) {
          return filter;
        } else {
          return null;
        }
      }
    } catch(err) {
      return null;
    }
  }
};
