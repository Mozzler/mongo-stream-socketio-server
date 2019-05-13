const express = require('express');
const cors = require('cors');
const mongoAdapter = require('socket.io-adapter-mongo');
const bodyParser = require('body-parser');
const db = require('./services/db');
const { ReplSet } = require('mongodb-topology-manager');
const config = require('./config/config');
const userRoutes = require('./routes/user');
const MongoSocketsService = require('./services/sockets');

const app = express();
const io = require('socket.io')(config.SOCKETS_PORT);

runServer().catch(error => console.error(error));

async function runServer() {
  await setupReplicaSet();
  await db.connect(config.MONGO_URI, config.DB_NAME);
 
  io.adapter(mongoAdapter(config.MONGO_URI));

  app.use(cors());
  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
  app.get('/', function(req, res) {
    res.send('This is not the server you are looking for.');
  });

  app.use('/api/users', userRoutes);
  app.listen(config.PORT, () => console.log(`App running at ${config.PORT}`));

  const mongoSocketsService = new MongoSocketsService(io);
};

async function setupReplicaSet() {
  const bind_ip = 'localhost';
  const replSet = new ReplSet('mongod', [
    {options: {port: 31000, dbpath: `${__dirname}/data/db/31000`, bind_ip}},
    {options: {port: 31001, dbpath: `${__dirname}/data/db/31001`, bind_ip}},
    {options: {port: 31002, dbpath: `${__dirname}/data/db/31002`, bind_ip}}
  ], {replSet: 'rs0'});

  await replSet.purge();
  await replSet.start();
  console.log(new Date(), 'Replica set started...');
};
