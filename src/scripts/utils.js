export function logs (type, message) {
	if (typeof type !== 'string' || console[type] === undefined) {
		console.error('Logs function "type" parameter invalid!')
		return
	}
	if (type === 'error') {
		throw new Error(message)

	}
	console[type](message)
}

export function inherit(prototype) {
	if (prototype === null) {
		throw new TypeError('Prototype object of inherit(prototype) cannot be null.');
	}
	if (Object.create) {
		return Object.create(prototype.prototype);
	}
	var type = typeof prototype;
	if (type !== 'object' && type !== 'function') {
		throw new TypeError('Prototype object of inherit(prototype) is not an object or a function.');
	}
	var constructor = new Function('');
	constructor.prototype = prototype.prototype;
	return new constructor();
}

export function defineSubClass(baseClassConstructor, subClassConstructor) {
	subClassConstructor.prototype = inherit(baseClassConstructor);
	subClassConstructor.prototype.constructor = subClassConstructor;
}
