const db = require('./db');
const ObjectID = require('mongodb').ObjectID;

class UsersService {
  async getAllUsers(req, res) {
    try {
      const pageOptions = {
        page: req.query['page'] || 1,
        limit: req.query['per-page'] || 5
      }

      const skip = parseInt(pageOptions.limit * (pageOptions.page - 1));
      const limit = parseInt(pageOptions.limit);
      const result = await db.get().collection('mozzler.auth.user').aggregate([
        { "$group": {'_id': null , 'total': { '$sum' : 1 }, results: { $push: '$$ROOT' } } },
        { '$project': {'total': 1 , 'results': { '$slice' : ['$results', skip, limit] } } }
      ]).toArray();
      
      result[0].results.forEach(item => {
        item.id = item._id;
        delete item._id;
        delete item.createdAt;
        delete item.updatedAt;
        delete item.createdUserId;
        delete item.updatedUserId;
      });

      res.status(200).send({
        items: result[0].results,
        _meta: {
          totalCount: result[0].total
        }
      });
    } catch (err) {
      console.log(err)
      res.status(500).json({
        error: err,
      });
    }
  }

  async createNewUser(req, res) {
    try {
      const result = await db.get().collection('mozzler.auth.user').insertOne(req.body);
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
      const result = await db.get().collection('mozzler.auth.user').updateOne({_id: ObjectID(id)}, {$set: newUser});
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
      const result = await db.get().collection('mozzler.auth.user').deleteOne({_id: ObjectID(id)});
      res.status(200).send(!!result.ok);
    } catch (err) {
      res.status(500).json({
        error: err,
      });
    }
  }
};

module.exports = new UsersService;
