import { Task } from '../types';

const API_URL = 'http://10.0.2.2:3000';

export const taskApi = {
  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_URL}/tasks`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch tasks: ${response.status}`,
      );
    }

    return response.json();
  },

  async getTask(taskId: string): Promise<Task | null> {
    const response = await fetch(
      `${API_URL}/tasks/${taskId}`,
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch task: ${response.status}`,
      );
    }

    return response.json();
  },

  async createTask(task: Task): Promise<Task> {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create task: ${response.status}`,
      );
    }

    return response.json();
  },

  async updateTask(task: Task): Promise<Task> {
    const response = await fetch(
      `${API_URL}/tasks/${task.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to update task: ${response.status}`,
      );
    }

    return response.json();
  },

  async deleteTask(taskId: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/tasks/${taskId}`,
      {
        method: 'DELETE',
      },
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(
        `Failed to delete task: ${response.status}`,
      );
    }
  },
};