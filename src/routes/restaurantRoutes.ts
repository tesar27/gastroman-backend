import express from 'express';
import { getRestaurants, addRestaurant, updateRestaurant } from '../controllers/restaurantController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authMiddleware);

// Get all restaurants
router.get('/', getRestaurants);

// Add a new restaurant
router.post('/', addRestaurant);

// Update an existing restaurant
router.put('/:id', updateRestaurant);

export default router;