/**
 * CyberXperience 2026 - Terminal Gateway
 * Bridges web terminal to Docker containers
 */

const express = require('express');
const http = require('http');
const fs = require('fs');
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

// Load flags from configuration file
let FLAGS = [];
try {
  const flagsPath = process.env.FLAGS_PATH || '/app/flags.json';
  const flagsData = JSON.parse(fs.readFileSync(flagsPath, 'utf8'));
  FLAGS = flagsData.flags || [];
  console.log(`Loaded ${FLAGS.length} flags from configuration`);
} catch (err) {
  console.error('Failed to load flags.json:', err.message);
  // Fallback - no flags will be validated
}

// JWT utilities (matching frontend implementation)
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return { header, payload };
  } catch (e) {
    return null;
  }
}

function createJWT(payload) {
  const header = { alg: 'none', typ: 'JWT' };
  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  return `${headerEncoded}.${payloadEncoded}.`;
}

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'gateway' });
});

// Session initialization endpoint - creates initial JWT on server
app.post('/api/session/init', (req, res) => {
  const { existingToken } = req.body;

  // If there's an existing valid token, return it with parsed data
  if (existingToken) {
    const decoded = decodeJWT(existingToken);
    if (decoded && decoded.payload) {
      return res.json({
        token: existingToken,
        payload: decoded.payload
      });
    }
  }

  // Create new session
  const payload = {
    flags_solved: 0,
    solved_stages: [],
    found_creds: null,
    iat: Math.floor(Date.now() / 1000),
    sub: 'ctf_user',
    // Baby Shell tutorial fields
    experience_level: 'unknown',  // 'unknown' | 'beginner' | 'experienced'
    baby_shell_step: 0,           // Current completed step (0-10)
    baby_shell_completed: false
  };

  const token = createJWT(payload);

  return res.json({
    token: token,
    payload: payload
  });
});

// Store credentials endpoint - saves found credentials to JWT
app.post('/api/session/store-creds', (req, res) => {
  const { sessionToken, username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Missing credentials' });
  }

  // Decode existing session token or create new one
  let currentPayload = {
    flags_solved: 0,
    solved_stages: [],
    found_creds: null,
    sub: 'ctf_user'
  };

  if (sessionToken) {
    const decoded = decodeJWT(sessionToken);
    if (decoded && decoded.payload) {
      currentPayload = decoded.payload;
    }
  }

  // Check if credentials are already stored
  if (currentPayload.found_creds) {
    return res.json({
      success: true,
      alreadyStored: true,
      newToken: sessionToken
    });
  }

  // Store the credentials
  currentPayload.found_creds = { username, password };
  currentPayload.iat = Math.floor(Date.now() / 1000);

  const newToken = createJWT(currentPayload);

  return res.json({
    success: true,
    alreadyStored: false,
    newToken: newToken
  });
});

// Set experience level endpoint - saves beginner/experienced choice
app.post('/api/session/set-experience', (req, res) => {
  const { sessionToken, experienceLevel } = req.body;

  if (!experienceLevel || !['beginner', 'experienced'].includes(experienceLevel)) {
    return res.status(400).json({ success: false, error: 'Invalid experience level' });
  }

  // Decode existing session token or create new one
  let currentPayload = {
    flags_solved: 0,
    solved_stages: [],
    found_creds: null,
    sub: 'ctf_user',
    experience_level: 'unknown',
    baby_shell_step: 0,
    baby_shell_completed: false
  };

  if (sessionToken) {
    const decoded = decodeJWT(sessionToken);
    if (decoded && decoded.payload) {
      currentPayload = decoded.payload;
    }
  }

  // Update experience level
  currentPayload.experience_level = experienceLevel;
  currentPayload.iat = Math.floor(Date.now() / 1000);

  const newToken = createJWT(currentPayload);

  return res.json({
    success: true,
    newToken: newToken
  });
});

// Baby Shell step validation endpoint
app.post('/api/baby-shell/validate-step', (req, res) => {
  const { sessionToken, stepNumber } = req.body;

  if (typeof stepNumber !== 'number' || stepNumber < 1 || stepNumber > 10) {
    return res.status(400).json({ success: false, error: 'Invalid step number' });
  }

  // Decode existing session token
  let currentPayload = {
    flags_solved: 0,
    solved_stages: [],
    found_creds: null,
    sub: 'ctf_user',
    experience_level: 'unknown',
    baby_shell_step: 0,
    baby_shell_completed: false
  };

  if (sessionToken) {
    const decoded = decodeJWT(sessionToken);
    if (decoded && decoded.payload) {
      currentPayload = decoded.payload;
    }
  }

  // Only accept next step (no skipping)
  const expectedStep = (currentPayload.baby_shell_step || 0) + 1;
  if (stepNumber !== expectedStep) {
    return res.json({
      success: false,
      error: stepNumber < expectedStep ? 'Step already completed' : 'Complete previous steps first',
      currentStep: currentPayload.baby_shell_step
    });
  }

  // Update step progress
  currentPayload.baby_shell_step = stepNumber;
  currentPayload.baby_shell_completed = stepNumber === 10;
  currentPayload.iat = Math.floor(Date.now() / 1000);

  const newToken = createJWT(currentPayload);

  return res.json({
    success: true,
    newToken: newToken,
    stepCompleted: stepNumber,
    isComplete: stepNumber === 10
  });
});

// Flag validation endpoint
app.post('/api/validate-flag', (req, res) => {
  const { potentialFlag, sessionToken } = req.body;

  if (!potentialFlag) {
    return res.status(400).json({ valid: false, error: 'Missing potentialFlag' });
  }

  // Check if the potential flag matches any known flag
  const matchedFlag = FLAGS.find(f => f.value === potentialFlag);

  if (!matchedFlag) {
    return res.json({ valid: false });
  }

  // Decode existing session token or create new one
  let currentPayload = { flags_solved: 0, solved_stages: [], sub: 'ctf_user' };
  if (sessionToken) {
    const decoded = decodeJWT(sessionToken);
    if (decoded && decoded.payload) {
      currentPayload = decoded.payload;
    }
  }

  // Ensure solved_stages is an array
  if (!Array.isArray(currentPayload.solved_stages)) {
    currentPayload.solved_stages = [];
  }

  // Check if this stage was already solved
  if (currentPayload.solved_stages.includes(matchedFlag.id)) {
    // Already solved - return success but don't increment
    return res.json({
      valid: true,
      stageId: matchedFlag.id,
      stageName: matchedFlag.name,
      alreadySolved: true,
      newToken: sessionToken,
      flagsCount: currentPayload.flags_solved
    });
  }

  // Add the solved stage and increment count
  currentPayload.solved_stages.push(matchedFlag.id);
  currentPayload.flags_solved = currentPayload.solved_stages.length;
  currentPayload.iat = Math.floor(Date.now() / 1000);

  const newToken = createJWT(currentPayload);

  return res.json({
    valid: true,
    stageId: matchedFlag.id,
    stageName: matchedFlag.name,
    alreadySolved: false,
    newToken: newToken,
    flagsCount: currentPayload.flags_solved
  });
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
          Cmd: ['su', '-', 'ctf_user', '-c', 'python3 -u /home/ctf_user/restricted_shell.py'],
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          Tty: true,
          Env: ['TERM=xterm-256color', 'PYTHONUNBUFFERED=1']
        });

        // Start the exec instance
        stream = await exec.start({
          hijack: true,
          stdin: true,
          Tty: true
        });

        // Buffer to collect initial output (like banner)
        let outputBuffer = '';
        let shellReady = false;

        // IMMEDIATELY attach output handler to catch banner
        stream.on('data', (chunk) => {
          const data = chunk.toString();
          if (!shellReady) {
            outputBuffer += data;
          } else {
            socket.emit('output', data);
          }
        });

        stream.on('end', () => {
          socket.emit('shell_closed', { message: 'Shell session ended' });
        });

        // Store session
        activeSessions.set(socket.id, { exec, stream, container });

        // Delay to capture banner, then emit shell_ready with buffered output
        setTimeout(() => {
          shellReady = true;
          socket.emit('shell_ready', {
            message: 'Shell connected',
            initialOutput: outputBuffer
          });
        }, 50);

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
