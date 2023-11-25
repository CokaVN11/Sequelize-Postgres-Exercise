const router = require('express').Router();
const controller = require('../controllers/blogController');

router.get('/', controller.middleware, controller.showList);

router.get('/:id', controller.middleware, controller.showDetails);



module.exports = router;
