/*
A simple node.js that uses streams to transform the data and it teaches command line
application development.
References:
+ The pseudo code source: http://www.bennadel.com/blog/2662-my-first-look-at-streamsin-node-js.htm
+ https://strongloop.com/strongblog/practical-examples-of-the-new-node-js-streams-api/
+ For prototyping and inheritence model
 refer to intermediate.js on canvas and http://book.mixu.net/node/ch6.html
+ https://nodesource.com/blog/understanding-object-streams/
+ commander.js
 - https://github.com/visionmedia/commander.js
 - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-lineinterfaces-made-easy
*/
var Transform = require('stream').Transform;
var util	= require(	"util" ).inherits;
//other modules such as fs, commander, underscore etc are loaded
// For Node 0.8 users 
if (!Transform) {
 Transform = require('readable-stream/transform');
}
//Constructor logic includes Internal state logic. PatternMatch needs to consider it because it has to parse chunks that gets transformed
function PatternMatch(pattern){
    this.pattern = pattern;
    //Switching on object mode so when stream reads sensordata it emits single pattern match.
   Transform.call(this,
        {objectMode: true}
    );
    
}

// Transform classes require that we implement a single method called _transform and
//optionally implement a method called _flush. You assignment will implement both.
PatternMatch.prototype._transform = function (chunk, encoding, getNextChunk){
   //filled in fromhttps://strongloop.com/strongblog/practical-examples-of-the-new-node-js-streams-api/
    var data = chunk.toString();
    if(this._lastLineData) data = this._lastLineData + data;
    var lines = data.split(this.pattern);
    this._lastLineData = lines.splice(lines.length-1,1)[0];
    lines.forEach(this.push.bind(this));
    getNextChunk();
};


// Extend the Transform class.
// --
// NOTE: This only extends the class methods - not the internal properties. As such we
// have to make sure to call the Transform constructor(above).
util.inherits(PatternMatch, Transform); 

//After stream has been read and transformed, the _flush method is called. It is a great
//place to push values to output stream and clean up existing data
PatternMatch.prototype._flush = function (flushCompleted)	{
    
    if(this._lastLineData) this.push(this._lastLineData);
    this._lastLineData = null;
  
    // Signal the end of the output stream.
    this.push( null );

    // Signal that the input has been fully processed.
    flushCompleted();
}
//That wraps up patternMatch module.
//Program module is for taking command line arguments\
var program = require("commander");
var fs = require("fs");

program.option('-p, --pattern <pattern>', 'Input Pattern such as . ,').parse(process.argv);
// Create an input stream from the file system.
var inputStream = fs.createReadStream( "input-sensor.txt" );
// Create a Pattern Matching stream that will run through the input and find matches
// for the given pattern at the command line - "." and “,”.
var patternStream = inputStream.pipe( new PatternMatch(program.pattern));
// Read matches from the stream.
var matches = [];
patternStream.on("readable",function() {
        var content = null;
        while((content = this.read()) !== null){
            matches.push(content);
        }
    }    
);
