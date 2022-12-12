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
import AddIcon from '@mui/icons-material/Add';

import { create_branch } from '../Github';
import { githubRepo } from '../../action/index'

export default function CreateBatchDialog({branchList}) {

  const dispatch = useDispatch();
  const token = useSelector((state) => state.tokenUpdate);
  const repositories = useSelector((state) => state.repoUpdate);

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [createBranchName, setCreateBranchName] = useState([]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleCreateClose = async () => {
    setLoading(true);
    for (let repo_name in branchList)
    {
      for(let branch_name of branchList[repo_name] )
      {
        for (let cbn of createBranchName)
        {
          if(cbn.length === 0)
            continue;
          const new_repositories = await create_branch(token,repositories,repo_name,branch_name,cbn);
          dispatch(githubRepo({...new_repositories}));
        }
      }
    }

    setLoading(false);
    setOpen(false);
  };

  const handleClose = async () => {
    setOpen(false);
  };

  const handleCreateBranches = (event) => {
    event.preventDefault();
    let lst = event.target.value;
    lst = lst.split(",").map(element => element.trim());;
    setCreateBranchName([...lst]);
  };

  useEffect(() => {

  }, [repositories,token,open,createBranchName]);
  
  return (
    <Box>
      <IconButton onClick={handleClickOpen} sx={{m:5, mb:5}}>
          <AddIcon fontSize="large" sx={{color:"DodgerBlue"}}/>     
      </IconButton>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle> Creating Branch </DialogTitle>
        
        <DialogContent>
          <DialogContentText>
            Enter the new branch name you want to create in repository.
          </DialogContentText>

          <TextField fullWidth autoFocus margin="dense" label="Branch name" type="text" variant="standard" onChange={handleCreateBranches}/>
        </DialogContent>
        
        <DialogActions>
          <Fade in={loading} unmountOnExit> 
            <CircularProgress/> 
          </Fade>
          <Button onClick={handleClose}> Cancel </Button>
          <Button onClick={handleCreateClose}> Create </Button>          
        </DialogActions>

      </Dialog>
    </Box>
  );
}