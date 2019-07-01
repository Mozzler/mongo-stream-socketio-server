module.exports = {
  models: {
    user: 'mozzler.auth.user',
    car: 'drivible.car',
    dealership: 'drivible.dealership'
  },
  server_models: {
    'mozzler.auth.user': 'mozzler\\auth\\models\\User',
    'drivible.car': 'app\\models\\Car',
    'drivible.dealership': 'app\\models\\Dealership' 
  },
  routes: {
    user: 'user',
    stream: 'metadata/stream'
  }
};
