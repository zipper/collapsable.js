import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import {terser} from 'rollup-plugin-terser';
import path from 'path';

import pkg from './package.json';
const output = {
	banner: `/**\n * ${pkg.title} - ${pkg.description} \n * ${pkg.homepage}\n *\n * @author ${pkg.author.name} <${pkg.author.email}>\n * @license ${pkg.license}\n *\n * @version ${pkg.version}\n */\n`,
	sourcemap: true,
};

const babelPlugin = babel({
	exclude: /node_modules/,
	include: 'src/**',
	babelHelpers: 'runtime',
});

export default [
	{
		// ESM build for modern tools like webpack
		input: 'src/index.esm.ts',
		output: {
			...output,
			file: pkg.module,
			format: 'esm',
		},
		external: [
			/@babel\/runtime/,
			...Object.keys(pkg.dependencies || {}),
			...Object.keys(pkg.peerDependencies || {}),
		],
		plugins: [
			resolve(),
			commonjs(),
			typescript(),
			babelPlugin,
		],
	},
	{
		// type declaration files for ESM build
		input: 'src/index.esm.ts',
		output: {
			...output,
			dir: path.dirname(pkg.module),
			format: 'esm',
		},
		external: [
			/@babel\/runtime/,
			...Object.keys(pkg.dependencies || {}),
			...Object.keys(pkg.peerDependencies || {}),
		],
		plugins: [
			typescript({
				declaration: true,
				declarationDir: path.dirname(pkg.module),
				emitDeclarationOnly: true,
			}),
		],
	},
	{
		// minified
		input: 'src/index.ts',
		output: {
			...output,
			file: pkg.unpkg,
			format: 'umd',
			name: 'collapsable.js',
		},
		external: Object.keys(pkg.peerDependencies || {}),
		plugins: [
			resolve(),
			commonjs(),
			typescript(),
			babelPlugin,
			terser(),
		],
	},
	{
		// non-minified
		input: 'src/index.ts',
		output: {
			...output,
			file: pkg.main,
			format: 'umd',
			name: 'collapsable.js',
		},
		external: Object.keys(pkg.peerDependencies || {}),
		plugins: [
			resolve(),
			commonjs(),
			typescript(),
			babelPlugin,
		],
	},
];
