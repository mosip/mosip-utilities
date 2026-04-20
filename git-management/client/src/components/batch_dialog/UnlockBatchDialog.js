import React, {useEffect, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux'

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Box } from '@mui/system';
import { CircularProgress, Fade, IconButton } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { unlock_branch } from '../Github';
import { githubRepo } from '../../action/index'

export default function UnlockBatchDialog({branchList}) {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.tokenUpdate);
  const repositories = useSelector((state) => state.repoUpdate);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleUnlockClose = async () => {
    setLoading(true);

    for (let repo_name in branchList)
    {
      for(let branch_name of branchList[repo_name] )
      {
        const new_repositories = await unlock_branch (token, repositories, repo_name, branch_name);
        dispatch(githubRepo({...new_repositories}));
      }
    }
    setLoading(false);
    setOpen(false);
  };

  const handleClose = async () => {
    setOpen(false);
  };


  useEffect(() => {

  }, [repositories,token,open]);
  
  return (
    <Box>
      <IconButton onClick={handleClickOpen} sx={{m:5, mb:5}}>
          <LockOpenIcon fontSize="large" sx={{color:"DeepPink"}}/>
      </IconButton>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle> Unlocking Branch </DialogTitle>

        <DialogContent>
          <DialogContentText>
            Do you want to unlock branches ?
          </DialogContentText>
        </DialogContent>
        
        <DialogActions>
          <Fade in={loading} unmountOnExit> 
            <CircularProgress/> 
          </Fade>
        <Button onClick={handleClose}> Cancel </Button>
        <Button onClick={handleUnlockClose}> Unlock </Button>
        </DialogActions>

      </Dialog>
    </Box>
  );
}