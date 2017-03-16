'use strict';

const expect = require( 'chai' ).expect;
const blockDocumentation = require( '../index' );
const fs = require( 'fs-extra' );

describe( '#blockDocumentation', function()
{
	describe( '#generateData', function()
	{
		it( 'should create the data.json from a folder input', function()
		{
			blockDocumentation.generateData( {
				input: './example/input/blocks/',
				output: './test/output/',
				silent: true
			} );

			const data = JSON.stringify( fs.readJSONSync( './test/output/data.json' ) );
			const expectedData = JSON.stringify( fs.readJSONSync( './test/expected/data.json' ) );

			// Remove the folder
			fs.removeSync( './test/output/' );

			expect( data ).to.equal( expectedData );
		} );

		it( 'should create the data.json from a folder input nested within an object', function()
		{
			blockDocumentation.generateData( {
				input: {
					folder: './example/input/blocks/'
				},
				output: './test/output/',
				silent: true
			} );

			const data = JSON.stringify( fs.readJSONSync( './test/output/data.json' ) );
			const expectedData = JSON.stringify( fs.readJSONSync( './test/expected/data.json' ) );

			// Remove the folder
			fs.removeSync( './test/output/' );

			expect( data ).to.equal( expectedData );
		} );

		it( 'should create the data.json folder input and file input', function()
		{
			blockDocumentation.generateData( {
				input: {
					folder: './example/input/blocks/',
					files: [
						'./example/input/IDummyFile.ts'
					]
				},
				output: './test/output/',
				silent: true
			} );

			const data = JSON.stringify( fs.readJSONSync( './test/output/data.json' ) );
			const expectedData = JSON.stringify( fs.readJSONSync( './test/expected/data2.json' ) );

			// Remove the folder
			fs.removeSync( './test/output/' );

			expect( data ).to.equal( expectedData );
		} );

		it( 'should create the data.json from a single file input', function()
		{
			blockDocumentation.generateData( {
				input: {
					files: './example/input/IDummyFile.ts'
				},
				output: './test/output/',
				silent: true
			} );

			const data = JSON.stringify( fs.readJSONSync( './test/output/data.json' ) );
			const expectedData = JSON.stringify( fs.readJSONSync( './test/expected/data3.json' ) );

			// Remove the folder
			fs.removeSync( './test/output/' );

			expect( data ).to.equal( expectedData );
		} );

		it( 'should create the data.json from a array file input', function()
		{
			blockDocumentation.generateData( {
				input: {
					files: [
						'./example/input/IDummyFile.ts'
					]
				},
				output: './test/output/',
				silent: true
			} );

			const data = JSON.stringify( fs.readJSONSync( './test/output/data.json' ) );
			const expectedData = JSON.stringify( fs.readJSONSync( './test/expected/data3.json' ) );

			// Remove the folder
			fs.removeSync( './test/output/' );

			expect( data ).to.equal( expectedData );
		} );
	} )
} );