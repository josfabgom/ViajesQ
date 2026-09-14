import { Router } from 'express';
import { getPassengers, createPassenger, updatePassenger, deletePassenger } from '../controllers/passengerController';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../controllers/driverController';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicleController';
import { getPlaces, createPlace, updatePlace, deletePlace } from '../controllers/placeController';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { getRoutes, createRoute, updateRoute, deleteRoute } from '../controllers/routeController';
import { getUsers, createUser, updateUser, deleteUser, getRoles } from '../controllers/userController';
import { getPriceRates, createPriceRate, updatePriceRate, deletePriceRate } from '../controllers/priceRatesController';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication
router.use(authMiddleware);

router.get('/settings', getSettings);
router.put('/settings', requireAdmin, updateSettings);

router.get('/passengers', getPassengers);
router.post('/passengers', requireAdmin, createPassenger);
router.put('/passengers/:id', requireAdmin, updatePassenger);
router.delete('/passengers/:id', requireAdmin, deletePassenger);

router.get('/drivers', getDrivers);
router.post('/drivers', requireAdmin, createDriver);
router.put('/drivers/:id', requireAdmin, updateDriver);
router.delete('/drivers/:id', requireAdmin, deleteDriver);

router.get('/vehicles', getVehicles);
router.post('/vehicles', requireAdmin, createVehicle);
router.put('/vehicles/:id', requireAdmin, updateVehicle);
router.delete('/vehicles/:id', requireAdmin, deleteVehicle);

router.get('/places', getPlaces);
router.post('/places', requireAdmin, createPlace);
router.put('/places/:id', requireAdmin, updatePlace);
router.delete('/places/:id', requireAdmin, deletePlace);

router.get('/routes', getRoutes);
router.post('/routes', requireAdmin, createRoute);
router.put('/routes/:id', requireAdmin, updateRoute);
router.delete('/routes/:id', requireAdmin, deleteRoute);

router.get('/price-rates', requireAdmin, getPriceRates);
router.post('/price-rates', requireAdmin, createPriceRate);
router.put('/price-rates/:id', requireAdmin, updatePriceRate);
router.delete('/price-rates/:id', requireAdmin, deletePriceRate);

router.get('/users', requireAdmin, getUsers);
router.post('/users', requireAdmin, createUser);
router.put('/users/:id', requireAdmin, updateUser);
router.delete('/users/:id', requireAdmin, deleteUser);
router.get('/roles', requireAdmin, getRoles);

export default router;
