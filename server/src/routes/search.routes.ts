import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', ...searchController.search);
router.get('/suggestions', ...searchController.suggestions);

export default router;