"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs/promises"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
// Promisify exec for cleaner async/await usage
const execPromise = (0, util_1.promisify)(child_process_1.exec);
// Enhanced command execution with proper error handling
function runCommand(command) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { stdout, stderr } = yield execPromise(command);
            return {
                stdout: stdout || '',
                stderr: stderr || ''
            };
        }
        catch (error) {
            const execError = error;
            return {
                stdout: execError.stdout || '',
                stderr: execError.stderr || execError.message || 'Command execution failed',
            };
        }
    });
}
function checkRepoExists(repoName) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://api.github.com/repos/${repoName}`;
        try {
            const response = yield fetch(url, {
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                    'User-Agent': 'mosip-activity-tracker'
                }
            });
            return response.ok;
        }
        catch (error) {
            console.error("Error checking repository existence:", error);
            return false;
        }
    });
}
function repoInConfig(repoName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield fs.readFile('config.properties', 'utf8');
            const repos = data.split('\n').map(line => line.split('=')[0].trim());
            return repos.includes(repoName);
        }
        catch (error) {
            console.error("Error reading config.properties:", error);
            return false;
        }
    });
}
function executePythonScript() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Executing Python script...');
        return yield runCommand('python github_activity.py');
    });
}
app.post('/api/addRepo', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const existsOnGitHub = yield checkRepoExists(repoName);
        if (!existsOnGitHub) {
            res.status(404).json({ error: `Repository ${repoName} not found on GitHub` });
            return;
        }
        const existsInConfig = yield repoInConfig(repoName);
        if (existsInConfig) {
            console.log(`${repoName} already exists in config.properties`);
            // Execute Python script to fetch new data
            const { stdout, stderr } = yield executePythonScript();
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
        yield fs.appendFile('config.properties', `\n${repoName}=${repoName}`);
        console.log(`Added ${repoName} to config.properties`);
        // Execute Python script
        const { stdout, stderr } = yield executePythonScript();
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
    }
    catch (error) {
        console.error('Error in addRepo operation:', error);
        res.status(500).json({
            error: error.message || 'An unexpected error occurred'
        });
    }
}));
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Get repositories from config
app.get('/api/repos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield fs.readFile('config.properties', 'utf8');
        const repos = data
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .map(line => {
            const [key, value] = line.split('=');
            return { name: key === null || key === void 0 ? void 0 : key.trim(), value: value === null || value === void 0 ? void 0 : value.trim() };
        })
            .filter(repo => repo.name && repo.value);
        res.json({ repos });
    }
    catch (error) {
        console.error('Error reading repositories:', error);
        res.status(500).json({ error: 'Failed to read repositories' });
    }
}));
// Remove repository endpoint
app.delete('/api/removeRepo/:repoName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repoName = req.params.repoName;
    if (!repoName) {
        res.status(400).json({ error: 'Repository name is required' });
        return;
    }
    try {
        const data = yield fs.readFile('config.properties', 'utf8');
        const lines = data.split('\n');
        const filteredLines = lines.filter(line => !line.trim().startsWith(`${repoName}=`));
        yield fs.writeFile('config.properties', filteredLines.join('\n'));
        res.json({ message: `Repository ${repoName} removed successfully` });
    }
    catch (error) {
        console.error('Error removing repository:', error);
        res.status(500).json({ error: 'Failed to remove repository' });
    }
}));
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});
// Start server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log(`Health check available at: http://localhost:${port}/api/health`);
});
exports.default = app;
