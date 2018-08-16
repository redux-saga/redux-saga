module.exports = ({ types: t, template }) => {

	const isAssert = t.buildMatchMemberExpression('assert.ok')

	const tmpl = template(`expect(A).toBe(true)`)

	return {
		visitor: {
			CallExpression(path) {
				if (!isAssert(path.get('callee').node)) {
					return
				}

				if (path.get('arguments').length > 1) {
					console.log(path.toString())
					throw new Error('da')
				}
				const [a] = path.get('arguments')
				path.replaceWith(tmpl({ A: a.node }))
			},
			// Function(path) {
			// 	const params = path.get('params')
			// 	if (params.length !== 1 || params[0].node.name !== 'assert') {
			// 		return
			// 	}
			// 	params[0].remove()
			// },
		},
	}
}

