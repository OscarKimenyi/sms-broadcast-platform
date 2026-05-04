const router = require('express').Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const {
    getLists, createList, deleteList,
    getContacts, importCSV,
} = require('../controllers/contact.controller');

const upload = multer({ dest: path.join(__dirname, '../../uploads/') });

router.use(auth);

router.get('/lists', getLists);
router.post('/lists', createList);
router.delete('/lists/:id', deleteList);
router.get('/lists/:listId/contacts', getContacts);
router.post('/lists/:listId/import', upload.single('file'), importCSV);

module.exports = router;