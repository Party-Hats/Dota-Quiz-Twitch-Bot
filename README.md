# Dota-Quiz-Twitch-Bot
A Simple Twitch Bot, that regularly posts questions into a twitch channel that can be answered by the viewers.   
This bot was built for the streamer https://twitch.tv/HansiPowers
This is also the reason all text, that is posted to the chat is in german.
When implementing multiple languages it is a requirement to always have german as a supported language.

New features can freely be tested in the chat of https://twitch.tv/dota_quiz

## Install and run the bot

Make sure `NodeJS` and `npm` are installed on your pc

To install all dependencies run this in the main folder of the project:
`npm install`

Create a file `token` in the main directory that holds the oauth token for the user that posts in twitch chat.

Execute `node bot.js` in the main directory to run the bot 

## User Guide

Important files:
* `config/config.json`: The general configuration file, that holds most properties
* `config/question.json`: Holds all questions and its answers
* `lang/*`: Configuration files for all supported languages

### Setup

* Before usage, a twitch account, that should post the messages has to be created. After that, a login token has to be created for that user, that is used by this bot to login. Note that removing the token from the twitch account will remove all access for the bot. No need to change the account password.  
A token can be created using this link: https://twitchapps.com/tmi/
* After creating the token, write the username of the account into the configuration file under `identity.username` and write the token into a text file named `token` in the base folder
* Set the `channelName` to the channel the bot should post into

### Features

:pushpin: Properties with this icon can be changed in the configuration file
Note, that all commands are case-insensitive, meaning, that for example `#score` and `#SCOre` would do the same
### General
* When running, the bot has to be started to post questions using the command `#startQuiz` :pushpin:
* It can always be disabled again using `#stopQuiz` :pushpin:, at which point it will only react to commands but will not post anything on its own
* Note, that start and stop are only available to a channel admin who can be configured in the config under `channelAdmin`
* The bot will post questions into the chat every 60seconds :pushpin:
* When the question is not answered correctly within 20seconds :pushpin:, it "expires" with a notification in chat
* Chat users can try to answer the question by prefixing the chat answer with `?` :pushpin. For example: `?110mana`
* When sending a wrong answer the bot will not react (:pushpin:: It can be configured to send a "wrong answer" notification into the chat)
* When correctly answering a question, the user gets a message in chat and gets a score point. Also, the question immediately expires so no other chat used can answer it.
* The use score for each correct answer is saved and can be accessed later

### User Commands
* `#score` :pushpin:: Sends a message with the current score of the user, that sent the command
* `#frage` :pushpin:: Resends the current question

### Admin Commands
* `#startQuiz` :pushpin:: Starts the bots feature to post questions in chat
* `#stopQuiz` :pushpin:: Stops the bots feature to post questions in chat. It will still react to all commands (user or admin)
* `#totalScore` :pushpin:: Prints the current scores for ALL users, that have collected points to the chat
* `#reset` :pushpin:: Resets the saved points for ALL users. Prints them all to the chat before clearing it

## Configuration

### `config.json`

###### channelName
The name of the twitch channel, the bot should post its messages and react to commands

###### channelAdmin
The name of the twitch user, that is able to execute the Admin Commands

###### postQuestionIntervalInSeconds
The interval in which questions should be posted in seconds

###### questionTimeoutInSeconds
The time a question expires after it has been posted in seconds

###### questionCooldownPercent
When a question was posted it goes on "cooldown" and this percentage of other question have to be posted before this question can come up again

###### answerPrefix
The prefix, that is required on a chat message for it to be recognized as a potential answer

###### reactToWrongAnswer
When enabled, a message is sent when a user sent a wrong answer

###### reactToNoQuestion
When enabled, a message is sent when a user asks for the current question or tries to answer it, but no answer is currently active

###### identity.username
The name of the twitch account, that is used by the bot to send and receive messages

###### commands.personalScore
See [User Commands `#score`](#user-commands)

###### commands.currentQuestion
See [User Commands `#frage`](#user-commands)

###### adminCommands.start
See [Admin Commands `#startQuiz`](#admin-commands)

###### adminCommands.stop
See [Admin Commands `#stopQuiz`](#admin-commands)

###### adminCommands.allScores
See [Admin Commands `#totalScore`](#admin-commands)

###### adminCommands.reset
See [Admin Commands `#reset`](#admin-commands)

### About questions and answers
Currently all questions are build like this:

* A question is just a simple text with no variables or anything similar.
For example: "Welchen Cooldown hat Snapfires Mortimer Kisses?"
* A question have multiple answers where each answer is correct.
A user has to given any of these answers to be correct.
For example: `110`, `110s`
* When checking if an answer is correct it is compared with all configured correct answers.
When doing this _**all whitespaces are removed**_ from the answer and the answer is _**case-insensitive**_.
For example: The answer `110 S` still matches the answer `110s`
* This also means, when setting up questions, the answers should _**not contain any whitespaces**_ and all text should be _**in lower case**_

### Language Files

These are the texts, that are posted into the chat as described.
Most messages can have variables, that are replaced when the message is posted into the chat.
A variable can be used in a message by surrounding it with `${` and `}`

###### askQuestion
A new question is asked or a user sent the [command](#commandscurrentquestion) to see the question

Variables:
* `question`: The actual question, that is asked
* `timeout`: The timeout for the current question
* `answerPrefix`: The prefix, that has to be used when answering the question. See [General Features](#general) for details

###### noQuestion
A user asked for the current question or tried to answer a question, when none is currently open.
This message can be [disabled completely](#reacttonoquestion)

Variables:
* `user`: The user, that sent the message

###### wrongAnswer
The wrong answer was given for a question
This message can be [disabled completely](#reacttowronganswer)

Variables:
* `user`: The user, that sent the message

###### correctAnswer
The correct answer was sent for a question

Variables:
* `user`: The user, that sent the message
* `newQuestionIn`: The time until the next question will be asked

###### questionTimedOut
The question timed out and can not be answered anymore

Variables:
* `question`: The full question, that has just timed out
* `answer`: One valid answer for the question
* `newQuestionIn`: The time until the next question will be asked

###### commandScore
Send the total score of the user, that send the command

Variables:
* `user`: The user, that sent the message
* `scoreNumber`: The score of the user

###### commandReset
Message confirming the reset of all scores

###### commandResetNobodyHasPoints
Message when loading all scores, but nobody has scores yet

###### hours
The text used when sending hours in a message

###### minutes
The text used when sending minutes in a message

###### seconds
The text used when sending seconds in a message