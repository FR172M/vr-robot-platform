// src/test.ts
import { Task } from './types/Task';

const t: Task = {
    id: '1',
    title: 'Test',
    description: 'Demo',
    difficulty: 'Easy',
    pseudocode: 'forward()',
    createdAt: new Date().toISOString(),
};

console.log(t);
