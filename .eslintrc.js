require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
	root: true,
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended', 'prettier'],
	rules: {
		'@typescript-eslint/ban-ts-comment': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'prettier/prettier': 1
	},
	ignorePatterns: ['*.js']
}
