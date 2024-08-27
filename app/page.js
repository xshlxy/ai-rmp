'use client';
import {useState, useRef, useEffect} from 'react';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import {
    Box,
    TextField,
    IconButton,
    Typography,
    CssBaseline,
    Paper,
    AppBar,
    Toolbar,
    Button,
    Card,
    CardContent,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import LinkIcon from '@mui/icons-material/Link';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#f4f1de',
        },
        secondary: {
            main: '#e07a5f',
        },
        background: {
            default: '#3d405b',
            paper: '#3d405b',
            secondary: '#81b29a',
        },
    },
    typography: {
        fontFamily: '"Fira Code", monospace',
    },
});

export default function Home() {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Hi! I'm the Rate My Professor support assistant. How can I help you today?`,
        },
    ]);
    const [message, setMessage] = useState('');
    const [professorLink, setProfessorLink] = useState('');
    const messagesEndRef = useRef(null);
    const [professorData, setProfessorData] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    useEffect(scrollToBottom, [messages]);

    const sendMessage = async () => {
        if (!message.trim()) return;

        setMessage('');
        setMessages((messages) => [
            ...messages,
            {role: 'user', content: message},
            {role: 'assistant', content: ''},
        ]);

        const response = fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([...messages, {role: 'user', content: message}]),
        }).then(async (res) => {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let result = '';

            return reader.read().then(function processText({done, value}) {
                if (done) {
                    return result;
                }
                const text = decoder.decode(value || new Uint8Array(), {stream: true});
                setMessages((messages) => {
                    let lastMessage = messages[messages.length - 1];
                    let otherMessages = messages.slice(0, messages.length - 1);
                    return [
                        ...otherMessages,
                        {...lastMessage, content: lastMessage.content + text},
                    ];
                });
                return reader.read().then(processText);
            });
        });
    };

    const submitProfessorLink = async () => {
        if (!professorLink.trim()) return;

        try {
            const response = await fetch('/api/chat/scrape-and-insert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: professorLink }),
            });

            if (!response.ok) {
                throw new Error('Failed to scrape and insert data');
            }

            const data = await response.json();
            console.log("Received professor data:", data); // Add this line
            
            if (data.professorData) {
                console.log("Setting professor data:", data.professorData); // Add this line
                setProfessorData(data.professorData);
                setMessages(messages => [
                    ...messages,
                    { 
                        role: 'assistant', 
                        content: 'Here is a quick summary of the professor:',
                        professorData: data.professorData // Add this line
                    }
                ]);
            } else {
                throw new Error('No professor data returned');
            }
        } catch (error) {
            console.error('Error in submitProfessorLink:', error);
            setMessages(messages => [
                ...messages,
                { role: 'assistant', content: `An error occurred: ${error.message}. Please try again.` }
            ]);
        }

        setProfessorLink('');
    };

    useEffect(() => {
        console.log("Professor data updated:", professorData);
    }, [professorData]);

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline/>
            <Box sx={{display: 'flex', height: '100vh'}}>
                <AppBar position="fixed" sx={{zIndex: (theme) => theme.zIndex.drawer + 1}}>
                    <Toolbar>
                        <Typography variant="h6" noWrap component="div">
                            GEORGIA TECH UNIVERSITY | Choose A Professor Chat
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Box component="main" sx={{flexGrow: 1, p: 3}}>
                    <Toolbar/>
                    <Paper
                        elevation={4}
                        sx={{
                            mb: 2,
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: 'background.paper',
                            borderRadius: '12px',
                        }}
                    >
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Enter Rate My Professor URL..."
                            value={professorLink}
                            onChange={(e) => setProfessorLink(e.target.value)}
                            sx={{ mr: 1 }}
                        />
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={submitProfessorLink}
                            startIcon={<LinkIcon />}
                        >
                            Submit
                        </Button>
                    </Paper>
                    <Paper
                        elevation={4}
                        sx={{
                            height: 'calc(100vh - 140px)',
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'background.paper',
                            borderRadius: '12px',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                flexGrow: 1,
                                overflow: 'auto',
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {messages.map((message, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: message.role === 'assistant' ? 'flex-start' : 'flex-end',
                                        mb: 2,
                                    }}
                                >
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            bgcolor: message.role === 'assistant' ? 'background.default' : 'primary.main',
                                            color: message.role === 'assistant' ? 'text.primary' : 'background.default',
                                            borderRadius: '12px',
                                            p: 2,
                                            maxWidth: '70%',
                                        }}
                                    >
                                        <Typography variant="body1">
                                            {message.content}
                                        </Typography>
                                    </Paper>
                                    {message.professorData && (
                                        <Card sx={{ mt: 1, bgcolor: 'background.paper', width: '100%' }}>
                                            <CardContent>
                                                <Typography variant="h5" component="div">
                                                    {message.professorData.name}
                                                </Typography>
                                                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                                    {message.professorData.department}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Overall Rating: {message.professorData.overallRating}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Would Take Again: {message.professorData.wouldTakeAgainPercent}%
                                                </Typography>
                                                <Typography variant="body2">
                                                    Level of Difficulty: {message.professorData.levelOfDifficulty}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    )}
                                </Box>
                            ))}
                            <div ref={messagesEndRef}/>
                        </Box>
                        <Box
                            component="form"
                            sx={{
                                p: 2,
                                bgcolor: 'background.default',
                                display: 'flex',
                            }}
                            onSubmit={(e) => {
                                e.preventDefault();
                                sendMessage();
                            }}
                        >
                            <TextField
                                fullWidth
                                variant="outlined"
                                placeholder="Type your message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                sx={{
                                    mr: 1,
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.23)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'primary.main',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: 'primary.main',
                                        },
                                    },
                                }}
                            />
                            <IconButton
                                color="secondary"
                                onClick={sendMessage}
                                sx={{
                                    bgcolor: 'secondary.main',
                                    color: 'background.default',
                                    '&:hover': {
                                        bgcolor: 'secondary.dark',
                                    },
                                }}
                            >
                                <SendIcon/>
                            </IconButton>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </ThemeProvider>
    );
}