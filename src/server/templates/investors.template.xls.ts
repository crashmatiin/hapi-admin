import { IInvestorsStats, } from '../core/types/investors';

export function returnTemplate(data: IInvestorsStats) {
	return [
		[
			`Общее число инвесторов: ${data.stats.total}`,
			`Общее число активных инвесторов: ${data.stats.active}`,
			`Общее число заблокированных инвесторов: ${data.stats.banned}`,
			`Общее число верифицированных инвесторов: ${data.stats.verified}`
		],
		['Инвесторы', 'Сумма', 'Доход', 'Статус', 'Статус верификации'],
		...data.investors.map((item) => [item.user.firstName, 0, 0, item.user.verificationStatus])
	];
}
