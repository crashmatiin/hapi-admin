import {
	UserProfile,
	UserProfileStatus,
	LoanStatus,
	LoanArrearsStatus,
	Loan,
} from 'invest-models';
import { IListQueries, } from '../../utils/utils.interfaces';

export interface IInvestorsNumericStats {
	active: number;
	verified: number;
	banned: number;
	total: number;
	investedTotal: number;
	loansLeft: number;
	loansPaid: number;
}

export interface IInvestorsStats {
	stats: IInvestorsNumericStats;
	investors: UserProfile[];
}
export interface IFields {
	active: number;
	verified: number;
	banned: number;
}
export interface ListInvestorsQueries extends IListQueries {
	status?:
		| UserProfileStatus.ACCEPTED
		| UserProfileStatus.CREATED
		| UserProfileStatus.HISTORY
		| UserProfileStatus.REJECTED
		| UserProfileStatus.REVIEWING;
	from?: number;
	to?: number;
}
export interface IInvestorId {
	investorId: string;
}

export interface ListInvestorProjectsQueries extends IListQueries {
	status?:
		| LoanStatus.ACTIVE
		| LoanStatus.BANK_CONFIRMATION
		| LoanStatus.CLOSED
		| LoanStatus.DECLINED
		| LoanStatus.FINANCED
		| LoanStatus.NEW
		| LoanStatus.REVIEWING;
	arrearsStatus?:
		| LoanArrearsStatus.ASSIGNMENT_AGREEMENT
		| LoanArrearsStatus.IMPOSSIBILITY_OF_RECOVERY
		| LoanArrearsStatus.NO_OVERDUE_DEBT
		| LoanArrearsStatus.OVERDUE
		| LoanArrearsStatus.SUCCESSFUL_CLOSING;
	from?: number;
	to?: number;
}
export interface ListInvestorProjectsHoldQueries extends IListQueries {
	from?: number;
	to?: number;
}
export interface IInvestorLoansXslx {
	count: number;
	rows: Loan[];
}
