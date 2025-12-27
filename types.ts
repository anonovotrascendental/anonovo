
export interface ParticipationDays {
  day30: boolean;
  day31: boolean;
  day01: boolean;
  day02: boolean;
  day03: boolean;
}

export type ParticipationType = 'hosting' | 'dayuse' | null;
export type HostingStatus = 'paid' | 'reserving' | null;

export interface RegistrationFormData {
  participationType: ParticipationType;
  hostingStatus: HostingStatus;
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
  day30: number;
  day31: number;
  day01: number;
  day02: number;
  day03: number;
  hosting: number;
  restrictions: number;
}
