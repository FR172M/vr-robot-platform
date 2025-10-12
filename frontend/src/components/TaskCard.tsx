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
    Alert, IconButton,
} from '@mui/material';
import {
    Info,
    Storage,
    Visibility,
    Create,
    Delete,
    Check,
    Close,
    Remove,
    Lightbulb,
    Download,
    ViewInAr,
    ContentCopy,
    PriorityHigh,
    Replay,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import {Task} from '../types/Task';
import TaskForm from './TaskForm';
import {useTheme} from "@mui/material/styles";
import {useEffect} from 'react';
import axios from 'axios';
import {useColorMode} from "../ThemeContext";


interface TaskCardProps {
    task: Task;
    isExpanded: boolean;
    onToggleExpand: (taskId: string) => void;
    subTab: string;
    setSubTab: (tab: string) => void;
    onDownload: (taskId: string, variant: "Solution" | "Work" | "Pdf") => void;
    onDelete?: (taskId: string) => void;
    mode?: 'student' | 'teacher';
    onUpdated?: (task: Task) => void;
    tabIndex?: number;
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
                      tabIndex,
                  }: TaskCardProps) => {
    const now = dayjs();
    const due = dayjs(task.dueDate).endOf('day');
    const start = dayjs(task.startDate).startOf('day');
    const theme = useTheme();
    const colorMode = useColorMode();

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
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);

    const [resetRunSim, setResetRunSim] = useState(false);

    const handleEnterSimulation = (taskId: string) => {
        const windowName = `simulation-${taskId}`;
        const simUrl = `${window.location.origin.replace(/:\d+$/, ':5173')}/simulation/${taskId}`;

        // Prüfen, ob wir einen gespeicherten Namen haben
        const storedName = localStorage.getItem(`simulation-${taskId}`);
        let simWindow: Window | null = null;

        if (storedName) {
            simWindow = window.open('', storedName); // attach by name
            console.log(storedName, simUrl, windowName)
        }
        if (simWindow) {
            // Tab existiert → Fokus
            simWindow.focus();
        } else {
            // Tab nicht offen → neue öffnen
            simWindow = window.open(simUrl, windowName);
        }
    };



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

    useEffect(() => {
        if (subTab !== 'simulation') {
            axios.post(`/api/tasks/${task.id}/simulation-closed/solution`)
                .then(() => console.log(`🕑 Cleanup scheduled for task ${task.id}`))
                .catch(err => console.error('❌ Failed to start cleanup timer:', err));
        } else {
            const interval = setInterval(() => {
                fetch(`/api/tasks/${task.id}/simulation-keepalive/solution`, {
                    method: "POST",
                }).catch((err) => console.error("❌ Heartbeat failed:", err));
            }, 1 * 60 * 1000);  // jede Minute

            return () => clearInterval(interval);
        }
    }, [subTab, task.id]);


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
                                {(() => {
                                        switch (tabIndex) {
                                            case 0:
                                                return Math.random() < 0.7
                                                    ? <Check color="success"/>
                                                    : <Close color="error"/>;
                                            case 1:
                                                return [<Check color="success"/>, <Remove color="warning"/>,
                                                    <PriorityHigh color="error"/>][Math.floor(Math.random() * 3)]
                                        }
                                    }
                                )()}

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
                                    {(() => {
                                        const total = 21;
                                        const started = Math.floor(Math.random() * (total + 1)); // 0..21
                                        const completed = Math.floor(Math.random() * (total - started + 1)); // 0..(21-started)
                                        const remaining = total - started - completed;
                                        switch (tabIndex) {

                                            case 0:
                                                return <Typography variant="caption" color="text.secondary">
                                                    completed: {started + completed} / {total}
                                                </Typography>
                                            case 1:
                                                return (
                                                    <>
                                                        <Typography variant="caption" color="text.secondary">
                                                            started: {started}
                                                        </Typography> <br/>
                                                        <Typography variant="caption" color="text.secondary">
                                                            completed: {completed}
                                                        </Typography> <br/>
                                                        <Typography variant="caption" color="text.secondary">
                                                            remaining: {remaining} / {total}
                                                        </Typography>
                                                    </>
                                                );

                                        }
                                    })()}

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
                                minWidth: 200,
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

                            {((mode !== 'teacher' && tabIndex === 0) || mode === 'teacher') && (
                                <ListItem disablePadding>
                                    <ListItemButton
                                        onClick={() => setSubTab('solution')}
                                        selected={subTab === 'solution'}
                                    >
                                        <ListItemIcon>
                                            <Lightbulb/>
                                        </ListItemIcon>
                                        <ListItemText primary="Solution"/>
                                    </ListItemButton>
                                </ListItem>
                            )}
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
                                                <Delete/>
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

                                    <Button onClick={() => onDownload(task.id, "Pdf")} startIcon={<Download/>}>
                                        Download pdf
                                    </Button>


                                    <Divider textAlign={"center"} sx={{
                                        mb: 1,
                                        "&::before, &::after": {
                                            borderColor: difficultyColor
                                        }
                                    }
                                    }>
                                        <Typography variant="body2"
                                                    color={"textSecondary"}
                                        >
                                            Difficulty: {task.difficulty}
                                        </Typography>
                                    </Divider>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
                                            borderRadius: 1,
                                            p: 2,
                                            fontFamily: 'monospace',
                                            whiteSpace: 'pre-wrap',
                                            overflowX: 'auto',
                                            maxHeight: 130,
                                            overflowY: 'auto',
                                        }}
                                    >
                                        {task.pseudocode || '(No pseudocode provided)'}
                                    </Typography>

                                </>
                            )}

                            {subTab === 'simulation' && (
                                <>
                                    <Box
                                        flex
                                        sx={{
                                            width: "100%",
                                            height: 300,
                                            overflow: 'hidden',
                                            position: "relative",

                                        }}
                                    >
                                        <Stack direction={"row"}>

                                            <Box
                                                flexGrow={1}
                                                sx={{
                                                    height: 300,
                                                    borderRadius: 1,
                                                    border: "1px solid",
                                                    borderColor: "text.secondary",
                                                    overflow: 'hidden',
                                                    mr: 2

                                                }}
                                            >
                                                <iframe
                                                    src={`http://localhost:3000/${task.id}/view-simulation/solution`}
                                                    title="Embedded Simulation"
                                                    width="100%"
                                                    height="100%"
                                                    style={{border: 'none'}}
                                                />

                                            </Box>

                                            <Box
                                                sx={{
                                                    minWidth: 100,
                                                    position: "relative",
                                                    overflow: "hidden",
                                                }}
                                            >

                                                <Box
                                                    sx={{
                                                        width: 100,
                                                        height: 300,
                                                        bottom: 0,
                                                        right: 0,
                                                        cursor: "default"
                                                    }}

                                                >
                                                    <Box
                                                        onMouseEnter={() => {
                                                            setShowDownloadOptions(!showDownloadOptions)
                                                        }}
                                                        onMouseLeave={() => {
                                                            setShowDownloadOptions(!showDownloadOptions)
                                                        }}
                                                        sx={{
                                                            display: (tabIndex == 2 && mode !== 'teacher') ? 'none' : '',

                                                            position: "absolute",
                                                            top: 0,
                                                            flexDirection: "column"
                                                        }}>

                                                        <Card elevation={0}
                                                              sx={{
                                                                  border: "1px solid",
                                                                  borderColor: theme.palette.primary.main,
                                                                  p: 1
                                                              }}
                                                        >
                                                            <Typography variant={"body2"} color={"primary"}>
                                                                Downloads
                                                            </Typography>
                                                        </Card>

                                                        <Collapse in={showDownloadOptions}>
                                                            <Box sx={{
                                                                borderRadius: 1,
                                                                border: "1px solid",
                                                                borderColor: "text.secondary",
                                                                mt: 0.5,
                                                                cursor: "pointer"

                                                            }}
                                                            >

                                                                <Card elevation={0}
                                                                      sx={{
                                                                          borderBottomLeftRadius: 0,
                                                                          borderBottomRightRadius: 0,
                                                                          borderBottom: "1px solid",
                                                                          borderColor: "text.secondary",
                                                                          color: "text.secondary",
                                                                          width: "100%"
                                                                      }}
                                                                >
                                                                    <CardActionArea
                                                                        onClick={() => onDownload(task.id, "Solution")}
                                                                        sx={{p: 1}}>

                                                                        <Stack direction={"row"}>
                                                                            <Download sx={{mr: 0.5}}/>

                                                                            <Typography
                                                                                variant={"body2"}>Solution</Typography>
                                                                        </Stack>
                                                                    </CardActionArea>
                                                                </Card>

                                                                <Card elevation={0}
                                                                      sx={{
                                                                          color: "text.secondary",
                                                                          borderTopRightRadius: 0,
                                                                          borderTopLeftRadius: 0,
                                                                          width: "100%"

                                                                      }}
                                                                >
                                                                    <CardActionArea
                                                                        onClick={() => onDownload(task.id, "Work")}
                                                                        sx={{p: 1}}>

                                                                        <Stack direction={"row"}>
                                                                            <Download sx={{mr: 0.5}}/>

                                                                            <Typography
                                                                                variant={"body2"}>Work</Typography>
                                                                        </Stack>
                                                                    </CardActionArea>
                                                                </Card>

                                                            </Box>
                                                        </Collapse>
                                                    </Box>
                                                    <Box sx={{
                                                        position: "absolute",
                                                        bottom: 0,
                                                        width: "100%",

                                                    }}
                                                    >
                                                        <Typography variant={"body2"} color={"textSecondary"}>
                                                            {"Show solution:"}
                                                        </Typography>
                                                        <Card elevation={0}
                                                              sx={{
                                                                  borderRadius: 1,
                                                                  border: "1px solid",
                                                                  borderColor: 'primary.main',
                                                                  color: 'primary.main',
                                                                  width: "100%",
                                                                  mt: 0.5
                                                              }}
                                                        >
                                                            <CardActionArea
                                                                onClick={async () => {
                                                                    const iframe = document.querySelector(
                                                                        'iframe[title="Embedded Simulation"]'
                                                                    ) as HTMLIFrameElement | null;

                                                                    if (!iframe?.contentWindow) {
                                                                        console.warn("Unity iframe not found!");
                                                                        return;
                                                                    }

                                                                    if (resetRunSim) {
                                                                        // Reset Unity simulation
                                                                        iframe.contentWindow.postMessage('[{"command":"resetScene"}]', '*');
                                                                        console.log("Simulation reset command sent.");
                                                                        setResetRunSim(!resetRunSim)
                                                                    } else {
                                                                        // Send code to backend and forward commands to Unity
                                                                        try {
                                                                            const res = await fetch('/api/code/run-python', {
                                                                                method: 'POST',
                                                                                headers: {'Content-Type': 'application/json'},
                                                                                body: JSON.stringify({
                                                                                    code: task.sampleSolution,
                                                                                    taskId: task.id,
                                                                                    variant: 'solution',
                                                                                }),
                                                                            });

                                                                            if (!res.ok) {
                                                                                console.error("Backend error:", res.statusText);
                                                                                return;
                                                                            }

                                                                            const data = await res.json();
                                                                            console.log("Backend response:", data);

                                                                            iframe.contentWindow.postMessage(
                                                                                JSON.stringify(data.commands),
                                                                                "*"
                                                                            );
                                                                            console.log("Commands sent to Unity:", data);
                                                                            setResetRunSim(!resetRunSim)

                                                                        } catch (err) {
                                                                            console.error("Error sending commands:", err);
                                                                        }
                                                                    }
                                                                }}

                                                                sx={{p: 1}}
                                                            >
                                                                <Stack direction="row">
                                                                    {resetRunSim ?
                                                                        <>
                                                                            <Replay sx={{mr: 0.5}}/>
                                                                            <Typography
                                                                                variant="body2">Reset</Typography>
                                                                        </>
                                                                        :
                                                                        <>
                                                                            <Check sx={{mr: 0.5}}/>
                                                                            <Typography variant="body2">Run</Typography>
                                                                        </>
                                                                    }
                                                                </Stack>
                                                            </CardActionArea>


                                                        </Card>

                                                        <Typography variant={"body2"} color={"textSecondary"}
                                                                    sx={{
                                                                        mt: 1,
                                                                        display: (tabIndex == 2 && mode !== 'teacher') ? 'none' : '',
                                                                    }}>
                                                            {"Start editing:"}
                                                        </Typography>
                                                        <Card elevation={0}
                                                              sx={{
                                                                  display: (tabIndex == 2 && mode !== 'teacher') ? 'none' : '',

                                                                  borderRadius: 1,
                                                                  border: "1px solid",
                                                                  borderColor: 'primary.main',
                                                                  color: 'primary.main',
                                                                  width: "100%",
                                                                  mt: 0.5
                                                              }}
                                                        >

                                                            <CardActionArea
                                                                onClick={() => {
                                                                    handleEnterSimulation(task.id)
                                                                }}
                                                                sx={{p: 1}}
                                                            >
                                                                <Stack direction={"row"}>
                                                                    <ViewInAr sx={{mr: 0.5}}/>
                                                                    <Typography variant={"body2"}>Enter!</Typography>
                                                                </Stack>
                                                            </CardActionArea>

                                                        </Card>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </>
                            )}

                            {subTab === 'stats' && (
                                <>
                                    <Typography variant="h6" gutterBottom>
                                        Stats
                                    </Typography>
                                    <Typography variant="body2">
                                        Created at: {dayjs(task.createdAt).format('LL')}
                                    </Typography>
                                    <Typography variant="body2">
                                        Start: {dayjs(task.startDate).startOf('day').format('LL')}
                                    </Typography>
                                    <Typography variant="body2">
                                        Due: {dayjs(task.dueDate).endOf('day').format('LL')}
                                    </Typography>
                                    <Typography variant="body2">ID: {task.id}</Typography>
                                    <Typography variant="body2">
                                        Pseudocode: {task.pseudocode ? `${task.pseudocode.length} characters` : '—'}
                                    </Typography>
                                    <Typography variant="body2">
                                        worksheetPath: {task.worksheetPath || '—'}
                                    </Typography>
                                    <Typography variant="body2">
                                        simWorkPath: {task.simWorkPath?.toString()}
                                    </Typography>
                                    <Typography variant="body2">
                                        simSolutionPath: {task.simSolutionPath?.toString()}
                                    </Typography>
                                </>
                            )}

                            {subTab === 'solution' && (
                                <>

                                    <Box
                                        sx={{
                                            position: 'relative'
                                        }}>
                                        {task.sampleSolution ?
                                            <IconButton
                                                onClick={() => {
                                                    navigator.clipboard.writeText(task.sampleSolution || '');
                                                }}
                                                size={"small"}
                                                sx={{
                                                    position: "absolute",
                                                    top: 8,
                                                    right: 8
                                                }}
                                            >
                                                <ContentCopy/>
                                            </IconButton>
                                            :
                                            ''
                                        }
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#f5f5f5',
                                                borderRadius: 1,
                                                p: 2,
                                                fontFamily: 'monospace',
                                                whiteSpace: 'pre-wrap',
                                                overflowX: 'auto',
                                                maxHeight: 300,
                                                overflowY: 'auto',
                                            }}
                                        >
                                            {task.sampleSolution || '(No Solution provided)'}
                                        </Typography>
                                    </Box>
                                </>
                            )
                            }

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
                                    <Typography variant="body2" mb={2}>
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
