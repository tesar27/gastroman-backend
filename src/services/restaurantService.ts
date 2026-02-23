import { z } from 'zod';
import { database } from '../db/database';
import { HttpError } from '../errors/httpErrors';
import {
  CreateRestaurantInput,
  Restaurant,
  RestaurantDto,
  UpdateRestaurantInput,
} from '../models/restaurantModel';

const createRestaurantSchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().min(1).max(255),
  openingTime: z.string().min(1).max(255),
  mainPicture: z.url().max(2000),
  deals: z.array(z.string().min(1)).default([]),
  reviews: z.array(z.string().min(1)).default([]),
});

const updateRestaurantSchema = createRestaurantSchema.partial();

export class RestaurantService {
  async getAllRestaurants(ownerId: number): Promise<RestaurantDto[]> {
    const rows = await database.query<Restaurant>(
      'SELECT id, owner_id, name, address, opening_time, main_picture, deals, reviews FROM restaurants WHERE owner_id = ? ORDER BY id DESC',
      [ownerId]
    );

    return rows.map(this.toDto);
  }

  async addRestaurant(ownerId: number, input: unknown): Promise<RestaurantDto> {
    const restaurant: CreateRestaurantInput = createRestaurantSchema.parse(input);

    const result = await database.execute(
      'INSERT INTO restaurants (owner_id, name, address, opening_time, main_picture, deals, reviews) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        ownerId,
        restaurant.name,
        restaurant.address,
        restaurant.openingTime,
        restaurant.mainPicture,
        JSON.stringify(restaurant.deals),
        JSON.stringify(restaurant.reviews),
      ]
    );

    if (!result.insertId) {
      throw new HttpError(500, 'Failed to create restaurant');
    }

    return {
      id: result.insertId,
      ownerId,
      ...restaurant,
    };
  }

  async updateRestaurant(ownerId: number, id: number, input: unknown): Promise<RestaurantDto> {
    const restaurant: UpdateRestaurantInput = updateRestaurantSchema.parse(input);
    const existingRows = await database.query<Restaurant>(
      'SELECT id, owner_id, name, address, opening_time, main_picture, deals, reviews FROM restaurants WHERE id = ? AND owner_id = ? LIMIT 1',
      [id, ownerId]
    );

    const existing = existingRows[0];
    if (!existing) {
      throw new HttpError(404, 'Restaurant not found');
    }

    const nextValues = {
      name: restaurant.name ?? existing.name,
      address: restaurant.address ?? existing.address,
      openingTime: restaurant.openingTime ?? existing.opening_time,
      mainPicture: restaurant.mainPicture ?? existing.main_picture,
      deals: restaurant.deals ?? this.safeArrayParse(existing.deals),
      reviews: restaurant.reviews ?? this.safeArrayParse(existing.reviews),
    };

    const result = await database.execute(
      'UPDATE restaurants SET name = ?, address = ?, opening_time = ?, main_picture = ?, deals = ?, reviews = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_id = ?',
      [
        nextValues.name,
        nextValues.address,
        nextValues.openingTime,
        nextValues.mainPicture,
        JSON.stringify(nextValues.deals),
        JSON.stringify(nextValues.reviews),
        id,
        ownerId,
      ]
    );

    if (result.affectedRows === 0) {
      throw new HttpError(404, 'Restaurant not found');
    }

    return {
      id,
      ownerId,
      ...nextValues,
    };
  }

  private toDto(restaurant: Restaurant): RestaurantDto {
    return {
      id: restaurant.id,
      ownerId: restaurant.owner_id,
      name: restaurant.name,
      address: restaurant.address,
      openingTime: restaurant.opening_time,
      mainPicture: restaurant.main_picture,
      deals: this.safeArrayParse(restaurant.deals),
      reviews: this.safeArrayParse(restaurant.reviews),
    };
  }

  private safeArrayParse(value: string): string[] {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
}