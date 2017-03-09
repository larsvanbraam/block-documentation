/*!
 * blockDocumentation
 * @copyright 2017 Lars van Braam <larsvanbraam@gmail.com>
 * MIT Licensed
 */

'use strict';

/**
 * @private
 * @description Module dependencies
 */
const fs = require( 'fs-extra' );
const path = require( 'path' );
const upperCamelCase = require( 'uppercamelcase' );
const camelCase = require( 'camelcase' );
const typhen = require( 'typhen' );

/**
 * @private
 * @description Default configuration for generating the documentation
 */
const config = {
	input: '',
	output: '',
	jsonFile: 'data.json',
	interfaceName: 'I{blockId}Options.ts',
	exampleBlockIdLabel: 'componentId',
	silent: false,
	placeholderValues: {
		string: 'Lorem ipsum dolor sit amet',
		boolean: true,
		number: 1
	}
};

/**
 * @private
 * @description The global result object
 * @type {{blocks: Array, references: Array, enums: Array}}
 */
let result = {blocks: [], references: [], enums: []};

/**
 * @private
 * @method generateData
 * @returns void
 */
function generateData( options )
{
	// Merge the provided config with the default config
	Object.assign( config, options );

	// Check for provided input / output
	if( !config.input.length || !config.output.length )
	{
		console.error( 'Please provide an input and an output path' );

		return;
	}

	// Get all the directories
	const blockDiretories = getDirectories( config.input );

	// Loop through all the blocks
	blockDiretories.forEach( function( blockDirectory, index )
	{
		const blockId = blockDirectoryToBlockId( blockDirectory );
		const properties = parseBlock( blockDirectory ).reverse();

		if( !config.silent )
		{
			const progress = Math.round( (index + 1) / blockDiretories.length * 100 ) + '%';

			console.log( '[' + progress + '] Parsing block with id: ' + blockId );
		}

		result.blocks.push( {
			blockId: blockId,
			properties: properties,
			example: JSON.stringify( {
				[config.exampleBlockIdLabel]: blockId,
				data: generateExampleJSON( properties, {} )
			}, null, 4 )
		} );
	} );

	if( !config.silent )
	{
		console.log( '[Info] All blocks have been parsed, writing to file..' );
	}

	writeOutputFile();
}

/**
 * @private
 * @method generate
 * @returns void
 */
function generate( options )
{
	// First generate the data
	generateData( options );

	// Copy the index.html from the src folder to the output folder
	fs.copySync( __dirname + '/src/index.html', config.output + 'index.html' );

	if( !config.silent )
	{
		console.log( '[Success] Copied the index.html file to the output directory' );
	}
}

/**
 * @method generateExampleJSON
 * @description This method recursively generated mock data for the types
 * @returns {Object}
 */
function generateExampleJSON( properties, base )
{
	properties.forEach( function( property )
	{
		let reference;

		if( hasReference( property.type, result.references ) )
		{
			reference = hasReference( property.type, result.references );

			// If we found a reference object, start generating the example JSON
			base[property.name] = generateExampleJSON( reference.properties, {} );
		}
		else if( hasReference( property.type, result.enums ) )
		{
			reference = hasReference( property.type, result.enums );

			// If we found a reference Enum, we always choose the first option as default
			base[property.name] = reference.properties[0].value;
		}
		else
		{
			switch( property.type )
			{
				case 'string':
				{
					base[property.name] = property.placeholder || config.placeholderValues.string;

					break;
				}
				case 'boolean':
				{
					base[property.name] = config.placeholderValues.boolean;

					break;
				}
				case 'number':
				{
					base[property.name] = config.placeholderValues.number;

					break;
				}
				case 'Object':
				{
					base[property.name] = generateExampleJSON( property.properties, {} );

					break;
				}
				case 'Array':
				{
					base[property.name] = [];
					base[property.name].push( generateExampleJSON( property.properties, {} ) );

					break;
				}
				default:
				{
					base[property.name] = 'TODO: ' + property.type;
				}
			}
		}
	} );


	return base;
}

/**
 * @private
 * @method parseBlock
 * @param blockDirectory
 * @returns {Array}
 */
function parseBlock( blockDirectory )
{
	// Get the file path
	const path = blockDirectoryToInterfacePath( blockDirectory );

	// Parse the options file with typhen to get all the properties
	const typhenResult = typhen.parse( path );

	// TODO: It kinda messes up when you reference to a interface in an array!
	const typenTypes = typhenResult.types[0];
	const properties = typenTypes.properties || typenTypes.type.properties;

	return parseProperties( properties );
}

/**
 * @private
 * @method parseProperties
 * @param properties
 * @returns {Array}
 */
function parseProperties( properties )
{
	if( !properties )
	{
		properties = []
	}

	// Keep track of the parsed properties
	let parsedProperties = [];

	// Parse all the properties
	properties.forEach( function( property )
	{
		// If the @ignore comment was added we will skip the property
		if( !getDocComment( property.docComment || [], '@ignore' ) )
		{
			parsedProperties.push( parseProperty( property ) );
		}
	} );

	// Return the parsed properties
	return parsedProperties;
}

/**
 * @private
 * @method parseProperty
 * @description Parse the properties and return the new parsed object
 * @returns {Object}
 */
function parseProperty( property )
{
	let childProperties = null;

	if( property.type.rawName === 'Array' )
	{
		childProperties = property.type.type.properties;
	}
	else if( property.type.rawName === '' ) // If the rawName == '' the interface was an object, it's super werid!
	{
		childProperties = property.type.properties;
	}

	return {
		name: property.rawName,
		type: getType( property.type ),
		required: !property.isOptional,
		defaultValue: getDocComment( property.docComment, '@defaultValue' ) || 'null',
		description: getDocComment( property.docComment, '@description' ),
		placeholder: getDocComment( property.docComment, '@placeholder' ),
		properties: parseProperties( childProperties )
	}
}

/**
 * @private
 * @method getDocComment
 * @description Fetch a desired doc comment based on the @property
 * @param docComment
 * @param property
 */
function getDocComment( docComment, property )
{
	if( Array.isArray( docComment ) )
	{
		for( let i = 0; i < docComment.length; i++ )
		{
			if( docComment[i].indexOf( property ) > -1 )
			{
				return docComment[i].replace( property + ' ', '' ).toString();
			}
		}
	}

	// No match was found
	return '';
}

/**
 * @private
 * @method getType
 * @param PrimitiveType
 * @description Get type from the type object
 */
function getType( PrimitiveType )
{
	if( PrimitiveType.properties && PrimitiveType.rawName.indexOf( 'I' ) === 0 )
	{
		parseObjectReference( PrimitiveType.rawName, PrimitiveType.properties );
	}
	else if( PrimitiveType.members )
	{
		parseEnumReference( PrimitiveType.rawName, PrimitiveType.members );
	}

	// No name means it's a custom Object
	if( PrimitiveType.rawName === '' )
	{
		return 'Object';
	}
	else
	{
		return PrimitiveType.rawName;
	}
}

/**
 * @private
 * @method hasReference
 * @param {string} name
 * @param {Array} array
 * @returns {boolean}
 */
function hasReference( name, array )
{
	return array.find( function( item )
	{
		return item.name === name
	} );
}

/**
 * @private
 * @method parseReference
 * @param {string} name
 * @param {Object} properties
 * @returns void
 */
function parseObjectReference( name, properties )
{
	if( !hasReference( name, result.references ) && Array.isArray( properties ) )
	{
		// Keep track of the parsed properties
		let parsedProperties = [];

		// Parse all the properties
		properties.forEach( function( property )
		{
			// If the @ignore comment was added we will skip the property
			if( !getDocComment( property.docComment || [], '@ignore' ) )
			{
				parsedProperties.push( parseProperty( property ) );
			}
		} );

		result.references.push( {
			name: name,
			properties: parsedProperties
		} );
	}
}

/**
 * @private
 * @method parseEnum
 * @description Parse an enum reference
 * @param {string} name
 * @param {Array} members
 * @returns void
 */
function parseEnumReference( name, members )
{
	if( !hasReference( name, result.enums ) && Array.isArray( members ) )
	{
		// Keep track of the parsed properties
		let parsedProperties = [];

		// Parse all the properties
		members.forEach( function( member )
		{
			// If the @ignore comment was added we will skip the property
			if( !getDocComment( member.docComment || [], '@ignore' ) )
			{
				parsedProperties.push( {
					name: member.rawName,
					value: member.value
				} );
			}
		} );

		result.enums.push( {
			name: name,
			properties: parsedProperties
		} );
	}
}

/**
 * @private
 * @writeOutputFile
 * @returns void
 */
function writeOutputFile()
{
	// Create the output folder if it's not there
	if( !fs.existsSync( config.output ) )
	{
		fs.mkdirSync( config.output );
	}

	// Write the *.json file
	fs.outputJsonSync(
		config.output + config.jsonFile,
		result,
		{
			spaces: 4
		}
	);

	if( !config.silent )
	{
		console.log( '[Success] Writing to file is done! See: ', config.output + config.jsonFile );
	}
}

/**
 * @private
 * @method getDirectories
 * @description Get all the folders within a desired folder
 * @param {string} src
 * @returns {string}
 */
function getDirectories( src )
{
	return fs.readdirSync( src ).filter( function( file )
	{
		return fs.statSync( path.join( src, file ) ).isDirectory();
	} );
}

/**
 * @private
 * @method blockDirectoryToBlockId
 * @param blockDirectory
 * @description Parse the block directory name to the internally used block id's
 * @returns {string}
 */
function blockDirectoryToBlockId( blockDirectory )
{
	return camelCase( blockDirectory.split( '-' ).slice( 1 ).join( '-' ) );
}

/**
 * @private
 * @method blockDirectoryToInterfacePath
 * @param blockDirectory
 * @returns {string}
 */
function blockDirectoryToInterfacePath( blockDirectory )
{
	// Parse the configured with the correct blockId
	const fileName = config.interfaceName.replace( '{blockId}', upperCamelCase( blockDirectory ) );

	return config.input + blockDirectory + '/' + fileName;
}

/**
 * @public
 * @description Module exports
 */
module.exports = {
	generateData: generateData,
	generate: generate
};