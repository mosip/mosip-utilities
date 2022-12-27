import React from 'react'
import { useSelector } from 'react-redux'

import { Box, Stack, Accordion, AccordionDetails, AccordionSummary, Grid, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import RenameDialog from './RenameDialog';
import DeleteDialog from './DeleteDialog';
import CreateDialog from './CreateDialog';
import LockDialog from './LockDialog';
import UnlockDialog from './UnlockDialog';
import AddDialog  from './AddDialog';

const Repo = () => {
    const repositories = useSelector((state) => state.repoUpdate);
    
    return (
        <Box sx={{m:2}}>
            <Grid container spacing={2}>
            { Object.keys(repositories).map( (rep,key) => ( 
                <Grid item xs={3} key={key}>
                <Accordion elevation={4} >
                    <AccordionSummary  expandIcon={<ExpandMoreIcon />} >
                        <Stack direction="row" alignItems="center" gap={1}>
                            <Typography fontSize='h6.fontSize' fontWeight='bold'> {rep} </Typography>
                            
                        </Stack>
                    </AccordionSummary>
                    
                    <AccordionDetails>
                        { repositories[rep].map( (branch,key) => (                                
                                <Stack direction="row" alignItems="center" justify="left" gap={1} key={key} sx={{border:0}} >                                    
                                    <Typography> {branch} </Typography>
                                    <RenameDialog repo_name={rep} branch_name={branch}/>
                                    <CreateDialog repo_name={rep} branch_name={branch}/>                                    
                                    <LockDialog repo_name={rep} branch_name={branch}/>
                                    <UnlockDialog repo_name={rep} branch_name={branch}/>
                                    <DeleteDialog repo_name={rep} branch_name={branch}/>
                                    <AddDialog repo_name={rep} branch_name={branch}/>
                                </Stack>
                        ))}
                    </AccordionDetails>
                </Accordion>
                </Grid>
            ))}    
            </Grid>
        </Box>
    )
}

export default Repo