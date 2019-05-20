module.exports = {
  models: {
    User: 'mozzler.auth.user',
    Car: 'drivible.car',
    Dealership: 'drivible.dealership' 
  },
  server_models: {
    'mozzler.auth.user': 'mozzler\\auth\\models\\User',
    'drivible.car': 'app\\models\\Car',
    'drivible.dealership': 'app\\models\\Dealership' 
  },
  alphabet: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
};
