#! /bin/sh

#Script for updating already existing workflows in existing repositories from a global remote repository.
#Means that the workflow files should already exist in those existing repositories.
#This script assumes that all the updated workflows are already pushed into the global remote repository.

#Just run this script using ./ and pass the filename containing the updated workflow names as the first parameter and filename containing the existing repository names where the workflows have to be updated as the second parameter.
#Both of these files should exist in the same directory as this script.

#Here the Github user name is asked.
echo "Enter the Github Account Username:"
read GITHUB_USERNAME

#Here the Global repo name is asked.
echo "Enter the Global Repository Name:"
read GLOBAL_REPO_NAME

#Here the Global URL is constructed from GLOBAL_REPO_NAME and GITHUB_USERNAME.
readonly GLOBAL_REPO_URL="https://github.com/$GITHUB_USERNAME/$GLOBAL_REPO_NAME"

#Creating a local copy of the remote Global Repo.
git clone $GLOBAL_REPO_URL

#First argument will be the workflows filename.
workflows_filename=$1

#Second argument will be the repositories filename.
repos_filename=$2

while read WORKFLOW_NAME
do
        while read REPO_NAME
	do
                #Here the REPO URL is constructed from REPO_NAME and GITHUB_USERNAME.
                REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME"

                #Creating a local copy of the remote existing Repo.
                git clone $REPO_URL

                #Removing the old outdated workflow file.
                yes | rm $REPO_NAME/.github/workflows/$WORKFLOW_NAME

                #Copying the new workflow from the global repo.
                cp $GLOBAL_REPO_NAME/.github/workflows/$WORKFLOW_NAME $REPO_NAME/.github/workflows/

                cd $REPO_NAME

                #Now, just pushing the changes into the remote repository.
                git add .
                git commit -m "Updated $WORKFLOW_NAME in $REPO_NAME/.github/workflows/"
                git push

                cd ..

                #Now removing the local repositories from the system.
                yes | rm -r $REPO_NAME
	done < $repos_filename
done < $workflows_filename

#Now removing the global repository from the system.
yes | rm -r $GLOBAL_REPO_NAME

#Finished