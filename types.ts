
export interface ParticipationDays {
  day31: boolean;
  day01: boolean;
  day02: boolean;
}

export interface RegistrationFormData {
  spiritualName: string;
  civilName: string;
  rg: string;
  phone: string;
  bloodType: string;
  restrictions: string;
  days: ParticipationDays;
}

export interface RegistrationRecord extends RegistrationFormData {
  selectedDays: string;
  timestamp?: string;
}

export type AppView = 'form' | 'login' | 'admin' | 'success';

export interface AdminStats {
  total: number;
  day31: number;
  day01: number;
  day02: number;
  restrictions: number;
}
