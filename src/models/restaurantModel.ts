export interface Restaurant {
  id: number;
  owner_id: number;
  name: string;
  address: string;
  opening_time: string;
  main_picture: string;
  deals: string;
  reviews: string;
}

export interface RestaurantDto {
  id: number;
  ownerId: number;
  name: string;
  address: string;
  openingTime: string;
  mainPicture: string;
  deals: string[];
  reviews: string[];
}

export interface CreateRestaurantInput {
  name: string;
  address: string;
  openingTime: string;
  mainPicture: string;
  deals: string[];
  reviews: string[];
}

export interface UpdateRestaurantInput {
  name?: string;
  address?: string;
  openingTime?: string;
  mainPicture?: string;
  deals?: string[];
  reviews?: string[];
}