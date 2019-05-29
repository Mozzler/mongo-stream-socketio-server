const axios = require('axios');
const { WEB_API_URL } = require('../config/config');
axios.defaults.baseURL = WEB_API_URL;

module.exports = {
  list: async (model, token) => {
    const options = {
      headers: {'Authorization': `Bearer ${token}`},
    };

    const response = await axios.get(`v1/${model}`, options);
    console.log(response.data)
    return response.data;
  }
};
