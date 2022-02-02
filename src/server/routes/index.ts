import actions from './actions';
import admins from './admins';
import auth from './auth';
import borrowers from './borrowers';
import faq from './faq';
import investors from './investors';
import moneybox from './moneybox';
import settings from './settings';
import users from './users';
import support from './support';
import loans from './loans';
import expressLoan from './expressLoan';
import usersNotifications from './usersNotifications';
import news from './news';
import platformDocs from './platformDocuments';
import deposits from './deposit';
import withdrawals from './withdrawals';
import revise from './revise';
import registry from './registry';
import investments from './investments';
import documents from './documents';

export default [
	...actions,
	...admins,
	...auth,
	...borrowers,
	...faq,
	...investors,
	...moneybox,
	...settings,
	...users,
	...support,
	...loans,
	...expressLoan,
	...usersNotifications,
	...news,
	...platformDocs,
	...deposits,
	...withdrawals,
	...registry,
	...revise,
	...investments,
	...documents
];
