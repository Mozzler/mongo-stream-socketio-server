const axios = require('axios');
const { WEB_API_URL } = require('../config/config');

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
  // list: async (model, token) => {
  //   const response = await axios.get(`${model}`, getOptions(token));
  //   console.log(response.data)
  //   return response.data;
  // }
};
