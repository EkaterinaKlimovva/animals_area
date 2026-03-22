import { Router } from 'express';
import { AccountController, validateRegistration, validateCreateAccount, validateUpdateAccount } from '../controllers/accountController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { Role } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const accountController = new AccountController();

// POST /registration - public
router.post('/registration', validateRegistration, asyncHandler(accountController.register.bind(accountController)));

// GET /accounts/search - authenticated
router.get('/accounts/search', authenticateToken, asyncHandler(accountController.searchAccounts.bind(accountController)));

// GET /accounts/{accountId} - authenticated
router.get('/accounts/:accountId', authenticateToken, asyncHandler(accountController.getAccountById.bind(accountController)));

// POST /accounts - admin only
router.post('/accounts', authenticateToken, authorizeRoles(Role.ADMIN), validateCreateAccount, asyncHandler(accountController.createAccount.bind(accountController)));

// PUT /accounts/{accountId} - authenticated (own account or admin)
router.put('/accounts/:accountId', authenticateToken, validateUpdateAccount, asyncHandler(accountController.updateAccount.bind(accountController)));

// DELETE /accounts/{accountId} - authenticated (own account or admin)
router.delete('/accounts/:accountId', authenticateToken, asyncHandler(accountController.deleteAccount.bind(accountController)));

export default router;