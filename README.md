# Dota-Quiz-Twitch-Bot
A Simple Twitch Bot, that regularly posts questions into a twitch channel that can be answered by the viewers.   
This bot was built for the streamer https://twitch.tv/HansiPowers

# User Guide

TODO

# Feature backlog
### Major 

* Have asked questions expire after a certain time
* Count and persist correct answers per user
* Give chat users the ability to check their answer score
* Give Hansi the ability to get all user scores and reset the persisted data
* Have a command that starts/stops the bot
* Implement multiple question "catalogues" with different questions, and have a command, that switches to a different question catalogue

### Minor

* Implement some logic, that makes sure, that the same questions are not asked too soon again 
(e.g. only allow question to be asked again after at least 50% of the other questions have been asked)
* Post one valid answer when question expires / a new question is asked

### Ideas

* To update any settings (including available questions) one has to connect to the server the bot runs on and update the config files. 
There should be an easier way to change the settings (especially the questions)
