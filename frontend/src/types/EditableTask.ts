// types/EditableTask.ts
import { Dayjs } from 'dayjs';
import { Task } from './Task';

export type EditableTask = Omit<Task, 'startDate' | 'dueDate'> & {
    startDate: Dayjs | null;
    dueDate: Dayjs | null;
};
