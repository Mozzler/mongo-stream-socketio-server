import {Runner} from "./services/runner";

const config = require('./config/config');
const userRoutes = require('./routes/user');

Runner.express.use('/api/users', userRoutes);

const runner = new Runner(config);
runner.init().catch(error => console.error(error));

