// src/services/taskServices.ts

import axios from 'axios';
import {Task} from '../types/Task';

export const saveTask = async (task: Task): Promise<void> => {
    try {
        return await axios.post(`/api/task`, task);
    } catch (error) {
        console.error('❌ Error saving task:', error);
    }
};

export const getTasks = async (): Promise<Task[]> => {
    try {
        const response = await axios.get(`/api/task`);
        return response.data;
    } catch (error) {
        console.error('Error loading tasks:', error);
        return [];
    }
};

export const getTaskById = async (taskId: string) => {
    try {
        const response = await axios.get(`/api/tasks/${taskId}`);
        return response.data;
    } catch (error) {
        console.error('Error loading taskByID:', error);
        return [];
    }
};

export const deleteTask = async (id: string): Promise<void> => {
    try {
        console.log("deleting: " + id);
        await axios.delete(`/api/task/${id}`);
    } catch (error) {
        console.error('Error deleting task:', error);
    }
};

export const updateTask = async (id: string, task: Task): Promise<void> => {
    try {
        await axios.put(`/api/task/${id}`, task);
    } catch (error) {
        console.error('Error updating task:', error);
    }
};
