'use strict';

const expect = require( 'chai' ).expect;
const blockDocumentation = require( '../index' );
const fs = require( 'fs-extra' );

const exampleOutput = {
	"blocks": [
		{
			"blockId": "dummy",
			"properties": [
				{
					"name": "theme",
					"type": "Theme",
					"required": false,
					"defaultValue": "null",
					"description": "The theme is referenced to an external Enum",
					"placeholder": "",
					"properties": []
				},
				{
					"name": "image",
					"type": "IImage",
					"required": true,
					"defaultValue": "null",
					"description": "The image is referenced to another interface",
					"placeholder": "",
					"properties": []
				},
				{
					"name": "header",
					"type": "string",
					"required": true,
					"defaultValue": "Define the default value of the property if required",
					"description": "The heading displayed",
					"placeholder": "This is a defined placeholder value",
					"properties": []
				}
			],
			"example": "{\n    \"componentId\": \"dummy\",\n    \"data\": {\n        \"theme\": 0,\n        \"image\": {\n            \"url\": \"path/to/image.jpg\"\n        },\n        \"header\": \"This is a defined placeholder value\"\n    }\n}"
		}
	],
	"references": [
		{
			"name": "IImage",
			"properties": [
				{
					"name": "url",
					"type": "string",
					"required": true,
					"defaultValue": "null",
					"description": "url of the image",
					"placeholder": "path/to/image.jpg",
					"properties": []
				}
			]
		}
	],
	"enums": [
		{
			"name": "Theme",
			"properties": [
				{
					"name": "LIGHT",
					"value": 0
				},
				{
					"name": "DARK",
					"value": 1
				}
			]
		}
	]
};

describe( '#blockDocumentation', function()
{
	it( 'should create the data.json file from the interfaces', function()
	{
		blockDocumentation.generateData( {
			input: './example/input/',
			output: './example/output/'
		} );

		const data = fs.readJSONSync( './example/output/data.json' );

		expect( JSON.stringify( data ) ).to.equal( JSON.stringify( exampleOutput ) );
	} );
} );