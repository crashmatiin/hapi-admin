export interface IOutputEmpty {
	ok: boolean;
}

export interface IOutputOk<R = Record<string, string>> {
	ok: boolean;
	result: R;
}

export interface IOutputPagination<R = Record<string, string>> {
	ok: boolean;
	result: {
		count: number[] | number;
		rows: R;
	};
}

export interface ICreateSupportReply {
	answerToAppeal: string;
	files: [
		{
			id: string;
			name: string;
		},
	];
}

export interface IAdminPermissions {
	fullName: string;
	email: string;
	role: {
		key: string;
		serialNumber: number;
		globalSettings: number;
		news: number;
		notificationsFromUsers: number;
		notificationsForUsers: number;
		accountsOperations: number;
		signaturesVerification: number;
		registryLookup: number;
		reports: number;
		users: number;
		documentsRegistry: number;
		borrowers: number;
		investors: number;
		support: number;
		permissionLevels: number;
		creditAgreements: number;
		legalOpinions: number;
		decisionsOnApplications: number;
		platformDocuments: number;
		faq: number;
		rosFinVerification: number;
		expressLoan: number;
		createdAt: string;
		updatedAt: string;
	};
	writePermissions: Array<string>;
	readPermissions: Array<string>;
}
