// src/pages/UserPage.tsx

import {
    Box,
    Button,
    Divider,
    MenuItem,
    Select,
    Stack,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Task} from '../types/Task';
import {useNavigate} from 'react-router-dom';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import TaskCard from '../components/TaskCard';
import {
    AddCircleOutline,
    CancelOutlined,
    Brightness7,
    Brightness4,
    MenuRounded,
    MenuOpenRounded,
    Logout,
    Forward,
    SortByAlphaOutlined,
    Sort,
    AccessTime,
    Add,
    Close, Contacts,
} from '@mui/icons-material';
import TaskForm from '../components/TaskForm';
import {useColorMode} from "../ThemeContext2";
import {useTheme} from '@mui/material/styles';
import MoreList from "../components/MoreList";
import api, {
    deleteTaskAPI,
    downloadAPI, fetchEnvAPI,
    fetchMyUserAPI,
    fetchTasksAPI,
} from "../api/axiosInstance";
import UserList from "../components/userList";


dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export interface TeacherPageProps {
    mode: string | null;
}

const UserPage: React.FC<TeacherPageProps> = ({
                                                  mode,
                                              }) => {

        const theme = useTheme();
        const {toggleColorMode} = useColorMode();

        const [userList, setUserList] = useState(false)


        const navigate = useNavigate();
        const [tasks, setTasks] = useState<Task[]>([]);
        const [tabIndex, setTabIndex] = useState(1);
        const [expanded, setExpanded] = useState<string>('');
        const [subTab, setSubTab] = useState('description');
        const [sortKey, setSortKey] = useState<'date' | 'difficulty' | 'name'>('date');
        const [createMode, setCreateMode] = useState(false);

        const now = dayjs();

        const fetchTasks = async () => {
            const data = await fetchTasksAPI();
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

        const reloadTasks = async (tabIndex) => {
            await fetchTasks();
            setExpanded('');
            setSubTab('description');
            setTabIndex(tabIndex); // z.B. Current Tasks
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

        useEffect(() => {
            document.title = `${getLabel().charAt(0).toUpperCase() + getLabel().slice(1)} Tasks`;
            return () => {
                document.title = "VR Robot Platform";
            };
        }, [tabIndex]);


        const handleDownload = async (taskId: string, variant: "Solution" | "Work" | "Pdf") => {
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

            const isDocker = await fetchEnvAPI();
            if (isDocker) {
                try {
                    await downloadAPI(taskId, endpoint);
                } catch (err) {
                    console.error("Download failed:", err);
                }
            } else {
                window.open(`/api/tasks/${taskId}/${endpoint}`, "_blank");
            }
        };


        const handleEnterGrading = (taskId: string) => {
            try {
                window.open(`/grading/${taskId}`, '_blank');

            } catch (error) {
                console.log(`error grading: ${error}`)
            }

        }

        const toggleExpand = (taskId: string) => {
            setExpanded(expanded === taskId ? '' : taskId);
            setSubTab('description');
        };

        const handleDelete = async (id: string) => {
            if (confirm('Really delete this task?')) {
                await deleteTaskAPI(id);
                fetchTasks();
            }
        };

        const handleCloseForm = () => {
            setCreateMode(false);
            fetchTasks();
        };

        const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

        useEffect(() => {
            if (!expanded) return;

            console.log('wtf')
            const refKey = expanded + sortKey;
            const el = itemRefs.current[refKey];

            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({behavior: 'smooth', block: 'center'});
                }, 150);
            }
        }, [expanded, sortKey]);


        const [menu, setMenu] = useState(false);
        const [moreListMenu, setMoreListMenu] = useState(false);

        const getLabel = () => {
            switch (tabIndex) {
                case 0:
                    return "previous";
                case 1:
                    return "current";
                case 2:
                    return "upcoming";
                default:
                    return "";
            }
        };


        const actions = [

            // Add more actions here

            {
                label: `${menu ? 'close' : 'open'} menu`,
                icon: menu ? <MenuOpenRounded fontSize="small"/> : <MenuRounded fontSize="small"/>,
                onClick: () => {
                    setMenu(!menu)
                },

            },

            {
                label: `change to ${
                    tabIndex === 0 ?
                        'current'
                        :
                        tabIndex === 1 ?
                            'upcoming'
                            :
                            'previous'
                } tasks`,
                icon: <Forward fontSize="small"/>,
                onClick: () => {
                    let val = tabIndex + 1;
                    if (val >= 3) val = 0;
                    setTabIndex(val);
                    setExpanded('')
                }
            },


            {
                label: (
                    <>
                        <div>{`sorted by ${sortKey}`} </div>
                        <div>

                            {`(change to ${(sortKey === 'name') ?
                                'difficulty'
                                :
                                (sortKey === 'difficulty') ?
                                    'date'
                                    :
                                    'name'
                            })`}
                        </div>
                    </>
                ),
                icon: (
                    sortKey === 'difficulty' ?
                        <Sort fontSize={'small'}/>
                        :
                        sortKey === 'date' ?
                            <AccessTime fontSize={'small'}/>
                            :
                            <SortByAlphaOutlined fontSize={"small"}/>

                ),
                onClick: () => {
                    setExpanded('');

                    if (sortKey === 'name') {
                        setSortKey("difficulty");
                    } else if (sortKey === "difficulty") {
                        setSortKey("date");
                    } else setSortKey("name");

                }
            },

            mode
            ===
            'teacher' && {
                label: createMode ? 'cancel' : 'add task',
                icon: createMode ? <Close fontSize={"small"}/> : <Add fontSize={"small"}/>,
                onClick: () => {
                    if (createMode) {
                        if (confirm('Leave Task creation?')) {
                            setCreateMode(false);
                            fetchTasks();
                        }
                    } else {
                        setCreateMode(true);
                    }
                }
            },


            // immer versteckt (3)

            mode === 'teacher' && {
                label: 'list all users',
                icon: <Contacts fontSize={"small"}/>,
                onClick: () => setUserList(!userList),
            },

            {
                label: theme.palette.mode === 'dark' ? 'light mode' : 'dark mode',
                icon: theme.palette.mode === 'dark' ? <Brightness7 fontSize={"small"}/> : <Brightness4 fontSize={"small"}/>,
                onClick: toggleColorMode,
            },


            {
                label: 'logout',
                icon: <Logout fontSize="small"/>,
                onClick: () => {
                    setRole(null);      // <— absolut notwendig

                    handleLogout()
                },
            },

        ].filter(Boolean);

        const maxVisContRef = useRef<HTMLDivElement>(null);


        const [username, setUsername] = useState<string | null>(null);
        const [role, setRole] = useState<string | null>(null);


        useEffect(() => {
            const loadUser = async () => {
                try {
                    const user = await fetchMyUserAPI();
                    if (!user) {
                        navigate('/'); // falls Cookie fehlt oder abgelaufen
                        return;
                    }
                    setUsername(user.username);
                    setRole(user.role);
                } catch (err) {
                    console.error(err);
                    navigate('/');
                }
            };
            loadUser();
        }, []);

        const handleLogout = async () => {
            await api.post('/auth/logout');
            navigate('/login');       // danach sichere Landung
        };


        return (
            <>
                {/*Screen*/}


                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'absolute',
                        height: '100vh',
                        width: '100vw',
                        overflow: 'auto',

                    }}
                >
                    {role === 'teacher' && (
                        <UserList open={userList} role={role} onClose={() => setUserList(false)}/>
                    )}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: menu
                                ? `${theme.palette.background.paper}35`
                                : `${theme.palette.background.paper}35`,
                            backdropFilter: 'blur(16px)',
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            zIndex: 50,
                            maxWidth: '100%',
                            transition: 'background-color 0.3s ease',
                        }}
                    >
                        {/* Top Row: Title + Menu Toggle */}

                        <Box sx={{
                            position: 'relative',
                            display: 'flex',
                            flexGrow: 1,
                            alignItems: 'center',
                            gap: 2,
                            overflow: 'hidden',
                            pl: 4, pr: 4,
                            pt: 1, pb: 1
                        }}
                        >
                            <Box
                                ref={maxVisContRef}
                                sx={{
                                    display: 'flex',
                                    flex: '0 0 auto',         // ⬅ allows grow AND shrink properly
                                    maxWidth: '100%',           // ⬅ never exceed 25% of row
                                    overflow: 'hidden',
                                }}
                            >
                                <MoreList
                                    position={"relative"}
                                    zIndex={100}
                                    onHover={setMoreListMenu}
                                    onClick={() => setMenu(!menu)}
                                    actions={actions}
                                    expanded={moreListMenu}
                                    hoverCardPosition={'bottom-right'}
                                    containerRef={maxVisContRef}
                                    arrow={true}
                                    icon={menu ? <MenuOpenRounded fontSize={"small"}/> : <MenuRounded fontSize={"small"}/>}
                                    noSmallBg={true}
                                    listAfter={role === 'teacher' ? actions.length - 3 : actions.length - 2}
                                    // color={theme.palette.text.primary}
                                />
                            </Box>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flex: '0 0 auto',         // ⬅ allows grow AND shrink properly
                                    maxWidth: '60vw',           // ⬅ never exceed 25% of row
                                    overflow: 'hidden',
                                    flexDirection: 'column',
                                    gap: 0,
                                }}
                            >
                                <Typography variant="h6" color={"primary"} fontWeight="bolder">
                                    Hello {username}!
                                </Typography>

                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        gap: 1,
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        color={"textSecondary"}
                                    >
                                        {`${role}`}
                                    </Typography>
                                    <Divider flexItem orientation={"vertical"}/>
                                    <Typography
                                        variant="subtitle2"
                                        color={"textSecondary"}
                                        onClick={() => {
                                            let val = tabIndex + 1;
                                            if (val >= 3) val = 0;
                                            setTabIndex(val);
                                            setExpanded('')
                                        }}
                                        sx={{
                                            cursor: 'pointer',
                                        }}
                                    >

                                        {mode === 'teacher' ?
                                            `manage ${getLabel()} tasks`
                                            :
                                            `check your ${getLabel()} tasks`
                                        }
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>


                        {/* Collapsible Menu Tabs / Create Mode */}
                        <Box
                            sx={{
                                overflow: 'hidden',
                                maxHeight: menu ? 120 : 0, // adjust based on content height
                                opacity: menu ? 1 : 0,
                                transition: 'all 400ms ease',
                            }}
                        >
                            <Box sx={{display: 'flex', alignItems: 'center', pr: 4, pl: 4, gap: 1}}>

                                {mode === 'teacher' && (
                                    <>
                                        <Button
                                            onClick={() => {
                                                setMenu(!menu)

                                                if (createMode) {
                                                    if (confirm('Leave Task creation?')) {
                                                        setCreateMode(false);
                                                        fetchTasks();
                                                    }
                                                } else {
                                                    setCreateMode(true);
                                                }
                                            }}
                                        >
                                            {createMode ? <CancelOutlined/> : <AddCircleOutline/>}
                                        </Button>

                                        <Divider sx={{color: theme.palette.divider, mt: 1, mb: 1}}
                                                 orientation="vertical"
                                                 flexItem/>
                                    </>
                                )}
                                {createMode ? (
                                    <Tab disabled sx={{color: theme.palette.primary.main}}
                                         label="Create new task"/>
                                ) : (
                                    <Box overflow={'auto'} flexGrow={1}>

                                        <Tabs
                                            value={tabIndex}
                                            sx={{width: 420}}

                                            onChange={(_, val) => {
                                                setTabIndex(val);
                                                setExpanded('');
                                                setSubTab('description');
                                                setMenu(!menu)
                                            }}
                                        >
                                            <Tab label="Previous" disabled={createMode}/>
                                            <Tab label="Current" disabled={createMode}/>
                                            <Tab label="Upcoming" disabled={createMode}/>
                                            <Divider sx={{color: theme.palette.divider, mt: 1, mb: 1}}
                                                     orientation="vertical"
                                                     flexItem/>
                                            <Tab label="All tasks" disabled={createMode}/>


                                        </Tabs>
                                    </Box>
                                )}


                                {!createMode && menu && (
                                    <Select
                                        size="small"
                                        value={sortKey}
                                        sx={{width: 110, opacity: 1, transition: 'opacity 0.3s ease'}}
                                        onChange={(e) => {
                                            setExpanded('');
                                            setSortKey(e.target.value as any);
                                        }}
                                    >
                                        <MenuItem value="date">Date</MenuItem>
                                        <MenuItem value="difficulty">Difficulty</MenuItem>
                                        <MenuItem value="name">Name</MenuItem>
                                    </Select>
                                )}
                            </Box>
                        </Box>
                    </Box>


                    <Box sx={{overflow: 'auto', maxHeight: '100%', p: 4}}
                         onScroll={() => setMenu(false)}>
                        {createMode ? (
                            <TaskForm
                                mode="create"
                                fetchTasks={fetchTasks}
                                handleCloseDialog={handleCloseForm}
                                onSuccess={() => reloadTasks(1)}
                                onClose={() => {
                                    handleCloseForm()
                                }}
                            />
                        ) : (
                            <Stack spacing={2}>

                                {getTasksByTab().map((task) => (
                                    <TaskCard
                                        key={task.id + sortKey}
                                        ref={(el: HTMLDivElement) => (itemRefs.current[task.id + sortKey] = el)}

                                        task={task}
                                        mode={role}
                                        isExpanded={expanded === task.id}
                                        onToggleExpand={toggleExpand}
                                        subTab={subTab}
                                        setSubTab={setSubTab}
                                        onDownload={handleDownload}
                                        onGrading={handleEnterGrading}
                                        onDelete={handleDelete}
                                        onUpdated={() => reloadTasks(1)}
                                        fetchTasks={fetchTasks}
                                        tabIndex={tabIndex}
                                    />
                                ))}

                            </Stack>
                        )}
                    </Box>
                </Box>


            </>
        )
            ;
    }
;

export default UserPage;
