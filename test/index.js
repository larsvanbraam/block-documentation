'use strict';

const expect = require( 'chai' ).expect;
const blockDocumentation = require( '../index' );
const fs = require( 'fs-extra' );

describe( '#blockDocumentation', function()
{
	describe( '#generateData', function()
	{
		it( 'should create the data.json file from the interfaces', function()
		{
			blockDocumentation.generateData( {
				input: './example/input/',
				output: './test/output/',
				silent: true
			} );

			const data = fs.readJSONSync( './test/output/data.json' );
			const expectedData = fs.readJSONSync( './test/expected/data.json' );

			expect( JSON.stringify( data ) ).to.equal( JSON.stringify( expectedData ) );
		} );
	} )
} );