// frontend/src/components/TaskCard.tsx

import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Collapse,
    Divider, Fade,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Snackbar,
    Stack,
    Tooltip,
    Typography, Zoom,
} from '@mui/material';
import {
    Check,
    Close,
    ContentCopy,
    Create,
    Delete,
    DoNotTouch,
    Download, Feedback, Grading, HourglassBottom,
    Info,
    Lightbulb,
    PriorityHigh,
    Refresh,
    Remove,
    Replay,
    Storage,
    ViewInAr,
    Visibility,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import {Task} from '../types/Task';
import TaskForm from './TaskForm';
import {useTheme} from "@mui/material/styles";
import {useColorMode} from "../ThemeContext";
import {
    fetchAllUsersAPI,
    fetchMySolutionAPI,
    fetchTaskSolutionsAPI,
    getSimulationUrlAPI, runPythonCodeAPI,
    simulationClosedAPI,
    simulationKeepaliveAPI
} from "../api/axiosInstance";


interface TaskCardProps {
    task: Task;
    isExpanded: boolean;
    onToggleExpand: (taskId: string) => void;
    subTab: string;
    setSubTab: (tab: string) => void;
    onDownload: (taskId: string, variant: "Solution" | "Work" | "Pdf") => void;
    onGrading: (taskId: string) => void;
    onDelete?: (taskId: string) => void;
    mode: 'student' | 'teacher';
    onUpdated?: (task: Task) => void;
    tabIndex?: number;
}

const TaskCard = React.forwardRef<HTMLDivElement, TaskCardProps>((props, ref) => {
    const {
        task,
        isExpanded,
        onToggleExpand,
        subTab,
        setSubTab,
        onDownload,
        onDelete,
        onGrading,
        mode = 'student',
        onUpdated,
        tabIndex,
    } = props;

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
        Easy: localStorage.getItem('colorMode') === 'dark' ? '#8ce6aa' : '#007d4b',
        Medium: localStorage.getItem('colorMode') === 'dark' ? '#ffe483' : '#ffc700',
        Hard: localStorage.getItem('colorMode') === 'dark' ? '#ffaaa5' : '#c85000',
    };
    const difficultyColor = difficultyMap[task.difficulty] ?? '#ccc';

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);

    const [resetRunSim, setResetRunSim] = useState(false);

    const handleEnterNewTab = (variant: string, taskId: string) => {
        const windowName = `${variant}-${taskId}`;
        const simUrl = `/${variant}/${taskId}`;

        // Prüfen, ob schon ein Fenster mit diesem Namen offen ist
        let simWindow = window.open('', windowName);

        if (simWindow && !simWindow.closed) {
            // Fenster existiert → URL setzen und fokusieren
            simWindow.location.href = simUrl; // sicherstellen, dass es die richtige Seite lädt
            simWindow.focus();
            return;
        }

        // Fenster existiert nicht → direkt mit URL öffnen
        simWindow = window.open(simUrl, windowName);

        if (simWindow) {
            localStorage.setItem(`${variant}-${taskId}`, windowName);
            simWindow.focus();
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

    const prevSubTab = useRef(subTab);
    const intervalRef = useRef<NodeJS.Timer | null>(null);

    useEffect(() => {
        // Wechsel von Simulation weg → Cleanup
        if (prevSubTab.current === 'simulation' && subTab !== 'simulation') {
            simulationClosedAPI(task.id, 'solution')
                .then(() => console.log(`🕑 Cleanup scheduled for task ${task.id}`))
                .catch(err => console.error('❌ Failed to start cleanup timer:', err));
        }

        // Wechsel zu Simulation → Heartbeat starten
        if (subTab === 'simulation') {
            intervalRef.current = setInterval(() => {
                simulationKeepaliveAPI(task.id, 'solution').catch(err =>
                    console.error('❌ Heartbeat failed:', err)
                );
            }, 60 * 1000);
        } else if (intervalRef.current) {
            // vorheriges Intervall stoppen
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        prevSubTab.current = subTab;

        // Cleanup beim Unmount
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [subTab, task.id]);


    const [mySolutionStats, setMySolutionStats] = useState<{
        startedAt: string,
        updatedAt: string,
        submittedAt: string,
        code: string,
        status: string,
        passed: boolean,
        grade: number,
        feedback: string,
        metaData: {},
    } | null>(null);

    const [totalStudents, setTotalStudents] = useState<number>(0);
    const [totalStarted, setTotalStarted] = useState<number>(0);
    const [totalSubmitted, setTotalSubmitted] = useState<number>(0);
    const [remainingStudents, setRemainingStudents] = useState<number>(0);

    const [totalNotSubmitted, setTotalNotSubmitted] = useState<number>(0);
    const [totalPending, setTotalPending] = useState<number>(0);
    const [totalPassed, setTotalPassed] = useState<number>(0);
    const [totalNotPassed, setTotalNotPassed] = useState<number>(0);

    const [meanGrade, setMeanGrade] = useState<number>(0);
    const [medianGrade, setMedianGrade] = useState<number>(0);


    const [refreshStats, setRefreshStats] = useState(false);
    const [showGrade, setShowGrade] = useState(false);
    const [showMoreNP, setShowMorNP] = useState(false);


    useEffect(() => {
        if (!task?.id) return;

        if (mode === 'student') {
            const loadMySolution = async () => {
                try {
                    const res = await fetchMySolutionAPI(task.id);
                    // Defensive: res might be null or an object with a .status string
                    if (!res) {
                        setMySolutionStats(null);
                    } else {
                        setMySolutionStats({
                            startedAt: res.started_at ?? null,
                            updatedAt: res.updated_at ?? null,
                            submittedAt: res.submitted_at ?? null,
                            code: res.code ?? null,
                            status: res.status ?? null,
                            passed: res.passed ?? null,
                            grade: res.grade ?? null,
                            feedback: res.feedback ?? null,
                            metaData: res.metadata ?? {},
                        });
                    }

                } catch (err) {
                    console.error('Failed to load my solution status:', err);
                    setMySolutionStats(null);
                }
            };


            loadMySolution();
            return;
        }

        if (mode === 'teacher') {
            const loadStats = async () => {
                try {
                    // load in parallel
                    const [solutions, students] = await Promise.all([
                        fetchTaskSolutionsAPI(task.id), // expect array of solutions { user_id, status, ... }
                        fetchAllUsersAPI('student') // expect array of user objects
                    ]);

                    const total = Array.isArray(students) ? students.length : 0;

                    // Normalize solutions array
                    const solArray = Array.isArray(solutions) ? solutions : [];

                    // Build map userId -> latest solution (if you ever have duplicates)
                    const userLatest: Record<string, any> = {};
                    for (const s of solArray) {
                        const uid = s.user_id ?? s.userId ?? s.user?.id;
                        if (!uid) continue;
                        // If duplicates exist, prefer submitted > started > new (simple priority), or use updated_at
                        if (!userLatest[uid]) {
                            userLatest[uid] = s;
                        } else {
                            const prev = userLatest[uid];
                            // Prefer the one with a later updated_at if available
                            const prevTime = prev.updated_at ? new Date(prev.updated_at).getTime() : 0;
                            const curTime = s.updated_at ? new Date(s.updated_at).getTime() : 0;
                            if (curTime >= prevTime) userLatest[uid] = s;
                        }
                    }

                    const uniqueUserIds = Object.keys(userLatest); // students that have any entry
                    const uniqueCount = uniqueUserIds.length;

                    // Count statuses among the unique users (one count per student)
                    let started = 0;
                    let submitted = 0;

                    let notSubmitted = 0;
                    let pending = 0;
                    let passed = 0;
                    let notPassed = 0;

                    for (const uid of uniqueUserIds) {
                        const sol = userLatest[uid];
                        const st = sol.status;
                        if (st === 'started') started++;
                        else if (st === 'submitted') submitted++;
                        else if (st === 'not submitted') notSubmitted++;
                        else if (st === 'pending') pending++;
                        else if (st === 'passed') passed++;
                        else if (st === 'not passed') notPassed++;
                        // you can extend for other statuses if needed
                    }

                    // Extrahiere alle vorhandenen Noten
                    const grades: number[] = uniqueUserIds
                        .map(uid => Number(userLatest[uid]?.grade))
                        .filter(g => !isNaN(g) && g > 0);  // filtert auch nicht-numerische Strings raus


                    // grades ist ein Array von Zahlen, z. B. [3.5, 5, 3.7, 1.6, ...]

                    const sortedGrades = [...grades].sort((a, b) => a - b); // aufsteigend sortieren
                    const passedGrades = [...sortedGrades].filter(g => g < 5);
                    let promedio = 0;
                    let median = 0;

                    // Berechne Durchschnitt/Mean (passed)
                    if (passedGrades.length > 0) {
                        const sum = passedGrades.reduce((acc, g) => acc + g, 0);
                        promedio = sum / passedGrades.length;
                    }

                    // Berechne Median (passed)
                    const len = passedGrades.length;
                    if (len > 0) {
                        if (len % 2 === 1) {
                            // ungerade Anzahl → mittleres Element
                            median = passedGrades[(len - 1) / 2];
                        } else {
                            // gerade Anzahl → Durchschnitt der beiden mittleren
                            median = (passedGrades[len / 2 - 1] + passedGrades[len / 2]) / 2;
                        }
                    }

                    // Optional: runden auf 2 Nachkommastellen
                    promedio = Math.round(promedio * 100) / 100;
                    median = Math.round(median * 100) / 100;


                    setMeanGrade(promedio);  // falls du einen State dafür hast
                    setMedianGrade(median);

                    setTotalStudents(total);
                    setTotalStarted(started);
                    setTotalSubmitted(submitted + passed + notPassed);
                    setRemainingStudents(Math.max(0, total - uniqueCount));

                    setTotalNotSubmitted(notSubmitted);
                    setTotalPending(pending);
                    setTotalPassed(passed);
                    setTotalNotPassed(notPassed)
                } catch (err) {
                    console.error('Failed to load task stats:', err);
                    setTotalStudents(0);
                    setTotalStarted(0);
                    setTotalSubmitted(0);
                    setRemainingStudents(0);
                }
            };

            loadStats();
        }
    }, [task?.id, mode, refreshStats]);


// solution: einzelner Eintrag aus task_solutions
    const getStatusIcon = () => {
        switch (mySolutionStats?.status) {
            // Current tasks
            case 'submitted':
                return <Check color="success"/>;       // erledigt
            case 'started':
                return <Remove color="warning"/>;      // begonnen, aber noch nicht abgegeben

            // Previous tasks
            case 'pending':                            // noch nicht bewertet
                return <HourglassBottom color="warning"/>;
            case 'passed':
                return <Check color="success"/>;       // bestanden
            case 'not passed':
                return <Close color="error"/>;         // nicht bestanden
            case 'not submitted':
                return <DoNotTouch color="error"/>;    // nicht abgegeben

            default:
                // kein Eintrag / unbekannt
                return <PriorityHigh color="error"/>;
        }
    };


    const [copySuccess, setCopySuccess] = useState(false);

    async function copy(text: string) {
        // Moderner Weg
        if (navigator?.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                setCopySuccess(true);
                setTimeout(() => {
                    setCopySuccess(false)
                }, 1000);

                return true;
            } catch (e) {
                // Fallthrough zum Fallback
            }
        }

        // Fallback: Hidden textarea + execCommand
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';

        document.body.appendChild(textarea);
        textarea.select();

        try {
            const ok = document.execCommand('copy');
            setCopySuccess(true);
            setTimeout(() => {
                setCopySuccess(false)
            }, 1000);
            document.body.removeChild(textarea);
            return ok;
        } catch (e) {
            document.body.removeChild(textarea);
            return false;
        }
    }


    return (
        <Box
            ref={ref}
            sx={{
                // border: 'solid green',
            }}>
            <Card key={task.id} variant={"elevation"}
                  sx={{
                      borderRadius: 2,
                      boxShadow: isExpanded ? `0 0 10px ${theme.palette.primary.main}55` : `0 0 2px ${theme.palette.action.hover}, inset 0 0 10px ${theme.palette.action.hover}`,
                  }}>
                <CardActionArea onClick={() => onToggleExpand(task.id)}>
                    <CardContent

                        sx={{position: 'relative', flex: '1 0 auto', display: 'flex', alignItems: 'center', gap: 2}}>


                        <Box sx={{width: 8, height: 50, bgcolor: difficultyColor, borderRadius: 1}}/>

                        {now.isSame(due, "day") && (
                            <Box sx={{
                                borderRadius: '50%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignContent: 'center',
                                p: 0.4,
                                boxShadow: `0 0 20px ${theme.palette.warning.main}, inset 0 0 5px ${theme.palette.warning.main}`,
                                color: `${theme.palette.warning.main}`,
                            }}>
                                <PriorityHigh/>
                            </Box>
                        )}

                        <Box sx={{
                            display: 'flex',
                            flexGrow: 1,
                            flexDirection: 'column',
                            height: 50,
                            justifyContent: 'center',   // ← vertically center content
                            gap: 0.5
                        }}>


                            <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>
                                {task.title}
                            </Typography>

                            <Typography
                                variant="caption"
                                lineHeight={1}
                            >

                                {statusLabel}
                            </Typography>


                        </Box>


                        {mode !== 'teacher' && (
                            <Tooltip
                                title={
                                    <Typography variant={"subtitle2"}
                                                fontWeight={"bolder"}> {mySolutionStats?.grade}</Typography>
                                }
                                open={showGrade}
                                placement={'left'}
                                slotProps={{
                                    tooltip: {
                                        sx: {
                                            backgroundColor: theme.palette.background.paper,
                                            color: theme.palette.text.secondary,

                                        }
                                    }
                                }}
                            >
                                <Box sx={{ml: 'auto'}}
                                     onMouseEnter={() => {
                                         mySolutionStats?.grade ? setShowGrade(true) : {}
                                     }}
                                     onMouseLeave={() => {
                                         mySolutionStats?.grade ? setShowGrade(false) : {}
                                     }}
                                >
                                    {
                                        (tabIndex <= 1) && (
                                            getStatusIcon())
                                    }
                                </Box>
                            </Tooltip>

                        )}
                        {mode === 'teacher' && (
                            <Box sx={{ml: 'auto', display: 'flex'}}>
                                <Divider sx={{color: theme.palette.divider, mr: 2}} orientation="vertical" flexItem/>
                                <Stack
                                    direction="row"
                                    useFlexGap
                                    sx={{flexWrap: 'wrap'}}
                                    width={100}
                                >
                                    {(() => {

                                        switch (tabIndex) {

                                            case 0:
                                                return (
                                                    <Tooltip
                                                        title={
                                                            <Box style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                width: 125
                                                            }}
                                                            >
                                                                <Box style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'row',
                                                                    flexGrow: 1
                                                                }}> mean (passed): <div
                                                                    style={{flexGrow: 1}}/>{meanGrade}</Box>
                                                                <Box style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'row',
                                                                    flexGrow: 1
                                                                }}> median (passed):
                                                                    <div style={{flexGrow: 1}}/>
                                                                    {medianGrade}</Box>
                                                                <Box style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'row',
                                                                    flexGrow: 1
                                                                }}> not submitted:
                                                                    <div style={{flexGrow: 1}}/>
                                                                    {totalNotSubmitted}</Box>
                                                                <Box style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'row',
                                                                    flexGrow: 1
                                                                }}> not passed:
                                                                    <div style={{flexGrow: 1}}/>
                                                                    {totalNotPassed}</Box>
                                                            </Box>
                                                        }
                                                        open={showMoreNP}
                                                        placement={'left'}
                                                        slotProps={{
                                                            tooltip: {
                                                                sx: {
                                                                    backgroundColor: theme.palette.background.paper,
                                                                    color: theme.palette.text.secondary,

                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center'
                                                            }}
                                                            onMouseEnter={() => setShowMorNP(true)}
                                                            onMouseLeave={() => setShowMorNP(false)}
                                                        >

                                                            <Typography variant="caption" color="text.secondary">
                                                                passed: {totalPassed}
                                                            </Typography>

                                                            <Typography variant="caption" color="text.secondary">
                                                                not passed: {totalNotSubmitted + totalNotPassed}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                pending: {totalPending} / {totalStudents}
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                )
                                            case 1:
                                                return (
                                                    <Tooltip
                                                        title={
                                                            <Box style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                width: 125
                                                            }}
                                                            >
                                                                <Box style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'row',
                                                                    flexGrow: 1
                                                                }}> mean (passed): <div
                                                                    style={{flexGrow: 1}}/>{meanGrade}</Box>
                                                                <Box style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'row',
                                                                    flexGrow: 1
                                                                }}> median (passed):
                                                                    <div style={{flexGrow: 1}}/>
                                                                    {medianGrade}</Box>
                                                                <Box style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'row',
                                                                    flexGrow: 1
                                                                }}> passed:
                                                                    <div style={{flexGrow: 1}}/>
                                                                    {totalPassed}</Box>
                                                                <Box style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'row',
                                                                    flexGrow: 1
                                                                }}> not passed:
                                                                    <div style={{flexGrow: 1}}/>
                                                                    {totalNotPassed}</Box>
                                                            </Box>
                                                        }
                                                        open={showMoreNP}
                                                        placement={'left'}
                                                        slotProps={{
                                                            tooltip: {
                                                                sx: {
                                                                    backgroundColor: theme.palette.background.paper,
                                                                    color: theme.palette.text.secondary,

                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center'
                                                            }}
                                                            onMouseEnter={() => setShowMorNP(true)}
                                                            onMouseLeave={() => setShowMorNP(false)}
                                                        > <Typography variant="caption" color="text.secondary">
                                                            submitted: {totalSubmitted}
                                                        </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                started: {totalStarted}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                remaining: {remainingStudents} / {totalStudents}
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                );

                                        }
                                    })()}

                                </Stack>
                            </Box>)}
                    </CardContent>
                </CardActionArea>


                <Collapse in={props.isExpanded} unmountOnExit>
                    <Divider/>
                    <Box
                        sx={{
                            display: 'flex',
                            height: 350,
                            borderTop: '1px solid',
                            borderColor: theme.palette.divider,
                            overflow: 'hidden',
                        }}
                    >
                        <List
                            sx={{
                                minWidth: 200,
                                borderRight: '1px solid',
                                borderColor: theme.palette.divider,
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
                                        <ViewInAr/>
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

                            {mode === 'student' && (
                                <ListItem disablePadding>
                                    <ListItemButton
                                        onClick={() => setSubTab('feedback')}
                                        selected={subTab === 'feedback'}
                                    >
                                        <ListItemIcon>
                                            <Feedback/>
                                        </ListItemIcon>
                                        <ListItemText primary="Feedback"/>
                                    </ListItemButton>
                                </ListItem>
                            )}


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
                                    {dayjs(task.dueDate).endOf('day').isAfter(now) && (
                                        <ListItem disablePadding>
                                            <ListItemButton onClick={() => setSubTab('edit')}
                                                            selected={subTab === 'edit'}>
                                                <ListItemIcon>
                                                    <Create/>
                                                </ListItemIcon>
                                                <ListItemText primary="Edit"/>
                                            </ListItemButton>
                                        </ListItem>
                                    )}
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

                                    <Box sx={{display: 'flex', flexDirection: 'row', flexgrow: 1}}>
                                        <Button onClick={() => onDownload(task.id, "Pdf")} startIcon={<Download/>}>
                                            Download pdf
                                        </Button>
                                        {mode === 'teacher' && tabIndex < 2 && (
                                            <>
                                                <div style={{flexGrow: 1}}/>
                                                <Button onClick={() => handleEnterNewTab('grading', task.id)}
                                                        startIcon={<Grading/>}>
                                                    Start Grading
                                                </Button>
                                            </>
                                        )}
                                    </Box>

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
                                            backgroundColor: `${theme.palette.background.default}`,
                                            color: `${theme.palette.text.secondary}`,

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
                                                    borderColor: "divider",
                                                    overflow: 'hidden',
                                                    mr: 2

                                                }}
                                            >
                                                <iframe
                                                    src={getSimulationUrlAPI(task?.id, 'solution')}
                                                    title="Embedded Simulation"
                                                    width="100%"
                                                    height="100%"
                                                    style={{border: 'none'}}
                                                    allow="camera; microphone; fullscreen"
                                                    allowFullScreen

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
                                                            display: (tabIndex == 2 && mode !== 'teacher') ? 'none' : undefined,

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
                                                                        iframe.contentWindow.postMessage('[{"command":"resetScene"}]', '*');
                                                                        console.log("Simulation reset command sent.");
                                                                        setResetRunSim(false);
                                                                        return;
                                                                    }

                                                                    // Run solution code
                                                                    try {
                                                                        const data = await runPythonCodeAPI(task.id, "solution", task.sampleSolution);

                                                                        console.log("Backend response:", data);

                                                                        iframe.contentWindow.postMessage(
                                                                            JSON.stringify(data.output.output.commands),
                                                                            "*"
                                                                        );

                                                                        console.log("Commands sent to Unity:", data);

                                                                        setResetRunSim(true);
                                                                    } catch (err) {
                                                                        console.error("Error sending commands:", err);
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
                                                                        display: (tabIndex == 2 && mode !== 'teacher') ? 'none' : undefined,
                                                                    }}>
                                                            {"Start editing:"}
                                                        </Typography>
                                                        <Card elevation={0}
                                                              sx={{
                                                                  display: (tabIndex == 2 && mode !== 'teacher') ? 'none' : undefined,

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
                                                                    handleEnterNewTab('simulation', task.id)
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
                                <Box sx={{position: 'relative'}}>
                                    <IconButton
                                        size={"small"}
                                        sx={{
                                            position: 'absolute',
                                            right: 0, top: 0
                                        }}
                                        onClick={() => setRefreshStats(!refreshStats)}>
                                        <Refresh/>
                                    </IconButton>
                                    {mode === 'student' && (
                                        <>
                                            <Typography variant="subtitle2" fontWeight={"bolder"} gutterBottom>
                                                Your Stats:
                                            </Typography>
                                            <Typography variant="body2">
                                                Started: {mySolutionStats?.startedAt != null ? dayjs(mySolutionStats?.startedAt).format('DD.MM.YYYY - hh:mm a') : '–'}
                                            </Typography>
                                            <Typography variant="body2">
                                                Last
                                                Update: {mySolutionStats?.updatedAt != null ? dayjs(mySolutionStats?.updatedAt).format('DD.MM.YYYY - hh:mm a') : '–'}
                                            </Typography>
                                            <Typography variant="body2">
                                                Submitted: {mySolutionStats?.submittedAt != null ? dayjs(mySolutionStats?.submittedAt).format('DD.MM.YYYY - hh:mm a') : '–'}
                                            </Typography>
                                            <Typography variant="body2">
                                                Your Code Length: {mySolutionStats?.code?.length ?? '–'}
                                            </Typography>
                                            <Typography variant="body2">
                                                Status: {mySolutionStats?.status ?? '–'}
                                            </Typography>
                                            <Typography variant="body2">
                                                Passed? {mySolutionStats?.passed != null ? (mySolutionStats.passed ? 'Yes' : 'No') : '–'}
                                            </Typography>
                                            <Typography variant="body2">
                                                Grade: {mySolutionStats?.grade ?? '–'}
                                            </Typography>
                                            <Typography variant="body2">
                                                Feedback: {mySolutionStats?.feedback ?? '–'}
                                            </Typography>
                                            <Typography variant="body2">
                                                Metadata: {mySolutionStats?.metaData != null ? JSON.stringify(mySolutionStats.metaData) : '–'}
                                            </Typography>
                                        </>
                                    )}

                                    {mode === 'teacher' && (
                                        <>
                                            <Typography variant="subtitle2" fontWeight={"bolder"} gutterBottom>
                                                Task Stats:
                                            </Typography>
                                            <Typography variant="body2">
                                                Created at: {dayjs(task.createdAt).format('DD.MM.YYYY - hh:mm a')}
                                            </Typography>
                                            <Typography variant="body2">
                                                Start: {dayjs(task.startDate).startOf('day').format('DD.MM.YYYY - hh:mm a')}
                                            </Typography>
                                            <Typography variant="body2">
                                                Due: {dayjs(task.dueDate).endOf('day').format('DD.MM.YYYY - hh:mm a')}
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

                                </Box>
                            )}

                            {subTab === 'feedback' && (
                                <Box
                                    sx={{
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >

                                    <Box
                                        sx={{
                                            position: 'relative'
                                        }}>

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                backgroundColor: `${theme.palette.background.default}`,
                                                color: `${theme.palette.text.secondary}`,
                                                border: '1px solid',
                                                borderColor: theme.palette.divider,
                                                borderRadius: 1,
                                                p: 2,
                                                fontFamily: 'monospace',
                                                whiteSpace: 'pre-wrap',
                                                overflowX: 'auto',
                                                maxHeight: 135,
                                                overflowY: 'auto',
                                            }}
                                        >
                                            {mySolutionStats?.feedback || '(No Feedback provided)'}
                                        </Typography>
                                    </Box>
                                    <Divider textAlign={"center"} sx={{
                                        mb: 1, mt: 2,
                                        "&::before, &::after": {
                                            borderColor: difficultyColor
                                        }
                                    }
                                    }>
                                        <Typography variant="body2"
                                                    color={"textSecondary"}
                                        >
                                            your solution
                                        </Typography>
                                    </Divider>
                                    <Box
                                        sx={{
                                            position: 'relative',
                                        }}
                                    >

                                        <Typography
                                            variant="body2"
                                            sx={{
                                                backgroundColor: `${theme.palette.background.default}`,
                                                color: `${theme.palette.text.secondary}`,
                                                border: '1px solid',
                                                borderColor: theme.palette.divider,
                                                borderRadius: 1,
                                                p: 2,
                                                fontFamily: 'monospace',
                                                whiteSpace: 'pre-wrap',
                                                overflowX: 'auto',
                                                maxHeight: 120,
                                                overflowY: 'auto',
                                            }}
                                        >
                                            {mySolutionStats?.code || '(Nothing submitted yet)'}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}

                            {subTab === 'solution' && (
                                <>

                                    <Box
                                        sx={{
                                            position: 'relative'
                                        }}>
                                        {task.sampleSolution ?

                                            <Tooltip
                                                title={'copied'}
                                                open={copySuccess}
                                                placement={'left'}
                                                slotProps={{
                                                    tooltip: {
                                                        sx: {
                                                            backgroundColor: theme.palette.background.paper
                                                        }
                                                    }
                                                }}
                                            >
                                                <Box
                                                    onClick={() => copy(task?.sampleSolution)}
                                                    size={"small"}
                                                    sx={{
                                                        position: "absolute",
                                                        top: 8,
                                                        right: 8,
                                                        p: 1,
                                                        cursor: 'pointer',

                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',

                                                        '&:hover': {
                                                            transform: 'scale(1.05)'
                                                        },
                                                        '&:active': {
                                                            transform: 'scale(0.95)'
                                                        },

                                                        transition: 'all 200ms ease'
                                                    }}
                                                >
                                                    <Box sx={{position: 'relative', width: 20, height: 20}}>
                                                        <Zoom in={!copySuccess} timeout={200} unmountOnExit>
                                                            <Box sx={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <ContentCopy fontSize="small"/>
                                                            </Box>
                                                        </Zoom>

                                                        <Fade in={copySuccess} timeout={200} unmountOnExit>
                                                            <Box sx={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <Check fontSize="small"/>
                                                            </Box>
                                                        </Fade>
                                                    </Box>
                                                </Box>
                                            </Tooltip>
                                            :
                                            ''
                                        }
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                backgroundColor: `${theme.palette.background.default}`,
                                                color: `${theme.palette.text.secondary}`,
                                                border: '1px solid',
                                                borderColor: theme.palette.divider,
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
        </Box>
    );
})

export default TaskCard;
