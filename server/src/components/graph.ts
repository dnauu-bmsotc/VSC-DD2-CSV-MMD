import { ERType, Index } from '.';
import { GraphData, GraphViewDataAnswer } from '../../../shared/settings';
import { AST, ASTElement, GameType } from './parser';
import { FieldsDescription } from './schema';

export function getGraphData(ast: AST, line: number, gameType: GameType, index: Index, schema: FieldsDescription): GraphViewDataAnswer {
	const data: GraphData = {
		nodes: [],
		edges: [],
	}
	let root = null;
	for (const e of ast) {
		if ((e.fullRange.start.line <= line) && (line <= e.fullRange.end.line)) {
			root = e;
		}
	}
	if (!root) {
		return data;
	}
	const getGraphDataRecursive = (element: ASTElement) => {
		if (data.nodes.find(n => n.id === element.id)) {
			return;
		}
		data.nodes.push({
			id: element.id,
			label: `${element.elementType}\n${element.name}`,
			color: (element.id === root.id) ? "#71a3ff" : "#fdad90",
			shape: "box",
		});
		// additional connections
		const elementDefinition = schema[element.elementType];
		if (!elementDefinition) {
			return;
		}
		if (!elementDefinition.graphViewExpand && (element.id !== root.id)) {
			return;
		}
		// process elements referred to by this element
		for (const receiver of index.getReceiversByElementId(element.id) ?? []) {
			if (receiver.type === ERType.tag) {
				continue;
			}
			const emitters = index.findEmitters(gameType, receiver);
			for (const emitter of emitters) {
				const connectedElement = index.getElementByNumericId(emitter.ownerId);
				if (!connectedElement) {
					continue;
				}
				if (!data.edges.find(e => (e.from === element.id) && (e.to === connectedElement.id))) {
					data.edges.push({
						from: element.id,
						to: connectedElement.id,
						arrows: {
							to: {
								enabled: true,
								type: "arrow",
							},
						},
					});
				}
				getGraphDataRecursive(connectedElement);
			}
		}
		const connectedElementEmitters = elementDefinition.graphViewExtraConnections.map(elementType => {
			return index.findEmitters(gameType, { type: ERType.id, group: elementType, name: element.name });
		}).flat();
		const connectedElements = [...new Set(connectedElementEmitters.map(e => index.getElementByNumericId(e.ownerId)))].filter(e => !!e);
		for (const connectedElement of connectedElements) {
			getGraphDataRecursive(connectedElement);
			if (!data.edges.find(edge => (edge.from === element.id) && (edge.to === connectedElement.id))) {
				data.edges.push({
					from: element.id,
					to: connectedElement.id,
					arrows: {
						to: {
							enabled: true,
							type: "arrow",
						},
					},
					dashes: [5, 5],
				});
			}
		}
	}
	getGraphDataRecursive(root);
	return data;
}