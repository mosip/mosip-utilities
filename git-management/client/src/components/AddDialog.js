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
import SellIcon from '@mui/icons-material/Sell';

import { create_tag } from './Github';
import { githubRepo } from '../action/index'

export default function AddDialog ({repo_name,branch_name}) {

  const dispatch = useDispatch();
  const token = useSelector((state) => state.tokenUpdate);
  const repositories = useSelector((state) => state.repoUpdate);

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [tagName, setTagName] = useState(branch_name);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleAddClose = async () => {
    setLoading(true);    
    const new_repositories = await create_tag(token,repositories,repo_name,branch_name,tagName);
    dispatch(githubRepo({...new_repositories}));
    setLoading(false);
    setOpen(false);
  };

  const handleClose = async () => {
    setOpen(false);
  };


  useEffect(() => {

  }, [repositories,token,open,tagName]);
  
  return (
    <Box>
      <IconButton onClick={handleClickOpen}>
          <SellIcon sx={{color:"GoldenRod"}}/>     
      </IconButton>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle> Creating Tag </DialogTitle>
        
        <DialogContent>
          <DialogContentText>
            Enter the new tag name you want to add in repository: {repo_name}
          </DialogContentText>

          <TextField fullWidth autoFocus margin="dense" label="Tag name" type="text" variant="standard" onChange={(e)=>{setTagName(e.target.value)}}/>
        </DialogContent>
        
        <DialogActions>
          <Fade in={loading} unmountOnExit> 
            <CircularProgress/> 
          </Fade>
          <Button onClick={handleClose}> Cancel </Button>
          <Button onClick={handleAddClose}> Add </Button>          
        </DialogActions>

      </Dialog>
    </Box>
  );
}