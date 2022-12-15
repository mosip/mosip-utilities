import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import { Counter } from './features/counter/Counter';
import './App.css';
import MUIDataTable from "mui-datatables";
import Button from "@mui/material/Button";
// import { fetchAlerts } from './services/DependabotApi';
import axios from "./common/config/AxiosConfig";
import { Stack, TextField, ButtonGroup } from '@mui/material'
import { Box, Grid, Paper } from '@mui/material'

function parse_link_header(header) {
    if (header.length === 0) {
        throw new Error("input must not be of zero length");
    }

    // Split parts by comma
    var parts = header.split(',');
    var links = {};
    // Parse each part into a named link
    for(var i=0; i<parts.length; i++) {
        var section = parts[i].split(';');
        if (section.length !== 2) {
            throw new Error("section could not be split on ';'");
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    }
    return links;
}


function App() {
    const [apiData, setApiData] = useState([]);
    const [refinedData,setRefinedData] = useState([]);
    const [linkHeader,setLinkHeader] = useState({});
    const oorg = process.env.REACT_APP_ORGANISATION_NAME//localStorage.getItem("org");
    const [apiLink,setApiLink]= useState("https://api.github.com/orgs/"+oorg+"/dependabot/alerts?first=100")
    const fetchAlerts = () => {
        console.log("heli");
        console.log("ji");
        axios
            .get(apiLink) 
            .then((res) => {
                // if (!res.data) { throw new Error("No alerts found"); }
                console.log("-----then------", res);
                console.log("**********",res.headers.link);
                setLinkHeader(parse_link_header(res.headers.get('Link')))
                setApiData(res.data)
            })
            .catch((err) => {
                console.log("-----this is catch------", err);
            })
    }

function getRefinedData(apiData){
    // let data=[];
    // console.log("adfasdfasdf234234",apiData);
    for (const element of apiData) {
        refinedData.push({summary:element.security_advisory.summary,state:element.state,severity:element.security_advisory.severity,created_at:element.created_at,repository:element.repository.name,html_url:element.html_url,ecosystem:element.dependency.package.ecosystem,score:(element.security_advisory.cvss.score)})
        // console.log(element.repository.name)
    }
    // return data;
}
    useEffect(()=>{
        console.log("hiiiii",linkHeader);
        // if(linkHeader.next){
            setApiLink(linkHeader.next)
        // }
    },[linkHeader])


    // const [value, setValue] = useState('');
    // const [org,setOrg] = useState('');
    // const handleChange = (event) => {
    //   setValue(event.target.value)
    // }
    // const handleOrgChange = (event) => {
    //     setOrg(event.target.value)
    //   }
    useEffect(()=>{
        fetchAlerts();
        console.log("asfd");
    },[])
    useEffect(()=>{
        fetchAlerts();
        console.log("next page");
    },[apiLink])
    useEffect(()=>{
        getRefinedData(apiData);
        // const data = newd;
        // console.log("nnnnnnnnnnnnnnnnnn",newd);
        // setRefinedData(data);
    },[apiData])



    const columns = [
        { label: "summary",name:" summary", options: { filterOptions: { fullWidth: true } ,
        customBodyRenderLite: (dataIndex) => {
            let val = refinedData[dataIndex].summary;
            return val;
          } } 
        },
        {name:"state",label:"state",        
        options: { filterOptions: { fullWidth: true } ,
        customBodyRenderLite: (dataIndex) => {
            let val = refinedData[dataIndex].state;
            return val;
          } } 
        },
        
        {label:"severity ",name:"severity",options: { filterOptions: { fullWidth: true } ,
        customBodyRenderLite: (dataIndex) => {
            let val = refinedData[dataIndex].severity;
            return val;
          } } },
        {label:"created_at ",name:"created_at",options: { filterOptions: { fullWidth: true } ,
          customBodyRenderLite: (dataIndex) => {
              let val = refinedData[dataIndex].created_at;
              return val;
            } } },
        {name:"repository",label:"repository",        
        options: { filterOptions: { fullWidth: true } ,
        customBodyRenderLite: (dataIndex) => {
          const val = refinedData[dataIndex].repository;
          return val;
          } } 
        },
        {name:"ecosystem",label:"ecosystem",        
        options: { filterOptions: { fullWidth: true } ,
        customBodyRenderLite: (dataIndex) => {
          const val = refinedData[dataIndex].ecosystem;
          return val;
          } } 
        },
        {name:"cvss Score",label:"cvss Score",        
        options: { filterOptions: { fullWidth: true } ,
        customBodyRenderLite: (dataIndex) => {
          const val = refinedData[dataIndex].score;
          return val;
          } } 
        },
        {name: "Open in gitHub",
        options: { filterOptions: {  fullWidth: true } ,
        customBodyRenderLite: (dataIndex) => {
            let val = refinedData[dataIndex].html_url;
            console.log(val);
            return (<>
                <Button size="small" variant="contained"    onClick={() => {
            window.open(
                val, "_blank");
                    }}>gitHub</Button>
            </>
            )
          } } 

        }
    ];

    const options = {
        search: true,
        download: false,
        print: false,
        viewColumns: true,
        filter: true,
        filterType: "dropdown",
        responsive:"standard",
        selectableRows:"none",
      };


  return (
    <div className="App">

    {/* <Paper sx={{ padding: '16px' }} elevation={2}>
 
      <Grid rowSpacing={2} columnSpacing={1} container my={4}>
        <Grid item xs={6}>
            <TextField
                    label='Org name'
                    required
                    error={!org}
                    value={org}
                    fullWidth
                    onChange={handleOrgChange}
                    />
        </Grid>
        <Grid item xs={6}>
            <TextField  
                label='Personal acess token'
                required
                helperText={
                    !value ? 'Required' : 'Do not share your token with anyone'
                }
                type='password'
                error={!value}
                value={value}
                onChange={handleChange}
                fullWidth
            />        
        </Grid>
        <Grid item xs={12}>

                <Button  variant="contained"    onClick={() => {
                        localStorage.setItem("org",org);
                        localStorage.setItem("token",value);
                        window.location.reload();

                    }}>submit</Button>

                <Button  variant="contained"    onClick={() => {
                        localStorage.removeItem("org");
                        localStorage.removeItem("token");
                        window.location.reload();
                    }}>LogOut</Button>            

        </Grid>
      </Grid>
    </Paper> */}

        <MUIDataTable
        title={"Dependabot Alerts"}
        data={refinedData}
        columns={columns}
        options={options}
        />
        
    </div>
  );
}

export default App;
