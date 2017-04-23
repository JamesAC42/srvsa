var http = require("http");
var fs = require("fs");
var formidable = require("formidable");
var path = require("path");
var async = require("async");
var parseString = require('xml2js').parseString;

var server = http.createServer(function(req, res){
	if (req.method.toLowerCase() == 'get'){
		displayForm(req, res);
	} else if (req.method.toLowerCase() == 'post'){
		processForm(req, res);
	}
});

function displayForm(req, res){
	var filePath = req.url;
	if (filePath == '/')
	  filePath = '/newcards.html';
	filePath = __dirname+filePath;
	var extname = path.extname(filePath);
	var contentType = 'text/html';
	switch (extname) {
	    case '.js':
	        contentType = 'text/javascript';
	        break;
	    case '.css':
	        contentType = 'text/css';
	        break;
	}
	fs.exists(filePath, function(exists) {
	    if (exists) {
	        fs.readFile(filePath, function(error, content) {
	            if (error) {
	                res.writeHead(500);
	                res.end();
	            }
	            else {                   
	                res.writeHead(200, { 'Content-Type': contentType });
	                res.end(content, 'utf-8');                  
	            }
	        });
	    }
	});
}

function processForm(req, res){
	console.log("recieved");
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files){
		res.writeHead(200, {
			'content-type': 'text/plain'
		});
		var words = JSON.parse(fields.words);
		words = words.filter(filterWords);
		var worddefs = [];
		async.each(words,
			function(word, callback){
				console.log("wording");
				var sanitizedw = word.replace(/\s/g, '');
				sanitizedw = sanitizedw.replace(/[^A-Za-z\s!?]/g,'');
				if(!sanitizedw === ''){
					var wpath = '/api/v1/references/collegiate/xml/' + sanitizedw + '?key=ef9d9b7a-b5fd-493f-8962-d8b89d1e4ba8';
					var options = {
					    host: 'www.dictionaryapi.com',
					    path: wpath
					};
					http.get(options, function (http_res) {
					    var data = "";
					    http_res.on("data", function (chunk) {
					        data += chunk;
					    });
					    http_res.on("end", function () {
					    	console.log('hello there');
					    	parseString(data, function(err, result){
					    		if("suggestion" in result.entry_list){
					    			var entry = {
					    				word: word,
					    				mainDefinition: '',
					    				definitions: [],
					    				hasDefinitions: false
					    			}
					    		}else{
					    			var definitions = result.entry_list.entry[0].def[0].dt;
					    			definitions = definitions.filter(filterDefs);
					    			var mainDefinition = definitions[0];
					    			definitions.splice(0,1);
					    			var entry = {
					    				word:word,
					    				mainDefinition: mainDefinition,
					    				definitions: definitions,
					    				hasDefinitions: true
					    			};
					    		}
					    	});
					    	worddefs.push(entry);
					    	callback();
					    });
					});
				}
			},
			function(err){
				console.log('hello');
				if(!err){
					var title = JSON.parse(fields.title)
					title.replace(/[^A-Za-z\s!?]/g,'');
					var dataJson = {
						title: title,
						words: worddefs
					};
					var filename = Math.random().toString(36).substring(2, 7);
					var filepath = "./data/" + filename + ".json";
					fs.writeFile(filepath, JSON.stringify(dataJson), "utf8");
					console.log(dataJson);
					res.write('http://localhost:3000/');
					res.end();
				}
			}
		);
	});
}

function filterDefs(input){
	return typeof input === "string";
}

function filterWords(input){
	return input !== '';
}

function defineWord(word){
	var wpath = '/api/v1/references/collegiate/xml/' + word + '?key=ef9d9b7a-b5fd-493f-8962-d8b89d1e4ba8';
	var options = {
	    host: 'www.dictionaryapi.com',
	    path: wpath
	};
	http.get(options, function (http_res) {
	    var data = "";
	    http_res.on("data", function (chunk) {
	        data += chunk;
	    });
	    http_res.on("end", function () {
	    	parseString(data, function(err, result){
	    		if("suggestion" in result.entry_list){
	    			var entry = {
	    				word: word,
	    				mainDefinition: '',
	    				definitions: [],
	    				hasDefinitions: false
	    			}
	    		}else{
	    			var definitions = result.entry_list.entry[0].def[0].dt;
	    			definitions = definitions.filter(filterDefs);
	    			var mainDefinition = definitions[0];
	    			definitions.splice(0,1);
	    			var entry = {
	    				word:word,
	    				mainDefinition: mainDefinition,
	    				definitions: definitions,
	    				hasDefinitions: true
	    			};
	    		}
	    		return entry;
	    	});
	    });
	});
}

function asyncLoop(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: function() {
            if (done) {
                return;
            }
            if (index < iterations) {
                index++;
                func(loop);
            } else {
                done = true;
                callback();
            }
        },
        iteration: function() {
            return index - 1;
        },
        break: function() {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
}

server.listen(3000);
console.log('Server listening on 3000');
