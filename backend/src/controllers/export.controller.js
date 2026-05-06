const db = require('../config/db');
const ExcelJS = require('exceljs');

exports.exportCampaignLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'csv' } = req.query;

        const [campaigns] = await db.query(
            'SELECT * FROM campaigns WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        if (!campaigns.length) return res.status(404).json({ message: 'Campaign not found' });
        const campaign = campaigns[0];

        const [logs] = await db.query(
            'SELECT phone_number, status, sent_at, delivered_at FROM sms_logs WHERE campaign_id = ?',
            [id]
        );

        if (format === 'excel') {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Delivery Report');
            ws.columns = [
                { header: 'Phone Number', key: 'phone_number', width: 20 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Sent At', key: 'sent_at', width: 25 },
                { header: 'Delivered At', key: 'delivered_at', width: 25 },
            ];
            ws.getRow(1).font = { bold: true };
            ws.getRow(1).fill = {
                type: 'pattern', pattern: 'solid',
                fgColor: { argb: 'FF1A1E25' },
            };
            logs.forEach(log => ws.addRow(log));

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="campaign_${id}_report.xlsx"`);
            await wb.xlsx.write(res);
            res.end();
        } else {
            // CSV
            const headers = 'phone_number,status,sent_at,delivered_at\n';
            const rows = logs.map(l =>
                `${l.phone_number},${l.status},${l.sent_at || ''},${l.delivered_at || ''}`
            ).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="campaign_${id}_report.csv"`);
            res.send(headers + rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Export failed' });
    }
};

exports.exportContacts = async (req, res) => {
    try {
        const { listId } = req.params;

        const [lists] = await db.query(
            'SELECT id, name FROM contact_lists WHERE id = ? AND user_id = ?',
            [listId, req.user.id]
        );
        if (!lists.length) return res.status(404).json({ message: 'List not found' });

        const [contacts] = await db.query(
            'SELECT phone_number, first_name, last_name, status FROM contacts WHERE list_id = ?',
            [listId]
        );

        const headers = 'phone_number,first_name,last_name,status\n';
        const rows = contacts.map(c =>
            `${c.phone_number},${c.first_name || ''},${c.last_name || ''},${c.status}`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="contacts_${listId}.csv"`);
        res.send(headers + rows);
    } catch (err) {
        res.status(500).json({ message: 'Export failed' });
    }
};