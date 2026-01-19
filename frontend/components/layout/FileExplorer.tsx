'use client'

import {useState, useEffect, JSX} from 'react'
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    Collapse,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from '@mui/material'
import {
    Folder,
    FolderOpen,
    InsertDriveFile,
    Refresh,
    ExpandMore,
    ChevronRight,
    Code,
    Description,
    Image,
    PictureAsPdf,
} from '@mui/icons-material'
import {apiClient} from '@/lib_fe/api'
import {FileTreeNode} from '@/lib_fe/types'
import FileViewer from './FileViewer'

export default function FileExplorer() {
    const [tree, setTree] = useState<FileTreeNode | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set([]))
    const [selectedFile, setSelectedFile] = useState<string | null>(null)

    const loadFileTree = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await apiClient.getFileTree({
                max_depth: 10,
                include_files: true,
            })
            setTree(response.tree)
            // Auto-expand root
            setExpandedPaths(new Set([response.tree.path]))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load file tree')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFileTree()
    }, [])

    const handleToggleExpand = (path: string) => {
        setExpandedPaths(prev => {
            const newSet = new Set(prev)
            if (newSet.has(path)) {
                newSet.delete(path)
            } else {
                newSet.add(path)
            }
            return newSet
        })
    }

    const handleFileClick = (path: string) => {
        setSelectedFile(path)
    }

    const getFileIcon = (node: FileTreeNode) => {
        if (node.type === 'directory') {
            return expandedPaths.has(node.path) ? <FolderOpen/> : <Folder/>
        }

        const ext = node.name.split('.').pop()?.toLowerCase()
        switch (ext) {
            case 'ts':
            case 'tsx':
            case 'js':
            case 'jsx':
            case 'py':
            case 'java':
            case 'cpp':
            case 'c':
            case 'rs':
            case 'go':
                return <Code/>
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'svg':
            case 'webp':
                return <Image/>
            case 'pdf':
                return <PictureAsPdf/>
            default:
                return <InsertDriveFile/>
        }
    }

    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return ''
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const renderTreeNode = (node: FileTreeNode, depth: number = 0): JSX.Element => {
        const isExpanded = expandedPaths.has(node.path)
        const hasChildren = node.children && node.children.length > 0
        const isSelected = selectedFile === node.path

        return (
            <Box key={node.path}>
                <ListItem
                    disablePadding
                    sx={{
                        pl: depth * 2,
                    }}
                >
                    <ListItemButton
                        onClick={() => {
                            if (node.type === 'directory') {
                                handleToggleExpand(node.path)
                            } else {
                                handleFileClick(node.path)
                            }
                        }}
                        selected={isSelected}
                        sx={{
                            py: 0.5,
                            minHeight: 36,
                            '&.Mui-selected': {
                                backgroundColor: 'action.selected',
                                '&:hover': {
                                    backgroundColor: 'action.selected',
                                },
                            },
                        }}
                    >
                        {node.type === 'directory' && (
                            <ListItemIcon sx={{minWidth: 28}}>
                                {hasChildren ? (
                                    isExpanded ?
                                        <ExpandMore fontSize="small"/> :
                                        <ChevronRight fontSize="small"/>
                                ) : null}
                            </ListItemIcon>
                        )}
                        <ListItemIcon sx={{minWidth: 36}}>
                            {getFileIcon(node)}
                        </ListItemIcon>
                        <ListItemText
                            primary={node.name}
                            secondary={node.type === 'file' ? formatFileSize(node.size) : null}
                            primaryTypographyProps={{
                                variant: 'body2',
                                noWrap: true,
                            }}
                            secondaryTypographyProps={{
                                variant: 'caption',
                            }}
                        />
                    </ListItemButton>
                </ListItem>

                {node.type === 'directory' && hasChildren && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {node.children!.map((child: any) => renderTreeNode(child, depth + 1))}
                        </List>
                    </Collapse>
                )}
            </Box>
        )
    }

    if (selectedFile) {
        return <FileViewer filePath={selectedFile}
                           onClose={() => setSelectedFile(null)}/>
    }

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Toolbar */}
            <Box
                sx={{
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Typography variant="subtitle2" fontWeight={600}>
                    File Explorer
                </Typography>
                <Tooltip title="Refresh">
                    <IconButton size="small" onClick={loadFileTree}
                                disabled={loading}>
                        <Refresh fontSize="small"/>
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Content */}
            <Box sx={{flex: 1, overflow: 'auto'}}>
                {loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '200px',
                        }}
                    >
                        <CircularProgress size={32}/>
                    </Box>
                ) : error ? (
                    <Box sx={{p: 2}}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                ) : tree ? (
                    <List dense disablePadding>
                        {renderTreeNode(tree)}
                    </List>
                ) : (
                    <Box sx={{p: 2}}>
                        <Typography variant="body2" color="text.secondary">
                            No files found
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    )
}