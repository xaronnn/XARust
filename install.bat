@echo off

NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
	echo This setup needs admin permissions. Please run this file as admin.
	pause
	exit
)
set NODE_VER=null
node -v >temp.txt
set /p NODE_VER=<temp.txt
del temp.txt
IF %NODE_VER% NEQ null (
	echo NodeJS not detected, please first install NodeJS.
	pause
	exit
) ELSE (
	NodeJS detected, installing packages..
	echo Installation succeeded, please configure config.js and then run start.bat file.
)