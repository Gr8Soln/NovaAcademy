import { clsx, type ClassValue } from "clsx";

/**
 * Merge class names conditionally.
 * Combines clsx for conditional classes.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
