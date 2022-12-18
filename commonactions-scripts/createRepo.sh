#! /bin/sh

#Script for automatically creating new repositories on github with the default workflow files.
#This script assumes that all the default workflows are already pushed into the global remote repository.

#Just run this script using ./ and pass the name of the file containing new repository names. The file should kept in the same directory as this script.

#Here the Github username is asked.
echo "Enter the Github Account Username:"
read GITHUB_USERNAME

#Here the Global repo name is asked.
echo "Enter the Global Repository Name:"
read GLOBAL_REPO_NAME

#Here the Global URL is constructed from GLOBAL_REPO_NAME and GITHUB_USERNAME.
readonly GLOBAL_REPO_URL="https://github.com/$GITHUB_USERNAME/$GLOBAL_REPO_NAME"

#For storing the github username and token after entering them once. They will be stored for the seconds specified in the timeout field.
#That timeout field is set to 300s, i.e. 5 minutes.
#This will help to store the username and github token for the prompts coming from github's side.
git config --global credential.helper "cache --timeout=300"

#Creating a local copy of the remote Global Repo.
git clone $GLOBAL_REPO_URL

filename=$1

while read REPO_NAME
do
	#Creating a remote repository corresponding to each line, where the line represents the repository's name.
	#Will have to install and configure the gh command (using sudo snap install gh) before using the below line. Also, gh auth login needs to be configuredi.
	gh repo create $REPO_NAME --public
	
	#The new Repo's URL is constructed here.
	NEW_REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME"
	
	#Creating a local copy of the remote new Repo.
	git clone $NEW_REPO_URL
	
	#Creating the .github/workflows folder inside the new repo.
	mkdir "$REPO_NAME/.github"
	mkdir "$REPO_NAME/.github/workflows"
	
	#Copying all the default workflows from the Global Repo into the New Repo.
	cp $GLOBAL_REPO_NAME/.github/workflows/* $REPO_NAME/.github/workflows/
	
	cd $REPO_NAME
	
	#Now just preparing and pushing the code into the remote repository.
	git add .
	git commit -m "Added all the default workflow files from the $GLOBAL_REPO_NAME Repository."
	git push
	
	#After this the github username and the token is to be entered. (Only if not already cached)

	cd ..
	
	#Deleting the local copy of the New Repo from the system. This is done for all the repositories.
	yes | rm -r $REPO_NAME

	#After this many prompts asking for the confirmation of deletion of files come where we have to enter the alphabet "y" every time - solved using piping.
done < $filename

#Deleting the local copy of the Global Repo from the system.
yes | rm -r $GLOBAL_REPO_NAME

#After this also many prompts asking for the confirmation of deletion of files come where we have to enter the alphabet "y" everytime - solved using piping.

#Finished
