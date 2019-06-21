const config = require('./config/config');

const carRoutes = require('./routes/car');
const userRoutes = require('./routes/user');
const dealershipRoutes = require('./routes/dealership');

const runner = require('./runner.js')(config);
runner.init().catch(error => console.error(error));

runner.setRoute('/v1/cars', carRoutes);
runner.setRoute('/v1/users', userRoutes);
runner.setRoute('/v1/dealerships', dealershipRoutes);

runner.listen();
