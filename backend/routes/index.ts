import { Router } from 'express';
import cors from 'cors';

import uploadRoutes from './upload';

const router = Router();

router.use(cors());
router.use('/', uploadRoutes);

export default router;
