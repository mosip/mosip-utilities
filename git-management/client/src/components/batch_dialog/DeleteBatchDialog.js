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
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import { delete_branch } from '../Github';
import { githubRepo } from '../../action/index'

export default function DeleteBatchDialog({branchList, setBranchList}) {

  const dispatch = useDispatch();
  const token = useSelector((state) => state.tokenUpdate);
  const repositories = useSelector((state) => state.repoUpdate);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleDeleteClose = async () => {
    setLoading(true);

    for (let repo_name in branchList)
    {
      for(let branch_name of branchList[repo_name] )
      {
        const new_repositories = await delete_branch (token, repositories, repo_name, branch_name);
        dispatch(githubRepo({...new_repositories}));         
      }
    }

    for (let repo_name in branchList)
    {
      if(!repositories.hasOwnProperty(repo_name))
        delete branchList[repo_name];
      else
      {
        const filteredList = branchList[repo_name].filter(value => repositories[repo_name].includes(value));
        branchList[repo_name] = filteredList;
        if(branchList[repo_name].length===0)
          delete branchList[repo_name];
      }
      setBranchList({...branchList});
    }
    
    // console.log(branchList);

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
          <DeleteForeverIcon  fontSize="large" sx={{color:"coral"}}/>
      </IconButton>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle> Deleting Branch </DialogTitle>
        
        <DialogContent>
          <DialogContentText>
            Do you want to delete branches ?
          </DialogContentText>
        </DialogContent>
        
        <DialogActions>
          <Fade in={loading} unmountOnExit> 
            <CircularProgress/> 
          </Fade>
          <Button onClick={handleClose}> Cancel </Button>
          <Button onClick={handleDeleteClose}> Delete </Button>
        </DialogActions>

      </Dialog>
    </Box>
  );
}