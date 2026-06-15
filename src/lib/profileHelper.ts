export interface ProfileData {
  header: {
    name?: string;
    phone?: string;
    location?: string;
    degree?: string;
    university?: string;
    [key: string]: unknown;
  };
  preferences: {
    currentCTC?: string;
    expectedCTC?: string;
    [key: string]: unknown;
  };
  resumeUrl?: string;
  [key: string]: unknown;
}

export interface MissingField {
  label: string;
  fieldKey: string;
}

export const REQUIRED_FIELDS: MissingField[] = [
  { label: 'Full Name', fieldKey: 'name' },
  { label: 'Phone Number', fieldKey: 'phone' },
  { label: 'Location', fieldKey: 'location' },
  { label: 'Degree / Education', fieldKey: 'degree' },
  { label: 'University / Institution', fieldKey: 'university' },
  { label: 'Current CTC', fieldKey: 'currentCTC' },
  { label: 'Expected CTC', fieldKey: 'expectedCTC' },
  { label: 'Resume Upload', fieldKey: 'resumeUrl' },
];

/**
 * Validates a profile object (saved or draft) and returns any missing required fields.
 */
export function getMissingProfileFields(profile: ProfileData | null | undefined): MissingField[] {
  if (!profile) return REQUIRED_FIELDS;

  const missing: MissingField[] = [];

  if (!profile.header?.name?.trim()) missing.push({ label: 'Full Name', fieldKey: 'name' });
  if (!profile.header?.phone?.trim()) missing.push({ label: 'Phone Number', fieldKey: 'phone' });
  if (!profile.header?.location?.trim()) missing.push({ label: 'Location', fieldKey: 'location' });
  if (!profile.header?.degree?.trim()) missing.push({ label: 'Degree / Education', fieldKey: 'degree' });
  if (!profile.header?.university?.trim()) missing.push({ label: 'University / Institution', fieldKey: 'university' });
  if (!profile.preferences?.currentCTC?.trim()) missing.push({ label: 'Current CTC', fieldKey: 'currentCTC' });
  if (!profile.preferences?.expectedCTC?.trim()) missing.push({ label: 'Expected CTC', fieldKey: 'expectedCTC' });
  if (!profile.resumeUrl?.trim()) missing.push({ label: 'Resume Upload', fieldKey: 'resumeUrl' });

  return missing;
}

/**
 * Returns true if all required fields are filled.
 */
export function isProfileComplete(profile: ProfileData | null | undefined): boolean {
  return getMissingProfileFields(profile).length === 0;
}
