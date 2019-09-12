module.exports = function transformer(file, api) {
	// The imports that we want to move from 'redux-saga' into 'redux-saga/effects';
	const EFFECTS_TO_MOVE = ['takeEvery','takeLatest','throttle','delay'];
	// This array holds the list of effects that have been moved
	// Array<j.ImportSpecifier>
	let movedEffectImportSpecifiers = [];
	
	const j = api.jscodeshift;
	const root = j(file.source);
	let reduxSagaImportWithComments;

	// Find all `import Default, { named } from 'redux-saga';`
	const reduxSagaImports = root.find(j.ImportDeclaration, {
		source: { value: 'redux-saga' },
	});

	if (reduxSagaImports.length === 0) {
		return;
	}

	// Step 1 - Remove EFFECTS_TO_MOVE named imports from 'redux-saga';

	reduxSagaImports.forEach(declaration => {
		// Remove the desired named imports (ImportSpecifier) from each declaration
		// Also record which imports we have removed, because we'll need to re-import them later
		declaration.value.specifiers = declaration.value.specifiers.filter(specifier => {
			if (specifier.type === 'ImportSpecifier') {
				const importName = specifier.imported.name;
				if (EFFECTS_TO_MOVE.includes(importName)) {
					if (!movedEffectImportSpecifiers.includes(specifier)) {
						movedEffectImportSpecifiers.push(specifier);
					}
					return false;
				} else {
					return true;
				}
			} else {
				return true;
			}
		})

		// If we have removed all of the imports from a given ImportDeclaration, lets
		// just remove it, so we don't leave behind an `import from 'redux-saga';`
		if (declaration.value.specifiers.length === 0) {
			if (declaration.value.comments) {
				// If the first import has comments, we'll keep a reference so that we
				// can remove it later, but preserve the comments
				// This is meant to preserve comments above for top-of-file imports and
				// keep the diff minimal when removing imports
				if (!reduxSagaImportWithComments) {
					reduxSagaImportWithComments = declaration;
				} else {
					/*
						Otherwise, just remove it - this may result in loss of comments
						This would be in cases where users had like

							// @flow
							import { takeLatest } from 'redux-saga';
							// Similar to takeLatest but...
							import { takeEvery } from 'redux-saga';

						Both imports would be modified to `import from 'redux-saga';`
						We would preserve comments on the first, but not the second.

						here, `declaration` is a reference to the 2nd import from 'redux-saga';
					*/
					declaration.prune();
				}
			} else {
				// No comments on this import, safe to remove
				declaration.prune();
			}
		}
	});

	// Step 2 - Re-import movedEffectImportSpecifiers via 'redux-saga/effects'
	// We will use an existing 'redux-saga/effects' import, or create a new one

	if (movedEffectImportSpecifiers.length) {
		let destinationImport = root
			// Search for an existing 'redux-saga/effects' import
			.find(j.ImportDeclaration, {
				source: { value: 'redux-saga/effects' },
			})


		// If we found an existing 'redux-saga/effects' import, add the movedEffectImportSpecifiers to it
		if (destinationImport.length) {
			destinationImport.at(0).forEach(declaration => {
				declaration.value.specifiers = declaration.value.specifiers.concat(movedEffectImportSpecifiers)
			})

			// Since we're not creating a new import, we'll just move the comments from the prior
			// reduxSagaImportWithComments import to the next import on the page
			if (reduxSagaImportWithComments) {
				// If the import that we are replacing has comments that we want to keep
				// Lets try to add them to the next import, or the previous one
				// Prefer next import first, because it could be top of file
				if (reduxSagaImportWithComments.value.comments) {
					root.find(j.ImportDeclaration)
						.filter(function(a,b,c) {
							if (a === reduxSagaImportWithComments) {
								const nextImport = c[b+1];
								const prevImport = c[b-1];
								if (nextImport) {
									nextImport.value.comments = reduxSagaImportWithComments.value.comments;
								} else if (prevImport) {
									prevImport.value.comments = reduxSagaImportWithComments.value.comments;
								}
							}
							return true;
						});	
				}
				reduxSagaImportWithComments.prune();
			}
		} else {
			// If we do not have an existing 'redux-saga/effects' import, let's create one
			// and then use it to replace the reduxSagaImportWithComments import

			const newReduxSagaEffectsImport = j.importDeclaration(
				movedEffectImportSpecifiers,
				j.literal('redux-saga/effects'),
			);
			if (reduxSagaImportWithComments.value.comments) {
				newReduxSagaEffectsImport.comments = reduxSagaImportWithComments.value.comments;
			}

			// Replace the reduxSagaImportWithComments with our newly created one one
			root
				// Find the first `import 'redux-saga';` to replace it
				.find(j.ImportDeclaration).filter(declaration => {
					return declaration === reduxSagaImportWithComments;
				}).at(0).replaceWith(newReduxSagaEffectsImport)
		}
	}

	// Step 3 - Return file contents
	
	return root.toSource();
}
