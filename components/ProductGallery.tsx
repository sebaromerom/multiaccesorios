[{
	"resource": "/c:/Users/sebar/Proyectos/carcasas-store/app/NavBar.tsx",
	"owner": "eslint1",
	"code": {
		"value": "react-hooks/set-state-in-effect",
		"target": {
			"$mid": 1,
			"path": "/reference/eslint-plugin-react-hooks/lints/set-state-in-effect",
			"scheme": "https",
			"authority": "react.dev"
		}
	},
	"severity": 8,
	"message": "Error: Calling setState synchronously within an effect can trigger cascading renders\n\nEffects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:\n* Update external systems with the latest state from React.\n* Subscribe for updates from some external system, calling setState in a callback function when external state changes.\n\nCalling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).\n\nC:\\Users\\sebar\\Proyectos\\carcasas-store\\app\\NavBar.tsx:14:5\n  12 |   // sin interrumpir los renderizados de los componentes hijos (como el carrito).\n  13 |   useEffect(() => {\n> 14 |     setIsOpen(false);\n     |     ^^^^^^^^^ Avoid calling setState() directly within an effect\n  15 |   }, [pathname]);\n  16 |\n  17 |   return (",
	"source": "eslint",
	"startLineNumber": 14,
	"startColumn": 5,
	"endLineNumber": 14,
	"endColumn": 14,
	"modelVersionId": 1,
	"origin": "extHost1"
}]