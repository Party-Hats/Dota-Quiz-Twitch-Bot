# Dota-Quiz-Twitch-Bot
A Simple Twitch Bot, that regularly posts questions into a twitch channel that can be answered by the viewers.   
This bot was built for the streamer https://twitch.tv/HansiPowers

New features can freely be tested in the chat of https://twitch.tv/dota_quiz

# User Guide

TODO

# Feature backlog
### In progress
### Major 

* Have asked questions expire after a certain time
* Give chat users the ability to check their answer score
* Give Hansi the ability to get all user scores and reset the persisted data
* Have a command that starts/stops the bot
* Implement multiple question "catalogues" with different questions, and have a command, that switches to a different question catalogue

### Minor

* Move all posted text to a separate file to make it easier to modify
* Make sure client reconnects to twitch when it is disconnected
* Implement some logic, that makes sure, that the same questions are not asked too soon again 
(e.g. only allow question to be asked again after at least 50% of the other questions have been asked)
* Post one valid answer when question expires / a new question is asked

### Ideas

* To update any settings (including available questions) one has to connect to the server the bot runs on and update the config files. 
There should be an easier way to change the settings (especially the questions)
