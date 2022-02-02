import BigNumber from 'bignumber.js';
import { Payment, UserProfile, } from 'invest-models';
import { UserStats, } from '../core/types/generic';

export interface UserProfileWithLoansStats extends UserProfile {
	loansStats: {
		paid: number;
		debt: number;
		minGoal: number;
		maxGoal: number;
	};
}
export interface UserTemplate {
	stats: UserStats;
	users: UserProfileWithLoansStats[];
}

export interface IPaymentWithInvestorStats extends Payment {
	investorsPercent: BigNumber;
	paymentInvestorAmount: BigNumber;
}
