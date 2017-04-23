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
    var words = JSON.parse(fields.words);
    words = words.filter(filterWords);
    Promise.all(words.map(sanitizedw => new Promise ((done, reject) => {
      sanitizedw = sanitizedw.replace(/[^a-zA-Z/s]/g,'').trim();
      var encodedw = encodeURIComponent(sanitizedw);
      var wpath = '/api/v1/references/collegiate/xml/' + encodedw + '?key=ef9d9b7a-b5fd-493f-8962-d8b89d1e4ba8';
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
          parseString(data, function(err, result) {
            console.info(JSON.stringify(result), null, '  ');
            let entry;
            if (err) {
              reject(err);
              return;
            }
            const entryList = result['entry_list'];
            if (!entryList.entry) {
              if (entryList.suggestion) {
                const suggestion = entryList.suggestion;
                entry = {
                  sanitizedw,
                  mainDefinition: '',
                  definitions: [],
                  hasDefinitions: false,
                  suggestions: Array.isArray(suggestion) ? suggestion : [ suggestion ]
                }
              } else {
                entry = {
                  sanitizedw,
                  mainDefinition: '',
                  definitions: [],
                  hasDefinitions: false,
                  suggestions: []
                }
              }
            } else {
              var definitionsSpagget = entryList.entry[0].def[0].dt;
              var defs = definitionsSpagget.map(function(def){
                let cleanDef;
                if (typeof def === 'object') {
                  cleanDef = def["_"].slice(1).trim();
                } else if (typeof def === 'string') {
                  cleanDef = def.slice(1).trim();
                }
                if (cleanDef !== '' || typeof cleanDef == 'object'){
                  return cleanDef;
                } else {
                  return;
                }
              })
              var mainDefinition = defs[0];
              defs.splice(0,1);
              entry = {
                sanitizedw,
                mainDefinition: mainDefinition,
                definitions: defs,
                hasDefinitions: true,
                suggestions: []
              };
            }
            done(entry);
          }); 
        });
      });
    }))).then(results => {
      console.info(results);
      var title = JSON.parse(fields.title)
      title.replace(/[^A-Za-z\s0-9!?]/g,'');
      var dataJson = {
        title,
        words: results
      };
      var filename = Math.random().toString(36).substring(2, 7);
      var filepath = "./data/sets/" + filename + ".json";
      var dataset = require("./data/sets.json");
      dataset["files"].push(filename);
      fs.writeFile("./data/sets.json", JSON.stringify(dataset), "utf8");
      fs.writeFile(filepath, JSON.stringify(dataJson, null, '  '), "utf8");
      console.info(dataJson);
      res.write('http://localhost:3000/');
      res.end();
    }).catch(err => {
      console.error(err);
    });
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
