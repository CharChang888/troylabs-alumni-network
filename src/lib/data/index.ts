import { isSupabaseConfigured } from "@/lib/env";
import * as demo from "@/lib/data/demo-store";
import * as remote from "@/lib/data/supabase-store";

export { matchAudience } from "@/lib/data/audience";
export { isSupabaseConfigured } from "@/lib/env";

function store() {
  return isSupabaseConfigured() ? remote : demo;
}

export async function ensureSeedData() {
  return store().ensureSeedData();
}

export async function sendMagicLink(email: string, emailRedirectTo: string) {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured" };
  }
  return remote.sendMagicLink(email, emailRedirectTo);
}

export async function loginWithEmail(email: string) {
  return store().loginWithEmail(email);
}

export async function resolveSessionUser(token?: string | null) {
  return store().resolveSessionUser(token);
}

export async function resolveSessionProfile(token?: string | null) {
  return store().resolveSessionProfile(token);
}

export async function getAllProfiles() {
  return store().getAllProfiles();
}

export async function listAllProfiles() {
  return store().listAllProfiles();
}

export async function getProfileById(id: string) {
  return store().getProfileById(id);
}

export async function getProfileByUserId(userId: string) {
  return store().getProfileByUserId(userId);
}

export async function updateProfile(...args: Parameters<typeof demo.updateProfile>) {
  return store().updateProfile(...args);
}

export async function getGlobePins(...args: Parameters<typeof demo.getGlobePins>) {
  return store().getGlobePins(...args);
}

export async function getAllowedDomains() {
  return store().getAllowedDomains();
}

export async function addAllowedDomain(domain: string, notes?: string) {
  return store().addAllowedDomain(domain, notes);
}

export async function removeAllowedDomain(domainOrId: string) {
  return store().removeAllowedDomain(domainOrId);
}

export async function removeUserByEmail(email: string) {
  return store().removeUserByEmail(email);
}

export async function createCampaign(...args: Parameters<typeof demo.createCampaign>) {
  return store().createCampaign(...args);
}

export async function getCampaigns() {
  return store().getCampaigns();
}

export async function getDeliveries(campaignId?: string) {
  return store().getDeliveries(campaignId);
}

export async function getUsers() {
  return store().getUsers();
}

export async function getAlumniInvites() {
  return store().getAlumniInvites();
}

export async function trackEvent(...args: Parameters<typeof demo.trackEvent>) {
  return store().trackEvent(...args);
}

export async function getAnalytics() {
  return store().getAnalytics();
}
