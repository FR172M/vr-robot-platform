// frontend/src/pages/SimulationPage.tsx
import {
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Collapse,
    Divider, Fade,
    Grow,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemText,
    Stack,
    TextField,
    Tooltip,
    Typography, Zoom
} from '@mui/material';
import {
    Brightness4,
    Brightness7,
    Check, ChevronRight,
    Close,
    ContentCopy,
    Edit,
    Gamepad,
    KeyboardArrowDown, Send
} from '@mui/icons-material';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useParams} from 'react-router-dom';
import {Task} from '../types/Task';
import {useTheme} from "@mui/material/styles";
import dayjs from "dayjs";
import {useColorMode} from "../ThemeContext2";
import Editor from '@monaco-editor/react';
import {
    fetchMySolutionAPI, fetchMyUserAPI,
    fetchTaskByIdAPI, getSimulationUrlAPI,
    listApiAPI,
    runPythonCodeAPI,
    simulationClosedAPI,
    simulationKeepaliveAPI, startSolutionAPI, submitSolutionAPI, updateSolutionAPI
} from "../api/axiosInstance";

type SimulationPageProps = {
    variant: "work" | "solution";
};

const SimulationPage = ({variant}: SimulationPageProps) => {


    const moveInterval = useRef<number | null>(null);

    const startMove = (command: string, value: number) => {
        const iframe = document.querySelector('iframe[title="Simulation"]') as HTMLIFrameElement;
        if (!iframe?.contentWindow) return;

        if (moveInterval.current === null) {
            moveInterval.current = window.setInterval(() => {
                iframe.contentWindow!.postMessage(
                    JSON.stringify([{command, value}]),
                    '*'
                );
            }, 100); // alle 0.1 Sekunden
        }
    };


    const stopMove = () => {
        if (moveInterval.current !== null) {
            clearInterval(moveInterval.current);
            moveInterval.current = null;
        }
    };


    const theme = useTheme();
    const {taskId} = useParams<{ taskId: string }>();
    const [task, setTask] = useState<Task | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [openMoves, setOpenMoves] = useState(false);

    const [selectedItem, setSelectedItem] = useState('Description');
    const [userSolution, setUserSolution] = useState('');

    const {toggleColorMode} = useColorMode();

    const getLocalStoredCode = (id: string) => `task-${id}-userCode`;
    const editorRef = useRef<any>(null);
    const [code, setCode] = useState(localStorage.getItem(getLocalStoredCode(taskId)) || "");
    const [coding, setCoding] = useState(false);
    const [pendingCommands, setPendingCommands] = useState<any[] | null>(null);
    const [pendingDelay, setPendingDelay] = useState<number>(0);
    const [waitCodeUpload, setWaitCodeUpload] = useState(false);

    const [solutionId, setSolutionId] = useState<string | null>(null);


// Beim ersten Run Code
    const handleRunCode = async (delay = 0) => {
        setWaitCodeUpload(true);
        try {
            let currentSolutionId = solutionId;

            const user = fetchMyUserAPI();

            if ((await user).role === 'student') {
                // Falls noch keine Solution gestartet → starten
                if (!currentSolutionId && taskId) {
                    const solution = await startSolutionAPI(taskId);
                    currentSolutionId = solution.id;
                    setSolutionId(solution.id);
                }

                // Lösung speichern (update) – auch beim ersten Run
                if (currentSolutionId) {
                    await updateSolutionAPI(currentSolutionId, code);
                }
            }
            // Code ausführen
            const data = await runPythonCodeAPI(taskId!, variant, code);


            if ("error" in data && data.error) {
                console.error("Python execution error:", data.error);
                alert("Python error:\n" + data.error);
                return;
            }

            if (!data.output?.output.commands || data.output.output.commands.length === 0) {
                console.error("No commands returned from Python:", data);
                alert("No commands returned from Python.");
                return;
            }
            console.log(data.output.output.commands)

            // Alles gut, Commands setzen
            setPendingCommands(data.output.output.commands);


            setPendingDelay(delay);
            localStorage.removeItem(getLocalStoredCode(taskId))
            setCoding(false);

        } catch (err) {
            console.error(err);
            alert('Failed to execute Python code. Editor stays open.');
        } finally {
            setWaitCodeUpload(false);
        }
    };


    useEffect(() => {
        const loadSolution = async () => {
            if (!taskId) return;
            const solution = await fetchMySolutionAPI(taskId);
            if (solution?.code) {
                setUserSolution(solution.code);
                setCode(solution.code);
                console.log(`UserSolution und Code`)
            }
        };
        loadSolution();
    }, [taskId, expanded]);


    useEffect(() => {
        if (!taskId) return;
        const interval = setInterval(() => {
            simulationKeepaliveAPI(taskId!, variant).catch(err => console.error('❌ Heartbeat failed:', err));
        }, 60_000); // jede Minute
        return () => clearInterval(interval);
    }, [taskId, variant]);


    useEffect(() => {
        if (!coding && pendingCommands) {
            const timer = setTimeout(() => {
                const iframe = document.querySelector(
                    'iframe[title="Simulation"]'
                ) as HTMLIFrameElement;

                iframe?.contentWindow?.postMessage(
                    JSON.stringify(pendingCommands),
                    '*'
                );

                // aufräumen
                setPendingCommands(null);
                setPendingDelay(0);
            }, pendingDelay);

            return () => clearTimeout(timer);
        }
    }, [coding, pendingCommands, pendingDelay]);


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

    const handleCopy = async () => {
        try {
            await copy(task?.pseudocode)
        } catch (err) {
            console.error("Clipboard error:", err);
            alert("Failed to copy to clipboard.");
        }
    };


    useEffect(() => {
        const fetchTask = async () => {
            if (taskId) {
                try {
                    const data = await fetchTaskByIdAPI(taskId);
                    setTask(data);

                    const storedCode = localStorage.getItem(getLocalStoredCode(taskId));
                    setCode(storedCode || "# Write your Python code here");

                } catch (err) {
                    console.error('Failed to fetch task', err);
                }
            }
        };
        fetchTask();
    }, [taskId]);

    useEffect(() => {
        if (!taskId) return;

        let cancelled = false;

        const fetchWithPolling = async () => {
            // 5 Sekunden initiale Verzögerung
            await new Promise((r) => setTimeout(r, 5000));

            const blocks = [10, 10, 10]; // drei Polling-Blöcke à 10 Sekunden
            for (let i = 0; i < blocks.length; i++) {
                if (cancelled) return;

                const start = Date.now();
                const timeout = start + blocks[i] * 1000;

                while (Date.now() < timeout) {
                    if (cancelled) return;

                    try {
                        const data = await listApiAPI(taskId, 'work');
                        const apiInfo = data.apiInfo.output.output || {};
                        setApiInfo(apiInfo);
                        console.log(apiInfo)
                        if (Object.keys(apiInfo).length > 0) {
                            // API gefunden, Polling beenden
                            return;
                        }
                    } catch (err) {
                        console.error("Failed to fetch API:", err);
                    }

                    await new Promise((r) => setTimeout(r, 2000)); // 2 Sekunden zwischen Requests
                }

                if (i < blocks.length - 1) {
                    await new Promise((r) => setTimeout(r, 20000)); // 20 Sekunden Pause zwischen Blöcken
                }
            }
        };

        fetchWithPolling();

        return () => {
            cancelled = true;
        };
    }, [taskId]);


    useEffect(() => {
        document.title = `Simulation: ${task?.title}`;
        return () => {
            document.title = "VR Robot Platform";
        };
    }, [task?.title]);


    const [apiInfo, setApiInfo] = useState<Record<string, { signature: string, doc: string }>>({});
    const [showApi, setShowApi] = useState(true);

    const categories: ApiCategory[] = ["movement", "rotation", "utility"];

    const groupedApi = useMemo(() => {
        const result: Record<ApiCategory, typeof apiInfo[]> = {movement: [], rotation: [], utility: []};
        Object.entries(apiInfo).forEach(([name, info]) => {
            if (categories.includes(info.category)) {
                result[info.category as ApiCategory].push({name, signature: info.signature, doc: info.doc});
            }
        });
        categories.forEach(cat => result[cat].sort((a, b) => a.name.localeCompare(b.name)));
        return result;
    }, [apiInfo]);


    const movementAndRotationButtons = Object.entries(apiInfo)
        .filter(([name, info]) => ["movement", "rotation"].includes(info.category))
        .map(([name, info]) => {
            const value = info.category === "movement" ? 0.1 : 5;
            return (
                <Button
                    key={name}
                    onMouseDown={() => startMove(name, value)}
                    onMouseUp={stopMove}
                    onMouseLeave={stopMove}
                    color={"inherit"}
                    sx={{
                        '&:hover': {
                            backgroundColor: theme.palette.action.hover
                        }
                    }}
                >
                    {name}
                </Button>
            )
        });

    useEffect(() => {
        const handleTabClose = () => {
            simulationClosedAPI(taskId!, variant)
                .then(() => console.log(`Simulation cleanup timer started for task ${taskId} (${variant})`))
                .catch(err => console.error('❌ Failed to start cleanup timer:', err));
        };

        window.addEventListener("beforeunload", handleTabClose);
        return () => window.removeEventListener("beforeunload", handleTabClose);
    }, [taskId, variant]);

    const closeMovesTimer = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnterMoves = () => {
        if (closeMovesTimer.current) {
            clearTimeout(closeMovesTimer.current);
            closeMovesTimer.current = null;
        }
        setOpenMoves(true);
    };

    const handleMouseLeaveMoves = () => {
        closeMovesTimer.current = setTimeout(() => {
            setOpenMoves(false);
        }, 2000); // 2 Sekunden Verzögerung
    };


    if (!task) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100vh"
            >
                <Typography variant="h6">Loading simulation...</Typography>
            </Box>
        );
    }


    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                margin: 0,
                padding: 0,
            }}
        >
            <Box
                sx={{
                    display: coding ? 'flex' : 'none',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100vh',
                    width: '100vw',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(125,125,125,0.5)',
                }}
            />

            <iframe
                src={getSimulationUrlAPI(task?.id, 'work')}
                title="Simulation"
                width="100%"
                height="100%"
                style={{border: 'none'}}
                allow="camera; microphone; fullscreen"
                allowFullScreen

            />


            <Box sx={{position: 'absolute', top: 16, left: 16, gap: 1}}>

                {task?.simWorkPath !== '/assets/globalSim.zip' ?
                    ''
                    :
                    <Stack
                        direction={"row"}
                        onMouseEnter={handleMouseEnterMoves}
                        onMouseLeave={handleMouseLeaveMoves}
                    >

                        <IconButton
                            onClick={() => {
                                setOpenMoves(!openMoves)
                            }}
                            sx={{
                                backgroundColor: theme.palette.background.paper,
                                color: theme.palette.text.primary,
                                scale: 0.9,

                                "&:hover": {
                                    backgroundColor: theme.palette.action.hover,
                                    color: theme.palette.text.primary,
                                    scale: 1.1,

                                },
                                transition: 'all 400ms ease'
                            }}
                        >
                            {openMoves ? <Close/> : <Gamepad/>}
                        </IconButton>
                        <Collapse in={openMoves} timeout={100} orientation={"horizontal"}>
                            <Stack
                                direction={"row"}
                                sx={{
                                    background: theme.palette.background.default,
                                    borderRadius: 2,
                                    overflowX: "auto"
                                }}
                            >
                                {movementAndRotationButtons}

                                {/* Reset bleibt hartcoded */}
                                <Button
                                    color={"inherit"}
                                    onClick={() => {
                                        const iframe = document.querySelector(`iframe[title="Simulation"]`) as HTMLIFrameElement;
                                        iframe?.contentWindow?.postMessage('[{"command":"resetScene"}]', '*');
                                    }}
                                    sx={{
                                        whiteSpace: 'nowrap',
                                        '&:hover': {
                                            backgroundColor: theme.palette.action.hover
                                        }
                                    }}
                                >
                                    Reset
                                </Button>
                            </Stack>
                        </Collapse>
                    </Stack>
                }

                <IconButton
                    sx={{
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        scale: 0.9,

                        "&:hover": {
                            backgroundColor: theme.palette.action.hover,
                            color: theme.palette.text.primary,
                            scale: 1.1,

                        },
                        transition: 'all 400ms ease'
                    }} onClick={toggleColorMode}
                >
                    {theme.palette.mode === 'dark' ? <Brightness7/> : <Brightness4/>}
                </IconButton>


            </Box>


            <Stack
                sx={{
                    position: "absolute",
                    left: 16,
                    bottom: 16,
                    right: coding || expanded ? 16 : 'auto',
                }}>
                <Grow in={true} timeout={600}>

                    <Card
                        sx={{
                            position: coding ? "absolute" : '',
                            left: coding ? 0 : 'auto',
                            bottom: coding ? 0 : 'auto',
                            right: coding ? 0 : 'auto',
                            width: coding ? 'auto' : 200,
                            transform: 'translateX(50%)',
                            borderRadius: 2,
                            boxShadow: 6,
                            flexDirection: 'column',
                            zIndex: coding ? 30 : 20,
                            overflow: 'auto',
                            display: "flex"

                        }}
                    >
                        <CardActionArea
                            onClick={() => {
                                setCoding(!coding)
                                setExpanded(false)
                            }}
                            sx={{
                                borderRadius: 0,
                                borderBottom: coding ? "1px solid " : "",
                                borderColor: "divider"
                            }}
                        >
                            <Box
                                sx={{

                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    p: 2,

                                }}
                            >
                                <Typography variant={coding ? "subtitle1" : "subtitle2"} fontWeight="bold">
                                    {coding ? "Python Editor" : "Open Editor"}
                                </Typography>

                                {coding ? <Close/> : <Edit fontSize={"small"}/>}
                            </Box>
                        </CardActionArea>
                        {!coding ?
                            <></>

                            :
                            <>
                                <Box
                                    sx={{

                                        flexGrow: 1,
                                        display: 'flex',
                                        p: 2,
                                        overflow: "hidden",
                                    }}
                                >


                                    <Box
                                        sx={{
                                            display: 'flex',        // wichtig für Editor 100% Höhe
                                            flexDirection: "column",
                                            flexGrow: 1,
                                            overflow: "hidden",
                                            height: 300

                                        }}
                                    >

                                        <Box
                                            sx={{
                                                position: 'relative',
                                                width: '100%',
                                                display: "flex",
                                                flexDirection: "row",
                                                flexGrow: 1,

                                            }}>


                                            <Box
                                                sx={{

                                                    position: "relative",
                                                    display: 'flex',
                                                    flexGrow: 1,
                                                    flexDirection: "column",
                                                    mr: showApi ? 1 : 0,
                                                    width: showApi ? '30%' : '0%',
                                                    maxWidth: 250,
                                                    opacity: showApi ? 1 : 0,
                                                    transition: 'all 400ms ease'
                                                }}
                                            >

                                                <Box
                                                    sx={{
                                                        overflow: "auto",
                                                        p: 2,
                                                        backgroundColor: theme.palette.background.paper,
                                                        borderRadius: 1,
                                                        flexGrow: 1, // füllt den restlichen Platz
                                                        height: 10
                                                    }}
                                                >

                                                    {Object.keys(apiInfo).length > 0 ? (
                                                        categories.map(cat => (
                                                            groupedApi[cat].length > 0 && (
                                                                <Box key={cat} sx={{mb: 2}}>
                                                                    <Typography variant="subtitle2" sx={{
                                                                        fontWeight: "bold",
                                                                        textTransform: "capitalize"
                                                                    }}>
                                                                        {cat}:
                                                                    </Typography>
                                                                    {groupedApi[cat].map((cmd, index) => (
                                                                        <React.Fragment key={cmd.name}>
                                                                            <Tooltip title={cmd.doc || "no doc"} arrow
                                                                                     placement="right">
                                                                                <CardActionArea
                                                                                    sx={{
                                                                                        cursor: 'pointer',
                                                                                        p: 1,
                                                                                        backgroundColor: 'rgba(0,0,0,0.05'
                                                                                    }}
                                                                                    onClick={() => {
                                                                                        if (editorRef.current) {
                                                                                            const currentCode = editorRef.current.getValue();
                                                                                            editorRef.current.setValue(currentCode + `\n${cmd.name}()`);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <Typography variant="body2" sx={{
                                                                                        fontFamily: "monospace",
                                                                                        whiteSpace: "pre-wrap"
                                                                                    }}>
                                                                                        {cmd.name}{cmd.signature}
                                                                                    </Typography>
                                                                                </CardActionArea>
                                                                            </Tooltip>
                                                                            {index < groupedApi[cat].length - 1 &&
                                                                                <Divider/>}
                                                                        </React.Fragment>
                                                                    ))}
                                                                </Box>
                                                            )
                                                        ))) : (
                                                        <Typography variant="body2" sx={{fontFamily: "monospace"}}>
                                                            (No API available yet – maybe still unpacking)
                                                        </Typography>
                                                    )}


                                                </Box>


                                            </Box>

                                            <Box
                                                sx={{
                                                    borderRadius: 1,
                                                    border: "1px solid",
                                                    p: 0,
                                                    flexGrow: 1,
                                                    maxWidth: '100%',
                                                    overflow: 'hidden',
                                                    transition: 'all 400ms ease'
                                                }}
                                            >
                                                <Editor
                                                    defaultLanguage="python"
                                                    defaultValue={localStorage.getItem(getLocalStoredCode(task.id)) || "# Write your Python code here"}
                                                    theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'vs-light'}
                                                    value={code}
                                                    onChange={(value) => {
                                                        setCode(value || '');
                                                        if (task?.id) localStorage.setItem(getLocalStoredCode(task.id), value || '');
                                                    }}
                                                    onMount={(editor) => (editorRef.current = editor)}
                                                    options={{
                                                        minimap: {enabled: false},
                                                        fontSize: 14,
                                                        scrollBeyondLastLine: false,
                                                        automaticLayout: true, // reagiert zusätzlich auf Resize-Events
                                                    }}
                                                    width={"99.9%"}
                                                    height={"99.9%"}
                                                />
                                            </Box>

                                        </Box>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "row",
                                                flexGrow: 1,
                                                mt: 1,
                                            }}
                                        >
                                            <Tooltip
                                                arrow
                                                title={`${Object.keys(apiInfo).length} ${Object.keys(apiInfo).length === 1 ? "call" : "calls"}`}
                                                placement={"right"}
                                            >

                                                <Button
                                                    variant={"outlined"}
                                                    onClick={() => {
                                                        setShowApi(!showApi)
                                                    }}
                                                    sx={{
                                                        mr: 1,
                                                        width: showApi ? '30%' : '10%',
                                                        maxWidth: 250,
                                                        minWidth: 75,
                                                        display: 'flex',
                                                        flexWrap: 'nowrap',
                                                        whiteSpace: 'nowrap',
                                                        transition: 'all 400ms ease'

                                                    }}
                                                    startIcon={showApi ? <Close/> : <ChevronRight/>}
                                                >

                                                    {`${showApi ? "Close" : ""} API`}


                                                </Button>
                                            </Tooltip>

                                            <Button
                                                sx={{flexGrow: 1, maxWidth: "100%"}}
                                                variant="contained"
                                                loading={waitCodeUpload}
                                                onClick={() => handleRunCode(250)}
                                            >
                                                Run Code
                                            </Button>


                                        </Box>
                                    </Box>


                                </Box>
                            </>
                        }
                    </Card>
                </Grow>

                <Grow in={true} timeout={600}>
                    <Card
                        sx={{
                            mt: 2,
                            width: expanded ? 'auto' : 200,
                            height: expanded ? 300 : 'auto',
                            borderRadius: 2,
                            display: 'flex',
                            flexDirection: expanded ? 'column' : 'row',
                            overflow: 'hidden',

                        }}
                        onClick={() => {
                            if (!expanded) setExpanded(true);
                        }}
                    >
                        {expanded ? (
                            <>
                                {/* Titelbereich über gesamte Breite */}
                                <CardActionArea
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpanded(false);
                                    }}
                                    sx={{
                                        borderRadius: 0,
                                        borderBottom: expanded ? "1px solid " : "",
                                        borderColor: "divider"
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            p: 2,
                                        }}
                                    >
                                        <Typography variant={"subtitle1"} fontWeight="bold">
                                            {task.title}
                                        </Typography>

                                        <KeyboardArrowDown/>
                                    </Box>
                                </CardActionArea>


                                {/* Menü + Content nebeneinander */}
                                <Box sx={{display: 'flex', flexGrow: 1, overflow: 'hidden'}}>
                                    {/* Menü */}
                                    <Box
                                        sx={{
                                            width: 200,
                                            borderRight: '1px solid',
                                            borderColor: 'divider',
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}
                                    >
                                        {['Description', 'Pseudocode', 'Your Solution', 'Stats'].map(
                                            (item, index) => (
                                                <Box key={item}>
                                                    <ListItem disablePadding>
                                                        <ListItemButton
                                                            selected={selectedItem === item}
                                                            onClick={() => setSelectedItem(item)}
                                                            sx={{
                                                                bgcolor:
                                                                    selectedItem === item
                                                                        ? 'action.selected'
                                                                        : 'transparent',
                                                                '&:hover': {
                                                                    bgcolor: 'action.hover',
                                                                },
                                                            }}
                                                        >
                                                            <ListItemText primary={item}/>
                                                        </ListItemButton>
                                                    </ListItem>
                                                    {index < 3 && <Divider/>}
                                                </Box>
                                            )
                                        )}
                                    </Box>

                                    {/* Content */}
                                    <CardContent
                                        sx={{
                                            flexGrow: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflowY: 'auto',
                                            //  border: "solid red",
                                            p: 2
                                        }}
                                    >


                                        {selectedItem === 'Description' && (
                                            <>
                                                <Typography
                                                    variant="body2">{task.description}</Typography>

                                                <Typography variant="body2"
                                                            color={"textSecondary"}
                                                            mt={2}
                                                >
                                                    Difficulty: {task.difficulty}
                                                </Typography>
                                                <Typography variant="body2"
                                                            color="textSecondary">
                                                    {`Due ${dayjs().to(dayjs(task.dueDate).endOf('day'))}`}
                                                </Typography>

                                            </>
                                        )}

                                        {selectedItem === 'Pseudocode' && (
                                            <Box
                                                sx={{
                                                    position: 'relative',
                                                    height: "100%",
                                                    borderRadius: 1,
                                                }}
                                            >
                                                {/* Button bleibt fix über dem scrollbaren Inhalt */}
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
                                                        size="small"
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
                                                        onClick={handleCopy}
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

                                                {/* Scrollbarer Content */}
                                                <Box
                                                    sx={{
                                                        p: 2,
                                                        borderRadius: 1,
                                                        overflow: 'auto',
                                                        maxHeight: "100%",
                                                        backgroundColor: `${theme.palette.background.default}`,
                                                        color: `${theme.palette.text.secondary}`,
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontFamily: 'monospace',
                                                            whiteSpace: 'pre-wrap',
                                                        }}
                                                    >
                                                        {task.pseudocode || '(No pseudocode provided)'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                        )}

                                        {selectedItem === 'Your Solution' && (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    height: '100%',
                                                    position: 'relative', // wichtig für absolut positionierten Button
                                                }}
                                            >
                                                <TextField
                                                    multiline
                                                    fullWidth
                                                    minRows={5}
                                                    maxRows={5}
                                                    value={userSolution}
                                                    autoFocus
                                                    onChange={(e) => setUserSolution(e.target.value)}
                                                    placeholder="Post your code here..."
                                                    sx={{
                                                        '& .MuiInputBase-root': { // Selektieren der Input-Basis für Höhe
                                                            height: '100%',
                                                            alignItems: 'stretch', // Ermöglicht Strecken
                                                            backgroundColor: `${theme.palette.background.paper}`,
                                                        },
                                                        '& .MuiInputBase-input': { // Selektieren des eigentlichen Input-Elements
                                                            height: '100%',
                                                            boxSizing: 'border-box', // Stellt sicher, dass die Höhe die Padding- und Border-Werte einschließt
                                                            paddingBottom: '1.2em', // Notwendig, da der Inhalt sonst von der Etikett "verschluckt" werden könnte
                                                        },
                                                    }}
                                                />

                                                {/* kleiner Button oben rechts */}
                                                <Tooltip title={"Paste stored Code from Editor"}
                                                         arrow
                                                         placement={"right"}>
                                                    <IconButton
                                                        disabled={!localStorage.getItem(`task-${task?.id}-userCode`)}
                                                        size="small"
                                                        sx={{
                                                            position: 'absolute',
                                                            top: 4,
                                                            right: 4,
                                                            zIndex: 10,
                                                        }}
                                                        onClick={() => {
                                                            const storedCode = localStorage.getItem(`task-${task?.id}-userCode`);
                                                            if (storedCode) setUserSolution(storedCode);
                                                        }}
                                                        color={"primary"}
                                                    >
                                                        <ContentCopy fontSize="small"/>
                                                    </IconButton>

                                                </Tooltip>

                                                {/* Optional: Submit Button unten rechts */}
                                                <Button
                                                    sx={{mt: 1, alignSelf: 'flex-end'}}
                                                    variant="outlined"
                                                    endIcon={<Send/>}
                                                    onClick={async () => {
                                                        if (!solutionId) {
                                                            alert("You need to run code at least once before submitting.");
                                                            return;
                                                        }
                                                        try {
                                                            // Solution submitten (status -> submitted, submitted_at -> now)
                                                            await submitSolutionAPI(solutionId, userSolution);
                                                            alert("Solution successfully submitted!");
                                                        } catch (err) {
                                                            console.error("Failed to submit solution:", err);
                                                            alert("Failed to submit solution. See console for details.");
                                                        }
                                                    }}
                                                >
                                                    Submit
                                                </Button>

                                            </Box>
                                        )}


                                        {selectedItem === 'Stats' && (
                                            <Box>
                                                <Typography variant="body2">
                                                    Start: {new Date(task.startDate).toLocaleDateString()}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                                </Typography>
                                                <Typography variant="body2">Task
                                                    ID: {task.id}</Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Box>
                            </>
                        ) : (
                            // Kompakte Card

                            <CardActionArea sx={{p: 2}}>
                                <Stack direction={"column"}
                                       sx={{
                                           display: 'flex',
                                           justifyContent: 'space-between',

                                       }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight="bold"
                                        sx={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {task.title}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        noWrap
                                    >
                                        {new Date(task.startDate).toLocaleDateString()} –{' '}
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </Typography>
                                </Stack>
                            </CardActionArea>

                        )}
                    </Card>
                </Grow>

            </Stack>

        </Box>
    );
};

export default SimulationPage;
