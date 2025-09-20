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
  id: string;
  timestamp: number; // performance.now()
  character: string;
  eventType: 'keydown' | 'keyup' | 'input' | 'delete' | 'backspace';
  cursorPosition: number;
  isSpecialKey: boolean;
}

export interface DatabaseKeystrokeEvent {
  id: number;
  post_id: number;
  timestamp: number;
  character: string | null;
  event_type: 'keydown' | 'keyup' | 'input' | 'delete' | 'backspace';
  cursor_position: number;
  is_special_key: boolean;
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
  keystroke_events: Omit<DatabaseKeystrokeEvent, 'id' | 'post_id' | 'created_at'>[];
}

export interface PublishPostRequest {
  post_id: number;
  slug: string;
}

export interface PostWithKeystrokes extends Post {
  keystroke_events: DatabaseKeystrokeEvent[];
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
  event_type: 'keydown' | 'keyup' | 'input' | 'delete' | 'backspace';
  cursor_position: number;
  is_special_key: boolean;
}

export interface KeystrokeBatch {
  events: KeystrokeEvent[];
  batchTimestamp: number;
}

export interface Draft {
  id: string;
  user_id: number;
  title: string | null;
  content: string;
  word_count: number;
  last_saved_at: string;
  created_at: string;
}

export interface DraftKeystrokeEvent {
  id: number;
  draft_id: string;
  timestamp: number;
  character: string | null;
  event_type: 'keydown' | 'keyup' | 'input' | 'delete' | 'backspace';
  created_at: string;
}

export interface SaveDraftRequest {
  title?: string;
  content: string;
  keystrokes: Omit<DraftKeystrokeEvent, 'id' | 'draft_id' | 'created_at'>[];
  draftId?: string;
}

export interface SaveDraftResponse {
  draftId: string;
  savedAt: string;
  wordCount: number;
}

export interface SaveStatus {
  state: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}