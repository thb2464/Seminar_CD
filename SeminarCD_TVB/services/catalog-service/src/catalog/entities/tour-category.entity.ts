import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Tour } from './tour.entity';

export type SupportedLocale = 'vi' | 'en' | 'zh';

@Entity({ name: 'tour_categories' })
@Index('idx_tour_categories_document_locale', ['documentId', 'locale'], { unique: true })
@Index('idx_tour_categories_slug_locale', ['slug', 'locale'])
export class TourCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, name: 'document_id' })
  documentId!: string;

  @Column({ type: 'varchar', length: 10, default: 'vi' })
  locale!: SupportedLocale;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @OneToMany(() => Tour, (tour) => tour.category)
  tours!: Tour[];
}
