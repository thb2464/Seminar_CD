import { User } from './user.entity';

describe('User entity', () => {
  it('defaults sensible identity fields', () => {
    const user = new User();
    user.username = 'tan';
    user.email = 'tan@example.com';
    user.password = '$2a$10$abc';

    expect(user.username).toBe('tan');
    expect(user.email).toBe('tan@example.com');
    expect(user.password).toBe('$2a$10$abc');
  });

  it('allows optional contact fields to be null', () => {
    const user = new User();
    user.fullName = null;
    user.phone = null;
    expect(user.fullName).toBeNull();
    expect(user.phone).toBeNull();
  });
});
