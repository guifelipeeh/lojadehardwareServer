const Routes = require('express').Router();
const productController = require('../controller/productController');


Routes.post('/addProduct',productController.addProduct);




module.exports = Routes;
    