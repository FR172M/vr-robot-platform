// src/types/Task.ts
export interface Task {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    pseudocode: string;
    createdAt: string;
    startDate: string;
    dueDate: string;
}

