let items = [];

const sortSelect = document.getElementById('sort-select');
const itemList = document.getElementById('item-list');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

let currentSort = 'az';
let currentQuery = ''; 

const fetchItunesJsonp = (genre) =>
	new Promise((resolve, reject) => {
		const callbackName = `itunesCallback_${genre.replace(/\W/g, '')}_${Date.now()}`;
		const script = document.createElement('script');

		window[callbackName] = (data) => {
			resolve(data);
			delete window[callbackName];
			script.remove();
		};

		script.onerror = () => {
			reject(new Error(`Failed to load genre: ${genre}`));
			delete window[callbackName];
			script.remove();
		};

		script.src = `https://itunes.apple.com/search?term=${encodeURIComponent(
			genre
		)}&entity=musicTrack&limit=1&callback=${callbackName}`;
		document.body.appendChild(script);
	});

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

	if (sortType === 'genre-az') {
		sorted.sort((left, right) => left.genre.localeCompare(right.genre));
	}
    
	if (sortType === 'genre-za') {
		sorted.sort((left, right) => right.genre.localeCompare(left.genre));
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
}
const hamburger = document.getElementById('hamburger--menu');
const navList = document.querySelector('.nav--item--list');
hamburger.addEventListener('click', () => {
	navList.classList.toggle('open');

});

const renderItems = () => {
	const filteredItems = filterItems(currentQuery);
	const sortedItems = sortItems(filteredItems, currentSort);

	if (sortedItems.length === 0) {
		itemList.innerHTML = '<li class="item-card"><h2>No songs found</h2><p>Try a different search term.</p></li>';
		return;
	}

	itemList.innerHTML = sortedItems
		.map(
			(item) => `
			<li class="item-card">
				<h2>${item.title}</h2>
				<p><strong>Genre:</strong> ${item.genre}</p>
				<p><strong>Released:</strong> ${formatDate(item.createdAt)}</p>
			</li>`
		)
		.join('');
}

searchButton.addEventListener('click', () => {
	currentQuery = searchInput.value.trim();
	if (currentQuery) {
		fetchMusicByQuery(currentQuery);
	}
	else {
		renderItems();
	}
	
});
const fetchMusicByQuery = async (query) => {
	try {
		const data = await fetchItunesJsonp(query);
		const track = data.results[0];
		
		if (track) {
			items = [{title : track.trackName, createdAt: track.releaseDate, genre: query}];
		}
		renderItems();
	} catch (error) {
		console.error('Failed to fetch music by query:', error);
	}
};

sortSelect.addEventListener('change', (event) => {
	currentSort = event.target.value;
	renderItems();
});

searchInput.addEventListener('input', (event) => {
	currentQuery = event.target.value;
	renderItems();
});



searchInput.addEventListener('keydown', (event) => {
		currentQuery = event.target.value;
		renderItems();
	}
);

const fetchMusic = async () => {
	try {
	const genres = [
			'rnb', 'afrobeats', 'dancehall', 'hip hop',
			'pop', 'jazz', 'rock', 'classical',
			'reggae', 'soul', 'country', 'electronic'
		];

		const genreResults = await Promise.all(
			genres.map(async (genre) => {
				const data = await fetchItunesJsonp(genre);
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
