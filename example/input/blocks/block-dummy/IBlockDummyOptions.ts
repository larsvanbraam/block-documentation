import IImage from "./interface/IImage";
import Theme from "./enum/Theme";

interface IBlockDummyOptions
{
	/**
	 * @ignore
	 * @description This is the Id of the interface that will be ignored by the generate task
	 */
	id:string;
	/**
	 * @description The heading displayed
	 * @defaultValue Define the default value of the property if required
	 * @placeholder This is a defined placeholder value
	 */
	header:string;
	/**
	 * @description The image is referenced to another interface
	 */
	image:IImage
	/**
	 * @description The theme is referenced to an external Enum
	 */
	theme?:Theme
}

export default IBlockDummyOptions