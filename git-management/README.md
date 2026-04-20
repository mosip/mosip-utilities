> # Server
  * This folder contains backend/server side of code.
  * The Tech Stack used for the same is:
    * Nodejs
    * Express
    * Octokit
    * cors
    * dotenv
  * This mainly handels functionality like:
    * Handel client request
    * Retreive the information from github.
    * Process input and output for the API request.
  * Directory Structure:
    * ./serevr.js : Code begins here. Then uses the routes mentioned in route folde.
    * ./router/route.js : This contains the backend API details. Here we can add or delete API's. Frontend send request to these API.
    * ./Github/api.js: This file contains functions called by route to interact with github. Thses function performs the backend task of taking input and generating output.
    

> # Client
* This folder contains frontend/client side of code.
* The Tech Stack used for the same is:
  * Nodejs
  * React
  * Axions
  * Material UI
  * Redux
  * React dom
  * React router
* This mainly handels functionality like:
  * UI part of the website
  * Displaying the information extracted from backend.
  * Process the task based on selection.
  * Route the user to correct path of frontend.
* Directory Structure:
  * ./index.js : Executation starts from here.
  * ./App.js : It contains the links and the main Box which further contains other component.
  * ./src/components : Contains different components that are being used in UI.
  * ./src/reducers : This contains the react state function which is universal and can be accessed anywhere.
  * ./src/action: This contains the universal react state and can be accessed anywhere.
    


> # Workflow
  * This folder contains the github actions workflow pipeline code.
  * In this pipeline we performs following actions:
    * Install the dependencies.
    * Build the project.
    * After that Login to Docker Hub.
    * Builds the docker image.
    * Publishes docker image on docker hub.
  * Test the proejct build in different environment.
  * Each server and client folder contains there own docker file named ./Dockerfile.
  * Repective docker file contains instruction to dockerize the image and expose to given port.
