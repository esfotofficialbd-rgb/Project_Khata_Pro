
export type UserRole = 'contractor' | 'worker' | 'supervisor';

export interface Profile {
  id: string;
  phone: string;
  email?: string; // Contractor login
  password?: string;
  role: UserRole;
  full_name: string;
  company_name?: string; // Contractor only
  designation?: string; // Supervisor only
  skill_type?: string; // Worker only
  daily_rate?: number; // Worker only or Supervisor Daily
  monthly_salary?: number; // Supervisor Monthly
  payment_type?: 'daily' | 'monthly'; // Supervisor payment logic
  assigned_project_id?: string; // Supervisor assigned project
  balance: number; // Due salary
  is_verified: boolean;
  avatar_url?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  project_name: string;
  location: string;
  client_name?: string; // Added
  client_phone?: string; // Added
  project_type: 'fixed' | 'daily' | 'sqft'; // Added sqft
  budget_amount: number;
  current_expense: number;
  status: 'active' | 'completed';
  start_date: string;
  // New Fields for Specific Modes
  sqft_rate?: number;
  total_area?: number;
  mistri_rate?: number;
  helper_rate?: number;
  created_at?: string;
}

export interface Attendance {
  id: string;
  worker_id: string;
  project_id: string;
  date: string;
  status: 'P' | 'H' | 'A'; // Present, Half-day, Absent
  overtime?: number; // Hours
  amount: number;
}

export interface Transaction {
  id: string;
  project_id?: string;
  related_user_id?: string;
  type: 'income' | 'expense' | 'salary';
  amount: number;
  description: string;
  date: string;
}

export interface WorkReport {
  id: string;
  project_id: string;
  submitted_by: string; // User ID
  date: string;
  description: string;
  image_url?: string; // Base64 or URL
}

export interface MaterialLog {
  id: string;
  project_id: string;
  submitted_by: string;
  date: string;
  item_name: string; // e.g., Cement
  quantity: number;
  unit: string; // e.g., Bag, Truck, CFT
  supplier_name?: string;
  challan_photo?: string;
}

export interface DailyStats {
  totalPresent: number;
  totalExpense: number;
  totalDue: number;
}

export interface Notification {
  id: string;
  user_id: string; // Receiver
  type: 'info' | 'alert' | 'success' | 'payment' | 'project_request' | 'attendance_request' | 'advance_request' | 'work_report' | 'material_log' | 'profile_update_request';
  message: string;
  date: string;
  is_read: boolean;
  metadata?: any; // To store payload like project details
}

export interface PublicNotice {
  id: string;
  message: string;
  created_by: string; // User ID
  created_at: string;
  is_active: boolean;
}

export interface UserLocation {
  user_id: string;
  lat: number;
  lng: number;
  is_active: boolean;
  last_updated: string;
}