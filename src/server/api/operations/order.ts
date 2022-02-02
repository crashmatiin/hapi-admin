import { col, } from 'sequelize';

/* eslint-disable */
export const order = (request) => {
	let orderObject = request.query.order;
	const order = [];
	if (orderObject) {
		Object.entries(orderObject).forEach(([key, value]) => {
			const element = [key, value];
			order.push(element);
		});
	} else {
		order.push(['createdAt', 'DESC']);
	}
	return {
		order,
	};
};

/* eslint-disable */
export const orderWithCol = (request) => {
	let orderObject = request.query.order;
	const order = [];
	if (orderObject) {
		Object.entries(orderObject).forEach(([key, value]) => {
			const element = [col(key), value];
			order.push(element);
		});
	}
	return {
		order,
	};
};
