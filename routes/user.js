const express = require('express');
const router = express.Router();
const userService = require('../services/user');

router
  .route('/')
  .get(userService.getAllUsers)
  .post(userService.createNewUser);
  

router
  .route('/:id')
  .put(userService.editUser)
  .delete(userService.deleteUser);

module.exports = router;
