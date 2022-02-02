import { Request, } from '@hapi/hapi';

/**
 * Extract paging parameters from request query string
 * @param request Request object
 * @returns paging parameters
 */
export const paginate = (request): { offset: number; limit: number } => {
	const offset: number = request.query?.offset || 0;
	const limit: number = request.query?.limit || 10;
	return {
		offset,
		limit,
	};
};
