/**
 * Get user initials from name or email
 *
 * @param name - User's full name (e.g., "John Doe")
 * @param email - User's email (e.g., "john@example.com")
 * @returns Uppercase initials (e.g., "JD" or "JO")
 *
 * @example
 * getUserInitials("John Doe") // "JD"
 * getUserInitials(undefined, "john@example.com") // "JO"
 * getUserInitials("John") // "J"
 */
export function getUserInitials(name?: string, email?: string): string {
  // Try to get initials from name first
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
      // First and last name
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      // Single name, take first character
      return parts[0][0].toUpperCase();
    }
  }

  // Fallback to email
  if (email && email.trim()) {
    const emailUsername = email.split("@")[0];
    if (emailUsername.length >= 2) {
      return emailUsername.substring(0, 2).toUpperCase();
    } else if (emailUsername.length === 1) {
      return emailUsername[0].toUpperCase();
    }
  }

  // Final fallback
  return "U";
}

/**
 * Get display name from user data
 *
 * @param name - User's full name
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param email - User's email
 * @returns Best available display name
 */
export function getDisplayName(
  name?: string,
  firstName?: string,
  lastName?: string,
  email?: string,
): string {
  if (name && name.trim()) {
    return name.trim();
  }

  if (firstName && lastName) {
    return `${firstName.trim()} ${lastName.trim()}`;
  }

  if (firstName) {
    return firstName.trim();
  }

  if (email) {
    return email.split("@")[0];
  }

  return "User";
}
