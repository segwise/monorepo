function transformArray(props: unknown) {
	return Array.isArray(props) ? props : [props];
}

export { transformArray };
