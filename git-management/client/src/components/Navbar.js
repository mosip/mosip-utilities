import * as React from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';

import GitHubIcon from '@mui/icons-material/GitHub';
import{Link} from 'react-router-dom';


const pages=["Repo","Branch","Error",];

export default function Navbar() {
  return (
    <Box>
      <AppBar>
        <Toolbar>
          
          <IconButton color="inherit" component={Link} to="/">
            <GitHubIcon/>            
          </IconButton>
          <Typography component={Link} to="/" sx={{color:"white", textDecoration: 'none' }}> GitHub </Typography>

          <Box m="auto">
            <ButtonGroup variant="contained">
              {pages.map( (page,idx) => ( <Button component={Link} to={`/${page}`} key={idx}> {page} </Button> ))}
            </ButtonGroup>
          </Box>
          
        </Toolbar>
      </AppBar>
      <Toolbar/>
    </Box>
  );
}
