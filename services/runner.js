const express = require('express');
const cors = require('cors');
const mongoAdapter = require('socket.io-adapter-mongo');
const bodyParser = require('body-parser');
const { ReplSet } = require('mongodb-topology-manager');
const MongoSocketsService = require('../services/sockets');
const io = require('socket.io');
const db = require('../services/db');

const app = express();

module.exports = class Runner {

    constructor(config) {
        this.config = config;
        this.io = new io(config.PORT);
    }

    async init() {
        await this.setupReplicaSet();
        await db.connect(this.config.MONGO_URI, this.config.DB_NAME);

        this.io.adapter(mongoAdapter(this.config.MONGO_URI));

        app.use(cors());
        app.use(bodyParser.json({limit: '50mb'}));
        app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
        app.get('/', function(req, res) {
            res.send('This is not the server you are looking for.');
        });
    }

    async setupReplicaSet() {
        const bind_ip = 'localhost';
        const replSet = new ReplSet('mongod', [
            {options: {port: 31000, dbpath: `${__dirname}/data/db/31000`, bind_ip}},
            {options: {port: 31001, dbpath: `${__dirname}/data/db/31001`, bind_ip}},
            {options: {port: 31002, dbpath: `${__dirname}/data/db/31002`, bind_ip}}
        ], {replSet: 'rs0'});

        await replSet.purge();
        await replSet.start();
        console.log(new Date(), 'Replica set started...');
    }

    listen() {
        app.listen(this.config.PORT, () => console.log(`App running at ${this.config.PORT}`));
        let mongoSocketsService = new MongoSocketsService(this.io);
    }
    get express() {
        return app;
    }
}