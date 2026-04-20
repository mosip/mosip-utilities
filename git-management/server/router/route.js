const express = require('express');
const router = express.Router();

const API = require ('../GitHub/api')

router.post('/user', async (req,res) => {    
    const username = await API.get_user(req.body.token);
    res.status(200).json({username:username});
});

router.post('/repo', async (req,res) => {
    const repo = await API.get_repo_list(req.body.token);
    res.status(200).json({repo:repo});
});

router.post('/branch', async (req,res) => {
    const branches = await API.get_branch_list(req.body.token, req.body.repo_name);
    res.status(200).json({branches:branches});
});

router.post('/rename_branch', async (req,res) => {
    const status = await API.rename_branch(req.body.token, req.body.repo_name, req.body.old_branch_name, req.body.new_branch_name);
    res.status(200).json({status:status});
});

router.post('/create_branch', async (req,res) => {
    const status = await API.create_branch(req.body.token, req.body.repo_name, req.body.parent_branch_name, req.body.create_branch_name);
    res.status(200).json({status:status});
});

router.post('/delete_branch', async (req,res) => {
    const status = await API.delete_branch(req.body.token, req.body.repo_name, req.body.branch_name );
    res.status(200).json({status:status});
});

router.post('/lock_branch', async (req,res) => {
    const status = await API.lock_branch(req.body.token, req.body.repo_name, req.body.branch_name );
    res.status(200).json({status:status});
});

router.post('/unlock_branch', async (req,res) => {
    const status = await API.unlock_branch(req.body.token, req.body.repo_name, req.body.branch_name );
    res.status(200).json({status:status});
});

router.post('/create_tag', async (req,res) => {
    const status = await API.create_tag(req.body.token, req.body.repo_name, req.body.branch_name, req.body.tag_name);
    res.status(200).json({status:status});
});

module.exports = router;