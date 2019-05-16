const express = require('express');
const router = express.Router();
const dealershipService = require('../services/dealership');

router
  .route('/')
  .get(dealershipService.getAllDealerships)
  .post(dealershipService.createNewDealership);
  
router
  .route('/:id')
  .put(dealershipService.editDealership)
  .delete(dealershipService.deleteDealership);

module.exports = router;
