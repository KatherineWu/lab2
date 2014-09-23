var express = require('express');
//var bodyParser = require('body-parser');
//var expressSession = require('express-session');
var cookieParser = require('cookie-parser'),
    session = require('cookie-session'); //express-session
var app = express();

app.use(cookieParser('katherine-is-awesome'));
app.use(session({
    name:"sessionid",
    keys:['katherine']
}));

app.disable("etag");

app.get('/', function(req, res){
    var cookie = req.cookies.sessionid;

    if(cookie === undefined) {
	var rand = Math.random().toString();
	rand = rand.substring(2, rand.length);
	res.cookie("sessionid", rand, {maxAge:900000, httpOnly:true});
	console.log("Cookie created", rand);
    }

    if(req.session.inventory === undefined) {
	console.log("No items in inventory");
	req.session.inventory = ["laptop"];
    }
    if(req.session.location === undefined) {
	req.session.location = campus[4].id.toString();
    }
    
    //console.log("Refresh request from old player");
    //req.session.location = getLocation(req.session);

    res.status(200);
    res.sendFile(__dirname + "/index.html");
});

app.get('/:id', function(req, res){
    var inventory = getInventory(req.session);
    var loc = getLocation(req.session);
    if (req.params.id == "location") {
	res.set({'Content-Type': 'application/json'});
	res.status(200);
	res.send({"location": loc});
	return;	
    }
    if (req.params.id == "inventory") {
	res.set({'Content-Type': 'application/json'});
	res.status(200);
	res.send(inventory);
	return;
    }
    for (var i in campus) {
	if (req.params.id == campus[i].id) {
	    res.set({'Content-Type': 'application/json'});
	    res.status(200);
	    setLocation(req.session, campus[i].id);
	    res.send(campus[i]);
	    return;
	}
    }
   
    res.status(404);
    res.send("not found, sorry");
});

app.get('/images/:name', function(req, res){
    res.status(200);
    res.sendFile(__dirname + "/" + req.params.name);
});

app.delete('/:id/:item', function(req, res){
    var inventory = getInventory(req.session);
    for (var i in campus) {
	if (req.params.id == campus[i].id) {
	    res.set({'Content-Type': 'application/json'});
	    var ix = -1;
	    if (campus[i].what != undefined) {
		ix = campus[i].what.indexOf(req.params.item);
	    }
	    if (ix >= 0) {
		res.status(200);
		inventory.push(campus[i].what[ix]); // stash
		res.send(inventory);
		campus[i].what.splice(ix, 1); // room no longer has this
		return;
	    }
	    res.status(200);
	    res.send([]);
	    return;
	}
    }
    res.status(404);
    res.send("location not found");
});

app.put('/:id/:item', function(req, res){
    var inventory = getInventory(req.session);
    for (var i in campus) {
	if (req.params.id == campus[i].id) {
	    // Check you have this
	    var ix = inventory.indexOf(req.params.item)
	    if (ix >= 0) {
		dropbox(inventory, ix, campus[i]);
		res.set({'Content-Type': 'application/json'});
		res.status(200);
		res.send([]);
	    } else {
		res.status(404);
		res.send("you do not have this");
	    }
	    return;
	}
    }
    res.status(404);
    res.send("location not found");
});

app.listen(3000);

var dropbox = function(inventory, ix, room) {
    var item = inventory[ix];

    inventory.splice(ix, 1);	 // remove from inventory
    if (room.id == 'allen-fieldhouse' && item == "basketball") {
	room.text += " Someone found the ball so there is a game going on!"
	return;
    }
    if (room.what == undefined) {
	room.what = [];
    }
    if (item == "ku flag") {
	room.where = 'davidRoom.jpg';
	room.text = "You are at David's abode ;)";
	refresh();
	return;
    }
    if (room.where = 'davidRoom.jpg' && item == "hot girls")
    {
	room.where = 'partyRoom.jpg';
	room.text = "Looks like you're gonna have a party!";
	refresh();
	return;
    }  

    room.what.push(item);
};

var getInventory = function(session) {
    return session.inventory;
};

var getLocation = function(session) {
    return session.location;
}
var setLocation = function(session, location) {
    session.location = location;
}

var campus =
    [ { "id": "lied-center",
	"where": "LiedCenter.jpg",
	"next": {"east": "eaton-hall", "south": "dole-institute"},
	"text": "You are outside the Lied Center."
      },
      { "id": "dole-institute",
	"where": "DoleInstituteofPolitics.jpg",
	"next": {"east": "allen-fieldhouse", "north": "lied-center"},
	"text": "You take in the view of the Dole Institute of Politics. This is the best part of your walk to Nichols Hall."
      },
      { "id": "eaton-hall",
	"where": "EatonHall.jpg",
	"next": {"east": "snow-hall", "south": "allen-fieldhouse", "west": "lied-center"},
	"text": "You are outside Eaton Hall. You should recognize here."
      },
      { "id": "snow-hall",
	"where": "SnowHall.jpg",
	"next": {"east": "strong-hall", "south": "ambler-recreation", "west": "eaton-hall"},
	"text": "You are outside Snow Hall. Math class? Waiting for the bus?"
      },
      { "id": "strong-hall",
	"where": "StrongHall.jpg",
	"next": {"east": "outside-fraser", "north": "memorial-stadium", "west": "snow-hall"},
	"what": ["coffee", "hot girls"],
	"text": "You are outside Stong Hall."
      },
      { "id": "ambler-recreation",
	"where": "AmblerRecreation.jpg",
	"next": {"west": "allen-fieldhouse", "north": "snow-hall"},
	"text": "It's the starting of the semester, and you feel motivated to be at the Gym. Let's see about that in 3 weeks."
      },
      { "id": "outside-fraser",
  "where": "OutsideFraserHall.jpg",
	"next": {"west": "strong-hall","north":"spencer-museum"},
	"what": ["basketball"],
	"text": "On your walk to the Kansas Union, you wish you had class outside."
      },
      { "id": "spencer-museum",
	"where": "SpencerMuseum.jpg",
	"next": {"south": "outside-fraser","west":"memorial-stadium"},
	"what": ["art"],
	"text": "You are at the Spencer Museum of Art."
      },
      { "id": "memorial-stadium",
	"where": "MemorialStadium.jpg",
	"next": {"south": "strong-hall","east":"spencer-museum"},
	"what": ["ku flag"],
	"text": "Half the crowd is wearing KU Basketball gear at the football game."
      },
      { "id": "allen-fieldhouse",
	"where": "AllenFieldhouse.jpg",
	"next": {"north": "eaton-hall","east": "ambler-recreation","west": "dole-institute"},
	"text": "Rock Chalk! You're at the field house."
      }
    ]
