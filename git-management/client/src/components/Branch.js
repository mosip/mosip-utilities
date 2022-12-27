import React, {useState} from 'react'
import { useSelector } from 'react-redux'

import { Box, Checkbox, Paper, Typography, TextField } from '@mui/material'
import { TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material'

import UnlockBatchDialog from './batch_dialog/UnlockBatchDialog';
import LockBatchDialog from './batch_dialog/LockBatchDialog';
import DeleteBatchDialog from './batch_dialog/DeleteBatchDialog';
import CreateBatchDialog from './batch_dialog/CreateBatchDialog';
import RenameBatchDialog from './batch_dialog/RenameBatchDialog';
import AddBatchDialog from './batch_dialog/AddBatchDialog';

const Branch = () => {
    const repositories = useSelector((state) => state.repoUpdate);

    const [branchKeyword, setBranchKeyword] = useState(RegExp("",'i'));
    const [repoKeyword, setRepoKeyword] = useState(RegExp("",'i'));

    const [allCheck, setAllCheck] = useState(false);
    const [branchList,setBranchList] = useState({});

    const handleCheck = (event,repo_name,branch_name) => {
        event.preventDefault();
        const check = event.target.checked;
        if(!branchList.hasOwnProperty(repo_name))
                branchList[repo_name]=[];
            
        if(check===true)
        {            
            let pre=false;            
            for (let i=0; i<branchList[repo_name].length; i++)
            {
                if(branchList[repo_name][i]===branch_name)
                {
                    pre=true;
                    break;
                }
            }
            if(!pre)
                branchList[repo_name].push(branch_name);
        }
        else
        {
            for (let i=0; i<branchList[repo_name].length; i++)
            {
                if(branchList[repo_name][i]===branch_name)
                {
                    branchList[repo_name].splice(i,1);
                }
            }
        }
        setBranchList({...branchList});
    };
    
    const handleAllCheck = (event) => {
        setBranchList({});

        let checked = !allCheck;
        setAllCheck(checked);

        if(checked)
        {
            for (let rep in repositories)
            {
                if(RegExp(repoKeyword,'i').test(String(rep)))
                {
                    for (let i=0; i<repositories[rep].length; i++)
                    {
                        const branch_name=repositories[rep][i];
                        if(RegExp(branchKeyword,'i').test(String(branch_name)))
                        {                            
                            if(!branchList.hasOwnProperty(rep))
                                branchList[rep]=[];

                            branchList[rep].push(branch_name);
                        }
                    }
                }
            }
            setBranchList({...branchList});
        }
        
    };

    const checkChecked = (repo_name,branch_name) => {
        if(!branchList.hasOwnProperty(repo_name))
            return false;
        
        for (let i=0; i<branchList[repo_name].length; i++)
        {
            if(branchList[repo_name][i]===branch_name)
            {
                return true;
            }
        }

        return false;
    };

    const handleRepoKeyword = (event) =>{
        try {
            event.preventDefault();        
            setBranchList({});
            setAllCheck(false);
            
            const reg = RegExp(event.target.value,'i');
            setRepoKeyword(reg);
        }
        catch(error)
        {
            console.log(error.message);
        }
    };

    const handleBranchKeyword = (event) =>{
        try {
            event.preventDefault();
            setBranchList({});
            setAllCheck(false);

            const reg = RegExp(event.target.value,'i');
            setBranchKeyword(reg);
        }
        catch(error)
        {
            console.log(error.message);
        }
    };

    return (
    <Box>
    <Box display="flex" justifyContent="center" alignItems="center" sx={{ border:0, m:5, }}>        
        <UnlockBatchDialog branchList={branchList} />
        <LockBatchDialog branchList={branchList} />
        <DeleteBatchDialog branchList={branchList} setBranchList={setBranchList}/>
        <CreateBatchDialog branchList={branchList} />
        <RenameBatchDialog branchList={branchList} />      
        <AddBatchDialog branchList={branchList} />   
    </Box>
    
    <Box display="flex" justifyContent="center" alignItems="center" sx={{ border:0, m:5, }}>
        <TextField fullWidth autoFocus autoComplete='off' id="search" label="Repo Search" defaultValue={""} variant="outlined" sx={{m:5, mb:5, width:500,}} onChange={handleRepoKeyword} />
        <TextField fullWidth autoFocus autoComplete='off' id="search" label="Branch Search" defaultValue={""} variant="outlined" sx={{m:5, mb:5, width:500,}} onChange={handleBranchKeyword} />        
    </Box>
    
    <Box>
        <TableContainer component={Paper}>
        <Table sx={{ }} >
            <TableHead>
                <TableRow>
                    <TableCell> <Checkbox checked={allCheck} onChange={handleAllCheck} /> </TableCell>
                    <TableCell> <Typography fontSize='h5.fontSize' fontWeight='bold'> Repository name </Typography>  </TableCell>
                    <TableCell> <Typography fontSize='h5.fontSize' fontWeight='bold'> Branch name </Typography>  </TableCell>
                </TableRow>
            </TableHead>

            <TableBody>            
            { Object.keys(repositories).map( (rep,key) => {
                // if(RegExp(repoKeyword,'i').test(String(rep)))
                if(repoKeyword.test(String(rep)))
                {
                    return repositories[rep].map( (branch,key) => {
                        // if(RegExp(branchKeyword,'i').test(String(branch)))
                        if(branchKeyword.test(String(branch)))
                        {
                            return  <TableRow key={key} >
                                <TableCell> <Checkbox checked={checkChecked(rep,branch)} onChange={(event)=>{handleCheck(event,rep,branch)}} /> </TableCell>
                                <TableCell > {rep} </TableCell>
                                <TableCell > {branch} </TableCell>
                            </TableRow>
                        }
                        else
                            return null;
                    })
                }
                else
                    return null;
            })}            
            </TableBody>
        </Table>
        </TableContainer>
    </Box>
    </Box>
  )
}

export default Branch   