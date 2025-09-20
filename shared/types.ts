export interface User {
  id: number;
  email: string;
  display_name: string;
  created_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  title: string;
  content: string;
  slug: string;
  published_at: string | null;
  word_count: number;
  created_at: string;
}

export interface KeystrokeEvent {
  id: number;
  post_id: number;
  timestamp: number;
  character: string | null;
  event_type: 'keydown' | 'keyup' | 'input' | 'delete';
  created_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  keystroke_events: Omit<KeystrokeEvent, 'id' | 'post_id' | 'created_at'>[];
}

export interface PublishPostRequest {
  post_id: number;
  slug: string;
}

export interface PostWithKeystrokes extends Post {
  keystroke_events: KeystrokeEvent[];
  user: Pick<User, 'display_name'>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  service: string;
}

export interface KeystrokeEventInput {
  timestamp: number;
  character: string | null;
  event_type: 'keydown' | 'keyup' | 'input' | 'delete';
}