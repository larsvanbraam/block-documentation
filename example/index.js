let blockDocumentation = require( '../index.js' );
let server = require( 'node-http-server' );

// Generate the documentation
blockDocumentation.generate( {
	input: {
		folder: './example/input/blocks/',
		files: [
			'./example/input/IDummyFile.ts'
		]
	},
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