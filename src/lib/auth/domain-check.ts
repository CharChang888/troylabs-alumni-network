import allowedDomainsConfig from "../../../config/allowed-domains.json";
import { getEmailDomain } from "@/lib/utils";

export function isEmailDomainAllowed(email: string, extraDomains: string[] = []): boolean {
  const domain = getEmailDomain(email);
  if (!domain) return false;

  const allDomains = new Set([
    ...allowedDomainsConfig.default_domains,
    ...allowedDomainsConfig.additional_domains,
    ...extraDomains,
  ].map((d) => d.toLowerCase()));

  return allDomains.has(domain);
}

export function isAdminEmail(email: string): boolean {
  return allowedDomainsConfig.admin_emails
    .map((e) => e.toLowerCase())
    .includes(email.toLowerCase());
}

export function getDefaultAllowedDomains(): string[] {
  return [
    ...allowedDomainsConfig.default_domains,
    ...allowedDomainsConfig.additional_domains,
  ];
}
