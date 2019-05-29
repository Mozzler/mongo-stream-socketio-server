const config = require('./config/config');
const userRoutes = require('./routes/user');

const Runner = require('./services/runner');
const runner = new Runner(config);
runner.init().catch(error => console.error(error));
runner.express.use('/api/users', userRoutes);
runner.listen();

