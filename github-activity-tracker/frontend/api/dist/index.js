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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.json());
// ✅ Improved CORS handling (avoids duplicate headers)
app.use((req, res, next) => {
    if (!res.get('Access-Control-Allow-Origin')) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
    }
    // Handle OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const execPromise = (0, util_1.promisify)(child_process_1.exec);
// ✅ Improved command execution with CloudWatch logging
function runCommand(command) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { stdout, stderr } = yield execPromise(command);
            console.log(`✅ Command executed successfully: ${command}`);
            if (stdout)
                console.log(`STDOUT:\n${stdout}`);
            if (stderr)
                console.warn(`STDERR:\n${stderr}`);
            return { stdout: stdout || '', stderr: stderr || '' };
        }
        catch (error) {
            const execError = error;
            console.error(`❌ Command execution failed: ${command}`, execError);
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
            console.error("❌ Error checking repository existence:", error);
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
            console.error("❌ Error reading config.properties:", error);
            return false;
        }
    });
}
function executePythonScript() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🚀 Executing Python script...');
        return yield runCommand('python github_activity.py');
    });
}
app.post('/api/addRepo', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repoName = req.body.repoName;
    if (!repoName) {
        console.warn('⚠️ Missing repository name in request');
        res.status(400).json({ error: 'Repository name is required' });
        return;
    }
    if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repoName)) {
        console.warn(`⚠️ Invalid repo name format received: ${repoName}`);
        res.status(400).json({ error: 'Invalid repository name format. Use owner/repo.' });
        return;
    }
    try {
        const existsOnGitHub = yield checkRepoExists(repoName);
        if (!existsOnGitHub) {
            console.warn(`⚠️ Repository not found on GitHub: ${repoName}`);
            res.status(404).json({ error: `Repository ${repoName} not found on GitHub` });
            return;
        }
        const existsInConfig = yield repoInConfig(repoName);
        if (existsInConfig) {
            console.log(`${repoName} already exists in config.properties`);
            const { stdout, stderr } = yield executePythonScript();
            if (stderr && stderr.trim() !== '') {
                console.error('❌ Python script stderr:', stderr);
                res.status(500).json({ error: `Python script failed: ${stderr}` });
                return;
            }
            console.log('✅ Python script stdout:', stdout);
            res.json({
                message: 'Repository already exists, fetching new data',
                output: stdout.trim()
            });
            return;
        }
        yield fs.appendFile('config.properties', `\n${repoName}=${repoName}`);
        console.log(`✅ Added ${repoName} to config.properties`);
        const { stdout, stderr } = yield executePythonScript();
        if (stderr && stderr.trim() !== '') {
            console.error('❌ Python script stderr:', stderr);
            res.status(500).json({ error: `Python script failed: ${stderr}` });
            return;
        }
        console.log('✅ Python script stdout:', stdout);
        res.json({
            message: 'Repository added successfully',
            output: stdout.trim()
        });
    }
    catch (error) {
        console.error('❌ Error in addRepo operation:', error);
        res.status(500).json({
            error: error.message || 'An unexpected error occurred'
        });
    }
}));
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
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
        console.error('❌ Error reading repositories:', error);
        res.status(500).json({ error: 'Failed to read repositories' });
    }
}));
app.delete('/api/removeRepo/:repoName', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repoName = req.params.repoName;
    if (!repoName) {
        console.warn('⚠️ Missing repository name in delete request');
        res.status(400).json({ error: 'Repository name is required' });
        return;
    }
    try {
        const data = yield fs.readFile('config.properties', 'utf8');
        const lines = data.split('\n');
        const filteredLines = lines.filter(line => !line.trim().startsWith(`${repoName}=`));
        yield fs.writeFile('config.properties', filteredLines.join('\n'));
        console.log(`✅ Repository ${repoName} removed successfully`);
        res.json({ message: `Repository ${repoName} removed successfully` });
    }
    catch (error) {
        console.error('❌ Error removing repository:', error);
        res.status(500).json({ error: 'Failed to remove repository' });
    }
}));
app.use((error, req, res, next) => {
    console.error('💥 Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});
app.listen(port, () => {
    console.log(`🚀 Server listening on port ${port}`);
    console.log(`✅ Health check: http://localhost:${port}/api/health`);
});
exports.default = app;
