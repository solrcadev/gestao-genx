export type UserRole = 'admin' | 'coach' | 'athlete' | 'user';

export type TeamType = 'Masculino' | 'Feminino';

export interface Athlete {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  team: TeamType;
  position?: string;
  active: boolean;
  created_at: string;
  avatar_url?: string;
  height?: number;
  weight?: number;
  notes?: string;
  user_id?: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  video_url?: string;
  image_url?: string;
  category: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  equipment?: string;
  created_at: string;
  created_by: string;
  tags?: string[];
  is_favorite?: boolean;
}

export interface Training {
  id: string;
  name: string;
  description?: string;
  team: TeamType;
  created_at: string;
  created_by: string;
  scheduled_date?: string;
  duration?: number;
  location?: string;
  status?: 'draft' | 'scheduled' | 'completed' | 'cancelled';
  exercises?: TrainingExercise[];
  notes?: string;
}

export interface TrainingExercise {
  id: string;
  training_id: string;
  exercise_id: string;
  order: number;
  sets?: number;
  reps?: number;
  duration?: number;
  rest?: number;
  notes?: string;
  exercise?: Exercise;
}

export interface ExerciseEvaluation {
  id: string;
  athlete_id: string;
  exercise_id: string;
  training_id?: string;
  date: string;
  score: number;
  notes?: string;
  created_at: string;
  created_by: string;
  athlete?: Athlete;
  exercise?: Exercise;
}

export interface Attendance {
  id: string;
  athlete_id: string;
  training_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  created_at: string;
  created_by: string;
  athlete?: Athlete;
  training?: Training;
}

export interface PerformanceGoal {
  id: string;
  athlete_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  target_value?: number;
  current_value?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  created_at: string;
  created_by: string;
  athlete?: Athlete;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
  type?: 'info' | 'warning' | 'success' | 'error';
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface QueryParams {
  pagination?: PaginationParams;
  sort?: SortParams;
  filters?: FilterParams;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
