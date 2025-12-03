import React, {ReactNode, useState, useRef, useEffect, RefObject} from "react";
import {Box, CircularProgress, LinearProgress, Typography} from "@mui/material";
import {useTheme} from "@mui/material/styles";
import {deleteUserAPI, fetchAllUsersAPI} from "../api/axiosInstance";
import {DeleteForeverOutlined} from "@mui/icons-material";

export interface UserListProps {
    open: boolean;
    role: string | null;
    onClose?: () => void; // optionales Callback

}

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
}


const UserList: React.FC<UserListProps> = ({
                                               open,
                                               role,
                                               onClose,

                                           }) => {
    const theme = useTheme();

    const [users, setUsers] = useState<User[]>([]);

    const [opened, setOpened] = useState(open);

// Synchronisiert sich immer mit dem Parent, wenn sich open ändert
    useEffect(() => {
        setOpened(open);
    }, [open]);

// Funktion zum Schließen aus dem Component selbst
    const close = () => {
        setOpened(false);
        onClose?.();       // Parent informieren
    };

    const fetchUsers = async () => {
        try {
            const userList = await fetchAllUsersAPI()
            setUsers(userList)
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.error || 'wtf');
        }
    }

    // Sortierte Liste vorbereiten
    const sortedUsers = [...users]
        .sort((a, b) => {
            // Erst Role: Student < Teacher
            if (a.role === b.role) {
                // Gleiche Rolle: alphabetisch nach username
                return a.username.localeCompare(b.username);
            }
            return a.role === 'student' ? -1 : 1; // student zuerst
        });


    const [deletingUsers, setDeletingUsers] = useState<{ [id: string]: boolean }>({});
    const securityDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleDeleteUser = async (uid: string) => {
        if (!confirm("delete this user forever?")) return;
        setDeletingUsers(prev => ({...prev, [uid]: true}));

        try {

            await securityDelay(2000);
            await deleteUserAPI(uid);
            await fetchUsers();
        } finally {
            setDeletingUsers(prev => ({...prev, [uid]: false}));
        }
    };


    useEffect(() => {
        fetchUsers();
    }, []);


    return (
        <Box
            sx={{
                position: 'absolute',
                display: role === 'teacher' ? 'flex' : 'none',
                width: opened ? '100vw' : 0,
                height: opened ? '100vh' : 0,
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: opened ? `${theme.palette.background.paper}99` : 'transparent',
                opacity: opened ? 1 : 0,

                zIndex: 999,
                cursor: 'crosshair',

                transition: 'all 800ms ease'
            }}
            onClick={close}
        >

            <Box
                sx={{
                    position: 'absolute',
                    bottom: '50%',
                    left: '50%',
                    transform: 'translateX(-50%) translateY(50%)',
                    width: '75vw',
                    maxWidth: 'sm',
                    backgroundColor: theme.palette.background.default,
                    outline: `1px solid ${theme.palette.primary.main}`,
                    borderRadius: 5,
                    zIndex: 10000,
                    height: opened ? '75vh' : 0,
                    p: opened ? 2 : 0,
                    overflow: 'auto',
                    cursor: 'default',

                    transition: 'all 600ms ease'
                }}
                onClick={(e) => e.stopPropagation()} // Klick innerhalb der Box stoppt das Schließen

            >


                {sortedUsers.map((u: any, index: number) => {
                    const isDeleting = deletingUsers[u.id];
                    const isLast = index === sortedUsers.length - 1;

                    return (
                        <Box
                            key={u.id}
                            sx={{
                                display: 'flex',
                                flexDirection: isDeleting? 'column':'row',
                                flexGrow: 1,
                                p:isDeleting? 1:0,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderBottom: isLast ? undefined : `1px solid ${theme.palette.divider}`,
                            }}
                        >
                            {isDeleting ? (
                                <>
                                    <Typography variant="subtitle1" color="primary" fontWeight="bolder">
                                        deleting {u.username}...
                                    </Typography>
                                <LinearProgress sx={{height: 5, width: '80%', borderRadius: 5}} color="primary"/>
                                </>
                            ) : (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        flexGrow: 1,
                                        gap: 2,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            flexGrow: 1,
                                            p: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                gap: 1,
                                                alignItems: 'center',
                                                color: theme.palette.primary.main,
                                            }}
                                        >
                                            <Typography variant="subtitle1" color="primary" fontWeight="bolder">
                                                {u.username}
                                            </Typography>

                                            <Typography variant="subtitle2" color="textDisabled">
                                                ({u.role})
                                            </Typography>
                                        </Box>

                                        <Typography variant="caption" color="textSecondary" flexWrap="wrap">
                                            {u.email}
                                        </Typography>
                                    </Box>

                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mr: 2,
                                            cursor: 'pointer',
                                            height: 30,
                                            width: 30,
                                        }}
                                        onClick={() => handleDeleteUser(u.id)}
                                    >
                                        <DeleteForeverOutlined color="primary"/>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    );
                })}

            </Box>
        </Box>
    )
}
export default UserList;
