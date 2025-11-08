/**
 * API Client for backend communication
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Health Check
  async checkHealth() {
    return this.request('/health');
  }

  // Categories
  async getCategories() {
    return this.request('/api/categories');
  }

  async getMainCategories() {
    return this.request('/api/categories/main');
  }

  async getSubcategories(categoryId) {
    return this.request(`/api/categories/${categoryId}/subcategories`);
  }

  // Difficulty Levels
  async getDifficulties() {
    return this.request('/api/difficulties');
  }

  // Courses
  async getCourses(categoryId = null) {
    const url = categoryId ? `/api/courses?category_id=${categoryId}` : '/api/courses';
    return this.request(url);
  }

  async getCourse(courseId) {
    return this.request(`/api/courses/${courseId}`);
  }

  async getSimilarCourses(courseId, topK = 5) {
    return this.request(`/api/courses/${courseId}/similar?top_k=${topK}`);
  }

  // AI Recommendations
  async getRecommendations(requestData) {
    return this.request('/api/recommendations', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  // User Preferences
  async getUserPreferences(userId) {
    return this.request(`/api/users/${userId}/preferences`);
  }

  async createUserPreferences(userId, preferences) {
    return this.request(`/api/users/${userId}/preferences`, {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }

  async updateUserPreferences(userId, preferences) {
    return this.request(`/api/users/${userId}/preferences`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async completeOnboarding(userId, preferences) {
    return this.request(`/api/users/${userId}/complete-onboarding`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        preferences: preferences,
      }),
    });
  }

  async getUserRecommendations(userId, topK = 10) {
    return this.request(`/api/users/${userId}/recommendations?top_k=${topK}`);
  }

  // User Progress
  async getUserProgress(userId) {
    return this.request(`/api/users/${userId}/progress`);
  }

  async updateCourseProgress(userId, progressData) {
    return this.request(`/api/users/${userId}/progress`, {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
  }

  // Admin
  async reloadCourses() {
    return this.request('/api/admin/reload-courses', {
      method: 'POST',
    });
  }
}

export const apiClient = new APIClient();
export default apiClient;
