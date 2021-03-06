const http = require("http");
const fs = require("fs");
const formidable = require("formidable");
const path = require("path");
const pug = require("pug");
const url = require("url");
const parseString = require('xml2js').parseString;

var server = http.createServer(function(req, res){
  if (req.method.toLowerCase() === 'get'){
    displayPage(req, res);
  } else if (req.method.toLowerCase() === 'post'){
    if (req.url === '/') {
      processForm(req, res);
    } else if (req.url === '/deleteset') {
      deleteSet(req, res);
    } else if (req.url === '/deleteCard') {
      deleteCard(req, res);
    } else if (req.url === '/changeDef') {
      editDefinition(req, res);
    } else if (req.url === '/addNewCards') {
      addNewCards(req,res);
    } else if (req.url === '/editWord') {
      editWord(req, res);
    }
  }
});

function displayPage(req, res){
  var filePath = req.url;
  if (filePath == '/') {
    filePath = '/newcards.html';
  }
  let oldPath = url.parse(filePath,true);
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
  if (oldPath.pathname == '/sets') {
    var setdata = require('./data/sets.json');
    let htmlrender = pug.renderFile('./templates/sets.pug', setdata);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(htmlrender, 'utf8');
  } else if (oldPath.pathname == '/edit') {
    var query = url.parse(req.url, true).query;
    var fileName = query.set;
    var wordsData = require('./data/sets/' + fileName + '.json');
    let htmlrender = pug.renderFile('./templates/set.pug', wordsData);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(htmlrender, 'utf8');
  } else if (oldPath.pathname === '/study') { 
     var query = url.parse(req.url, true).query;
     var filename = query.set;
     var wordsData = require('./data/sets/' + filename + '.json');
     let htmlrender = pug.renderFile('./templates/study.pug', wordsData);
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
    var isUrban = JSON.parse(fields.urbanDefs);
    words = words.filter(filterWords);
    var defFromWords = isUrban ? getUrbanDefsFromWords(words) : getDefsFromWords(words);
    defFromWords.then(results => {
      var defList = results;
      var title = JSON.parse(fields.title)
      title.replace(/[^A-Za-z\s0-9!?]/g,'');
      var dataJson = {
        title,
        words: defList
      };
      var totalCards = defList.length;
      var filename = Math.random().toString(36).substring(2, 7);
      var filepath = "./data/sets/" + filename + ".json";
      var dataset = require("./data/sets.json");
      dataset["files"].push({
        filename,
        dateCreated: Date.now(),
        title,
        totalCards,
        canStudy: true
      });
      fs.writeFile("./data/sets.json", JSON.stringify(dataset, null, '  '), "utf8", callback=>{return});
      fs.writeFile(filepath, JSON.stringify(dataJson, null, '  '), "utf8", callback=>{return});
      let newUrl = 'http://localhost:3456/edit?set=' + filename;
      console.info(newUrl);
      res.writeHead(200, {'Content-type':'text/plain'});
      res.write(newUrl);
      res.end();
    }).catch(err => {
      console.error(err);
    });
  });
}

function addNewCards(req, res){
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files){
    res.writeHead(200, {
      'content-type':'text/plain'
    });
    var filename = fields.filename;
    var isUrban = JSON.parse(fields.urbanDefs);
    var words = JSON.parse(fields.words);
    words = words.filter(filterWords);
    var defFromWords = isUrban ? getUrbanDefsFromWords(words) : getDefsFromWords(words);
    defFromWords.then(results => {
      var defList = results;
      var totalCards = defList.length;
      var filepath = "./data/sets/" + filename + ".json";
      var set = require(filepath);
      var wordsList = set["words"];
      defList.forEach(function(item, index){
        wordsList.push(item);
      });
      fs.writeFile(filepath, JSON.stringify(set, null, '  '), "utf8", callback=>{return});
      var setList = require("./data/sets.json");
      setList["files"].forEach(function(item, index){
        if(item["filename"] == filename){
          item["totalCards"] = item["totalCards"] + totalCards;
        }
      });
      fs.writeFile('./data/sets.json', JSON.stringify(setList, null, '  '), "utf8", callback=>{return});

      res.write(JSON.stringify(defList));
      res.end();
    }).catch(err => {
      console.error(err);
    });
  });
}

function getUrbanDefsFromWords(words){
  return Promise.all(words.map(sanitizedw => new Promise ((done, reject) => {
    sanitizedw = sanitizedw.replace(/[^a-zA-Z ]/g,'').trim();
    var encodedw = encodeURIComponent(sanitizedw);
    var wpath = '/v0/define?term=' + encodedw;
    var options = {
      host: 'api.urbandictionary.com',
      path: wpath
    };
    http.get(options, function(http_res) {
      var data = "";
      http_res.on("data", function (chunk) {
        data += chunk;
      });
      http_res.on("end", function() {
        let result = JSON.parse(data);
        let entry;
        if (result["result_type"] == "exact") {
          try {
            var defSpagget = result["list"];
            var defs = defSpagget.map(item=>{
              return item["definition"];
            });
            entry = {
              sanitizedw,
              mainDefinition: defs[0],
              definitions: defs,
              hasDefinitions: true,
              suggestions: []
            }
          } catch(err) {
            entry = {
              sanitizedw,
              mainDefinition: '',
              definitions: [],
              hasDefinitions: false,
              suggestions: []
            }
          }
        } else if (result["none"]) {
          entry = {
            sanitizedw,
            mainDefinition: '',
            definitions: [],
            hasDefinitions: false,
            suggestions: []
          }
        }
        done(entry);
      });
    });
  })));
}

function getDefsFromWords(words){
  return Promise.all(words.map(sanitizedw => new Promise ((done, reject) => {
    sanitizedw = sanitizedw.replace(/[^a-zA-Z ]/g,'').trim();
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
          /*
          if (err) {
            reject(err);
            return;
          } */
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
            try {
              var definitionsSpagget = entryList.entry[0].def[0].dt;
              let defs;
              if(Array.isArray(definitionsSpagget)){
                defs = definitionsSpagget.map(function(def){
                  let cleanDef;
                  if (typeof def === 'object' && def["_"] !== undefined) {
                    cleanDef = def["_"].trim();
                    if (def["fw"] !== undefined) {
                      if (typeof def["fw"] === 'object' && def["fw"]["_"] !== undefined) {
                        cleanDef += " " + def["fw"]["_"];
                      } else if (typeof def["fw"] == 'string') {
                        cleanDef += " " + def["fw"];
                      } else if (Array.isArray(def["fw"])) {
                        if (typeof def["fw"][0] == 'string') {
                          cleanDef += " " + def["fw"][0];
                        }
                      }
                    }
                    if (def["sx"] !== undefined) {
                      if (typeof def["sx"] === 'object' && def["sx"]["_"] !== undefined) {
                        cleanDef += " " + def["sx"]["_"];
                      } else if (typeof def["sx"] == 'string') {
                        cleanDef += "; " + def["sx"];
                      } else if (Array.isArray(def["sx"])) {
                        if(typeof def["sx"][0] === 'object'){
                          if (typeof def["sx"][0]["_"] !== undefined) {
                            cleanDef += "; " + def["sx"][0]["_"];
                          }
                        } else {
                          def["sx"].forEach(function(item,index){
                            if (typeof item == 'string') {
                              cleanDef += "; " + item;
                            }
                          });
                        }
                      }
                    }
                    if (def["d_link"] !== undefined) {
                      if (typeof def["d_link"] === 'object' && def["d_link"]["_"] !== undefined) {
                        cleanDef += " " + def["d_link"]["_"];
                      } else if (typeof def["d_link"] == 'string') {
                        cleanDef += " " + def["d_link"];
                      }  
                    }
                    if (def["un"] !== undefined) {
                      cleanDef += "; "
                      if (typeof def["un"] === 'string') {
                        cleanDef += def["un"];
                      } else if (typeof def["un"] === 'object' && def["un"]["_"] !== undefined) {
                        cleanDef += def["un"]["_"];
                      } else if (Array.isArray(def["un"])) {
                        if (typeof def["un"][0] === 'string') {
                          cleanDef += def["un"][0];
                        } else if (typeof def["un"][0] === 'object' && def["un"][0]["_"] !== undefined) {
                          cleanDef += def["un"][0]["_"];
                        }
                      }
                    }
                  } else if (typeof def === 'object') {
                    if (def["un"] !== undefined) {
                      if (Array.isArray(def["un"])) {
                        if (typeof def["un"][0] === 'object' && def["un"][0]["_"] !== undefined){
                          cleanDef = def["un"][0]["_"].trim();
                        } else if (typeof def["un"][0] === 'string') {
                          cleanDef = def["un"][0].trim();
                        }
                      } else if (typeof def["un"] === 'string') {
                        cleanDef = def["un"].trim();
                      }
                    }
                  } else if (typeof def === 'string') {
                    cleanDef = def.trim();
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
              defs = defs.filter(filterDefs);
              defs = defs.map(item=>{
                return item.replace(/:/g,"");
              });
              var mainDefinition = defs[0];
              entry = {
                sanitizedw,
                mainDefinition: mainDefinition,
                definitions: defs,
                hasDefinitions: true,
                suggestions: []
              };
            } catch(err) {
              entry = {
                sanitizedw,
                mainDefinition: '',
                definitions: [],
                hasDefinitions: false,
                suggestions: []
              };
              console.info(err);
            }
          }
          done(entry);
        }); 
      });
    });
  })));
}

function appendInnerTag(object, tagName, string){
  if (typeof object[tagName] === 'object' && object[tagName]["_"] !== undefined) {
    string += " " + object[tagName]["_"];
  } else if (typeof object[tagName] == 'string') {
    string += " " + object[tagName];
  }
  return string;
}

function deleteSet(req, res){
  let form = new formidable.IncomingForm();
  form.parse(req, function(err, fields){
    let filename = fields.file;
    let sets = require('./data/sets.json');
    let files = sets["files"];
    let index;
    for (let i  = 0; i< files.length; i++) {
      if (files[i]["filename"] == filename) {
        index = i;
      }
    }
    files.splice(index, 1);
    let newSets = {files};
    fs.writeFile("./data/sets.json", JSON.stringify(newSets, null, '  '), "utf8", callback=>{return});
    fs.unlink("./data/sets/" + filename + ".json", callback=>{return});
    res.write(filename.toString());
    res.end();
  })
}

function deleteCard(req, res) {
  let form = new formidable.IncomingForm();
  form.parse(req, function(err, fields){
    let filename = fields.file;
    let set = require('./data/sets/' + filename + '.json');
    let index = JSON.parse(fields.cardindex);
    let words = set["words"];
    words.splice(index, 1);
    set["words"] = words;
    fs.writeFile("./data/sets/" + filename + ".json", JSON.stringify(set, null,  '  '), "utf8", callback=>{return});
    
    let sets = require('./data/sets.json');
    let files = sets["files"];
    files.forEach(function(item, index){
      if(item["filename"] === filename){
        item["totalCards"] = item["totalCards"] - 1;
      }
    });
    let newsets = {files};
    fs.writeFile("./data/sets.json", JSON.stringify(newsets, null, '  '), "utf8", callback=>{return});
    res.end();
  })
}

function editDefinition(req, res){
  let form = new formidable.IncomingForm();
  form.parse(req, function(err, fields){
    let filename = fields.file;
    let set = require('./data/sets/' + filename + '.json');
    let word = fields.word;
    let definition = fields.definition;
    let words = set["words"];
    for(let i = 0; i < words.length; i++){
      if (words[i]["sanitizedw"] == word){
        words[i]["mainDefinition"] = definition;
      }
    }
    fs.writeFile('./data/sets/' + filename + '.json', JSON.stringify(set, null, ' '), "utf8", callback=>{return});
    res.end();
  });
}

function editWord(req, res) {
  let form = new formidable.IncomingForm();
  form.parse(req, function(err, fields) {
    let filename = fields.file;
    let set = require('./data/sets/' + filename + '.json');
    let word = fields.word;
    let suggestion = [fields.suggestion];
    getDefsFromWords(suggestion).then(results => {
      let defList = results;
      let newWordItem = defList[0];
      set["words"].forEach(function(item, index) {
        if (item["sanitizedw"] == word) {
          set["words"][index] = newWordItem;
        }
      });
      fs.writeFile('./data/sets/' + filename + '.json', JSON.stringify(set, null, ' '), "utf8", callback=>{return});
      res.write(JSON.stringify(newWordItem));
      res.end();
    }).catch(err => {
      console.error(err);
    });
  });
}

function filterDefs(input){
  return typeof input === "string" && input !== "";
}

function filterWords(input){
  return input !== '';
}

server.listen(3456, '0.0.0.0');
console.log('Server listening on 3456');
