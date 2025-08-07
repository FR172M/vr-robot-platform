// frontend/src/components/TaskCard.tsx

import React, {useState} from 'react';
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Collapse,
    Divider,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    Typography,
    Snackbar,
    Alert,
} from '@mui/material';
import {
    Info,
    Storage,
    Visibility,
    Create,
    Delete as DeleteIcon, Check, Close,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import {Task} from '../types/Task';
import UploadSimulationButton from './UploadSimulationButton';
import TaskForm from './TaskForm';
import {green} from "@mui/material/colors";

interface TaskCardProps {
    task: Task;
    isExpanded: boolean;
    onToggleExpand: (taskId: string) => void;
    subTab: string;
    setSubTab: (tab: string) => void;
    onDownload: (taskId: string) => void;
    onDelete?: (taskId: string) => void;
    mode?: 'student' | 'teacher';
    onUpdated?: (task: Task) => void;
}

const TaskCard = ({
                      task,
                      isExpanded,
                      onToggleExpand,
                      subTab,
                      setSubTab,
                      onDownload,
                      onDelete,
                      mode = 'student',
                      onUpdated,
                  }: TaskCardProps) => {
    const now = dayjs();
    const due = dayjs(task.dueDate).endOf('day');
    const start = dayjs(task.startDate).startOf('day');

    let statusLabel = '';
    if (now.isBefore(start)) {
        statusLabel = `Starts ${start.from(now)}`;
    } else if (now.isAfter(due)) {
        statusLabel = `Ended ${now.to(due)}`;
    } else {
        statusLabel = `Due ${now.to(due)}`;
    }

    const difficultyMap: Record<string, string> = {
        Easy: '#81c784',
        Medium: '#ffb74d',
        Hard: '#e57373',
    };
    const difficultyColor = difficultyMap[task.difficulty] ?? '#ccc';

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    const handleSnackbarClose = () => setSnackbarOpen(false);

    const handleEditSuccess = () => {
        setSubTab('description');
        setSnackbarMsg('Task saved successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
    };

    const handleTaskUpdated = (newTask: Task) => {
        onUpdated?.(newTask);
    };

    const handleEditError = (msg: string) => {
        setSnackbarMsg(msg || 'An error occurred');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
    };

    const handleEditClose = () => {
        setSubTab('description');
    };

    return (
        <>
            <Card key={task.id} variant="outlined" sx={{borderRadius: 2, boxShadow: isExpanded ? 4 : 1}}>
                <CardActionArea onClick={() => onToggleExpand(task.id)}>
                    <CardContent sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                        <Box sx={{width: 8, height: 50, bgcolor: difficultyColor, borderRadius: 1}}/>

                        <Box sx={{flexGrow: 1}}>
                            <Typography variant="subtitle1" fontWeight="bold">
                                {task.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {statusLabel}
                            </Typography>
                        </Box>

                        {mode !== 'teacher' && (
                            <Box sx={{ml: 'auto'}}>
                                {Math.random() < 0.5
                                    ? <Check color="success"/>
                                    : <Close color="error"/>}
                            </Box>
                        )}
                        {mode === 'teacher' && (
                            <Box sx={{ml: 'auto'}}>
                                <Stack
                                    spacing={{xs: 1, sm: 2}}
                                    direction="row"
                                    useFlexGap
                                    sx={{flexWrap: 'wrap'}}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        started: 12
                                    </Typography> <br/>
                                    <Typography variant="caption" color="text.secondary">
                                        completed: 7
                                    </Typography> <br/>
                                    <Typography variant="caption" color="text.secondary">
                                        total: 21
                                    </Typography>
                                </Stack>
                            </Box>)}
                    </CardContent>
                </CardActionArea>


                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Divider/>
                    <Box
                        sx={{
                            display: 'flex',
                            height: 350,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            overflow: 'hidden',
                        }}
                    >
                        <List
                            sx={{
                                width: 200,
                                bgcolor: 'background.paper',
                                borderRight: '1px solid',
                                borderColor: 'divider',
                                height: '100%',
                            }}
                        >
                            <ListItem disablePadding>
                                <ListItemButton
                                    onClick={() => setSubTab('description')}
                                    selected={subTab === 'description'}
                                >
                                    <ListItemIcon>
                                        <Info/>
                                    </ListItemIcon>
                                    <ListItemText primary="Description"/>
                                </ListItemButton>
                            </ListItem>
                            <ListItem disablePadding>
                                <ListItemButton
                                    onClick={() => setSubTab('simulation')}
                                    selected={subTab === 'simulation'}
                                >
                                    <ListItemIcon>
                                        <Visibility/>
                                    </ListItemIcon>
                                    <ListItemText primary="Simulation"/>
                                </ListItemButton>
                            </ListItem>
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => setSubTab('stats')} selected={subTab === 'stats'}>
                                    <ListItemIcon>
                                        <Storage/>
                                    </ListItemIcon>
                                    <ListItemText primary="Stats"/>
                                </ListItemButton>
                            </ListItem>
                            {mode === 'teacher' && (
                                <>
                                    <ListItem disablePadding>
                                        <ListItemButton onClick={() => setSubTab('edit')} selected={subTab === 'edit'}>
                                            <ListItemIcon>
                                                <Create/>
                                            </ListItemIcon>
                                            <ListItemText primary="Edit"/>
                                        </ListItemButton>
                                    </ListItem>
                                    <ListItem disablePadding>
                                        <ListItemButton
                                            onClick={() => setSubTab('delete')}
                                            selected={subTab === 'delete'}
                                        >
                                            <ListItemIcon>
                                                <DeleteIcon/>
                                            </ListItemIcon>
                                            <ListItemText primary="Delete"/>
                                        </ListItemButton>
                                    </ListItem>
                                </>
                            )}
                        </List>

                        <Box sx={{flexGrow: 1, p: 3, overflowY: 'auto', whiteSpace: 'pre-wrap'}}>
                            {subTab === 'description' && (
                                <>
                                    <Typography variant="h6" gutterBottom>
                                        Description
                                    </Typography>
                                    <Typography variant="body1" paragraph>
                                        {task.description}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Difficulty: {task.difficulty}
                                    </Typography>
                                </>
                            )}

                            {subTab === 'simulation' && (
                                <>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: 250,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            overflow: 'hidden',
                                            mb: 2,
                                        }}
                                    >
                                        <iframe
                                            src={`http://localhost:3000/${task.id}/view-simulation`}
                                            title="Embedded Simulation"
                                            width="100%"
                                            height="100%"
                                            style={{border: 'none'}}
                                        />
                                    </Box>
                                    <Stack direction="row" spacing={2}>
                                        <Button variant="outlined" onClick={() => onDownload(task.id)}>
                                            Download Simulation
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={() =>
                                                window.open(
                                                    `${window.location.origin.replace(/:\d+$/, ':5173')}/simulation/${task.id}`
                                                )
                                            }
                                        >
                                            Open in Tab
                                        </Button>
                                    </Stack>
                                </>
                            )}

                            {subTab === 'stats' && (
                                <>
                                    <Typography variant="h6" gutterBottom>
                                        Stats
                                    </Typography>
                                    <Typography variant="body2">
                                        Created at: {new Date(task.createdAt).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="body2">
                                        Start: {dayjs(task.startDate).startOf('day').format('LL')}
                                    </Typography>
                                    <Typography variant="body2">
                                        Due: {dayjs(task.dueDate).endOf('day').format('LL')}
                                    </Typography>
                                    <Typography variant="body2">ID: {task.id}</Typography>
                                    <Typography variant="body2">
                                        Simulation Path: {task.simulation_path || '—'}
                                    </Typography>
                                    <Typography variant="body2">
                                        Filename: {task.simulation_filename || '—'}
                                    </Typography>
                                    <Typography variant="body2">
                                        Pseudocode: {task.pseudocode ? `${task.pseudocode.length} characters` : '—'}
                                    </Typography>
                                </>
                            )}

                            {subTab === 'edit' && mode === 'teacher' && (
                                <TaskForm
                                    mode="edit"
                                    initialTask={task}
                                    onSuccess={handleEditSuccess}
                                    onError={handleEditError}
                                    onClose={handleEditClose}
                                    onUpdated={handleTaskUpdated}
                                />
                            )}

                            {subTab === 'delete' && mode === 'teacher' && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Delete Task
                                    </Typography>
                                    <Typography variant="body2" color="error" mb={2}>
                                        This action cannot be undone. Do you want to delete this task?
                                    </Typography>
                                    <Button variant="contained" color="error" onClick={() => onDelete?.(task.id)}>
                                        Delete
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Collapse>
            </Card>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{width: '100%'}}>
                    {snackbarMsg}
                </Alert>
            </Snackbar>
        </>
    );
};

export default TaskCard;
