export type Role = 'super_admin' | 'owner' | 'admin' | 'reception' | 'doctor' | 'patient';

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'مدیر ارشد پلتفرم',
  owner: 'صاحب کلینیک',
  admin: 'مدیر عملیات',
  reception: 'مدیر پذیرش',
  doctor: 'پزشک متخصص',
  patient: 'مراجع / بیمار',
};

export interface UserProfile {
  id: string;
  name: string; // e.g. "سارا حسینی"
  role: Role;
  roleTitle: string; // e.g. "مدیر پذیرش"
  avatarInitials: string; // "س"
  email?: string;
  phone: string; // e.g. "09121110003"
  doctorId?: string; // e.g. "doc-1" for doctor role
  clientId?: string; // e.g. "cl-1" for patient role
  clinicId?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Actor {
  userId: string;
  userName?: string;
  role: Role;
  clinicId?: string | null;
  doctorId?: string;
  clientId?: string;
  phone?: string;
}

export interface ClinicWorkspace {
  id: string;
  slug: string; // "ariana"
  name: string; // "کلینیک زیبایی آریانا"
  tagline: string;
  phone: string;
  address: string;
  workingHours: string; // "شنبه تا پنجشنبه 9 تا 20"
}

export interface UserSession {
  user: UserProfile;
  activeClinic: ClinicWorkspace;
  availableClinics: ClinicWorkspace[];
  isAuthenticated: boolean;
  token?: string;
}
