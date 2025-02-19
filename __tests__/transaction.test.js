const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const { generateTokens } = require('../controllers/tokenController');

describe('Transaction API', () => {
    let authToken;
    let userId;
    let testTransaction;

    beforeAll(async () => {
        // Create a test user
        const user = new User({
            name: 'Test User',
            email: 'test@transaction.com',
            password: 'password123',
            isActivated: true
        });
        await user.save();
        userId = user._id;

        // Generate tokens for authentication
        const tokens = generateTokens({ id: user._id });
        authToken = tokens.accessToken;
    });

    beforeEach(async () => {
        // Create a test transaction before each test
        testTransaction = new Transaction({
            userId: userId,
            description: 'Test Transaction',
            amount: 100,
            type: 'expense',
            category: 'Food'
        });
        await testTransaction.save();
    });

    afterEach(async () => {
        // Clean up transactions after each test
        await Transaction.deleteMany({});
    });

    afterAll(async () => {
        // Clean up users after all tests
        await User.deleteMany({});
        await mongoose.connection.close();
    });

    // Test creating a transaction
    describe('POST /api/transactions', () => {
        it('should create a new transaction', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .set('Cookie', [`accessToken=${authToken}`])
                .send({
                    description: 'New Transaction',
                    amount: 50,
                    type: 'income',
                    category: 'Salary'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.transaction.description).toBe('New Transaction');
            expect(res.body.transaction.amount).toBe(50);
        });

        it('should fail without authentication', async () => {
            const res = await request(app)
                .post('/api/transactions')
                .send({
                    description: 'New Transaction',
                    amount: 50,
                    type: 'income',
                    category: 'Salary'
                });

            expect(res.statusCode).toBe(401);
        });
    });

    // Test getting transactions
    describe('GET /api/transactions', () => {
        it('should get all transactions for authenticated user', async () => {
            const res = await request(app)
                .get('/api/transactions')
                .set('Cookie', [`accessToken=${authToken}`]);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBe(1);
            expect(res.body[0].description).toBe('Test Transaction');
        });
    });

    // Test getting transactions in date range
    describe('POST /api/transactions/inRange', () => {
        it('should get transactions within date range', async () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 1);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 1);

            const res = await request(app)
                .post('/api/transactions/inRange')
                .set('Cookie', [`accessToken=${authToken}`])
                .send({
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBe(1);
        });
    });

    // Test updating a transaction
    describe('PUT /api/transactions/:id', () => {
        it('should update an existing transaction', async () => {
            const res = await request(app)
                .put(`/api/transactions/${testTransaction._id}`)
                .set('Cookie', [`accessToken=${authToken}`])
                .send({
                    description: 'Updated Transaction',
                    amount: 150,
                    type: 'expense',
                    category: 'Food'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.description).toBe('Updated Transaction');
            expect(res.body.amount).toBe(150);
        });

        it('should fail to update non-existent transaction', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .put(`/api/transactions/${fakeId}`)
                .set('Cookie', [`accessToken=${authToken}`])
                .send({
                    description: 'Updated Transaction',
                    amount: 150,
                    type: 'expense',
                    category: 'Food'
                });

            expect(res.statusCode).toBe(404);
        });
    });

    // Test deleting a transaction
    describe('DELETE /api/transactions/:id', () => {
        it('should delete an existing transaction', async () => {
            const res = await request(app)
                .delete(`/api/transactions/${testTransaction._id}`)
                .set('Cookie', [`accessToken=${authToken}`]);

            expect(res.statusCode).toBe(200);

            // Verify transaction was deleted
            const deletedTransaction = await Transaction.findById(testTransaction._id);
            expect(deletedTransaction).toBeNull();
        });
    });
}); 