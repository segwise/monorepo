const excludeWords = ['a', 'e', 'i', 'o', 'u', 'da', 'de', 'do', 'dos', 'em'];

function capitalizeFirstLetters(text: string = '') {
	const words = text.split(' ');

	const capitalizedWords = words.map((word) => {
		const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');

		if (excludeWords.includes(cleanWord.toLowerCase())) {
			return word.toLowerCase();
		} else {
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		}
	});

	return capitalizedWords.join(' ');
}

export { capitalizeFirstLetters };
