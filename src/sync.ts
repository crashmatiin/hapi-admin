import { initDatabase, loadDatabaseConfig, } from 'invest-models';

async function init() {
	await initDatabase(
		{
			...loadDatabaseConfig(),
			dialect: 'postgres',
		},
		true
	);
	console.log('Database sync complete');
}

try {
	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	init();
} catch (err) {
	console.error(err);
}
