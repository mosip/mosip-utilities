import { Request, Response } from 'express';
import { exec, ExecException } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import express from 'express';
import cors from 'cors';

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Promisify exec for cleaner async/await usage
const execPromise = promisify(exec);

// Interface for command execution results
interface CommandResult {
  stdout: string;
  stderr: string;
}

// Enhanced command execution with proper error handling
async function runCommand(command: string): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execPromise(command);
    return { 
      stdout: stdout || '', 
      stderr: stderr || '' 
    };
  } catch (error) {
    const execError = error as ExecException;
    return {
      stdout: execError.stdout || '',
      stderr: execError.stderr || execError.message || 'Command execution failed',
    };
  }
}

async function checkRepoExists(repoName: string): Promise<boolean> {
  const url = `https://api.github.com/repos/${repoName}`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'mosip-activity-tracker'
      }
    });
    return response.ok;
  } catch (error) {
    console.error("Error checking repository existence:", error);
    return false;
  }
}

async function repoInConfig(repoName: string): Promise<boolean> {
  try {
    const data = await fs.readFile('config.properties', 'utf8');
    const repos = data.split('\n').map(line => line.split('=')[0].trim());
    return repos.includes(repoName);
  } catch (error) {
    console.error("Error reading config.properties:", error);
    return false;
  }
}

async function executePythonScript(): Promise<CommandResult> {
  console.log('Executing Python script...');
  return await runCommand('python github_activity.py');
}

app.post('/api/addRepo', async (req: Request, res: Response): Promise<void> => {
  const repoName = req.body.repoName;

  if (!repoName) {
    res.status(400).json({ error: 'Repository name is required' });
    return;
  }

  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repoName)) {
    res.status(400).json({ error: 'Invalid repository name format. Use owner/repo.' });
    return;
  }

  try {
    const existsOnGitHub = await checkRepoExists(repoName);
    if (!existsOnGitHub) {
      res.status(404).json({ error: `Repository ${repoName} not found on GitHub` });
      return;
    }

    const existsInConfig = await repoInConfig(repoName);
    
    if (existsInConfig) {
      console.log(`${repoName} already exists in config.properties`);
      // Execute Python script to fetch new data
      const { stdout, stderr } = await executePythonScript();

      if (stderr && stderr.trim() !== '') {
        console.error('Python script stderr:', stderr);
        res.status(500).json({ error: `Python script failed: ${stderr}` });
        return;
      }

      console.log('Python script stdout:', stdout);
      res.json({ 
        message: 'Repository already exists, fetching new data', 
        output: stdout.trim() 
      });
      return;
    }

    // Add repository to config.properties file
    await fs.appendFile('config.properties', `\n${repoName}=${repoName}`);
    console.log(`Added ${repoName} to config.properties`);

    // Execute Python script
    const { stdout, stderr } = await executePythonScript();

    // Handle Python script output
    if (stderr && stderr.trim() !== '') {
      console.error('Python script stderr:', stderr);
      res.status(500).json({ error: `Python script failed: ${stderr}` });
      return;
    }

    console.log('Python script stdout:', stdout);
    res.json({ 
      message: 'Repository added successfully', 
      output: stdout.trim() 
    });

  } catch (error: any) {
    console.error('Error in addRepo operation:', error);
    res.status(500).json({ 
      error: error.message || 'An unexpected error occurred' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get repositories from config
app.get('/api/repos', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fs.readFile('config.properties', 'utf8');
    const repos = data
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const [key, value] = line.split('=');
        return { name: key?.trim(), value: value?.trim() };
      })
      .filter(repo => repo.name && repo.value);
    
    res.json({ repos });
  } catch (error: any) {
    console.error('Error reading repositories:', error);
    res.status(500).json({ error: 'Failed to read repositories' });
  }
});

// Remove repository endpoint
app.delete('/api/removeRepo/:repoName', async (req: Request, res: Response): Promise<void> => {
  const repoName = req.params.repoName;

  if (!repoName) {
    res.status(400).json({ error: 'Repository name is required' });
    return;
  }

  try {
    const data = await fs.readFile('config.properties', 'utf8');
    const lines = data.split('\n');
    const filteredLines = lines.filter(line => 
      !line.trim().startsWith(`${repoName}=`)
    );

    await fs.writeFile('config.properties', filteredLines.join('\n'));
    
    res.json({ message: `Repository ${repoName} removed successfully` });
  } catch (error: any) {
    console.error('Error removing repository:', error);
    res.status(500).json({ error: 'Failed to remove repository' });
  }
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: Function) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/api/health`);
});

export default app;