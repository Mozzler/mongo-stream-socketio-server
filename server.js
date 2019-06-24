const config = require('./config/config');
const runner = require('./runner.js')(config);

const carRoutes = require('./routes/car');
const userRoutes = require('./routes/user');
const dealershipRoutes = require('./routes/dealership');

function configure (runner) {
    runner.setRoute('/v1/cars', carRoutes);
    runner.setRoute('/v1/users', userRoutes);
    runner.setRoute('/v1/dealerships', dealershipRoutes);
    runner.listen();
}

runner.init()
    .then(() => configure(runner))
    .catch(error => console.error(error));

