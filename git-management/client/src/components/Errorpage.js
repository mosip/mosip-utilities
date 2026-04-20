import { Button, Typography } from '@mui/material'
import { Box } from '@mui/system'

import React from 'react'
import {Link} from 'react-router-dom'

const Errorpage = () => {
  return (
    <Box margin="auto" textAlign="center">
        <Typography variant="h1"> 404 </Typography>
        <Typography variant="h3"> Page Not Found </Typography>
        <Button variant='contained' component={Link} to="/"> Goto Home Page</Button>
    </Box>
  )
}

export default Errorpage