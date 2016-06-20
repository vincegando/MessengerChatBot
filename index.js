'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
let arr = []


app.set('port', (process.env.PORT || 5000))


app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello')
})

// Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

app.post('/webhook/', function (req, res) {
    // Initialize message to be sent
    let listString = "Current list: \n"

    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id
        if (event.message && event.message.text) {
            let text = event.message.text
            let lower = text.toLowerCase()
            
            // When user wants to add to their list 
            if (lower.includes("add ") == true) {
            	let element = lower.substring(lower.indexOf("add ") + 4)
            	// Add to list
            	arr.push(element)
            	// Loop through list and add items to message to be sent
            	for (var j = 0; j < arr.length; j++){
            		listString = listString + (j + 1) + ". " + arr[j] + "\n"
            	}
            	// Send message with current list
            	sendTextMessage(sender, listString)
            	continue
            }
            
            // When user wants to delete an item from their list
            else if (lower.includes("delete ") == true) {
            	let indexString = lower.substring(lower.indexOf("delete ") + 7)
            	let index = parseInt(indexString)
            	
            	// Delete item with specified index
            	deleteElement(sender, index, arr)
            	for (var k = 0; k < arr.length; k++){
            		// If an item in list is undefined, do not add to message to be printed
            		if (arr[k] === undefined) {
            			break
            		}
            		listString = listString + (k + 1) + ". " + arr[k] + "\n"
            	}
            	
            	// If list is empty
            	if (listString == "Current list: \n") {
            		arr = []
            		listString = "Your list is empty."
            	}
            	sendTextMessage(sender, listString)
            	continue
            }
            
            // When user wants to clear their list
            else if (lower.includes("clear") == true){
            	arr = []
            	sendTextMessage(sender, "List successfully cleared.")
            	continue
            }
            
            
            // Default message
            sendTextMessage(sender, "To add to your list, type \"Add [item]\". To delete an item from your list, type \"Delete [Number of item in list]\". To clear your list, type \"Clear\".")
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


function deleteElement(sender, index, arr) {
	if (index < 1 || index > arr.length) {
		sendTextMessage(sender, "Error: Invalid Index")
		return
	}
	else {
		index -= 1
		for(var i = index; i < arr.length; i++) {
			if (i == arr.length - 1) {
				delete arr[i]
				continue
			}
			else{
				arr[i] = arr[i + 1]
			}
		}
	}

}



// Start the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})