import {
    Box,
    Card,
    CardContent,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemText,
    Grow,
    TextField,
    Typography,
    Button,
    Tooltip, CardActionArea, Stack,
} from '@mui/material';
import {KeyboardArrowDown, MoreHoriz} from '@mui/icons-material';
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {Task} from '../types/Task';
import {getTaskById} from '../services/taskService';

const SimulationPage = () => {
    const {taskId} = useParams<{ taskId: string }>();
    const [task, setTask] = useState<Task | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [selectedItem, setSelectedItem] = useState('Description');
    const [userSolution, setUserSolution] = useState('');

    useEffect(() => {
        const fetchTask = async () => {
            if (taskId) {
                try {
                    const data = await getTaskById(taskId);
                    setTask(data);
                } catch (err) {
                    console.error('Failed to fetch task', err);
                }
            }
        };
        fetchTask();
    }, [taskId]);

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
            <iframe
                src={`http://localhost:3000/${task.id}/view-simulation`}
                title="Simulation"
                width="100%"
                height="100%"
                style={{border: 'none'}}
            />

            <Grow in={true} timeout={600}>
                <Card
                    sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        width: expanded ? '90vw' : 200,
                        maxWidth: 900,
                        height: expanded ? 300 : 'auto',
                        borderRadius: 2,
                        boxShadow: 6,
                        display: 'flex',
                        flexDirection: expanded ? 'column' : 'row',
                        cursor: expanded ? 'default' : 'pointer',
                        transition:
                            'width 600ms ease-in-out, height 600ms ease-in-out, flex-direction 600ms ease-in-out',
                        overflow: 'hidden',
                        zIndex: 10,
                    }}
                    onClick={() => {
                        if (!expanded) setExpanded(true);
                    }}
                >
                    {expanded ? (
                        <>
                            {/* Titelbereich über gesamte Breite */}
                            <CardActionArea onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(false);
                            }}
                                            sx={{boxShadow: 1, borderRadius: 0}}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        p: 2,
                                    }}
                                >
                                        <Typography variant="subtitle1" fontWeight="bold">
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
                                        py: 1,
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
                                        pt: 1,
                                        pr: 2,
                                    }}
                                >
                                    <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        mb={1}
                                    >
                                        <Typography variant="subtitle2" fontWeight="bold" noWrap>
                                            {selectedItem}
                                        </Typography>
                                    </Box>

                                    <Box flexGrow={1} overflow="auto">
                                        {selectedItem === 'Description' && (
                                            <Typography variant="body2">{task.description}</Typography>
                                        )}

                                        {selectedItem === 'Pseudocode' && (
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    backgroundColor: '#f5f5f5',
                                                    borderRadius: 1,
                                                    p: 2,
                                                    fontFamily: 'monospace',
                                                    whiteSpace: 'pre-wrap',
                                                    overflowX: 'auto',
                                                    maxHeight: 140,
                                                    overflowY: 'auto',
                                                }}
                                            >
                                                {task.pseudocode || '(No pseudocode provided)'}
                                            </Typography>
                                        )}

                                        {selectedItem === 'Your Solution' && (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    height: '100%',
                                                    gap: 1,
                                                }}
                                            >
                                                <TextField
                                                    multiline
                                                    fullWidth
                                                    maxRows={4}
                                                    minRows={4}
                                                    value={userSolution}
                                                    onChange={(e) => setUserSolution(e.target.value)}
                                                    placeholder="Write your pseudocode here..."
                                                    sx={{flexGrow: 1}}
                                                />
                                                <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                                                    <Button variant="contained">Submit</Button>
                                                </Box>
                                            </Box>
                                        )}

                                        {selectedItem === 'Stats' && (
                                            <Box>
                                                <Typography variant="body2">
                                                    Start: {new Date(task.start_date).toLocaleDateString()}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                                </Typography>
                                                <Typography variant="body2">Task ID: {task.id}</Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>
                            </Box>
                        </>
                    ) : (
                        // Kompakte Card
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            px={2}
                            py={1.5}
                            width="100%"
                            gap={2}
                        >
                            <Box sx={{minWidth: 0, flexGrow: 1}}>
                                <Tooltip title={task.title} arrow>
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
                                </Tooltip>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    noWrap
                                >
                                    {new Date(task.start_date).toLocaleDateString()} –{' '}
                                    {new Date(task.due_date).toLocaleDateString()}
                                </Typography>
                            </Box>
                            <MoreHoriz fontSize="small"/>
                        </Box>
                    )}
                </Card>
            </Grow>
        </Box>
    );
};

export default SimulationPage;
