function sortArray<T>(array: T[], compareFn?: (a: T, b: T) => number): T[] {
	return [...array].sort(compareFn);
}

export { sortArray };
