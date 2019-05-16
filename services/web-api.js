const { WEB_API_URL } = require('../config/config');
const { models, server_models } = require('../constants');
const axios = require('axios');

axios.defaults.baseURL = WEB_API_URL;

function getOptions(token) {
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

module.exports = {
  checkToken: async (token) => {
    try {
      const response = await axios.get('users', getOptions(token));
      return response.data.items[0];
    } catch(err) {
      return null;
    }
  },
  getPermissionsFilter: async (token, model) => {
    try {
      const { data: {models: available_models} } = await axios.get('metadata/streams', getOptions(token));
      const filter =  available_models[server_models[models[model]]].permissionFilter;
      
      if (!Array.isArray(filter) && Object.keys(filter).length > 0) {
        return filter;
      } else {
        return null;
      }
    } catch(err) {
      return null;
    }
  } 
};
