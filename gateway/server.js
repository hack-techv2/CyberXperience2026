/**
 * CyberXperience 2026 - Terminal Gateway
 * Bridges web terminal to Docker containers
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Docker = require('dockerode');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Valid credentials for shell access
const VALID_CREDENTIALS = {
  username: 'ctf_user',
  password: 'r3str1ct3d_2026'
};

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'gateway' });
});

// Store active sessions
const activeSessions = new Map();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  let authenticated = false;
  let exec = null;
  let stream = null;

  // Handle authentication
  socket.on('authenticate', async (credentials) => {
    const { username, password } = credentials;

    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      authenticated = true;
      socket.emit('auth_success', { message: 'Authentication successful. Connecting to shell...' });

      try {
        // Get the shell-backend container
        const containers = await docker.listContainers({
          filters: { name: ['shell-backend'] }
        });

        if (containers.length === 0) {
          socket.emit('error', { message: 'Shell backend service not available' });
          return;
        }

        const container = docker.getContainer(containers[0].Id);

        // Create exec instance for the restricted shell
        exec = await container.exec({
          Cmd: ['su', '-', 'ctf_user', '-c', 'python3 /home/ctf_user/restricted_shell.py'],
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          Tty: true
        });

        // Start the exec instance
        stream = await exec.start({
          hijack: true,
          stdin: true,
          Tty: true
        });

        // Store session
        activeSessions.set(socket.id, { exec, stream, container });

        // Handle output from container
        stream.on('data', (chunk) => {
          socket.emit('output', chunk.toString());
        });

        stream.on('end', () => {
          socket.emit('shell_closed', { message: 'Shell session ended' });
        });

        socket.emit('shell_ready', { message: 'Shell connected' });

      } catch (err) {
        console.error('Error connecting to shell:', err);
        socket.emit('error', { message: 'Failed to connect to shell backend' });
      }
    } else {
      socket.emit('auth_failed', { message: 'Invalid credentials' });
    }
  });

  // Handle terminal input
  socket.on('input', (data) => {
    if (!authenticated) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const session = activeSessions.get(socket.id);
    if (session && session.stream) {
      session.stream.write(data);
    }
  });

  // Handle terminal resize
  socket.on('resize', async (size) => {
    const session = activeSessions.get(socket.id);
    if (session && session.exec) {
      try {
        await session.exec.resize({ h: size.rows, w: size.cols });
      } catch (err) {
        console.error('Error resizing terminal:', err);
      }
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    const session = activeSessions.get(socket.id);
    if (session) {
      if (session.stream) {
        session.stream.end();
      }
      activeSessions.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Gateway server running on port ${PORT}`);
});
