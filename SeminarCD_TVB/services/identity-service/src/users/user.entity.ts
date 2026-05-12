import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'public' | 'authenticated' | 'admin';

@Entity({ name: 'users' })
@Index('idx_users_username', ['username'], { unique: true })
@Index('idx_users_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn({ name: 'id' })
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  username!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  // bcrypt hash — never log this field
  @Column({ type: 'varchar', length: 255, name: 'password' })
  password!: string;

  @Column({ type: 'varchar', length: 50, default: 'local' })
  provider!: string;

  @Column({ type: 'boolean', default: false })
  confirmed!: boolean;

  @Column({ type: 'boolean', default: false })
  blocked!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'full_name' })
  fullName!: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 30, default: 'authenticated' })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
