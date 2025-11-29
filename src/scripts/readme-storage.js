/*
 * Copyright (C) 2016-2023 Jones Magloire @Joxit
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const README_STORAGE_KEY = 'imageReadme';

/**
 * Generate a storage key for a specific image
 * @param {string} registryUrl - Registry URL
 * @param {string} imageName - Image name (repository)
 * @returns {string} - Unique key for the image README
 */
export function getReadmeKey(registryUrl, imageName) {
  return `${README_STORAGE_KEY}:${registryUrl}:${imageName}`;
}

/**
 * Get README content for a specific image
 * @param {string} registryUrl - Registry URL
 * @param {string} imageName - Image name (repository)
 * @returns {string|null} - README content or null if not found
 */
export function getReadmeContent(registryUrl, imageName) {
  try {
    const key = getReadmeKey(registryUrl, imageName);
    return localStorage.getItem(key);
  } catch (e) {
    console.error('Error reading README from localStorage:', e);
    return null;
  }
}

/**
 * Save README content for a specific image
 * @param {string} registryUrl - Registry URL
 * @param {string} imageName - Image name (repository)
 * @param {string} content - README markdown content
 * @returns {boolean} - True if save was successful
 */
export function saveReadmeContent(registryUrl, imageName, content) {
  try {
    const key = getReadmeKey(registryUrl, imageName);
    if (content && content.trim()) {
      localStorage.setItem(key, content);
    } else {
      localStorage.removeItem(key);
    }
    return true;
  } catch (e) {
    console.error('Error saving README to localStorage:', e);
    return false;
  }
}

/**
 * Delete README content for a specific image
 * @param {string} registryUrl - Registry URL
 * @param {string} imageName - Image name (repository)
 * @returns {boolean} - True if delete was successful
 */
export function deleteReadmeContent(registryUrl, imageName) {
  try {
    const key = getReadmeKey(registryUrl, imageName);
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Error deleting README from localStorage:', e);
    return false;
  }
}
