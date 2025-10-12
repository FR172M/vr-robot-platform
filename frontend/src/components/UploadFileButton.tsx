// frontend/src/components/UploadFileButton.tsx
import React, { useRef } from 'react';
import { Button, Box, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

type Variant = 'work' | 'solution' | 'worksheet';

interface Props {
    variant: Variant;
    onFileSelected: (file: File, variant: Variant) => void;
    fileName?: string;
    disabled: boolean;
}

const UploadFileButton: React.FC<Props> = ({ variant, onFileSelected, fileName = "Upload new file...", disabled }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelected(file, variant);
        }
    };

    // akzeptierte Dateiendungen je nach Variant
    const acceptedTypes =
        variant === 'worksheet' ? 'application/pdf' : '.zip';

    const label =
        variant === 'work'
            ? 'Upload Work Simulation'
            : variant === 'solution'
                ? 'Upload Solution Simulation'
                : 'Upload Worksheet';

    return (
        <Box flexDirection={"column"}>
            <input
                type="file"
                accept={acceptedTypes}
                onChange={handleFileChange}
                ref={inputRef}
                style={{ display: 'none' }}
            />
            <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={handleClick}
                disabled={disabled}
                sx={{
                    mt:2,
                    mb:0.5
                }}
            >
                {label}
            </Button>
            {fileName && (
                <Typography variant="body2"  color={disabled? "divider": "text.secondary" }>
                    {fileName}
                </Typography>
            )}
        </Box>
    );
};

export default UploadFileButton;
