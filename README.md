# Dota-Quiz-Twitch-Bot
A Simple Twitch Bot, that regularly posts questions into a twitch channel that can be answered by the viewers.<br/>
This bot was built for the streamer https://twitch.tv/HansiPowers <br/>
This is also the reason all text, that is posted to the chat is in german.<br/>
When implementing multiple languages it is a requirement to always have german as a supported language.<br/>

New features can freely be tested in the chat of https://twitch.tv/dota_quiz

## Install and run the bot

### In development

Make sure `NodeJS` and `npm` are installed on your pc

When starting the bot in a dev environment (where is constantly restarted and does not have to run as a daemon), execute the following commands:<br/>
`npm install` (Installs all dependencies)<br/>
`npm start:dev`

This will start the bot in a blocking command which can be terminated to stop the bot.<br/>
All logs are written to the log files and nothing is printed to the console.

Create a file `token` in the main directory that holds the oauth token for the user that posts in twitch chat.

### In production

Make sure `NodeJS` and `npm` are installed on your pc

To have the bot run as a service in production execute the following commands:<br/>
`npm install` (Installs all dependencies)<br/>
`npm setup-system-startup`<br/>
This will print a command that should be executed to have the service be in the autostart of the machine<br/>
`npm start`<br/>
This will start the service in the background where all logs are printed to te corresponding log files.

These additional commands can be used to manage the service:<br/>
`npm stop`<br/>
`npm restart`<br/>
`npm uninstall`<br/>
For additional monitoring check https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/

Create a file `token` in the main directory that holds the oauth token for the user that posts in twitch chat.

## User Guide

Important files:
* `config/config.json`: The general configuration file, that holds most properties
* `config/question.json`: Holds all questions and its answers
* `lang/*`: Configuration files for all supported languages

### Setup

* Before usage, a twitch account, that should post the messages has to be created. After that, a login token has to be created for that user, that is used by this bot to login. Note that removing the token from the twitch account will remove all access for the bot. No need to change the account password.<br/>
A token can be created using this link: https://twitchapps.com/tmi/
* After creating the token, write the username of the account into the configuration file under `identity.username` and write the token into a text file named `token` in the base folder
* Set the `channelName` to the channel the bot should post into

### Features

:pushpin: Properties with this icon can be changed in the configuration file<br/>
Note, that all commands are case-insensitive, meaning, that for example `#score` and `#SCOre` would do the same
### General
* When running, the bot has to be started to post questions using the command `#startQuiz` :pushpin:
* It can always be disabled again using `#stopQuiz` :pushpin:, at which point it will only react to commands but will not post anything on its own
* Note, that start and stop are only available to a channel admin who can be configured in the config under `channelAdmin`
* When enabled in the configuration, the bot will automatically disable itself when the stream of the configured channel is offline
* The bot will post questions into the chat every 60seconds :pushpin:
* When the question is not answered correctly within 20seconds :pushpin:, it "expires" with a notification in chat
* Chat users can try to answer the question by prefixing the chat answer with `?` :pushpin:. For example: `?110mana`
* When sending a wrong answer the bot will not react (:pushpin:: It can be configured to send a "wrong answer" notification into the chat)
* When correctly answering a question, the user gets a message in chat and gets a score point. Also, the question immediately expires so no other chat used can answer it.
* The use score for each correct answer is saved and can be accessed later

### User Commands
* `#score` :pushpin:: Sends a message with the current score of the user, that sent the command
* `#topTen` :pushpin:: Prints the scores of the ten users with the most points
* `#frage` :pushpin:: Resends the current question

### Admin Commands
* `#startQuiz` :pushpin:: Starts the bots feature to post questions in chat
* `#stopQuiz` :pushpin:: Stops the bots feature to post questions in chat. It will still react to all commands (user or admin)
* `#totalScore` :pushpin:: Prints the current scores for ALL users, that have collected points to the chat
* `#reset` :pushpin:: Resets the saved points for ALL users. Prints them all to the chat before clearing it

## Configuration

### `config.json`

#### channelName
The name of the twitch channel, the bot should post its messages and react to commands

#### channelAdmin
The name of the twitch user, that is able to execute the Admin Commands

#### disableBotWhenChannelIsOffline
When enabled, the quiz is automatically stopped when stream is offline

#### postQuestionIntervalInSeconds
The interval in which questions should be posted in seconds

#### questionTimeoutInSeconds
The time a question expires after it has been posted in seconds

#### questionCooldownPercent
When a question was posted it goes on "cooldown" and this percentage of other question have to be posted before this question can come up again

#### answerPrefix
The prefix, that is required on a chat message for it to be recognized as a potential answer

#### reactToWrongAnswer
When enabled, a message is sent when a user sent a wrong answer

#### reactToNoQuestion
When enabled, a message is sent when a user asks for the current question or tries to answer it, but no answer is currently active

#### identity.username
The name of the twitch account, that is used by the bot to send and receive messages

#### commands.personalScore
See [User Commands `#score`](#user-commands)

#### commands.topScores
See [User Commands `#topTen`](#user-commands)

#### commands.currentQuestion
See [User Commands `#frage`](#user-commands)

#### adminCommands.start
See [Admin Commands `#startQuiz`](#admin-commands)

#### adminCommands.stop
See [Admin Commands `#stopQuiz`](#admin-commands)

#### adminCommands.allScores
See [Admin Commands `#totalScore`](#admin-commands)

#### adminCommands.reset
See [Admin Commands `#reset`](#admin-commands)

### About questions and answers
Currently all questions are build like this:

* A question is just a simple text with no variables or anything similar.<br/>
For example: "Welchen Cooldown hat Snapfires Mortimer Kisses?"
* A question have multiple answers where each answer is correct.<br/>
A user has to given any of these answers to be correct.<br/>
For example: `110`, `110s`
* When checking if an answer is correct it is compared with all configured correct answers.<br/>
When doing this _**all whitespaces are removed**_ from the answer and the answer is _**case-insensitive**_.<br/>
For example: The answer `110 S` still matches the answer `110s`
* This also means, when setting up questions, the answers should _**not contain any whitespaces**_ and all text should be _**in lower case**_

### Language Files

These are the texts, that are posted into the chat as described.<br/>
Most messages can have variables, that are replaced when the message is posted into the chat.<br/>
A variable can be used in a message by surrounding it with `${` and `}`

#### askQuestion
A new question is asked or a user sent the [command](#commandscurrentquestion) to see the question

Variables:
* `question`: The actual question, that is asked
* `timeout`: The timeout for the current question
* `answerPrefix`: The prefix, that has to be used when answering the question. See [General Features](#general) for details

#### noQuestion
A user asked for the current question or tried to answer a question, when none is currently open.<br/>
This message can be [disabled completely](#reacttonoquestion)

Variables:
* `user`: The user, that sent the message

#### wrongAnswer
The wrong answer was given for a question<br/>
This message can be [disabled completely](#reacttowronganswer)

Variables:
* `user`: The user, that sent the message

#### correctAnswer
The correct answer was sent for a question

Variables:
* `user`: The user, that sent the message
* `newQuestionIn`: The time until the next question will be asked

#### questionTimedOut
The question timed out and can not be answered anymore

Variables:
* `question`: The full question, that has just timed out
* `answer`: One valid answer for the question
* `newQuestionIn`: The time until the next question will be asked

#### commandScore
Send the total score of the user, that send the command

Variables:
* `user`: The user, that sent the message
* `scoreNumber`: The score of the user
* `userRank`: The rank of the current compared to all others

#### commandScoreShort
Sent when the scores of multiple users are printed in a single chat message

Variables:
* `user`: The user, that sent the message
* `scoreNumber`: The score of the user
* `userRank`: The rank of the current compared to all others

#### commandReset
Message confirming the reset of all scores

#### commandResetNobodyHasPoints
Message when loading all scores, but nobody has scores yet

#### hours
The text used when sending hours in a message

#### minutes
The text used when sending minutes in a message

#### seconds
The text used when sending seconds in a message