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
const fs = __importStar(require("fs/promises")); // Fix fs import
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
function checkRepoExists(repoName) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `https://api.github.com/repos/${repoName}`;
        try {
            const response = yield fetch(url, {
                headers: { Authorization: `token ${GITHUB_TOKEN}` }
            });
            return response.ok;
        }
        catch (error) {
            console.error("Error checking repository existence:", error);
            return false;
        }
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
    const exists = yield checkRepoExists(repoName);
    if (!exists) {
        res.status(404).json({ error: `Repository ${repoName} not found on GitHub` });
        return;
    }
    try {
        // Append repository name to config.properties file
        yield fs.appendFile('config.properties', `\n${repoName}=${repoName}`);
        // Execute Python script
        const { stdout, stderr } = yield new Promise((resolve, reject) => {
            var _a, _b;
            const child = (0, child_process_1.exec)('python github_activity.py'); // ✅ Works on Windows
            let stdoutData = '';
            let stderrData = '';
            (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
                stdoutData += data;
            });
            (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (data) => {
                stderrData += data;
            });
            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout: stdoutData, stderr: stderrData });
                }
                else {
                    reject(new Error(`Python script exited with code ${code}: ${stderrData}`));
                }
            });
        });
        // Handle Python script output
        if (stderr) {
            console.error('Python script stderr:', stderr);
            res.status(500).json({ error: `Python script failed: ${stderr}` });
            return;
        }
        console.log('Python script stdout:', stdout);
        res.json({ message: 'Repository added successfully', output: stdout });
    }
    catch (error) {
        console.error('Error adding repository:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
