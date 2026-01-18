'use client'

import {useEffect} from 'react'
import {Box, Button, Typography, Container} from '@mui/material'
import {ErrorOutline} from '@mui/icons-material'

export default function Error({
                                  error,
                                  reset,
                              }: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application error:', error)
    }, [error])

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    textAlign: 'center',
                    gap: 3,
                }}
            >
                <ErrorOutline sx={{fontSize: 80, color: 'error.main'}}/>

                <Typography variant="h4" fontWeight={600}>
                    Something went wrong
                </Typography>

                <Typography variant="body1" color="text.secondary" maxWidth="400px">
                    {error.message || 'An unexpected error occurred. Please try again.'}
                </Typography>

                {error.digest && (
                    <Typography variant="caption" color="text.secondary">
                        Error ID: {error.digest}
                    </Typography>
                )}

                <Box sx={{display: 'flex', gap: 2}}>
                    <Button
                        variant="contained"
                        onClick={reset}
                        size="large"
                    >
                        Try again
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => window.location.href = '/'}
                        size="large"
                    >
                        Go home
                    </Button>
                </Box>
            </Box>
        </Container>
    )
}