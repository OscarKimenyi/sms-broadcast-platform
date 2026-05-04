const db = require('../config/db');
const fs = require('fs');
const csv = require('csv-parser');

exports.getLists = async (req, res) => {
    try {
        const [lists] = await db.query(
            'SELECT * FROM contact_lists WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json({ lists });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createList = async (req, res) => {
    try {
        const { name } = req.body;
        const [result] = await db.query(
            'INSERT INTO contact_lists (user_id, name) VALUES (?, ?)',
            [req.user.id, name]
        );
        res.status(201).json({ message: 'List created', id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteList = async (req, res) => {
    try {
        await db.query('DELETE FROM contact_lists WHERE id = ? AND user_id = ?', [
            req.params.id,
            req.user.id,
        ]);
        res.json({ message: 'List deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getContacts = async (req, res) => {
    try {
        const { listId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const [contacts] = await db.query(
            'SELECT * FROM contacts WHERE list_id = ? LIMIT ? OFFSET ?',
            [listId, limit, offset]
        );
        const [[{ total }]] = await db.query(
            'SELECT COUNT(*) as total FROM contacts WHERE list_id = ?',
            [listId]
        );

        res.json({ contacts, total, page, limit });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.importCSV = async (req, res) => {
    try {
        const { listId } = req.params;

        // Verify list belongs to user
        const [lists] = await db.query(
            'SELECT id FROM contact_lists WHERE id = ? AND user_id = ?',
            [listId, req.user.id]
        );
        if (!lists.length) return res.status(403).json({ message: 'List not found' });

        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const contacts = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (row) => {
                    const phone = row.phone_number || row.phone || row.number || row.msisdn;
                    if (phone) {
                        contacts.push([
                            listId,
                            phone.toString().trim(),
                            row.first_name || row.name || null,
                            row.last_name || null,
                        ]);
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        fs.unlinkSync(req.file.path); // clean up uploaded file

        if (!contacts.length) return res.status(400).json({ message: 'No valid contacts found in CSV' });

        // Bulk insert
        await db.query(
            'INSERT INTO contacts (list_id, phone_number, first_name, last_name) VALUES ?',
            [contacts]
        );

        // Update contact count on list
        await db.query(
            'UPDATE contact_lists SET contact_count = (SELECT COUNT(*) FROM contacts WHERE list_id = ?) WHERE id = ?',
            [listId, listId]
        );

        res.json({ message: `${contacts.length} contacts imported successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};