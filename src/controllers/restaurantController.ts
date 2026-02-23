import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors/httpErrors';
import { RestaurantService } from '../services/restaurantService';

const restaurantService = new RestaurantService();

// Get all restaurants
export const getRestaurants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpError(401, 'Unauthorized');
    }

    const restaurants = await restaurantService.getAllRestaurants(userId);
    res.status(200).json(restaurants);
  } catch (error) {
    next(error);
  }
};

// Add a new restaurant
export const addRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpError(401, 'Unauthorized');
    }

    const newRestaurant = await restaurantService.addRestaurant(userId, req.body);
    res.status(201).json(newRestaurant);
  } catch (error) {
    next(error);
  }
};

// Update an existing restaurant
export const updateRestaurant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new HttpError(401, 'Unauthorized');
    }

    const updatedRestaurant = await restaurantService.updateRestaurant(userId, Number(req.params.id), req.body);
    res.status(200).json(updatedRestaurant);
  } catch (error) {
    next(error);
  }
};