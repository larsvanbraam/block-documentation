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
const stripExtension = require( 'strip-extension' );

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
let result;

/**
 * @private
 * @method generateData
 * @returns void
 */
function generateData( options )
{
	// Empty the result
	result = {blocks: [], references: [], enums: [], stringLiterals:[], files: []};

	// Merge the provided config with the default config
	Object.assign( config, options );

	const inputDirectoryPath = getInputDirectoryPath();

	// Check for provided input / output
	if( (!inputDirectoryPath && !config.input.files) || !config.output.length )
	{
		console.error( 'Please provide an input and an output path' );

		return;
	}

	if( inputDirectoryPath )
	{
		// Parse the input directory path
		parseInputDirectoryPath( inputDirectoryPath )
	}

	// Parse the other files
	if( typeof config.input === 'object' )
	{
		parseInputFiles( config.input.files )
	}

	if( !config.silent )
	{
		console.log( '[Info] All blocks have been parsed, writing to file..' );
	}

	writeOutputFile();
}

/**
 * @private
 * @method parseInputDirectoryPath
 * @param inputDirectoryPath
 */
function parseInputDirectoryPath( inputDirectoryPath )
{
	// Get all the directories
	const blockDirectories = getDirectories( inputDirectoryPath );

	// Loop through all the blocks
	blockDirectories.forEach( function( blockDirectory, index )
	{
		const blockId = blockDirectoryToBlockId( blockDirectory );
		const interfacePath = blockDirectoryToInterfacePath( blockDirectory );
		const properties = parseBlock( interfacePath ).reverse();

		// Log the progress
		if( !config.silent )
		{
			const progress = Math.round( (index + 1) / blockDirectories.length * 100 ) + '%';

			console.log( '[' + progress + '] Parsing block with id: ' + blockId );
		}

		// Store the result
		result.blocks.push( {
			name: blockId,
			properties: properties,
			example: JSON.stringify( {
				[config.exampleBlockIdLabel]: blockId,
				data: generateExampleJSON( properties, {} )
			}, null, 4 )
		} );
	} );
}

/**
 * @private
 * @method parseInputFiles
 * @param inputFiles
 */
function parseInputFiles( inputFiles )
{
	var files = [];

	// Only one file has been defined
	if( typeof inputFiles === 'string' )
	{
		files.push( inputFiles );
	}
	// Multiple files have been defined
	else if( Array.isArray( inputFiles ) )
	{
		files = files.concat( inputFiles );
	}

	files.forEach( function( file, index )
	{
		const properties = parseBlock( file ).reverse();
		const fileName = stripExtension( file.split( '/' ).pop() );

		// Log the progress
		if( !config.silent )
		{
			const progress = Math.round( (index + 1) / files.length * 100 ) + '%';

			console.log( '[' + progress + '] Parsing file with name: ' + fileName );
		}

		// Store the result
		result.files.push( {
			name: fileName,
			properties: properties,
			example: JSON.stringify( generateExampleJSON( properties, {} ), null, 4 )
		} );
	} )
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
		else if( hasReference( property.type, result.stringLiterals ) )
		{
			reference = hasReference( property.type, result.stringLiterals );

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
 * @param path
 * @returns {Array}
 */
function parseBlock( path )
{
	// Parse the options file with typhen to get all the properties
	const typhenResult = typhen.parse( path );

	// Find the correct exported module for the file
	const typhenTypes = typhenResult.types.find( function( type, index )
	{
		return type.rawName == path.split( '/' ).pop().split( '.' ).shift();
	} );

	const properties = typhenTypes.properties || typhenTypes.type.properties;

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
	else if( property.type.rawName === '' && property.type.properties ) // If the rawName == '' the interface was an object, it's super werid!
	{
		childProperties = property.type.properties;
	}


	return {
		name: property.rawName,
		type: getType( property.type, getDocComment(property.docComment, '@rawName') ),
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
 * @param rawName
 * @description Get type from the type object
 */
function getType( PrimitiveType, rawName )
{
	if( PrimitiveType.properties && PrimitiveType.rawName.indexOf( 'I' ) === 0 )
	{
		parseObjectReference( PrimitiveType.rawName, PrimitiveType.properties );
	}
	else if( PrimitiveType.members )
	{
		parseEnumReference( PrimitiveType.rawName, PrimitiveType.members );
	}
	else if(PrimitiveType.types)
	{
		PrimitiveType.rawName = rawName

		parseStringLiteralReference(rawName, PrimitiveType.types);
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
 * @method parseStringLiteralReference
 * @description Parse a string literal reference
 * @param {string} name
 * @param {Array} stringLiterals
 * @returns void
 */
function parseStringLiteralReference( name, stringLiterals )
{
	if( !hasReference( name, result.stringLiterals ) && Array.isArray( stringLiterals ) )
	{
		// Keep track of the parsed properties
		let parsedProperties = [];

		// Parse all the properties
		stringLiterals.forEach( function( stringLiteral )
		{
			// If the @ignore comment was added we will skip the property
			if( !getDocComment( stringLiteral.docComment || [], '@ignore' ) )
			{
				// Strip out the " characters
				const text = stringLiteral.text.replace(/"/g, "");

				parsedProperties.push( {
					name: text,
					value: text
				} );
			}
		} );

		result.stringLiterals.push( {
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

	return getInputDirectoryPath() + blockDirectory + '/' + fileName;
}

/**
 * @private
 * @method getInputDirectoryPath
 * @returns {string}
 */
function getInputDirectoryPath()
{
	return typeof config.input === 'object' ? config.input.folder : config.input;
}

/**
 * @public
 * @description Module exports
 */
module.exports = {
	generateData: generateData,
	generate: generate
};
