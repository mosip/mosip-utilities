# Dependabot Alerts Dashboard 

## Overview 

This is a react Application that performs the following: 

1. Display summary of All Dependabot Alerts of an Organization along with few other parameters.  

2. Provides ability to search and filter the alerts based on repo, severity, ecosystem, state. 

3. Ability to redirect to the GitHub page of the specific alert 

4. Dockerised the application for platform independence. 
## Files and folder structure 

The folder structure is as follows: 

``` 
.
|-- Dockerfile
|-- README.md
|-- docker-compose.yml
|-- package-lock.json
|-- package.json
|-- public
|   |-- favicon.ico
|   |-- index.html
|   |-- logo192.png
|   |-- logo512.png
|   |-- manifest.json
|   `-- robots.txt
`-- src
    |-- App.css
    |-- App.js
    |-- App.test.js
    |-- common
    |   `-- config
    |       `-- AxiosConfig.js
    |-- index.css
    |-- index.js
    |-- logo.svg
    |-- reportWebVitals.js
    `-- setupTests.js

``` 

### Public Folder 

This folder contains the files required for the react application. 

### src Folder 

This folder contains the files written by the user specific to this application. 

AxiosConfig.js file present in src/common/config contains the configuration of the API call.  

App.js contains all the src code related to this application 

## Environment variables 

To run the application, you must create a `.env file` in the project directory to run successfully. 

The file needs to contain the variables in same name and format as mentioned below. 

`REACT_APP_ORGANISATION_NAME=yourOrgName` 

`REACT_APP_TOKEN=yourTokenForGithubApi` 

The prefix `REACT_APP_` is required for the react application to recognize this is a variable to be used in the application. 

Do remember **no spaces** in .env file 

## How to run 
In the root folder 
1. Step 1: Install the packages 
`npm install` 

2. Step 2: Start the react development server 
`npm start` 

Runs the app in the development mode.\ 

Open [http://localhost:3000](http://localhost:3000) To view it in your browser. 

The page will reload when you make changes. 
## Docker
### Dockerfile 

A Docker image is created by means of this file.  

This docker file: 

1. Written in an order to minimize the application build time as docker uses the previous cached layers till there is no change. 

2. Programmed to take `env variables` at run time.  

### Docker Build and Run 

The image can be built using the following command: 

`docker build . -t dependabot` 

The image can be run using the following command: 

`docker run --env-file ./.env -p 3000:3000 --name apps dependabot` 

### Docker Compose 

Instead of specifying all the parameters to run the application every time a docker-compose file has been created for this application.  

To run the application: `docker-compose up`  

To stop the application: `docker-compose down` 

Docker compose comes in handy while using multiple docker containers.  
## Work Flow of the application 

Once the application is started either using conventional npm start or docker compose, application is going to fetch the organization Name and API Token from the environment file. These environment variables are used to call GitHub API of dependabot alerts. These alerts are then displayed in tabular form with important parameters. You filter and find the alert you want to work on and click on the button of that row. This is going to redirect you to the GitHub page where you can create a PR or dismiss an alert. 