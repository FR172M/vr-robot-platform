// src/pages/StudentPage.tsx

import {
    Box,
    Button,
    Container, IconButton,
    MenuItem,
    Select,
    Stack,
    Tab,
    Tabs, Toolbar,
    Typography,
} from '@mui/material';
import {
    Brightness7,
    Brightness4
} from '@mui/icons-material';

import React, {useEffect, useMemo, useState} from 'react';
import {getTasks} from '../services/taskService';
import {Task} from '../types/Task';
import {useNavigate} from 'react-router-dom';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import TaskCard from '../components/TaskCard';
import {useColorMode} from "../ThemeContext";
import {useTheme} from '@mui/material/styles';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

const StudentPage = () => {

    const theme = useTheme();
    const {toggleColorMode} = useColorMode();

    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [tabIndex, setTabIndex] = useState(1);
    const [expanded, setExpanded] = useState<string>('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [subTab, setSubTab] = useState('description');
    const [sortKey, setSortKey] = useState<'date' | 'difficulty' | 'name'>('date');

    const now = dayjs();

    const fetchTasks = async () => {
        const data = await getTasks();
        const normalized = data.map((task) => ({
            ...task,
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

    const previousTasks = useMemo(
        () =>
            sortTasks(
                tasks.filter((t) => dayjs(t.dueDate).endOf('day').isBefore(now))
            ),
        [tasks, now, sortKey, tabIndex]
    );

    const currentTasks = useMemo(
        () =>
            sortTasks(
                tasks.filter(
                    (t) =>
                        dayjs(t.startDate).startOf('day').isSameOrBefore(now) &&
                        dayjs(t.dueDate).endOf('day').isSameOrAfter(now)
                )
            ),
        [tasks, now, sortKey, tabIndex]
    );

    const upcomingTasks = useMemo(
        () =>
            sortTasks(
                tasks.filter((t) => dayjs(t.startDate).startOf('day').isAfter(now))
            ),
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
    useEffect(() => {
        document.title = `Student Page`;
        return () => {
            document.title = "VR Robot Platform";
        };
    }, []);

    const handleDownload = (taskId: string, variant: "Solution" | "Work" | "Pdf") => {
        let endpoint = "";

        switch (variant.toLowerCase()) {
            case "solution":
                endpoint = "download-solution-simulation";
                break;
            case "work":
                endpoint = "download-work-simulation";
                break;
            case "pdf":
                endpoint = "download-worksheet";
                break;
            default:
                console.error("❌ Unknown variant:", variant);
                return;
        }

        window.open(`/api/tasks/${taskId}/${endpoint}`, "_blank");
    };

    const toggleExpand = (taskId: string) => {
        if (expanded === taskId) {
            setExpanded('');
            setSelectedTask(null);
        } else {
            setExpanded(taskId);
            setSelectedTask(tasks.find((t) => t.id === taskId) || null);
            setSubTab('description');
        }
    };

    return (
        <Container sx={{mt: 4}}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4">Available Tasks</Typography>

                <Stack direction="row" spacing={2}>
                    <Button onClick={() => {
                        sessionStorage.removeItem("role")
                        navigate('/')
                    }}>
                        Logout
                    </Button>
                    <IconButton color="inherit" onClick={toggleColorMode}>
                        {theme.palette.mode === 'dark' ? <Brightness7/> : <Brightness4/>}
                    </IconButton>
                </Stack>

            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Tabs
                    value={tabIndex}
                    onChange={(_, val) => {
                        setTabIndex(val);
                        setExpanded('');
                        setSelectedTask(null);
                        setSubTab('description');
                    }}
                >
                    <Tab label="Previous"/>
                    <Tab label="Current"/>
                    <Tab label="Upcoming"/>
                </Tabs>

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
            </Box>

            <Stack spacing={2} mt={2}>
                {getTasksByTab().map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        isExpanded={expanded === task.id}
                        onToggleExpand={toggleExpand}
                        subTab={subTab}
                        setSubTab={setSubTab}
                        onDownload={handleDownload}
                        tabIndex={tabIndex}
                    />
                ))}
            </Stack>
            <Toolbar/>
        </Container>
    );
};

export default StudentPage;
