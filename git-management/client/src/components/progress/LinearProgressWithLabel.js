import * as React from 'react';
import PropTypes from 'prop-types';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      
      <Box sx={{ width: '100%', }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>

      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" fontWeight='bold' color="text.secondary"> {`${props.value.toFixed(2)}%`} </Typography>
      </Box>    
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
};