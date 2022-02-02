export const where = (request) => {
	let { where, } = request.query;
	if (!where) {
		where = {};
	}

	return {
		where,
	};
};
