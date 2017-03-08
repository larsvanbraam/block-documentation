var blockDocumentation = require( '../index.js' );
var server = require( 'node-http-server' );

// Generate the documentation
blockDocumentation.generate( {
	input: './example/input/',
	output: './example/output/'
} );

console.log( '-----' );

// Start a  server to preview the output
server.deploy( {
	root: './example/output/',
	port: 8080
} );

console.log( '[Info] Running documentation server on [ http://localhost:8080 ]' );
console.log( '[Info] Close the server with CTRL + C' );