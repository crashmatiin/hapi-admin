import { QualificationStatus, } from 'invest-models';

export interface ITermOfOffice {
	termOfOffice: number;
}

export interface IQualificationStatus {
	qualificationStatus:
		| QualificationStatus.VERIFIED
		| QualificationStatus.FOR_VERIFICATION
		| QualificationStatus.UNVERIFIED;
}

export interface IId {
	id: string;
}
