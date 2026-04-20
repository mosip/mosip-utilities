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

import { create_tag } from '../Github';
import { githubRepo } from '../../action/index'

export default function AddBatchDialog({branchList}) {

  const dispatch = useDispatch();
  const token = useSelector((state) => state.tokenUpdate);
  const repositories = useSelector((state) => state.repoUpdate);

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [addTagName, setAddTagName] = useState([]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleAddClose = async () => {
    setLoading(true);
    for (let repo_name in branchList)
    {
      for(let branch_name of branchList[repo_name] )
      {
        for (let tag of addTagName)
        {
          if(tag.length === 0)
            continue;
          const new_repositories = await create_tag(token,repositories,repo_name,branch_name,tag);
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

  const handleTagNames = (event) => {
    event.preventDefault();
    let lst = event.target.value;
    lst = lst.split(",").map(element => element.trim());;
    setAddTagName([...lst]);
  };

  useEffect(() => {

  }, [repositories,token,open,addTagName]);
  
  return (
    <Box>
      <IconButton onClick={handleClickOpen} sx={{m:5, mb:5}}>
          <SellIcon fontSize="large" sx={{color:"GoldenRod"}}/>     
      </IconButton>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle> Adding Tags </DialogTitle>
        
        <DialogContent>
          <DialogContentText>
            Enter the new tag name you want to create in repository.
          </DialogContentText>

          <TextField fullWidth autoFocus margin="dense" label="Tag name" type="text" variant="standard" onChange={handleTagNames}/>
        </DialogContent>
        
        <DialogActions>
          <Fade in={loading} unmountOnExit> 
            <CircularProgress/> 
          </Fade>
          <Button onClick={handleClose}> Cancel </Button>
          <Button onClick={handleAddClose}> Create </Button>          
        </DialogActions>

      </Dialog>
    </Box>
  );
}