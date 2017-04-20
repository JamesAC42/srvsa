var http = require("http");
var fs = require("fs");
var formidable = require("formidable");
var path = require("path");
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
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files){
		res.writeHead(200, {
			'content-type': 'text/plain'
		});
		/*
		var word = fields.word;
		word = word.replace(/\s/g, '');
		word = word.replace(/[^A-Za-z\s!?]/g,'');
		console.log(word + " " + word.length)
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
		    		var definitions = result.entry_list.entry[0].def[0].dt;
		    		definitions = definitions.filter(filterDefs);
		    		var enddefs = word + "\n\n\n";
		    		definitions.forEach(function(element, index){
		    			enddefs += index + ": " + element + "\n\n";
		    		});
		    		res.write(enddefs);
		    		res.end();
		    	});
		    });
		}); */
		var words = JSON.parse(fields.words);
		var wordstring = '';
		words = words.filter(filterWords);
		words.forEach(function(element,index){
			var sanitizedw = element.replace(/\s/g, '');
			sanitizedw = sanitizedw.replace(/[^A-Za-z\s!?]/g,'');
			words[index] = sanitizedw;
			if(sanitizedw === ''){
				words.splice(index, 1);
			}else{
				wordstring += sanitizedw + ", ";
			}
		});
		var fs = require('fs');
		var wordsJson = {
			words: words
		};
		var filename = Math.random().toString(36).substring(2, 5);
		var filepath = "./data/" + filename + ".json";
		fs.writeFile(filepath, JSON.stringify(wordsJson), "utf8");
		console.log(words);
		res.write('http://localhost:3000/');
		res.end();
	});
}

function filterDefs(input){
	return typeof input === "string";
}

function filterWords(input){
	return input !== '';
}

server.listen(3000);
console.log('Server listening on 3000');
