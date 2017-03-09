module.exports = function( grunt )
{
	const blockDocumentation = require( 'block-documentation' );

	grunt.registerMultiTask(
		'generate-block-documentation',
		'Generate documentation based on the Typescript interfaces',
		function()
		{
			// Run the generate task
			blockDocumentation.generate( this.options() )
		}
	);
};