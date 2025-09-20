import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import validator from 'validator';
import { User, CreateUserRequest } from '../../../shared/types.js';

export class UserModel {
  constructor(private db: Pool) {}

  async createUser(userData: CreateUserRequest): Promise<User> {
    const { email, password, display_name } = userData;

    // Validate input
    this.validateUserInput(email, password, display_name);

    // Check if user already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user into database
    const query = `
      INSERT INTO users (email, password_hash, display_name)
      VALUES ($1, $2, $3)
      RETURNING id, email, display_name, created_at
    `;

    const result = await this.db.query(query, [email, hashedPassword, display_name]);
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, display_name, created_at
      FROM users
      WHERE email = $1
    `;

    const result = await this.db.query(query, [email]);
    return result.rows[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    const query = `
      SELECT id, email, display_name, created_at
      FROM users
      WHERE id = $1
    `;

    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash, display_name, created_at
      FROM users
      WHERE email = $1
    `;

    const result = await this.db.query(query, [email]);
    const user = result.rows[0];

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private validateUserInput(email: string, password: string, displayName: string): void {
    // Email validation
    if (!email || !validator.isEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Password validation
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    // Display name validation
    if (!displayName || displayName.trim().length < 2 || displayName.trim().length > 50) {
      throw new Error('Display name must be between 2 and 50 characters');
    }

    if (!/^[a-zA-Z0-9\s]+$/.test(displayName.trim())) {
      throw new Error('Display name can only contain letters, numbers, and spaces');
    }
  }
}