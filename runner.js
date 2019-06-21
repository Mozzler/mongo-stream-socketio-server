const express = require('express');
const cors = require('cors');
const mongoAdapter = require('socket.io-adapter-mongo');
const bodyParser = require('body-parser');
const io = require('socket.io');

const MongoSocketsService = require('./services/sockets');
const DB = require('./services/db');


class Runner {
    constructor(config) {
        this.app = express();
        this.config = config;

        this.io = new io(config.SOCKETS_PORT);
    }

    async init() {
        await DB.connect(this.config.MONGO_URI, this.config.DB_NAME);

        this.io.adapter(mongoAdapter(this.config.MONGO_URI));

        this.app.use(cors());
        this.app.use(bodyParser.json({limit: '50mb'}));
        this.app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
        this.app.get('/', function(req, res) {
            res.send('This is not the server you are looking for.');
        });
    }

    listen() {
        this.app.listen(this.config.PORT, () => console.log(`App running at ${this.config.PORT}`));
        return new MongoSocketsService(this.io);
    }

    setRoute(route, entity) {
        this.app.use(route, entity);
    }
}

module.exports = (data) => {
    return new Runner(data)
};