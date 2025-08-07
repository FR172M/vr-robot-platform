// frontend/src/pages/TeacherPage.tsx
import {
    Box,
    Container,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    MenuItem,
    Stack,
    Tabs,
    Tab,
    IconButton
} from '@mui/material';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {Edit, Delete, Visibility, Close} from '@mui/icons-material';
import {useEffect, useMemo, useState} from 'react';
import {deleteTask, getTasks, saveTask, updateTask} from '../services/taskService';
import {Task} from '../types/Task';
import {v4 as uuidv4} from 'uuid';
import {useNavigate} from 'react-router-dom';
import {EditableTask} from "../types/EditableTask";
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import UploadSimulationButton from "../components/UploadSimulationButton";
import axios from "axios";
import TaskCard from "../components/TaskCard";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

const TeacherPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentTask, setCurrentTask] = useState<EditableTask | null>(null);
    const [tabIndex, setTabIndex] = useState(1);
    const [simulationFile, setSimulationFile] = useState<File | null>(null);

    const fetchTasks = async () => {
        const data = await getTasks();
        const normalized = data.map(task => ({
            ...task,
            startDate: task.start_date,
            dueDate: task.due_date,
            createdAt: task.created_at,
        }));
        setTasks(normalized);
    };

    const now = new Date().toISOString();

    const previousTasks = useMemo(() =>
        tasks.filter(t => dayjs(t.dueDate).endOf('day').isBefore(now)), [tasks]);

    const currentTasks = useMemo(() =>
        tasks.filter(t =>
            dayjs(t.startDate).startOf('day').isSameOrBefore(now) &&
            dayjs(t.dueDate).endOf('day').isSameOrAfter(now)), [tasks]);

    const upcomingTasks = useMemo(() =>
        tasks.filter(t => dayjs(t.startDate).startOf('day').isAfter(now)), [tasks]);

    const getTasksByTab = () => {
        switch (tabIndex) {
            case 0: return previousTasks;
            case 1: return currentTasks;
            case 2: return upcomingTasks;
            default: return tasks;
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleOpenDialog = (task?: Task) => {
        if (task) {
            setIsEditMode(true);
            setCurrentTask({
                ...task,
                startDate: task.startDate ? dayjs(task.startDate) : null,
                dueDate: task.dueDate ? dayjs(task.dueDate) : null,
            });
        } else {
            setIsEditMode(false);
            setCurrentTask({
                id: uuidv4(),
                title: '',
                description: '',
                difficulty: 'Easy',
                pseudocode: '',
                dueDate: null,
                startDate: null,
                createdAt: new Date().toISOString(),
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setCurrentTask(null);
        setOpenDialog(false);
    };

    const handleSave = async () => {
        if (
            currentTask?.title &&
            currentTask.description &&
            currentTask.pseudocode &&
            currentTask.dueDate &&
            currentTask.startDate
        ) {
            const formattedTask: Task = {
                ...(currentTask as Task),
                startDate: dayjs(currentTask.startDate).format('YYYY-MM-DD'),
                dueDate: dayjs(currentTask.dueDate).format('YYYY-MM-DD'),
            };

            try {
                const existingTask = tasks.find(t => t.id === formattedTask.id);

                if (existingTask) {
                    await updateTask(formattedTask.id, formattedTask);
                } else {
                    await saveTask(formattedTask);
                }

                if (simulationFile) {
                    const formData = new FormData();
                    formData.append('simulation', simulationFile);
                    try {
                        await axios.post(`/api/tasks/${formattedTask.id}/upload-simulation`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                    } catch (uploadErr) {
                        console.error('Upload failed', uploadErr);
                        alert('Simulation upload failed');
                    }
                }

                await fetchTasks();
                alert('Task saved.');
                handleCloseDialog();

            } catch (err) {
                alert('Fehler beim Speichern der Aufgabe.');
                console.error('❌ Fehler in handleSave:', err);
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Really delete this task?')) {
            await deleteTask(id);
            fetchTasks();
        }
    };

    const handleDownload = (taskId: string) => {
        window.open(`/api/tasks/${taskId}/download-simulation`, '_blank');
    };


    return (
        <Container sx={{ mt: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4">Your Created Tasks</Typography>
                <Button onClick={() => navigate('/')}>Logout</Button>
            </Box>
            <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
                Add New Task
            </Button>
            <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)}>
                <Tab label="Previous" />
                <Tab label="Current" />
                <Tab label="Upcoming" />
            </Tabs>

            <Stack spacing={2} mt={2}>
                {getTasksByTab().map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        showEdit
                        showDelete
                        showView
                        showDownload={!!task.simulation_path}
                        onEdit={() => handleOpenDialog(task)}
                        onDelete={() => handleDelete(task.id)}
                        onView={() => alert(task.dueDate)}
                        onDownload={() => handleDownload(task.id)}
                    />

                ))}
            </Stack>

            <Dialog open={openDialog} onClose={handleCloseDialog} fullScreen>
                <DialogTitle>
                    <Box display="flex" justifyContent={'space-between'} alignItems="center">
                        {isEditMode ? 'Edit Task' : 'Create Task'}
                        <IconButton onClick={handleCloseDialog}><Close /></IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField
                            label="Title"
                            value={currentTask?.title || ''}
                            onChange={e => setCurrentTask({ ...currentTask!, title: e.target.value })}
                        />
                        <TextField
                            label="Description"
                            multiline
                            rows={3}
                            value={currentTask?.description || ''}
                            onChange={e => setCurrentTask({ ...currentTask!, description: e.target.value })}
                        />
                        <TextField
                            label="Pseudocode"
                            multiline
                            rows={4}
                            value={currentTask?.pseudocode || ''}
                            onChange={e => setCurrentTask({ ...currentTask!, pseudocode: e.target.value })}
                        />
                        <UploadSimulationButton onFileSelected={setSimulationFile} />
                        <TextField
                            label="Difficulty"
                            select
                            value={currentTask?.difficulty}
                            onChange={e => setCurrentTask({
                                ...currentTask!,
                                difficulty: e.target.value as Task['difficulty']
                            })}
                        >
                            <MenuItem value="Easy">Easy</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="Hard">Hard</MenuItem>
                        </TextField>
                        <Box display="flex" alignItems="center" gap={2}>
                            <DatePicker
                                label="Start Date"
                                disablePast
                                format={'DD/MM/YYYY'}
                                value={currentTask?.startDate || null}
                                onChange={(newDate) => setCurrentTask({ ...currentTask!, startDate: newDate })}
                            />
                            <DatePicker
                                label="Due Date"
                                disablePast
                                format={'DD/MM/YYYY'}
                                value={currentTask?.dueDate || null}
                                onChange={(newDate) => setCurrentTask({ ...currentTask!, dueDate: newDate })}
                            />
                            <Button onClick={() => {
                                alert("startDate: " + currentTask?.startDate + " / dueDate: " + currentTask?.dueDate)
                            }}>...</Button>
                        </Box>
                        <Box display="flex" justifyContent="flex-end" gap={2}>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button variant="contained" onClick={handleSave}>Save</Button>
                        </Box>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default TeacherPage;
