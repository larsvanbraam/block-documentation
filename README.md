# Generate block documentation
Task to automatically generate documentation for backend development based on [TypeScript](https://www.typescriptlang.org/) interfaces

## Setup
Clone the repository and then run:
```
npm i
```

## Preview example documentation
To preview output run the following script
```
npm test
```

## Documentation
This module scans a provided directory filled with block directories, inside each directory it looks for a Interface that contains the used within the block.

### Example folder structure
    Root folder
    ├── block-foo
    │   └── IBlockFooOptions.ts
    ├── block-bar
    │   └── IBlockBarOptions.ts
    └── ...

### Configuration
There are a few properties that you can configure:

#### Main configuration:
* Input: This is root folder where the task will look for the blocks
* Output: this is the output path where the documentation will be generated

#### Additional configuration
* jsonFile: This is the name of the output json file that will contain all the documentation
* interfaceName: This is the name of the file that contains the Interface the part with {blockId} will be replaced with a CamelCase version of the folder name
* placeholderValues: This are the values that are used when no ``@placeholder`` is provided

#### Available YUI doc comments
* ``@placeholder``: This will be used to overwrite the predefined placeholder value
* ``@ignore``: If this comment is available it will be skipped
* ``@description``: This is the description about the property
* ``@defaultValue``: If a default value is present you can provide it with this comment