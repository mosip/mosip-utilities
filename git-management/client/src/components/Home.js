import React, {useEffect, useState} from 'react'
import { useSelector,useDispatch } from 'react-redux'

import { Box,  Button, TextField, } from '@mui/material'
import LinearProgressWithLabel from './progress/LinearProgressWithLabel';

import { githubToken, githubUsername, githubRepo } from '../action/index'
import { update_username, update_branch_list, get_repo_list } from './Github';

import Repo from './Repo';

const Home = () => {
    const dispatch = useDispatch();
    const token = useSelector((state) => state.tokenUpdate);
    const username = useSelector((state) => state.usernameUpdate);
    const repositories = useSelector((state) => state.repoUpdate);

    const [progress, setProgress] = useState(0.0);
    const [tempToken, setTempToken] = useState(token);

    const postData = async(event) => {
        event.preventDefault();
        setProgress(0);
        dispatch(githubRepo({}));
        dispatch(githubToken(tempToken))
        dispatch(githubUsername(await update_username(token)));
        
        const repo_lst = await get_repo_list(token);        
        let new_repositories={};

        for (let i=0; i<repo_lst.length; i++)
        {
            new_repositories = await update_branch_list(token,new_repositories,repo_lst[i]);
            dispatch(githubRepo({...new_repositories}));
            setProgress((100*(i+1))/repo_lst.length)
        }
    }

    useEffect(() => {

    }, [repositories,username,token,tempToken]);

    return (
        <Box align="center" sx={{m:"auto", mt:5, flexGrow:1, }} >        
            <TextField fullWidth disabled id="username" label={username} variant="filled" InputProps={{ readOnly: true }} sx={{m:5, mb:5, width:500,}}/>
            <TextField fullWidth autoFocus autoComplete="false" id="token" label="Token" defaultValue={token} type="password" variant="outlined" sx={{m:5, mb:5, width:500,}} onChange={(event)=> setTempToken(event.target.value)} />
            <Button variant="contained" onClick={postData} sx={{m:5, mb:5}}> Load </Button>
            <LinearProgressWithLabel value={progress} sx={{m:5,}} />
            <Repo/>            
        </Box>
  )
}

export default Home