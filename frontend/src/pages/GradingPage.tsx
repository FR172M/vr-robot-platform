import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {Box, Button, Dialog, Divider, Paper, TextField, Typography, Zoom} from "@mui/material";
import {useTheme} from "@mui/material/styles";
import {fetchTaskSolutionsAPI, fetchAllUsersAPI, updateGradeAPI, fetchTasksAPI} from "../api/axiosInstance";
import dayjs from "dayjs";
import {Check, Close, Search} from "@mui/icons-material";
import {Task} from "../types/Task";

interface Solution {
    solutionId: string;
    userId: string;
    username: string;
    status: string | null;
    code: string | null;
    grade: string | null;
    feedback: string | null;
    submittedAt: string | null;
    startedAt: string | null;

}

interface User {
    id: string;
    username: string;
    email: string;
}

const GradingPage: React.FC = () => {
        const theme = useTheme();

        const {taskId} = useParams<{ taskId: string }>();
        const [thisTask, setThisTask] = useState<Task | null>(null);

        useEffect(() => {
            if (!taskId) return;

            const fetchTask = async () => {
                try {
                    const allTasks: Task[] = await fetchTasksAPI();
                    const foundTask = allTasks.find(task => task.id === taskId);
                    if (!foundTask) {
                        setThisTask(null);
                    } else {
                        setThisTask(foundTask);
                    }
                } catch (err) {
                    console.error("Failed to fetch task:", err);
                    setThisTask(null);
                } finally {
                }
            };

            fetchTask();
        }, [taskId]);

        const [submissions, setSubmissions] = useState<Solution[]>([]);
        const [started, setStarted] = useState<Solution[]>([]);
        const [allSolutions, setAllSolutions] = useState<Solution[]>([]);


        const order = {

            'pending': 1,
            'submitted': 2,
            'passed': 3,
            'not passed': 4,
            'not submitted': 5,
        };

        const sortedSubmissions = [...submissions].sort((a, b) => {
            // 1️⃣ Status sortieren
            const statusDiff = order[a.status || 'not submitted'] - order[b.status || 'not submitted'];
            if (statusDiff !== 0) return statusDiff;

            // 2️⃣ Grade vergleichen
            const gradeA = a.grade !== null ? Number(a.grade) : Infinity;
            const gradeB = b.grade !== null ? Number(b.grade) : Infinity;
            const gradeDiff = gradeA - gradeB;
            if (gradeDiff !== 0) return gradeDiff;

            // 3️⃣ submittedAt vergleichen (falls vorhanden)
            const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
            const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
            return dateA - dateB;
        });

        const sortedStarted = [...started].sort((a, b) => {
            const sortA = a.feedback ? a.feedback.length : 0;
            const sortB = b.feedback ? b.feedback.length : 0;
            return sortA - sortB
        });


        const [notSubmitted, setNotSubmitted] = useState<User[]>([]);
        const [loading, setLoading] = useState<boolean>(true);


        const [searchTerm, setSearchTerm] = useState("");

        const filteredSubmissions = sortedSubmissions.filter((s) =>
            s.username.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const filteredStarted = sortedStarted?.filter((s) =>
            s.username.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const filteredNotSubmitted = notSubmitted?.filter((u) =>
            u.username.toLowerCase().includes(searchTerm.toLowerCase())
        );


        const [searching, setSearching] = useState(false);
        const [solutionInfos, setSolutionInfos] = useState(false);
        const [gradable, setGradable] = useState(false);


        const [selectedUser, setSelectedUser] = useState<{
            id: string,
            solutionId: string,
            userName: string,
            status: string | null,
            code: string | null,
            grade: string | null,
            feedback: string | null,
            startedAt: string | null,
            submittedAt: string | null
            email: string | null,
        } | null>(null);


        const [gradeInput, setGradeInput] = useState('');
        const [feedbackInput, setFeedbackInput] = useState('');


        useEffect(() => {
            setGradeInput(selectedUser?.grade)
            setFeedbackInput(selectedUser?.feedback)
            // console.log(selectedUser?.feedback)
        }, [selectedUser]);

        useEffect(() => {
            if (!taskId) return;

            const loadData = async () => {
                try {
                    // 1️⃣ Alle Lösungen für die Task
                    const res = await fetchTaskSolutionsAPI(taskId);
                    const submitted = res
                        .filter((s: any) => s.submitted_at)
                        .map((s: any) => ({
                            userId: s.user_id,
                            solutionId: s.id,
                            username: s.username,
                            code: s.code,
                            startedAt: s.started_at,
                            submittedAt: s.submitted_at,
                            grade: s.grade,
                            feedback: s.feedback,
                            status: s.status,
                            email: s.email,
                        }));
                    setSubmissions(submitted);

                    const started = res
                        .filter((s: any) => s.started_at)
                        .filter((s: any) => !s.submitted_at)
                        .map((s: any) => ({
                            userId: s.user_id,
                            solutionId: s.id,
                            username: s.username,
                            code: s.code,
                            startedAt: s.started_at,
                            grade: s.grade,
                            feedback: s.feedback,
                            status: s.status,
                            email: s.email,
                        }));
                    setStarted(started);

                    setAllSolutions(submitted + started);


                    // 2️⃣ Alle User
                    const users = await fetchAllUsersAPI(); // [{id, username}]
                    // 3️⃣ User ohne Submission filtern
                    const notSubmittedUsers = users.filter(
                        (u: any) => u.role === 'student' && !submitted.some((s: Solution) => s.userId === u.id) && !started.some((s: Solution) => s.userId === u.id)
                    );
                    setNotSubmitted(notSubmittedUsers);

                } catch (err) {
                    console.error("Failed to load task solutions or users:", err);
                    setSubmissions([]);
                    setNotSubmitted([]);
                } finally {
                    setLoading(false);
                }
            };

            loadData();
        }, [taskId, solutionInfos]);


        const handleSave = async () => {
            if (!selectedUser) return;

            await updateGradeAPI(selectedUser.solutionId, gradeInput, feedbackInput);

            // console.log('success')
            // Optional: UI aktualisieren
            setSelectedUser({
                ...selectedUser,
                grade: gradeInput,
                feedback: feedbackInput,
            });
            setSolutionInfos(false)

        };


        useEffect(() => {
            document.title = `Grade Task`;
        }, []);

        if (loading) return <Typography>Loading...</Typography>;
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100vw',
                height: '100vh',
                p: 4,
                overflow: 'auto',


            }}
            >
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'start',
                    borderBottom: '1px solid',
                    borderColor: theme.palette.divider
                }}
                >
                    <Typography variant={'h5'} fontWeight={"bolder"}>
                        {thisTask?.title}
                    </Typography>
                    <Typography variant={'subtitle2'} color={"textSecondary"}>
                        {`(difficulty: ${thisTask?.difficulty})`}
                    </Typography>

                </Box>
                <Box sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    display: 'flex',
                    flexDirection: 'row',
                    flexGrow: 1,
                    gap: searching ? 2 : 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backgroundColor: searching ? theme.palette.background.paper : '',
                    p: searching ? 2 : 0,
                    borderRadius: searching ? 3 : 0,

                    transition: 'all 400ms ease',

                }}
                >

                    <Box
                        sx={{
                            position: 'relative',
                            width: 36,
                            height: 36,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            borderRadius: '50%',


                            '&:hover': {
                                transform: 'scale(1.05)',
                                backgroundColor: theme.palette.background.paper,

                            },
                            '&:active': {
                                transform: 'scale(0.95)'
                            },
                            zIndex: 1000,

                            transition: 'all 400ms ease'
                        }}
                        onClick={() => setSearching(!searching)}
                    >
                        <Box sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Zoom in={!searching} timeout={200} unmountOnExit>
                                <Search/>
                            </Zoom>

                        </Box>
                        <Box sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Zoom in={searching} timeout={200} unmountOnExit>
                                <Close/>
                            </Zoom>
                        </Box>


                    </Box>

                    <Box sx={{
                        position: 'relative', display: 'flex', flexDirection: 'column',
                        boxSizing: 'border-box', flex: '1 0 auto',
                        opacity: searching ? 1 : 0,
                        maxWidth: searching ? 350 : 0,
                        transition: 'all 400ms ease'
                    }}>
                        <TextField
                            disabled={!searching}
                            label="Search user"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Box>
                </Box>
                <Box sx={{
                    position: 'relative', display: 'flex', flexDirection: 'column',
                    height: '100%', p: 2,
                    minHeight: 300,

                }}>

                    <Box sx={{
                        position: 'relative', display: 'flex', flexDirection: 'row', gap: 2,
                        overflow: 'auto', flexGrow: 1, boxSizing: 'border-box',
                        height: '100%'
                    }}>

                        <Box
                            sx={{
                                display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, width: 1 / 3
                            }}
                        >
                            <Typography alignSelf={'center'} variant={'subtitle1'} fontWeight={"bolder"}>
                                submissions:
                            </Typography>
                            <Divider/>

                            <Box
                                sx={{
                                    maxHeight: '100%',
                                    overflow: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    p: 2,
                                    gap: 2
                                }}
                            >
                                {
                                    filteredSubmissions.map((u) =>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                p: 1,
                                                borderRadius: 2,
                                                backgroundColor: theme.palette.background.paper,
                                                cursor: 'pointer',
                                                '&:active': {
                                                    transform: 'scale(0.95)'
                                                }
                                            }}
                                            onClick={() => {
                                                setSelectedUser({
                                                    id: u.userId,
                                                    solutionId: u.solutionId,
                                                    userName: u.username,
                                                    status: u.status,
                                                    code: u.code,
                                                    grade: u.grade,
                                                    feedback: u.feedback,
                                                    startedAt: u.startedAt,
                                                    submittedAt: u.submittedAt,
                                                    email: u.email,
                                                })
                                                setGradable(true)

                                                setSolutionInfos(!solutionInfos)
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                }}
                                            >
                                                <Typography variant={"body1"} color={"textSecondary"} fontWeight={"bold"}>

                                                    {`${u.username}`}
                                                </Typography>
                                                <div style={{flexGrow: 1}}/>
                                                <Typography variant={"caption"} color={"textSecondary"}>
                                                    {`(${u.status})`}
                                                </Typography>

                                            </Box>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                }}
                                            >
                                                <Typography variant={"body2"} color={'textSecondary'}>

                                                    {`${dayjs(u?.submittedAt).format('DD.MM.YYYY - hh:mm a')}`}
                                                </Typography>
                                                <div style={{flexGrow: 1}}/>
                                                <Typography variant="caption" color="textSecondary" marginRight={1}>
                                                    {`grade:`}
                                                </Typography>
                                                {u.grade ?
                                                    <Typography variant="caption" color="textSecondary">
                                                        {`${u.grade}`}
                                                    </Typography>
                                                    :
                                                    <Close sx={{width: 18, height: 18, color: theme.palette.divider}}/>
                                                }

                                            </Box>
                                        </Box>
                                    )
                                }
                            </Box>
                        </Box>

                        <Divider flexItem orientation={"vertical"}/>

                        <Box
                            sx={{
                                display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, width: 1 / 3
                            }}
                        >
                            <Typography alignSelf={'center'} variant={'subtitle1'} fontWeight={"bolder"}>
                                started:
                            </Typography>
                            <Divider/>
                            <Box
                                sx={{
                                    maxHeight: '100%',
                                    overflow: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    p: 2,
                                    gap: 2
                                }}
                            >
                                {filteredStarted.map((u) =>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            p: 1,
                                            borderRadius: 2,
                                            backgroundColor: theme.palette.background.paper,
                                            cursor: 'pointer',
                                            '&:active': {
                                                transform: 'scale(0.95)'
                                            }
                                        }}
                                        onClick={() => {
                                            setSelectedUser({
                                                id: u.userId,
                                                solutionId: u.solutionId,
                                                userName: u.username,
                                                status: u.status,
                                                code: u.code,
                                                grade: u.grade,
                                                feedback: u.feedback,
                                                startedAt: u.startedAt,
                                                submittedAt: u.submittedAt,
                                                email: u.email,
                                            })
                                            setGradable(false)
                                            setSolutionInfos(!solutionInfos)
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                            }}
                                        >
                                            <Typography variant={"body1"} color={"textSecondary"} fontWeight={"bold"}>

                                                {`${u.username}`}
                                            </Typography>
                                            <div style={{flexGrow: 1}}/>
                                            <Typography variant={"caption"} color={"textSecondary"}>
                                                {`(${u.status})`}
                                            </Typography>

                                        </Box>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                            }}
                                        >
                                            <Typography variant={"body2"} color={'textSecondary'}>
                                                {`${dayjs(u?.startedAt).format('DD.MM.YYYY - hh:mm a')}`}
                                            </Typography>
                                            <div style={{flexGrow: 1}}/>
                                            <Typography variant={"caption"} color={'textSecondary'} marginRight={1}>
                                                feedback:
                                            </Typography>
                                            {u?.feedback?.length > 0 ?
                                                <Check sx={{width: 18, height: 18, color: theme.palette.text.secondary}}/>
                                                :
                                                <Close sx={{width: 18, height: 18, color: theme.palette.divider}}/>
                                            }
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        <Divider flexItem orientation={"vertical"}/>

                        <Box
                            sx={{
                                display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, width: 1 / 3
                            }}
                        >
                            <Typography alignSelf={'center'} variant={'subtitle1'} fontWeight={"bolder"}>
                                not started:
                            </Typography>
                            <Divider/>
                            <Box
                                sx={{
                                    maxHeight: '100%',
                                    overflow: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    p: 2,
                                    gap: 2
                                }}
                            >
                                {filteredNotSubmitted.map((u) =>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            p: 1,
                                            borderRadius: 2,
                                            backgroundColor: theme.palette.background.paper
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                            }}
                                        >
                                            <Typography variant={"body1"} color={"textSecondary"} fontWeight={"bold"}>

                                                {`${u.username}`}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                            }}
                                        >

                                            <Typography variant={"caption"} color={"textSecondary"}>

                                                {`${u.email}`}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Box>

                    </Box>
                </Box>

                <Dialog
                    open={solutionInfos}
                    onClose={() => setSolutionInfos(!solutionInfos)}
                    fullWidth
                    maxWidth="md"
                >
                    <Box
                        sx={{
                            backgroundColor: theme.palette.background.paper,
                            width: '100%',
                            maxHeight: '80vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'auto',
                            boxSizing: 'border-box',
                            borderRadius: 2,
                            p: 3,
                            gap: 2,
                        }}
                    >
                        {/* Header */}
                        <Typography variant="h5" fontWeight="bolder">
                            {selectedUser?.userName}
                        </Typography>

                        {/* User Info */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                pb: 1,
                            }}
                        >
                            <Typography variant="caption" color="textSecondary">
                                {selectedUser?.email}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {selectedUser?.status}
                            </Typography>
                        </Box>

                        {/* Code-Anzeige */}
                        <Box
                            sx={{
                                backgroundColor: theme.palette.background.default,
                                color: theme.palette.text.secondary,
                                borderRadius: 1,
                                p: 2,
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                overflow: 'auto',
                                maxHeight: 300,
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {selectedUser?.code ?? 'No code submitted'}
                        </Box>

                        {/* Grade Eingabe */}
                        {gradable && (
                            <TextField
                                label="Grade"
                                variant="outlined"
                                fullWidth
                                disabled={!gradable}
                                value={gradeInput}
                                onChange={(e) => setGradeInput(e.target.value)}
                            />
                        )}

                        {/* Feedback Eingabe */}
                        <TextField
                            label="Feedback"
                            variant="outlined"
                            fullWidth
                            multiline
                            minRows={3}
                            value={feedbackInput}
                            onChange={(e) => setFeedbackInput(e.target.value)}
                        />

                        {/* Actions */}
                        <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2}}>
                            <Button variant="contained" color="primary" onClick={handleSave}>
                                Save
                            </Button>
                            <Button variant="outlined" onClick={() => setSolutionInfos(false)}>
                                Close
                            </Button>
                        </Box>
                    </Box>
                </Dialog>


            </Box>
        );
    }
;

export default GradingPage;
