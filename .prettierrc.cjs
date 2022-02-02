module.exports = {
	bracketSpacing: true,
	semi: true,
	trailingComma: 'all',
	singleQuote: true,
	printWidth: 100,
	tabWidth: 2,
	useTabs: true,
	overrides: [
		{
			files: '*.ts',
			options: {
				parser: 'typescript',
			},
		},
	],
};
