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