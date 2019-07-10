const config = require('./config/config');
const constants = require('./config/constants');
const runner = require('./runner.js')(config);

const carRoutes = require('./routes/car');
const userRoutes = require('./routes/user');
const dealershipRoutes = require('./routes/dealership');

const MongoSocketsService = require('./services/sockets');
const PermissionService = require('./services/permission-api');

function configure (runner) {
    runner.setRoute('/v1/cars', carRoutes);
    runner.setRoute('/v1/users', userRoutes);
    runner.setRoute('/v1/dealerships', dealershipRoutes);

    const io = runner.initIO();
    const permissionService = new PermissionService(this.config.WEB_API_URL, constants);
    new MongoSocketsService(io, permissionService);
    runner.listen();
}

runner.init()
    .then(() => configure(runner))
    .catch(error => console.error(error));

