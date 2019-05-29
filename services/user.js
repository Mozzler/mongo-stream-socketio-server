const db = require('./db');
const ObjectID = require('mongodb').ObjectID;

class UsersService {
  async getAllUsers(req, res) {
    try {
      const result = await db.get().collection('users').find().toArray();
      res.status(200).send(result);
    } catch (err) {
      res.status(500).json({
        error: err,
      });
    }
  }

  async createNewUser(req, res) {
    try {
      const result = await db.get().collection('users').insertOne(req.body);
      res.status(200).send(result.ops[0]);
    } catch (err) {
      res.status(500).json({
        error: err,
      });
    }
  }

  async editUser(req, res) {
    try {
      const {id} = req.params;
      const newUser = req.body;
      const result = await db.get().collection('users').updateOne({_id: ObjectID(id)}, {$set: newUser});
      res.status(200).send(!!result.ok);
    } catch (err) {
      res.status(500).json({
        error: err,
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const {id} = req.params;
      const result = await db.get().collection('users').deleteOne({_id: ObjectID(id)});
      res.status(200).send(!!result.ok);
    } catch (err) {
      res.status(500).json({
        error: err,
      });
    }
  }
};

module.exports = new UsersService;
