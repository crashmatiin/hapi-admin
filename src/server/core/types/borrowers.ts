import { UserProfileRating, VerificationStatus, UserProfileStatus, } from 'invest-models';
import { IListQueries, } from '../../utils/utils.interfaces';

export interface ListBorrowersQueries extends IListQueries {
	status?: UserProfileStatus.ACCEPTED | UserProfileStatus.REJECTED | UserProfileStatus.REVIEWING;
	paidExpired?: boolean;
	arrearsStatus?: boolean;
	from?: number;
	to?: number;
}
export interface IBorrowerId {
	borrowerId: string;
}
export interface IBorrowerRating {
	rating:
		| UserProfileRating.A
		| UserProfileRating.AA
		| UserProfileRating.AAA
		| UserProfileRating.B
		| UserProfileRating.BB
		| UserProfileRating.BBB
		| UserProfileRating.C
		| UserProfileRating.D;
}
