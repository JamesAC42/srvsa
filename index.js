var http = require("http");
var fs = require("fs");
var formidable = require("formidable");
var path = require("path");
var pug = require("pug");
var parseString = require('xml2js').parseString;

var server = http.createServer(function(req, res){
  if (req.method.toLowerCase() == 'get'){
    displayPage(req, res);
  } else if (req.method.toLowerCase() == 'post'){
    if (req.url == '/') {
      processForm(req, res);
    }
  }
});

function displayPage(req, res){
  var filePath = req.url;
  if (filePath == '/') {
    filePath = '/newcards.html';
  }
  let oldPath = filePath;
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
  if (oldPath == '/sets') {
    var setdata = require('./data/sets.json');
    let htmlrender = pug.renderFile('./templates/sets.pug', setdata);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(htmlrender, 'utf8');
  } else {
    fs.exists(filePath, function(exists) {
        if (exists) {
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    res.writeHead(500);
                    res.end();
                }
                else {                   
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content, 'utf8');                  
                }
            });
        }
    });
  }
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
              console.info(definitionsSpagget);
              let defs;
              if(Array.isArray(definitionsSpagget)){
                defs = definitionsSpagget.map(function(def){
                  let cleanDef;
                  if (typeof def === 'object' && def["_"] !== undefined) {
                    cleanDef = def["_"].slice(1).trim();
                  } else if (typeof def === 'string') {
                    cleanDef = def.slice(1).trim();
                  } else {
                    return;
                  }
                  if (cleanDef !== '' && cleanDef !== null){
                    return cleanDef;
                  } else {
                    return;
                  }
                });
              }else if (typeof definitionsSpagget == 'string') {
                defs = [ definitionsSpagget] ;
              }
              var mainDefinition = defs[0];
              defs.splice(0,1);
              defs = defs.filter(filterDefs);
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
      var title = JSON.parse(fields.title)
      title.replace(/[^A-Za-z\s0-9!?]/g,'');
      var dataJson = {
        title,
        words: results
      };
      var filename = Math.random().toString(36).substring(2, 7);
      var filepath = "./data/sets/" + filename + ".json";
      var dataset = require("./data/sets.json");
      dataset["files"].push({
        filename,
        dateCreated: Date.now(),
        title,
        canStudy: true
      });
      fs.writeFile("./data/sets.json", JSON.stringify(dataset, null, '  '), "utf8");
      fs.writeFile(filepath, JSON.stringify(dataJson, null, '  '), "utf8");
      res.write('http://localhost:3000/sets');
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
