import { Router } from 'express';
import { getTrips, createTrip, updateTrip, deleteTrip, finishTrip } from '../controllers/tripController';

const router = Router();

router.get('/', getTrips);
router.post('/', createTrip);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);
router.put('/:id/finish', finishTrip);

export default router;
