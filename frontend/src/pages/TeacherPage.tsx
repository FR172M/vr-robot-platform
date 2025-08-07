// src/pages/TeacherPage.tsx

import {
    Box,
    Button,
    Container,
    Divider,
    MenuItem,
    Select,
    Stack,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import React, {useEffect, useMemo, useState} from 'react';
import {deleteTask, getTasks} from '../services/taskService';
import {Task} from '../types/Task';
import {useNavigate} from 'react-router-dom';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import TaskCard from '../components/TaskCard';
import {AddCircleOutline, CancelOutlined, CloseOutlined} from '@mui/icons-material';
import TaskForm from '../components/TaskForm';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

const TeacherPage = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [tabIndex, setTabIndex] = useState(1);
    const [expanded, setExpanded] = useState<string>('');
    const [subTab, setSubTab] = useState('description');
    const [sortKey, setSortKey] = useState<'date' | 'difficulty' | 'name'>('date');
    const [createMode, setCreateMode] = useState(false); // NEU

    const now = dayjs();

    const fetchTasks = async () => {
        const data = await getTasks();
        const normalized = data.map((task) => ({
            ...task,
            startDate: task.start_date,
            dueDate: task.due_date,
            createdAt: task.created_at,
        }));
        setTasks(normalized);
    };

    const sortTasks = (taskList: Task[]) => {
        return [...taskList].sort((a, b) => {
            if (sortKey === 'date') {
                if (tabIndex === 2) {
                    return dayjs(a.startDate).isAfter(dayjs(b.startDate)) ? 1 : -1;
                } else if (tabIndex === 0) {
                    return dayjs(a.dueDate).isBefore(dayjs(b.dueDate)) ? 1 : -1;
                }
                return dayjs(a.dueDate).isAfter(dayjs(b.dueDate)) ? 1 : -1;
            } else if (sortKey === 'difficulty') {
                const order = {Easy: 0, Medium: 1, Hard: 2};
                return (order[a.difficulty] ?? 3) - (order[b.difficulty] ?? 3);
            } else if (sortKey === 'name') {
                return a.title.localeCompare(b.title);
            }
            return 0;
        });
    };

    const reloadTasks = async () => {
        await fetchTasks();
        setExpanded('');
        setSubTab('description');
        setTabIndex(1); // z.B. Current Tasks
        setCreateMode(false);
    };


    const previousTasks = useMemo(
        () => sortTasks(tasks.filter((t) => dayjs(t.dueDate).endOf('day').isBefore(now))),
        [tasks, now, sortKey, tabIndex]
    );

    const currentTasks = useMemo(
        () => sortTasks(
            tasks.filter(
                (t) =>
                    dayjs(t.startDate).startOf('day').isSameOrBefore(now) &&
                    dayjs(t.dueDate).endOf('day').isSameOrAfter(now)
            )),
        [tasks, now, sortKey, tabIndex]
    );

    const upcomingTasks = useMemo(
        () => sortTasks(tasks.filter((t) => dayjs(t.startDate).startOf('day').isAfter(now))),
        [tasks, now, sortKey, tabIndex]
    );

    const getTasksByTab = () => {
        switch (tabIndex) {
            case 0:
                return previousTasks;
            case 1:
                return currentTasks;
            case 2:
                return upcomingTasks;
            default:
                return sortTasks(tasks);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleDownload = (taskId: string) => {
        window.open(`/api/tasks/${taskId}/download-simulation`, '_blank');
    };

    const toggleExpand = (taskId: string) => {
        setExpanded(expanded === taskId ? '' : taskId);
        setSubTab('description');
    };

    const handleDelete = async (id: string) => {
        if (confirm('Really delete this task?')) {
            await deleteTask(id);
            fetchTasks();
        }
    };

    const handleCloseForm = () => {
        setCreateMode(false);
        fetchTasks();
    };

    return (
        <Container sx={{mt: 4}}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4">Manage Tasks</Typography>

                <Stack direction="row" spacing={2}>
                    <Button onClick={() => navigate('/')}>Logout</Button>
                </Stack>
            </Box>


            <>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                >
                    <Stack
                        direction="row"
                        spacing={2}
                        divider={<Divider orientation="vertical" flexItem/>}
                    >
                        <Button onClick={() => setCreateMode(!createMode)}>
                            {createMode ?
                                <CancelOutlined/>
                                :
                                <AddCircleOutline/>
                            }

                        </Button>

                        {createMode ? <Tab disabled label={"create new task"}/> :
                            <Tabs
                                value={tabIndex}
                                onChange={(_, val) => {
                                    setTabIndex(val);
                                    setExpanded('');
                                    setSubTab('description');
                                }}
                            >
                                <Tab label="Previous" disabled={createMode}/>
                                <Tab label="Current" disabled={createMode}/>
                                <Tab label="Upcoming" disabled={createMode}/>


                            </Tabs>
                        }
                    </Stack>
                    {createMode ? '' :
                        <Select
                            size="small"
                            value={sortKey}
                            onChange={(e) => setSortKey(e.target.value as any)}
                            sx={{minWidth: 160}}
                        >
                            <MenuItem value="date">Sort by Date</MenuItem>
                            <MenuItem value="difficulty">Sort by Difficulty</MenuItem>
                            <MenuItem value="name">Sort by Name</MenuItem>
                        </Select>
                    }
                </Box>
                {createMode ? (
                    <TaskForm
                        mode="create"
                        fetchTasks={fetchTasks}
                        handleCloseDialog={handleCloseForm}
                        onSuccess={reloadTasks}
                        onClose={() => {
                            setCreateMode(false)
                        }}
                    />
                ) : (
                    <Stack spacing={2} mt={2}>
                        {getTasksByTab().map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                mode="teacher"
                                isExpanded={expanded === task.id}
                                onToggleExpand={toggleExpand}
                                subTab={subTab}
                                setSubTab={setSubTab}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                onUpdated={reloadTasks}
                                fetchTasks={fetchTasks}
                            />
                        ))}
                    </Stack>
                )}
            </>
        </Container>
    );
};

export default TeacherPage;
