import { Op, WhereOptions, } from 'sequelize';

export const filterRange = (
	field: string | number,
	range: Array<string | number>
): WhereOptions => ({
	[field]: {
		[Op.in]: range,
	},
});
