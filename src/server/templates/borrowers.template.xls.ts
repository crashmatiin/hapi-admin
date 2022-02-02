import { userRole, } from 'invest-models';
import { UserTemplate, } from './templates.interfaces';

const userRoleRelations = {
	simple: {
		[userRole.BORROWER]: 'Заемщики',
		[userRole.INVESTOR]: 'Инвесторы',
	},
	inclined: {
		[userRole.BORROWER]: 'Заемщиков',
		[userRole.INVESTOR]: 'Инвесторов',
	},
};

export function returnBorrowersTemplate(
	data: UserTemplate,
	userType: userRole
): Array<Array<string | number>> {
	return [
		[
			`Общее число ${userRoleRelations.inclined[userType]}: ${data.stats.total}`,
			`Общее число активных ${userRoleRelations.inclined[userType]}: ${data.stats.active}`,
			`Общее число заблокированных ${userRoleRelations.inclined[userType]}: ${data.stats.banned}`,
			`Общее число верифицированных ${userRoleRelations.inclined[userType]}: ${data.stats.verified}`
		],
		[`${userRoleRelations.simple[userType]}`, 'Сумма', 'Доход', 'Статус', 'Статус верификации'],
		...data.users.map((item) => [
			`${item.user.lastName} ${item.user.firstName} ${item.user.middleName}`,
			item.loansStats.paid,
			item.loansStats.paid + item.loansStats.debt,
			item.status,
			item.user.verificationStatus
		])
	];
}
