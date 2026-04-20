import React, {useEffect, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux'

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Box } from '@mui/system';
import { CircularProgress, Fade, IconButton } from '@mui/material';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';

import { rename_branch } from '../Github';
import { githubRepo } from '../../action/index'

export default function RenameBatchDialog({branchList}) {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.tokenUpdate);
  const repositories = useSelector((state) => state.repoUpdate);

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [newBranchName, setNewBranchName] = useState("");

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = async () => {
    setOpen(false);
  };

  const handleRenameClose = async () => {
    setLoading(true);
    for (let repo_name in branchList)
    {
      for(let branch_name of branchList[repo_name] )
      {
        const new_repositories = await rename_branch(token,repositories,repo_name,branch_name,newBranchName);
        dispatch(githubRepo({...new_repositories}));
      }
    }
    
    setLoading(false);
    setOpen(false);
  };

  useEffect(() => {

  }, [repositories,token,open,newBranchName]);
  
  return (
    <Box>
      <IconButton onClick={handleClickOpen} sx={{m:5, mb:5}}>
          <DriveFileRenameOutlineIcon  fontSize="large" sx={{color:"RebeccaPurple"}}/>
      </IconButton>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle> Renaming Branch </DialogTitle>
        
        <DialogContent>
          <DialogContentText>
            Enter the new name for the branches
          </DialogContentText>

          <TextField fullWidth autoFocus margin="dense" label="New branch name" type="text" variant="standard" onChange={(e)=>{setNewBranchName(e.target.value)}}/>
          
        </DialogContent>
        
        
        
        <DialogActions>          
          <Fade in={loading} unmountOnExit> 
            <CircularProgress/> 
          </Fade>          
          <Button onClick={handleClose}> Cancel </Button>
          <Button onClick={handleRenameClose}> Rename </Button>
        </DialogActions>

      </Dialog>
    </Box>
  );
}