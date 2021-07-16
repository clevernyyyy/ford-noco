# Ford NoCO
FordNoCO geolocates FordConnected vehicles that have left their engines running at home. Sends them alert about carbon monoxide poisoning and stops the engine to prevent the invisible killer.


## Inspiration
Ford NoCO was developed in Nebraska, one of the nation's highest state mortality rates due to carbon monoxide poisoning. Tired of seeing story after story of tragedies with families and young children dying due to the "Invisible Killer" we wanted to use this hackathon as an opportunity to design something that would automatically prevent these deaths and help educate the public about the dangers of running vehicles in enclosed areas.

## What it does
Ford NoCO monitors FordConnected vehicles for any vehicles that are within their home's GPS radius and are actively running with no readings from the speedometer. These running, idling vehicles are pumping out carbon monoxide and are potentially a danger to the home's residents. Ford NoCO notifies the resident via text of the risk or requests a well-being check from local authorities. If the vehicle continues to run without response from resident, Ford NoCO issues a shutdown command.

## How we built it
We built the server using express, node, mongodb. We built the website using reactjs and mongodb. We integrated texting receive and response using twilio and the express server.

## Accomplishments that we're proud of
We are proud of Ford NoCO's mission, which is to automatically prevent senseless carbon monoxide poisoning tragedies through smart connected technologies.

## What we learned
We learned a lot about connected vehicles and all that we can utilize through remote APIs. Additionally, this project also provided factual take-a-ways that we can use to help encourage others to be cognizant of the dangers CO can cause.

## What's next for Ford NoCO
Ford NoCO was built as an exercise for this hackathon, but in building it, we have really latched onto this idea of helping make the world safer. This is a project we would love to expand on and make it successful long-term. People are extremely unaware of carbon monoxide and how dangerous it is. Earlier this year, during the power outages in Texas, a whole family died because they were using their car to try to help heat their house. These tragedies can easily be avoided using Ford NoCO and we think bringing it to a production state would result in saved lives.

# Steps to run
1. Run MongoDB and populate with test car info
2. Setup a Twilio phone number linked to our server or Ngrok server
3. Add/edit your Twilio and Ford creditials into an .env file
4. Start the application command: node noco_monitor.js

