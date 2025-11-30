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

/**
 * Get the API base URL for README endpoints
 * @returns {string} - Base URL for API calls
 */
function getApiBaseUrl() {
  return window.location.origin;
}

/**
 * Get README content for a specific image from the backend API
 * @param {string} registryUrl - Registry URL (not used, kept for API compatibility)
 * @param {string} imageName - Image name (repository)
 * @returns {Promise<string|null>} - README content or null if not found
 */
export async function getReadmeContent(registryUrl, imageName) {
  try {
    const encodedImageName = encodeURIComponent(imageName);
    const response = await fetch(`${getApiBaseUrl()}/api/readme/${encodedImageName}`);
    
    if (response.ok) {
      const content = await response.text();
      return content || null;
    }
    return null;
  } catch (e) {
    console.error('Error reading README from API:', e);
    return null;
  }
}

/**
 * Save README content for a specific image via the backend API
 * @param {string} registryUrl - Registry URL (not used, kept for API compatibility)
 * @param {string} imageName - Image name (repository)
 * @param {string} content - README markdown content
 * @returns {Promise<boolean>} - True if save was successful
 */
export async function saveReadmeContent(registryUrl, imageName, content) {
  try {
    const encodedImageName = encodeURIComponent(imageName);
    const response = await fetch(`${getApiBaseUrl()}/api/readme/${encodedImageName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: content || '',
    });
    
    return response.ok;
  } catch (e) {
    console.error('Error saving README to API:', e);
    return false;
  }
}

/**
 * Delete README content for a specific image via the backend API
 * @param {string} registryUrl - Registry URL (not used, kept for API compatibility)
 * @param {string} imageName - Image name (repository)
 * @returns {Promise<boolean>} - True if delete was successful
 */
export async function deleteReadmeContent(registryUrl, imageName) {
  try {
    const encodedImageName = encodeURIComponent(imageName);
    const response = await fetch(`${getApiBaseUrl()}/api/readme/${encodedImageName}`, {
      method: 'DELETE',
    });
    
    return response.ok;
  } catch (e) {
    console.error('Error deleting README from API:', e);
    return false;
  }
}
