// frontend/src/types/Task.ts
export interface Task {
    id: string;
    title: string;
    description?: string;
    difficulty?: string;
    pseudocode?: string;
    sampleSolution?: string;
    worksheetPath?: string;      // ✅ einheitlich worksheetPath
    simWorkPath?: string;
    simSolutionPath?: string;
    startDate?: string;
    dueDate?: string;
    createdAt?: string;
}
