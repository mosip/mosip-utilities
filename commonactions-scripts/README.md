# Common Actions Scripts

## Overview

This repository contains automation scripts for putting the predefined workflows in the newly created repositories(createRepo.sh) in bulk and also to update workflows in the existing ones(updateRepo.sh) in bulk.

## Built With

* Shell Scripts

## Pre-requisites

* There should be a global repository in your github account containing the global workflows in it's .github/workflows/ folder.
* Git should be preconfigured on the system in which these scripts are running.
* Github classic access token should already be generated with these 3 scopes at the very least: read:org, repo, workflow. 
* gh command should be installed before using these scripts and it should also be configured. (This should also be done everytime the access token expires and a new one is generated)

## Installation and Configuration

### Generating Github classic token

1) Check the top right corner icon of your profile and select settings.
2) Go to Developer settings in the menu on the left.
3) Go to Personal access tokens and select Tokens (classic).
4) Click on Generate new token.
5) Now select these three scopes: read:org, repo, workflow. Also, set an expiry date for the token and then generate token.

* The read:org scope allows the gh command to use this token and read the saved configurations.
* The repo scope is already selected by default for the basic functionalities of the token.
* The workflow scope enables our scripts to modify the .github/workflows/ directory.

6) Copy and paste this new token in some text file on your local machine because you will have to enter this in the password field for github in the terminal and also to configure the gh command.

### gh command configuration

This gh command is mainly used to create a new repo in Github from your local system.

1) Install the gh command using "sudo snap install gh".
2) Now configure the gh command using "gh auth login".
3) When gh auth login is used,

* Select Github.com for account
* Select HTTPs as the preferred protocol
* Then paste the generated token.

4) This whole process of gh command configuration needs to be repeated after the token gets expired.

## Getting Started

* Just clone this repository.
* Change the file permissions of these shell scripts in order to execute them using the command chmod +x [scriptname]. (Do this for both of these scripts)

### For createRepo.sh

* Create a text file containing the names of the new repositories that you want to be preconfigured with the workflows from the global repository in your github account, in the same folder as that of these scripts. Let's assume that this file's name is newRepoNames.txt (For reference purposes)
* Each repo name should come in a new line in newRepoNames.txt (Refer sampletextfile.txt)

### For updateRepo.sh

* Create a text file containing the names of the exisiting repos in your github account for which you want to update the workflows from the global repository. Let's assume this file's name to be repoNames.txt (For reference purposes)
* Create a text file containing the names of the exisiting workflows in the global repository that you want to be updated inside the existing repositories. Let's assume this file's name to be workflowNames.txt (For reference purposes)
* Each repo name should come in a new line in repoNames.txt (Refer sampletextfile.txt)
* Each workflow name should come in a new line in workflowNames.txt (Refer sampletextfile.txt)

## Usage

After completing all the above steps you are ready to use both the scripts.

### createRepo.sh

1) This script takes only 1 argument: the filename containing the names of the new repositories.
2) Run the script using ./createRepo.sh [newRepoNames filename]
3) The script will ask for Github Account Username, Global Repository Name and will construct the Global repo URL by itself.
4) After this, only once the Github username and the access token need to be provided and then they automatically get cached for 5 minutes on the local machine. (This 5 minutes time is also configured inside the script and can be changed)
5) Once the execution is finished you will be able to see the newly created reposiotories with preconfigured workflows inside them. The workflows will also start to execute themselves provided that they have trigger on code push.

### updateRepo.sh

1) This scipt takes 2 arguments: The first argument will be the filename containing the names of the workflows to be updated. The second argument will be the filename containing the names of the repos in which these workflows are to be updated.
2) Run the script using ./updateRepo.sh [workflowNames filename] [repoNames filename]
3) The script will ask for Github Account Username, Global Repository Name and will construct the Global repo URL by itself.
4) After this, only once the Github username and the access token need to be provided and then they automatically get cached for 5 minutes on the local machine. (This 5 minutes time is also configured inside the script and can be changed)
5) Once the execution is finished you will be able to see the updated workflows inside the specified repositories. The workflows will also start to execute themselves provided that they have trigger on code push.

#### The scripts are well commented as well so that anyone can understand them easily and make the changes according to their usage.

## Contributing
Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement". Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
