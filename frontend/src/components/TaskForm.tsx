// frontend/src/components/TaskForm.tsx
import React, {useState} from 'react';
import {
    Box,
    Button,
    MenuItem,
    MobileStepper,
    Stack,
    TextField,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CardActionArea,
    Card,
    Typography,
    Collapse,
} from '@mui/material';
import {DatePicker} from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import {Task} from '../types/Task';
import {v4 as uuidv4} from 'uuid';
import UploadFileButton from "./UploadFileButton";
import {
    ChangeCircle,
    CheckBox,
    CheckBoxOutlineBlank,
} from "@mui/icons-material";
import {useTheme} from "@mui/material/styles";
import {
    clearTmpAPI,
    createTaskAPI,
    updateTaskAPI,
    uploadSolutionSimulationAPI, uploadWorksheetAPI,
    uploadWorkSimulationAPI
} from "../api/axiosInstance";


interface TaskFormProps {
    mode: 'create' | 'edit';
    initialTask?: Task;
    onSuccess?: () => void;
    onError?: (msg: string) => void;
    onClose?: () => void;
    onUpdated?: (updatedTask: Task) => void;
}

const steps = ['General Info', 'Pseudocode & Simulation', 'Dates & Difficulty'];

const TaskForm: React.FC<TaskFormProps> = ({
                                               mode,
                                               initialTask,
                                               onSuccess,
                                               onError,
                                               onClose,
                                               onUpdated,
                                           }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [task, setTask] = useState<Task>(
        initialTask || {
            id: uuidv4(),
            title: '',
            description: '',
            difficulty: 'Easy',
            pseudocode: '',
            sampleSolution: '',
            dueDate: '',
            startDate: '',
            createdAt: new Date().toString(),
        }
    );

    // Browser-kompatible Funktion
    const getFileName = (filePath?: string | null): string | undefined => {
        if (!filePath) return undefined;
        return filePath.split('/').pop(); // nimmt alles nach dem letzten '/'
    };

    const theme = useTheme();

    const [originalTask] = useState<Task | undefined>(initialTask);

    const [workSimulationFile, setWorkSimulationFile] = useState<File | null>(null);
    const [workSimulationFileName, setWorkSimulationFileName] = useState(getFileName(task?.simWorkPath));
    const [changeWorkSim, setChangeWorkSim] = useState(false);

    const [solutionSimulationFile, setSolutionSimulationFile] = useState<File | null>(null);
    const [solutionSimulationFileName, setSolutionSimulationFileName] = useState(getFileName(task?.simSolutionPath));
    const [changeSolutionSim, setChangeSolutionSim] = useState(false);

    const [worksheetFile, setWorksheetFile] = useState<File | null>(null);
    const [worksheetFileName, setPdfFileName] = useState(getFileName(task?.worksheetPath));
    const [changeWorksheet, setChangeWorksheet] = useState(false);

    const [useGlobalSimulation, setUseGlobalSimulation] = useState(task.simWorkPath === "/assets/globalSim.zip");
    const [confirmOpen, setConfirmOpen] = useState(false);

    const isStepValid = (step: number): boolean => {
        switch (step) {
            case 0:
                return !!task.title && !!task.description && !!task.startDate && !!task.dueDate;
            case 1:
                return !!task.pseudocode && !!task.sampleSolution;
            case 2:
                if (mode === "create") {
                    if (useGlobalSimulation) {
                        return !!worksheetFile;
                    }
                    return !!workSimulationFile && !!solutionSimulationFile && !!worksheetFile;
                } else if (mode === "edit") {
                    if ((task.simWorkPath === "/assets/globalSim.zip" && task.simSolutionPath === "/assets/globalSim.zip") && (!useGlobalSimulation) && (!changeSolutionSim && !changeWorkSim)) {
                        return false;
                    }
                }
                return true;
            default:
                return true;
        }
    };

    const handleNext = async () => {
        if (activeStep === steps.length - 1) {
            setConfirmOpen(true);
        } else {
            if (isStepValid(activeStep)) {
                setActiveStep((prev) => prev + 1);
            } else {
                onError?.("Bitte alle Pflichtfelder ausfüllen.");
            }
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };


    const handleSave = async () => {
        if (!task.title || !task.description || !task.pseudocode || !task.startDate || !task.dueDate) {
            onError?.('Bitte alle Pflichtfelder ausfüllen.');
            return;
        }

        const formattedTask: Task = {
            ...task,
            sampleSolution: task.sampleSolution ?? '',
            startDate: dayjs(task.startDate).format('YYYY-MM-DD'),
            dueDate: dayjs(task.dueDate).format('YYYY-MM-DD'),
        };

        try {
            let taskId = task.id;

            if (mode === 'edit' && task.id) {
                try { await clearTmpAPI(task.id); }
                catch (err) { console.warn('⚠️ Failed to clear TMP folders', err); }

                await updateTaskAPI(task.id, formattedTask);
            } else {
                const res = await createTaskAPI(formattedTask);
                taskId = res.id;
            }

            const updatePaths: Partial<Task> = {};

            if (useGlobalSimulation) {
                updatePaths.simWorkPath = "/assets/globalSim.zip";
                updatePaths.simSolutionPath = "/assets/globalSim.zip";
            } else {
                if (workSimulationFile && taskId) {
                    await uploadWorkSimulationAPI(taskId, workSimulationFile);
                    updatePaths.simWorkPath = `/uploads/${taskId}/work/${workSimulationFile.name}`;
                }

                if (solutionSimulationFile && taskId) {
                    await uploadSolutionSimulationAPI(taskId, solutionSimulationFile);
                    updatePaths.simSolutionPath = `/uploads/${taskId}/solution/${solutionSimulationFile.name}`;
                }
            }

            if (worksheetFile && taskId) {
                await uploadWorksheetAPI(taskId, worksheetFile);
                updatePaths.worksheetPath = `/uploads/${taskId}/worksheet/${worksheetFile.name}`;
            }

            if (Object.keys(updatePaths).length > 0) {
                await updateTaskAPI(taskId, updatePaths);
                Object.assign(formattedTask, updatePaths);
            }

            setConfirmOpen(false);
            onSuccess?.();
            onUpdated?.(formattedTask);
            onClose?.();
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message || 'Fehler beim Speichern der Aufgabe.';
            onError?.(msg);
        }
    };


    const HighlightedField = ({
                                  label,
                                  changed,
                                  message,
                              }: {
        label: string;
        changed: boolean;
        message: string;
    }) => {


        const [open, setOpen] = useState(changed);


        return (
            <Card
                sx={{
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: theme.palette.mode === 'dark' ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.05)",
                    display: (
                        (useGlobalSimulation && (label === "Work Simulation" || label === "Solution Simulation")) ||
                        (!useGlobalSimulation && label === "Global Simulation")
                    ) ? 'none' : 'block',
                }}
            >

                <CardActionArea
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1,
                        borderBottom: open ? "1px solid" : undefined,
                        borderColor: open ? "divider" : undefined,
                        borderBottomLeftRadius: open ? 0 : undefined,
                        borderBottomRightRadius: open ? 0 : undefined,

                    }}
                    onClick={() => setOpen((prev) => !prev)}
                >
                    <Typography variant={"body2"}>{label}</Typography>
                    {changed && (
                        <ChangeCircle fontSize={"small"} sx={{color: theme.palette.warning.main}}/>
                    )}
                </CardActionArea>
                <Collapse in={open}>
                    <Box sx={{p: 1}}>
                        <Typography variant={"caption"}>{message}</Typography>
                    </Box>
                </Collapse>
            </Card>
        );
    };


    return (
        <div>
            {activeStep === 0 && (
                <Stack spacing={2}>
                    <TextField
                        label="Title"
                        fullWidth
                        value={task.title}
                        onChange={(e) => setTask({...task, title: e.target.value})}
                    />
                    <Box display="flex" gap={2}>
                        <DatePicker
                            label="Start Date"
                            format="DD.MM.YYYY"
                            value={task.startDate ? dayjs(task.startDate) : null}
                            onChange={(date) => setTask({...task, startDate: date})}
                            disablePast
                            disabled={dayjs(task.startDate).isBefore(dayjs()) && mode === 'edit'}
                        />
                        <DatePicker
                            label="Due Date"
                            format="DD.MM.YYYY"
                            value={task.dueDate ? dayjs(task.dueDate) : null}
                            onChange={(date) => setTask({...task, dueDate: date})}
                            disablePast
                        />
                        <TextField
                            label="Difficulty"
                            select
                            fullWidth
                            value={task.difficulty}
                            onChange={(e) =>
                                setTask({
                                    ...task,
                                    difficulty: e.target.value as Task['difficulty'],
                                })
                            }
                        >
                            <MenuItem value="Easy">Easy</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="Hard">Hard</MenuItem>
                        </TextField>
                    </Box>
                    <TextField
                        label="Description"
                        multiline
                        rows={3}
                        fullWidth
                        value={task.description}
                        onChange={(e) => setTask({...task, description: e.target.value})}
                    />
                </Stack>
            )}
            {activeStep === 1 && (
                <Stack spacing={2}>
                    <TextField
                        label="Pseudocode"
                        multiline
                        rows={4}
                        fullWidth
                        value={task.pseudocode}
                        onChange={(e) => setTask({...task, pseudocode: e.target.value})}
                    />
                    <TextField
                        label="Solution"
                        multiline
                        rows={10}
                        fullWidth
                        value={task.sampleSolution}
                        onChange={(e) => setTask({...task, sampleSolution: e.target.value})}
                    />
                </Stack>
            )}
            {activeStep === 2 && (
                <>
                    <Card
                        sx={{
                            display: "inline-flex",   // statt flex → passt sich dem Inhalt an
                            width: "fit-content",     // sorgt dafür, dass sie nur so breit wie der Inhalt ist
                        }}
                        elevation={0}
                    >
                        <CardActionArea
                            onClick={() => {
                                setUseGlobalSimulation(!useGlobalSimulation)
                            }}
                            sx={{
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "row",
                                p: 1
                            }}
                        >

                            {useGlobalSimulation ? <CheckBox sx={{
                                mr: 1
                            }}/> : <CheckBoxOutlineBlank sx={{
                                mr: 1
                            }}/>}
                            <Typography variant={"body2"}>
                                {useGlobalSimulation ? "using global simulation" : "use global simulation"}
                            </Typography>
                        </CardActionArea>
                    </Card>
                    <Stack spacing={2} direction={"row"}>


                        <UploadFileButton
                            variant={"work"}
                            onFileSelected={(file) => {
                                setWorkSimulationFile(file);
                                setWorkSimulationFileName(file.name);
                                setChangeWorkSim(true)
                            }}
                            fileName={workSimulationFileName}
                            disabled={useGlobalSimulation}
                        />
                        <UploadFileButton
                            variant={"solution"}
                            onFileSelected={(file) => {
                                setSolutionSimulationFile(file);
                                setSolutionSimulationFileName(file.name);
                                setChangeSolutionSim(true)

                            }}
                            fileName={solutionSimulationFileName || undefined}
                            disabled={useGlobalSimulation}
                        />

                    </Stack>
                    <UploadFileButton
                        variant={"worksheet"}
                        onFileSelected={(file) => {
                            setWorksheetFile(file);
                            setPdfFileName(file.name);
                            setChangeWorksheet(true)

                        }}
                        fileName={worksheetFileName || undefined}
                    />
                </>
            )}


            <Box p={2}>
                <MobileStepper
                    sx={{
                        backgroundColor: 'inherit',
                    }}
                    variant="dots"
                    steps={steps.length}
                    activeStep={activeStep}
                    position="static"
                    backButton={
                        <Button disabled={activeStep === 0} onClick={handleBack}>
                            Back
                        </Button>
                    }
                    nextButton={
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={!isStepValid(activeStep)}
                        >
                            {activeStep === steps.length - 1
                                ? mode === 'edit'
                                    ? 'Update'
                                    : 'Create'
                                : 'Next'}
                        </Button>
                    }
                />
            </Box>

            {/* Confirmation Modal */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Confirm Task</DialogTitle>
                <DialogContent dividers sx={{maxHeight: 350, overflowY: "auto"}}>
                    <Stack spacing={1}>
                        {[
                            {label: "Title", value: task.title, original: originalTask?.title},
                            {label: "Description", value: task.description, original: originalTask?.description},
                            {label: "Difficulty", value: task.difficulty, original: originalTask?.difficulty},
                            {label: "Start Date", value: task.startDate, original: originalTask?.startDate},
                            {label: "Due Date", value: task.dueDate, original: originalTask?.dueDate},
                            {label: "Pseudocode", value: task.pseudocode, original: originalTask?.pseudocode},
                            {label: "Solution", value: task.sampleSolution, original: originalTask?.sampleSolution},
                            {
                                label: "Global Simulation",
                                value: useGlobalSimulation,
                                original: (originalTask?.simWorkPath && originalTask.simSolutionPath) === '/assets/globalSim.zip'
                            },
                            {label: "Work Simulation", value: changeWorkSim, original: false},
                            {label: "Solution Simulation", value: changeSolutionSim, original: false},
                            {label: "Worksheet", value: changeWorksheet, original: false},
                        ]
                            .map((f) => {
                                let changed = false;
                                let valStr = f.value;
                                let origStr = f.original;

                                const isDateField = f.label === "Start Date" || f.label === "Due Date";
                                if (isDateField) {
                                    valStr = f.value ? dayjs(f.value).format("YYYY-MM-DD") : "";
                                    origStr = f.original ? dayjs(f.original).format("YYYY-MM-DD") : "";
                                }
                                let message = ''

                                if (useGlobalSimulation && f.label === "Global Simulation") {
                                    message = 'Using global Simulation.'
                                } else if (changeWorkSim && f.label === "Work Simulation") {
                                    message = 'Uploading: ' + workSimulationFileName
                                } else if (!changeWorkSim && f.label === "Work Simulation") {
                                    message = 'Keep using: ' + workSimulationFileName + " (not changed)"
                                } else if (changeSolutionSim && f.label === "Solution Simulation") {
                                    message = 'Uploading: ' + solutionSimulationFileName
                                } else if (!changeSolutionSim && f.label === "Solution Simulation") {
                                    message = 'Keep using: ' + solutionSimulationFileName + " (not changed)"
                                } else if (changeWorksheet && f.label === "Worksheet") {
                                    message = 'Uploading: ' + worksheetFileName
                                } else if (!changeWorksheet && f.label === "Worksheet") {
                                    message = 'Keep using: ' + worksheetFileName + " (not changed)"
                                } else {
                                    message = valStr.toString()

                                }

                                if (valStr !== origStr) {
                                    changed = true;
                                }

                                return {...f, changed, message};
                            })

                            // sortiere zuerst geänderte
                            .sort((a, b) => (a.changed === b.changed ? 0 : a.changed ? -1 : 1))
                            .map((f) => (
                                <HighlightedField
                                    key={f.label}
                                    label={f.label}
                                    value={f.value}
                                    original={f.original}
                                    message={f.message}
                                    changed={f.changed}
                                />
                            ))}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Back to Edit</Button>
                    <Button variant="contained" onClick={handleSave} disabled={!isStepValid(activeStep)}>
                        Confirm & Save
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default TaskForm;
