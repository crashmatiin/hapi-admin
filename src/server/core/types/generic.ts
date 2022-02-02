export interface IListParams {
	limit: number;
	offset: number;
	query?: string;
	order: string;
}
export interface UserStats {
	total: number;
	active: number;
	banned: number;
	verified: number;
	sum: number;
	paid: number;
	debt: number;
}
