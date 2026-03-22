import { Router } from 'express';
import { AccountController } from '../controllers/accountController';
import { authenticateToken, authorizeRoles, optionalAuthenticate } from '../middleware/auth';
import { Role } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { accountIdParamsSchema, accountSearchQuerySchema, createAccountBodySchema, registrationBodySchema, updateAccountBodySchema } from '../validation/accountSchemas';

const router = Router();
const accountController = new AccountController();

// POST /registration - public
router.post('/registration', optionalAuthenticate, validate({ body: registrationBodySchema }), asyncHandler(accountController.register.bind(accountController)));

// GET /accounts/search - authenticated
router.get('/accounts/search', authenticateToken, validate({ query: accountSearchQuerySchema }), asyncHandler(accountController.searchAccounts.bind(accountController)));

// GET /accounts/{accountId} - authenticated
router.get('/accounts/:accountId', authenticateToken, validate({ params: accountIdParamsSchema }), asyncHandler(accountController.getAccountById.bind(accountController)));

// POST /accounts - admin only
router.post('/accounts', authenticateToken, authorizeRoles(Role.ADMIN), validate({ body: createAccountBodySchema }), asyncHandler(accountController.createAccount.bind(accountController)));

// PUT /accounts/{accountId} - authenticated (own account or admin)
router.put('/accounts/:accountId', authenticateToken, validate({ params: accountIdParamsSchema, body: updateAccountBodySchema }), asyncHandler(accountController.updateAccount.bind(accountController)));

// DELETE /accounts/{accountId} - authenticated (own account or admin)
router.delete('/accounts/:accountId', authenticateToken, validate({ params: accountIdParamsSchema }), asyncHandler(accountController.deleteAccount.bind(accountController)));

export default router;