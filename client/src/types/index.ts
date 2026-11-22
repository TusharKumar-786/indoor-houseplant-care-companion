export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  city?: string | null;
  weekly_digest?: boolean;
  language?: string;
  is_admin?: boolean;
  created_at?: string;
}

export interface BlogPost {
  id: number;
  user_id: number;
  author_name?: string;
  title: string;
  slug: string;
  cover_image_url: string;
  read_time: string;
  excerpt: string;
  body: string;
  created_at: string;
}

export interface PlantLibraryItem {
  id: number;
  common_name: string;
  scientific_name: string;
  image_url: string;
  water_frequency_days: number;
  sunlight_level: 'Low' | 'Medium' | 'High';
  humidity: string;
  pet_safe: boolean;
  care_tip: string;
}

export interface SmartSuggestion {
  id: string;
  type: 'watering' | 'light_mismatch' | 'neglected' | 'seasonal' | 'ai';
  title: string;
  description: string;
  action_label?: string;
  action_path?: string;
  plant_id?: number;
  severity?: 'critical' | 'warning' | 'info';
}

export interface Room {
  id: number;
  name: string;
  window_direction: string | null;
  plant_count: number;
  created_at: string;
}

export interface CareRequirement {
  id: number;
  water_frequency_days: number;
  sunlight_level: 'Low' | 'Medium' | 'High';
  fertilizing_frequency_days: number;
  created_at: string;
}

export interface Plant {
  id: number;
  nickname: string;
  species: string;
  image_url: string | null;
  room_id: number | null;
  room: string | null;
  care_requirement_id: number;
  water_frequency_days: number;
  sunlight_level: 'Low' | 'Medium' | 'High';
  fertilizing_frequency_days: number;
  created_at: string;
  last_watered: string | null;
  next_watering_date: string;
  days_since_last_watering: number | null;
  days_until_next_watering?: number;
  is_due: boolean;
  recent_logs?: CareLog[];
}

export interface CareLog {
  id: number;
  plant_id: number;
  plant_nickname?: string;
  plant_species?: string;
  action: 'Watered' | 'Fertilized' | 'Pruned';
  date: string;
  notes: string | null;
  created_at: string;
}

export interface GrowthJournalEntry {
  id: number;
  plant_id: number;
  date: string;
  notes: string;
  image_url: string | null;
  height_cm: number | null;
  created_at: string;
}

export interface HealthCheckResult {
  plant_nickname: string;
  plant_species: string;
  symptoms: string[];
  notes: string | null;
  diagnosis: {
    issue: string;
    confidence: 'High' | 'Medium' | 'Informational';
    explanation: string;
    primary_actions: string[];
    preventive_measures: string[];
  };
  disclaimer: string;
}

export interface DashboardData {
  counts: {
    total_plants: number;
    due_today: number;
    total_rooms: number;
  };
  plants_due_today: Array<{
    id: number;
    nickname: string;
    species: string;
    image_url: string | null;
    room: string | null;
    next_watering_date: string;
    days_since_last_watering: number;
  }>;
  recently_added: Array<{
    id: number;
    nickname: string;
    species: string;
    image_url: string | null;
    room: string | null;
    created_at: string;
  }>;
  weekly_activity: Array<{
    day: string;
    date: string;
    count: number;
  }>;
}
