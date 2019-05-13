const mongoose = require('mongoose');
const {User} = require('../models');

class UsersService {
  async getAllUsers(req, res) {
    await User.find().exec().then(docs => {
      res.status(200).send(docs);
    })
    .catch(err => {
      res.status(500).json({
        error: err,
      });
    });
  }

  async createNewUser(req, res) {
    const user = new User(req.body);
    await user.save();
    res.status(200).send(user);
  }

  async editUser(req, res) {
    const {id} = req.params;
    const newUser = req.body;
    const updatedUser = await User.findOneAndUpdate({_id: id}, newUser);
    res.status(200).json(updatedUser);
  }

  async deleteUser(req, res) {
    const {id} = req.params;
    await User.findOneAndDelete({_id: id})
      .then(doc => {
        res.status(200).send(doc);
      })
      .catch(err => {
        res.status(500).json({error: err});
      });
  }
}

module.exports = new UsersService;
