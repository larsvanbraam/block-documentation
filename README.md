# Generate block documentation
Task to automatically generate documentation for backend development based on [TypeScript](https://www.typescriptlang.org/) interfaces

## Setup
Clone the repository and then run:
```
npm i
```

## Demo
To preview output run the following script
```
npm test
```

## Documentation
This module scans a provided directory filled with block directories, inside each directory it looks for a Interface with all the properties, these properties can be primitive types or references to other interfaces or enums.

### Example folder structure
    Root folder
    ├── block-foo
    │   └── IBlockFooOptions.ts
    ├── block-bar
    │   └── IBlockBarOptions.ts
    └── ...

### Configuration
There are a few properties that you can configure:

#### Required configuration:
* Input: This is root folder where the task will look for the blocks
* Output: this is the output path where the documentation will be generated

#### Additional configuration
* jsonFile: This is the name of the output json file that will contain all the documentation
* interfaceName: This is the name of the file that contains the Interface the part with {blockId} will be replaced with a CamelCase version of the folder name
* placeholderValues: This are the values that are used when no ``@placeholder`` is provided

#### Example configuration
```javascript
const blockDocumentation = require('block-documentation');

blockDocumentation.generate({
    input: './input/',
    output: './output/',
    jsonFile: 'data.json',
    interfaceName: 'I{blockId}Options.ts',
    placeholderValues: {
        string: 'Lorem ipsum dolor sit amet',
        boolean: true,
        number: 1
    }
})
```

### Creating interfaces
All blocks have an interface which describes the data required for the block to provide the data used in the documentation you can use a couple of [YUIDoc](http://yui.github.io/yuidoc/) comments

#### Used YUI doc comments
* ``@placeholder``: This will be used to overwrite the predefined placeholder value
* ``@ignore``: If this comment is available it will be skipped
* ``@description``: This is the description about the property
* ``@defaultValue``: If a default value is present you can provide it with this comment

#### Example Interface
```typescript
import IImage from "./interface/IImage";
import Theme from "./enum/Theme";

interface IBlockDummyOptions
{
	/**
	 * @ignore
	 * @property
	 * @description This is the Id of the interface that will be ignored by the generate task
	 */
	id:string;
	/**
	 * @property
	 * @description The heading displayed
	 * @defaultValue Define the default value of the property if required
	 * @placeholder This is a defined placeholder value
	 */
	header:string;
	/**
	 * @property
	 * @description The image is referenced to another interface
	 */
	image:IImage
	/**
	 * @property
	 * @description The theme is referenced to an external Enum
	 */
	theme?:Theme
}

export default IBlockDummyOptions
```