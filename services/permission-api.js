const axios = require('axios');


class PermissionService {
  constructor (url, constants) {
    axios.defaults.baseURL = url;
    this.system = constants;
  }

  async checkToken (token) {
    try {
      const response = await axios.get(this.system.routes.user, this.getOptions(token));
      return response.data.items[0];
    } catch(err) {
      return null;
    }
  }

  async getPermissionsFilter (token, model, is_raw) {
    try {
      const response = await axios.get(this.system.routes.stream, this.getOptions(token));
      const { data: {models: available_models} } = response;

      return is_raw ? available_models : this.getFilter(available_models, model);
    } catch(err) {
      return null;
    }
  }

  getFilter (models, model) {
    const phpModel = this.system.server_models[this.system.models[model]];
    let filter = models[phpModel].permissionFilter;

    return (!Array.isArray(filter) &&
        Object.keys(filter).length > 0) ?
        filter : null;
  }

  getOptions (token) {
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  getModelByKey (key) {
    return this.system.models[key];
  }
}

module.exports = PermissionService;
