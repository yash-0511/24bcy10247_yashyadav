const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// ==========================================
// 1. DATA CONTRACTS & NOSQL SCHEMA DESIGNS
// ==========================================
const Category = mongoose.model('Category', new mongoose.Schema({
    name: { type: String, required: true },
    description: String
}, { collection: 'categories' }));

const Member = mongoose.model('Member', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['student', 'staff', 'admin'], default: 'student' },
    library_card_id: { type: String, required: true, unique: true },
    branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    active_loans: { type: Number, default: 0 },
    total_fines: { type: Number, default: 0 }
}, { collection: 'members' }));

const Resource = mongoose.model('Resource', new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['book', 'journal', 'equipment'], default: 'book' },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    branch_id: { type: mongoose.Schema.Types.ObjectId },
    status: { type: String, enum: ['available', 'borrowed', 'maintenance'], default: 'available' },
    total_copies: { type: Number, default: 1 },
    available_copies: { type: Number, default: 1 },
    reservation_queue: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }] // FIFO Reservation Array
}, { collection: 'resources' }));

const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    resource_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    borrow_date: { type: Date, default: Date.now },
    due_date: { type: Date, required: true },
    return_date: { type: Date, default: null },
    fine_amount: { type: Number, default: 0 },
    returned: { type: Boolean, default: false },
    condition_on_return: { type: String, default: 'good' }
}, { collection: 'transactions' }));

// ==========================================
// 2. PRODUCTION CORE REST API ENDPOINTS
// ==========================================

// GET: Core Health Status
app.get('/api/status', (req, res) => {
    res.status(200).json({ system: "LLRMS Core Engine", operational_status: "Online", compilation_milestone: "100% Fully Complete" });
});

// POST: Borrow a Resource (With automatic FIFO Waitlist Queueing)
app.post('/api/transactions/borrow', async (req, res) => {
    try {
        const { member_id, resource_id, days_allotted } = req.body;
        const resource = await Resource.findById(resource_id);
        if (!resource) return res.status(404).json({ success: false, message: "Inventory item missing" });

        // If copies are exhausted, push member to the FIFO reservation array instead of checking out
        if (resource.available_copies <= 0) {
            if (resource.reservation_queue.includes(member_id)) {
                return res.status(400).json({ success: false, message: "Member already waitlisted in FIFO queue" });
            }
            resource.reservation_queue.push(member_id);
            await resource.save();
            return res.status(202).json({ success: true, message: "Copies exhausted. Member appended to FIFO Reservation Queue", reservation_position: resource.reservation_queue.length });
        }

        // Process successful checkout transactions
        resource.available_copies -= 1;
        if (resource.available_copies === 0) resource.status = 'borrowed';
        await resource.save();

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (days_allotted || 14));

        const txn = await Transaction.create({
            member_id,
            resource_id,
            due_date: dueDate
        });

        await Member.findByIdAndUpdate(member_id, { $inc: { active_loans: 1 } });
        res.status(210).json({ success: true, message: "Checkout processed successfully", data: txn });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST: Return a Resource (With auto-fine processing & automatic queue resolution)
app.post('/api/transactions/return/:id', async (req, res) => {
    try {
        const txn = await Transaction.findById(req.params.id);
        if (!txn || txn.returned) return res.status(404).json({ success: false, message: "Transaction completed or missing" });

        
        const actualReturnDate = new Date();
        txn.return_date = actualReturnDate;
        txn.returned = true;

        // Auto-Calculate Fine: 5 Rupees per overdue day
        if (actualReturnDate > txn.due_date) {
            const overdueDays = Math.ceil((actualReturnDate - txn.due_date) / (1000 * 60 * 60 * 24));
            txn.fine_amount = overdueDays * 5;
        }
        await txn.save();

        const resource = await Resource.findById(txn.resource_id);
        
        // If members are waitlisted, clear the top position immediately to preserve FIFO processing flow
        if (resource.reservation_queue.length > 0) {
            const nextMemberId = resource.reservation_queue.shift(); // FIFO Shift Pop operation
            await resource.save();

            const nextDueDate = new Date();
            nextDueDate.setDate(nextDueDate.getDate() + 14);

            await Transaction.create({
                member_id: nextMemberId,
                resource_id: resource._id,
                due_date: nextDueDate
            });
            await Member.findByIdAndUpdate(nextMemberId, { $inc: { active_loans: 1 } });
        } else {
            resource.available_copies += 1;
            resource.status = 'available';
            await resource.save();
        }

        await Member.findByIdAndUpdate(txn.member_id, { $inc: { active_loans: -1, total_fines: txn.fine_amount } });
        res.status(200).json({ success: true, message: "Item cleared", total_fines_applied: txn.fine_amount });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET: Advanced Multi-Criteria Resource Catalog Search
app.get('/api/resources/search', async (req, res) => {
    try {
        const { title, status, type } = req.query;
        let searchFilter = {};
        if (title) searchFilter.title = { $regex: title, $options: 'i' };
        if (status) searchFilter.status = status;
        if (type) searchFilter.type = type;

        const results = await Resource.find(searchFilter).populate('category_id');
        res.status(200).json({ success: true, query_count: results.length, matches: results });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ==========================================
// 3. RELATIONAL AGGREGATION PIPELINES (REPORTS)
// ==========================================

// GET: Usage Analytics Report - Top 5 Most Borrowed Resources
app.get('/api/reports/popular', async (req, res) => {
    try {
        const platformMetrics = await Transaction.aggregate([
            { $group: { _id: "$resource_id", borrowCount: { $sum: 1 } } },
            { $sort: { borrowCount: -1 } },
            { $limit: 5 },
            { $lookup: { from: "resources", localField: "_id", foreignField: "_id", as: "resourceMetadata" } },
            { $unwind: "$resourceMetadata" }
        ]);
        res.status(200).json({ metric_scope: "Top Borrowed Inventory Assets", data: platformMetrics });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ==========================================
// 4. PIPELINE DRIVER BOOT SEQUENCE
// ==========================================
mongoose.connect('mongodb://localhost:27017/llrms')
    .then(() => {
        console.log("\n==================================================");
        console.log("🟢 [DATABASE ENGINE] Connected to Core Local MongoDB Instance");
        console.log("==================================================");
        app.listen(8080, () => {
            console.log("🚀 [ROUTING SERVER] 100% Complete LLRMS Engine Running on Port 8080");
            console.log("==================================================\n");
        });
    }).catch(err => console.error("❌ Driver Initialization Aborted:", err));