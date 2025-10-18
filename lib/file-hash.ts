/**
 * File hashing utilities for cryptographic proof of evidence integrity
 */

/**
 * Compute SHA-256 hash of a file for cryptographic proof
 * @param file - The file to hash
 * @returns Promise<string> - Hex-encoded SHA-256 hash
 */
export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Compute hash of text content for non-file evidence
 * @param content - The text content to hash
 * @returns Promise<string> - Hex-encoded SHA-256 hash
 */
export async function computeTextHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Format hash for display (first 8 and last 8 characters)
 * @param hash - The full hash string
 * @returns string - Formatted hash for display
 */
export function formatHashForDisplay(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}