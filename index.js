let items = [];

const sortSelect = document.getElementById('sort-select');
const itemList = document.getElementById('item-list');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

let currentSort = 'az';
let currentQuery = '';

const formatDate = (dateString) => {
	const normalizedDate = dateString.includes('T')
		? dateString
		: `${dateString}T00:00:00`;
	const date = new Date(normalizedDate);

	if (Number.isNaN(date.getTime())) {
		return 'Unknown date';
	}

	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
};

const sortItems = (list, sortType) => {
	const sorted = [...list];

	if (sortType === 'az') {
		sorted.sort((left, right) => left.title.localeCompare(right.title));
	}

	if (sortType === 'za') {
		sorted.sort((left, right) => right.title.localeCompare(left.title));
	}

	if (sortType === 'newest') {
		sorted.sort(
			(left, right) => new Date(right.createdAt) - new Date(left.createdAt)
		);
	}

	if (sortType === 'oldest') {
		sorted.sort(
			(left, right) => new Date(left.createdAt) - new Date(right.createdAt)
		);
	}

	return sorted;
};

const filterItems = (query) => {
	const normalizedQuery = query.trim().toLowerCase();

	if (!normalizedQuery) {
		return items;
	}

	return items.filter((item) =>
		item.title.toLowerCase().includes(normalizedQuery) ||
		item.genre.toLowerCase().includes(normalizedQuery)
	);
};

const renderItems = () => {
	const filteredItems = filterItems(currentQuery);
	const sortedItems = sortItems(filteredItems, currentSort);

	if (sortedItems.length === 0) {
		itemList.innerHTML = '<li class="item-card"><h2>No songs found</h2><p>Try a different search term.</p></li>';
		return;
	}

	itemList.innerHTML = sortedItems
		.map(
			(item) =>
				`<li class="item-card"><h2>${item.title}</h2><p>Genre: ${item.genre}</p><p>Created: ${formatDate(item.createdAt)}</p></li>`
		)
		.join('');
};

sortSelect.addEventListener('change', (event) => {
	currentSort = event.target.value;
	renderItems();
});

searchInput.addEventListener('input', (event) => {
	currentQuery = event.target.value;
	renderItems();
});

searchButton.addEventListener('click', () => {
	currentQuery = searchInput.value;
	renderItems();
	searchInput.focus();
});

searchInput.addEventListener('keydown', (event) => {
	if (event.key === 'Enter') {
		currentQuery = searchInput.value;
		renderItems();
	}
});

const fetchMusic = async () => {
	try {
		const genres = ['rnb', 'afrobeats', 'dancehall', 'hip hop'];

		const genreResults = await Promise.all(
			genres.map(async (genre) => {
				const response = await fetch(
					`https://itunes.apple.com/search?term=${encodeURIComponent(
						genre
					)}&entity=musicTrack&limit=1`
				);
				const data = await response.json();
				const track = data.results[0];

				if (!track) {
					return null;
				}

				return {
					title: track.trackName,
					createdAt: track.releaseDate,
					genre,
				};
			})
		);

		items = genreResults.filter(Boolean);

		renderItems();
	} catch (error) {
		console.error('Failed to fetch music:', error);
		itemList.innerHTML = '<li class="item-card"><h2>Failed to load music. Please try again.</h2></li>';
	}
};

fetchMusic();
