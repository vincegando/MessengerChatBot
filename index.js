'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

app.post('/webhook/', function (req, res) {
    let arr = []
    let listString = ""
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
            let lower = text.toLowerCase()
            if (lower.includes("add ") == true) {
            	let element = lower.substring(lower.indexOf("add ") + 4)
            	arr.push(element)
            	for (var j = 0; j < arr.length; j++){
            		listString = listString + (j + 1) + ". " + arr[j] + "\n"
            	}
            	sendTextMessage(sender, listString)
            	continue
            }
            else if (lower.includes("delete ") == true) {
            	let indexString = lower.substring(lower.indexOf("delete ") + 7)
            	let index = parseInt(indexString)
            	deleteElement(index,arr)
            	for (var k = 0; k < arr.length; k++){
            		listString = listString + (k + 1) + ". " + arr[k] + "\n"
            	}
            	sendTextMessage(sender, listString)
            	continue
            }
            // if (lower.substring(0,4) == 'flip') {
            // 	flip(sender)
            // 	continue
            // }
            sendTextMessage(sender, "To add to your list, type \"Add [item]\". To delete an item from your list, type \"Delete [Number of item in list]\".")
        }
        if (event.postback) {
        	let text = JSON.stringify(event.postback)
        	sendTextMessage(sender, "Postback received: " +text.substring(0,200), token)
        	continue
        }
    }
    res.sendStatus(200)
})

const token = "EAAOkwZCVHvwcBAGDyhkYx065BYywfZBgNrxy95G3LoEKo2dP2Q8wupNEd5gPvu9PdgfjNGAoMwKMkumzwvQoa9fl4N1Mi8LIyam4zyaaGuIBLFGSJcHwmcQerT4ZAWZCINPi2r9jRU8E3tFNOyjdekOE1ctkdTWJvx12ZApI1TQZDZD"


function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function flip(sender) {
    let num = Math.random()
    let res = "none"
    if(num < .5) {
    	res = "Heads"
    }
    else {
    	res = "Tails"
    }
    let result = { text:res }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: result,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function deleteElement(index, arr) {
	if (index < 1 || index > arr.length) {
		sendTextMessage(sender, "Error: Invalid Index")
		return
	}
	else {
		index -= 1
		for(var i = index; i < arr.length; i++) {
			arr[i] = arr[i + 1]
		}
	}

}



// Start the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})