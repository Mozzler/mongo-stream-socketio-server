const express = require('express');
const cors = require('cors');
const mongoAdapter = require('socket.io-adapter-mongo');
const bodyParser = require('body-parser');
const DB = require('./services/db');

const Server = require('socket.io');

const MongoSocketsService = require('./services/sockets');
const PermissionService = require('./services/permission-api');

class Runner {
    constructor(config) {
        this.app = express();
        this.config = config;
    }

    async init() {
        await DB.connect(this.config.MONGO_URI, this.config.DB_NAME);

        this.app.use(cors());
        this.app.use(bodyParser.json({limit: '50mb'}));
        this.app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
        this.app.get('/', function(req, res) {
            res.send('This is not the server you are looking for.');
        });
    }

    listen() {
        this.app.listen(this.config.PORT, () => console.log(`App running at ${this.config.PORT}`));
    }

    setRoute(route, entity) {
        this.app.use(route, entity);
    }

    initIO () {
        this.io = new Server(this.config.SOCKETS_PORT);
        this.io.adapter(mongoAdapter(this.config.MONGO_URI));

        return this.io;
    }
}

module.exports = (data) => {
    return new Runner(data)
};