// frontend/src/components/TaskForm.tsx
import React, { useState } from 'react';
import {
    Box,
    Button,
    MenuItem,
    MobileStepper,
    Stack,
    TextField,
    Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { Task } from '../types/Task';
import UploadSimulationButton from './UploadSimulationButton';
import { saveTask, updateTask } from '../services/taskService';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface TaskFormProps {
    mode: 'create' | 'edit';
    initialTask?: Task;
    onSuccess?: () => void;
    onError?: (msg: string) => void;
    onClose?: () => void;
    onUpdated?: (updatedTask: Task) => void;
}

const steps = ['General Info', 'Pseudocode & Simulation', 'Dates & Difficulty'];

const TaskForm: React.FC<TaskFormProps> = ({
                                               mode,
                                               initialTask,
                                               onSuccess,
                                               onError,
                                               onClose,
                                               onUpdated,
                                           }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [task, setTask] = useState<Task>(
        initialTask || {
            id: uuidv4(),
            title: '',
            description: '',
            difficulty: 'Easy',
            pseudocode: '',
            dueDate: '',
            startDate: '',
            createdAt: new Date().toString(),
        }
    );
    const [simulationFile, setSimulationFile] = useState<File | null>(null);
    const [simulationFileName, setSimulationFileName] = useState<string | null>(null);

    const handleNext = async () => {
        if (activeStep === steps.length - 1) {
            await handleSave();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleSave = async () => {
        if (
            task.title &&
            task.description &&
            task.pseudocode &&
            task.startDate &&
            task.dueDate
        ) {
            const formattedTask: Task = {
                ...task,
                startDate: dayjs(task.startDate).format('YYYY-MM-DD'),
                dueDate: dayjs(task.dueDate).format('YYYY-MM-DD'),
            };

            try {
                if (mode === 'edit' && task.id) {
                    await updateTask(task.id, formattedTask);
                } else {
                    await saveTask(formattedTask);
                }

                if (simulationFile && task.id) {
                    const formData = new FormData();
                    formData.append('simulation', simulationFile);

                    await axios.post(
                        `/api/tasks/${task.id}/upload-simulation`,
                        formData,
                        { headers: { 'Content-Type': 'multipart/form-data' } }
                    );
                }

                onSuccess?.();
                onUpdated?.(formattedTask);
                onClose?.();
            } catch (err: any) {
                const msg = axios.isAxiosError(err)
                    ? err.response?.data?.error || err.message
                    : 'Fehler beim Speichern der Aufgabe.';
                onError?.(msg);
                console.error('❌ Fehler in handleSave:', err);
            }
        } else {
            onError?.('Bitte alle Felder ausfüllen.');
        }
    };

    return (
        <div>
            {activeStep === 0 && (
                <Stack spacing={2}>
                    <TextField
                        label="Title"
                        fullWidth
                        value={task.title}
                        onChange={(e) => setTask({ ...task, title: e.target.value })}
                    />
                    <TextField
                        label="Description"
                        multiline
                        rows={3}
                        fullWidth
                        value={task.description}
                        onChange={(e) => setTask({ ...task, description: e.target.value })}
                    />
                </Stack>
            )}

            {activeStep === 1 && (
                <Stack spacing={2}>
                    <TextField
                        label="Pseudocode"
                        multiline
                        rows={4}
                        fullWidth
                        value={task.pseudocode}
                        onChange={(e) => setTask({ ...task, pseudocode: e.target.value })}
                    />
                    <UploadSimulationButton
                        onFileSelected={(file) => {
                            setSimulationFile(file);
                            setSimulationFileName(file.name);
                        }}
                        fileName={simulationFileName || undefined}
                    />
                </Stack>
            )}

            {activeStep === 2 && (
                <Stack spacing={2}>
                    <Box display="flex" gap={2}>
                        <DatePicker
                            label="Start Date"
                            format="YYYY-MM-DD"
                            value={task.startDate ? dayjs(task.startDate) : null}
                            onChange={(date) => setTask({ ...task, startDate: date })}
                        />
                        <DatePicker
                            label="Due Date"
                            format="YYYY-MM-DD"
                            value={task.dueDate ? dayjs(task.dueDate) : null}
                            onChange={(date) => setTask({ ...task, dueDate: date })}
                        />
                    </Box>
                    <TextField
                        label="Difficulty"
                        select
                        fullWidth
                        value={task.difficulty}
                        onChange={(e) =>
                            setTask({
                                ...task,
                                difficulty: e.target.value as Task['difficulty'],
                            })
                        }
                    >
                        <MenuItem value="Easy">Easy</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="Hard">Hard</MenuItem>
                    </TextField>
                </Stack>
            )}

            <Divider sx={{ paddingTop: 5 }} variant="middle" />

            <Box p={2}>
                <MobileStepper
                    variant="dots"
                    steps={steps.length}
                    activeStep={activeStep}
                    position="static"
                    backButton={
                        <Button disabled={activeStep === 0} onClick={handleBack}>
                            Back
                        </Button>
                    }
                    nextButton={
                        <Button variant="contained" onClick={handleNext}>
                            {activeStep === steps.length - 1
                                ? mode === 'edit'
                                    ? 'Update'
                                    : 'Create'
                                : 'Next'}
                        </Button>
                    }
                />
            </Box>
        </div>
    );
};

export default TaskForm;
