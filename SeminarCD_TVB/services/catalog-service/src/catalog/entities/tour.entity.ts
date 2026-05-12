import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SupportedLocale, TourCategory } from './tour-category.entity';

export type Region = 'MienBac' | 'MienTrung' | 'MienNam' | 'TayNguyen' | 'NhieuVung';
export type TransportType = 'XeKhach' | 'MayBay' | 'Tau' | 'XeMay' | 'KetHop';

export interface TourHighlight {
  title: string;
  description?: string;
  iconUrl?: string;
}

export interface GalleryImage {
  url: string;
  alt?: string | null;
  caption?: string | null;
}

@Entity({ name: 'tours' })
@Index('idx_tours_document_locale', ['documentId', 'locale'], { unique: true })
@Index('idx_tours_slug_locale', ['slug', 'locale'])
@Index('idx_tours_region', ['region'])
@Index('idx_tours_featured', ['isFeatured'])
export class Tour {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, name: 'document_id' })
  documentId!: string;

  @Column({ type: 'varchar', length: 10, default: 'vi' })
  locale!: SupportedLocale;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'varchar', length: 500, name: 'tour_name' })
  tourName!: string;

  @Column({ type: 'text', nullable: true, name: 'short_description' })
  shortDescription!: string | null;

  // Strapi rich-text blocks — keep raw so the frontend can render unchanged.
  @Column({ type: 'jsonb', nullable: true })
  description!: unknown | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  region!: Region | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'departure_location' })
  departureLocation!: string | null;

  @Column({ type: 'bigint', nullable: true, transformer: nullableBigint() })
  price!: number | null;

  @Column({ type: 'bigint', nullable: true, name: 'original_price', transformer: nullableBigint() })
  originalPrice!: number | null;

  @Column({ type: 'bigint', nullable: true, name: 'child_price', transformer: nullableBigint() })
  childPrice!: number | null;

  @Column({ type: 'integer', nullable: true, name: 'duration_days' })
  durationDays!: number | null;

  @Column({ type: 'integer', nullable: true, name: 'duration_nights' })
  durationNights!: number | null;

  @Column({ type: 'integer', nullable: true, name: 'max_participants' })
  maxParticipants!: number | null;

  @Column({ type: 'numeric', precision: 3, scale: 2, nullable: true })
  rating!: number | null;

  @Column({ type: 'integer', nullable: true, name: 'review_count' })
  reviewCount!: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'transport_type' })
  transportType!: TransportType | null;

  @Column({ type: 'boolean', default: false, name: 'is_featured' })
  isFeatured!: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  highlights!: TourHighlight[];

  @Column({ type: 'jsonb', nullable: true })
  itinerary!: unknown | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  gallery!: GalleryImage[];

  @Column({ type: 'text', nullable: true, name: 'featured_image_url' })
  featuredImageUrl!: string | null;

  @Column({ type: 'integer', nullable: true, name: 'tour_category_id' })
  tourCategoryId!: number | null;

  @ManyToOne(() => TourCategory, (cat) => cat.tours, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'tour_category_id' })
  category!: TourCategory | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt!: Date | null;
}

function nullableBigint() {
  return {
    to: (value: number | null | undefined) => value,
    from: (value: string | null) => (value === null ? null : Number(value)),
  };
}
