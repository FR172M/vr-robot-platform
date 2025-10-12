// backend/src/utils/taskMapper.ts
import { Task } from '../models/Task';

export const dbRowToTask = (row: any): Task => {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        difficulty: row.difficulty,
        pseudocode: row.pseudocode,
        sampleSolution: row.sample_solution,
        worksheetPath: row.worksheet_path,     // ✅ einheitlich worksheetPath
        simWorkPath: row.sim_work_path,
        simSolutionPath: row.sim_solution_path,
        startDate: row.start_date?.toString(),
        dueDate: row.due_date?.toString(),
        createdAt: row.created_at?.toISOString(),
    };
};
