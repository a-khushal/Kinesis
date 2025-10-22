import { Router } from 'express';
import uploadRoutes from './upload';

const router = Router();

router.use('/', uploadRoutes);

export default router;
