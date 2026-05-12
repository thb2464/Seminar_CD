import { Tour } from '../catalog/entities/tour.entity';

export const TOUR_CREATED = 'TourCreated';
export const TOUR_UPDATED = 'TourUpdated';
export const TOUR_DELETED = 'TourDeleted';

export type CatalogEventType = typeof TOUR_CREATED | typeof TOUR_UPDATED | typeof TOUR_DELETED;

export interface CatalogEventEnvelope<T = unknown> {
  type: CatalogEventType;
  occurredAt: string;
  service: 'catalog-service';
  payload: T;
}

export interface TourEventPayload {
  id: number;
  documentId: string;
  locale: string;
  slug: string;
  tourName: string;
  region: string | null;
  isFeatured: boolean;
  updatedAt: string;
}

export function toTourPayload(tour: Tour): TourEventPayload {
  return {
    id: tour.id,
    documentId: tour.documentId,
    locale: tour.locale,
    slug: tour.slug,
    tourName: tour.tourName,
    region: tour.region,
    isFeatured: tour.isFeatured,
    updatedAt: (tour.updatedAt ?? new Date()).toISOString(),
  };
}
