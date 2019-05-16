const express = require('express');
const router = express.Router();
const carService = require('../services/car');

router
  .route('/')
  .get(carService.getAllCars)
  .post(carService.createNewCar);
  
router
  .route('/:id')
  .put(carService.editCar)
  .delete(carService.deleteCar);

module.exports = router;
