// frontend/src/components/UploadSimulationButton.tsx
import React, { useRef } from 'react';
import { Button, Box, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface Props {
    onFileSelected: (file: File) => void;
    fileName?: string;
}

const UploadSimulationButton: React.FC<Props> = ({ onFileSelected, fileName }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelected(file);
        }
    };

    return (
        <Box display="flex" alignItems="center" gap={2}>
            <input
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                ref={inputRef}
                style={{ display: 'none' }}
            />
            <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={handleClick}
            >
                Upload Simulation
            </Button>
            {fileName && (
                <Typography variant="body2" color="text.secondary">
                    {fileName}
                </Typography>
            )}
        </Box>
    );
};

export default UploadSimulationButton;
