const axios = require('axios');


class PermissionService {
  constructor (url, constants) {
    axios.defaults.baseURL = url;
    this.system = constants;
  }

  async getPermissionsFilter (token, model, is_raw) {
    try {
      const response = await axios.get(this.system.routes.stream, this.getOptions(token));
      const { data: {models: available_models} } = response;

      const filters = is_raw ? available_models : this.getFilter(available_models, model);
      const user = this.getFilter(available_models, 'owner');
      const userId = this.getUserId(user);

      return [filters, userId];
    } catch(err) {
      return [err];
    }
  }

  getFilter (models, model) {
    const phpModel = this.system.server_models[this.system.models[model]];
    const filter = models[phpModel].permissionFilter;

    return (!Array.isArray(filter) &&
        Object.keys(filter).length > 0) ?
        filter : null;
  }

  getUserId (user) {
    return user.$or[0]['documentKey._id'];
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
