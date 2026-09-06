export type UserRole = "member" | "admin" | "stakeholder";

export type ProgramAffiliation =
  | "TL_INTERNAL"
  | "IGNITE"
  | "BUILD"
  | "DEMO";

export type Division =
  | "Product Management"
  | "Design"
  | "Tech"
  | "VC/Finance"
  | "Marketing"
  | "DEMO";

export type StakeholderType =
  | "ANGEL_INVESTOR"
  | "EARLY_STAGE_FUND"
  | "MENTOR"
  | "PARTNER";

export type EboardRole =
  | "Director of BUILD"
  | "Director of IGNITE"
  | "Director of Community"
  | "Director of Recruitment"
  | "Director of PMs"
  | "Director of VC/Finance"
  | "Director of Design"
  | "Director of Tech"
  | "Director of Marketing"
  | "Director of DEMO"
  | "Co-President";

export type ProfileVisibility = "public" | "hidden";

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";

export type DeliveryStatus = "queued" | "sent" | "delivered" | "failed" | "replied";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  is_active: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  cohort_year: number | null;
  programs: ProgramAffiliation[];
  divisions: Division[];
  eboard_roles: EboardRole[];
  startups: string[];
  current_title: string | null;
  current_company: string | null;
  linkedin_url: string | null;
  industries: string[];
  bio: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  photo_url: string | null;
  visibility: ProfileVisibility;
  sms_opt_in: boolean;
  notification_industries: string[];
  stakeholder_type: StakeholderType | null;
  embedding: number[] | null;
  profile_complete: boolean;
  location_updated_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface SearchFilters {
  programs?: ProgramAffiliation[] | null;
  divisions?: Division[] | null;
  industries?: string[] | null;
  cohort_year_min?: number | null;
  cohort_year_max?: number | null;
  location_radius_km?: number | null;
  lat?: number | null;
  lng?: number | null;
}

export interface HybridSearchResult extends Profile {
  similarity: number;
}

export interface MessageCampaign {
  id: string;
  created_by: string;
  title: string;
  body: string;
  event_name: string | null;
  event_date: string | null;
  event_location: string | null;
  rsvp_url: string | null;
  audience_filters: AudienceFilters;
  recipient_count: number;
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface AudienceFilters {
  programs?: ProgramAffiliation[];
  divisions?: Division[];
  industries?: string[];
  location_radius_km?: number;
  lat?: number;
  lng?: number;
  user_ids?: string[];
}

export interface MessageDelivery {
  id: string;
  campaign_id: string;
  profile_id: string;
  phone: string;
  status: DeliveryStatus;
  provider_message_id: string | null;
  error: string | null;
  sent_at: string | null;
}

export interface AllowedDomain {
  id: string;
  domain: string;
  notes: string | null;
  created_at: string;
}

export interface AlumniInvite {
  email: string;
  full_name: string;
  role: UserRole;
  programs: ProgramAffiliation[];
  created_at: string;
}

export interface AnalyticsSnapshot {
  total_users: number;
  active_users_30d: number;
  profile_completion_rate: number;
  searches_today: number;
  messages_sent_30d: number;
}

export interface GlobePin {
  id: string;
  full_name: string;
  lat: number;
  lng: number;
  programs: ProgramAffiliation[];
  divisions: Division[];
  current_title: string | null;
  current_company: string | null;
  photo_url: string | null;
}

export const PROGRAMS: ProgramAffiliation[] = [
  "TL_INTERNAL",
  "IGNITE",
  "BUILD",
  "DEMO",
];

export const DIVISIONS: Division[] = [
  "Product Management",
  "Design",
  "Tech",
  "VC/Finance",
  "Marketing",
  "DEMO",
];

export const INDUSTRY_OPTIONS = [
  "AI",
  "Fintech",
  "Healthtech",
  "Climate Tech",
  "Consumer",
  "Enterprise",
  "Edtech",
  "Cybersecurity",
  "Robotics",
  "Design",
  "SaaS",
  "VC/Finance",
  "Developer Tools",
  "Nonprofit",
  "Travel",
  "Productivity",
  "Insurance",
  "Hardware",
  "Marketing",
] as const;

export const PROGRAM_LABELS: Record<ProgramAffiliation, string> = {
  TL_INTERNAL: "TL Internal",
  IGNITE: "IGNITE",
  BUILD: "BUILD Startup",
  DEMO: "DEMO Startup",
};

export const EBOARD_ROLES: EboardRole[] = [
  "Director of BUILD",
  "Director of IGNITE",
  "Director of Community",
  "Director of Recruitment",
  "Director of PMs",
  "Director of VC/Finance",
  "Director of Design",
  "Director of Tech",
  "Director of Marketing",
  "Director of DEMO",
  "Co-President",
];
