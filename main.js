document.addEventListener('DOMContentLoaded', function() {
    fetchUserName();
    ensureTableExists();
    fetchSubscriptions();
});

function fetchUserName() {
    const apiUrl = 'https://cnjwhtdnld.execute-api.ap-southeast-2.amazonaws.com/Production/user_area';
    const userEmail = sessionStorage.getItem('userEmail');

    if (!userEmail) {
        console.error('No user email available');
        document.getElementById('userName').textContent = 'No email provided';
        return;
    }

    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userEmail })
    })
    .then(response => response.json())
    .then(data => {
        if (data.user_name) {
            document.getElementById('userName').textContent = data.user_name;
        } else {
            document.getElementById('userName').textContent = 'User name not found';
        }
    })
    .catch(error => {
        console.error('Error fetching user name:', error);
        document.getElementById('userName').textContent = 'Error loading user data';
    });
}

function queryMusic() {
    let title = document.getElementById('title').value;
    let year = document.getElementById('year').value;
    let artist = document.getElementById('artist').value;
    let apiUrl = 'https://cnjwhtdnld.execute-api.ap-southeast-2.amazonaws.com/Production/query_lambda_function';

    fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title, year, artist})
    })
    .then(response => response.text())  // parse as plain text first
    .then(text => {
        console.log('Raw API response:', text); // debug
        const data = JSON.parse(text);  // then parse manually
        displayQueryResults(data);
    })
    .catch(error => console.error('Error querying music:', error));
}

function displayQueryResults(data) {
    let resultsContainer = document.getElementById('queryResults');
    resultsContainer.innerHTML = '';

    if (!Array.isArray(data)) {
        resultsContainer.textContent = 'No result is retrieved. Please query again.';
        return;
    }

    if (data.length === 0) {
        resultsContainer.textContent = 'No result is retrieved. Please query again.';
    } else {
        data.forEach(item => {
            let musicDiv = document.createElement('div');
            musicDiv.className = 'musicItem';

            let image = document.createElement('img');
            const imageName = item.artist.replace(/ /g, '') + '.jpg';
            const imageUrl = `https://3994442.s3.amazonaws.com/${imageName}`;
            console.log("Image URL:", imageUrl); // test
            image.src = imageUrl;
            image.alt = 'Image of ' + item.artist;
            image.className = 'musicItemImage';

            let infoDiv = document.createElement('div');
            infoDiv.className = 'musicItemInfo';

            let title = document.createElement('h4');
            title.textContent = item.title;

            let artist = document.createElement('p');
            artist.textContent = 'Artist: ' + item.artist;

            let year = document.createElement('p');
            year.textContent = 'Year: ' + item.year;

            let button = document.createElement('button');
            button.textContent = 'Subscribe';
            button.onclick = function() {
                subscribeMusic(item.title, item.artist, item.year);
            };

            infoDiv.appendChild(title);
            infoDiv.appendChild(artist);
            infoDiv.appendChild(year);
            infoDiv.appendChild(button);

            musicDiv.appendChild(image);
            musicDiv.appendChild(infoDiv);

            resultsContainer.appendChild(musicDiv);
        });
    }
}

function subscribeMusic(title, artist, year) {
    const apiUrl = 'https://cnjwhtdnld.execute-api.ap-southeast-2.amazonaws.com/Production/subscribe_or_remove_lambda_function';
    const userEmail = sessionStorage.getItem('userEmail');
    const subscriptionArea = document.getElementById('subscriptionsList');
    const existingEntries = subscriptionArea.querySelectorAll('.musicItem');

    let exists = Array.from(existingEntries).some(entry =>
        entry.textContent.includes(title) && entry.textContent.includes(artist)
    );

    if (exists) {
        alert('You have already subscribed to this music.');
        return;
    }

    fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            email: userEmail,
            action: 'subscribe',
            music_info: {title, artist, year}
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.result === 'success') {
            addSubscriptionToDOM(title, artist, year);
            alert('Subscribed successfully!');
        } else {
            alert('Failed to subscribe');
        }
    })
    .catch(error => {
        console.error('Error subscribing to music:', error);
        alert('Error subscribing to music. Please try again.');
    });
}

function ensureTableExists() {
    const apiUrl = 'https://cnjwhtdnld.execute-api.ap-southeast-2.amazonaws.com/Production/subscribe_or_remove_lambda_function';
    const userEmail = sessionStorage.getItem('userEmail');

    fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: userEmail, action: 'create'})
    })
    .then(response => response.json())
    .then(data => {
        fetchSubscriptions();
    })
    .catch(error => {
        console.error('Error ensuring table exists:', error);
    });
}

function fetchSubscriptions() {
    const apiUrl = 'https://cnjwhtdnld.execute-api.ap-southeast-2.amazonaws.com/Production/subscribe_or_remove_lambda_function';
    const userEmail = sessionStorage.getItem('userEmail');

    fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email: userEmail, action: 'fetch' })
    })
    .then(response => response.text())
    .then(text => {
        console.log('Raw fetchSubscriptions response:', text);

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            console.error('JSON parsing error in fetchSubscriptions:', e);
            document.getElementById('subscriptionsList').textContent = 'Invalid response format';
            return;
        }

        const subsList = document.getElementById('subscriptionsList');
        subsList.innerHTML = '';

        if (parsed.subscriptions && parsed.subscriptions.length > 0) {
            parsed.subscriptions.forEach(sub => {
                addSubscriptionToDOM(sub.title, sub.artist, sub.year);
            });
        } else {
            subsList.textContent = 'No subscriptions yet.';
        }
    })
    .catch(error => {
        console.error('Error fetching subscriptions:', error);
        document.getElementById('subscriptionsList').textContent = 'Failed to load subscriptions.';
    });
}

function removeSubscription(title, artist) {
    const apiUrl = 'https://cnjwhtdnld.execute-api.ap-southeast-2.amazonaws.com/Production/subscribe_or_remove_lambda_function';
    const userEmail = sessionStorage.getItem('userEmail');

    fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            email: userEmail,
            action: 'remove',
            music_info: {title, artist}
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.result === 'success') {
            removeSubscriptionFromDOM(title, artist);
            alert('Subscription removed successfully!');
        } else {
            alert('Failed to remove subscription');
        }
    })
    .catch(error => {
        console.error('Error removing subscription:', error);
        alert('Error removing subscription. Please try again.');
    });
}

function removeSubscriptionFromDOM(title, artist) {
    const subscriptionArea = document.getElementById('subscriptionsList');
    const items = Array.from(subscriptionArea.children);
    let found = false;

    items.forEach(item => {
        if (item.textContent.includes(title) && item.textContent.includes(artist)) {
            subscriptionArea.removeChild(item);
            found = true;
        }
    });

    if (found && subscriptionArea.children.length === 0) {
        subscriptionArea.textContent = 'No subscriptions yet.';
    }
}

function addSubscriptionToDOM(title, artist, year) {
    const subscriptionArea = document.getElementById('subscriptionsList');
    const existingEntries = subscriptionArea.querySelectorAll('.musicItem');

    let exists = Array.from(existingEntries).some(entry =>
        entry.textContent.includes(title) && entry.textContent.includes(artist)
    );

    if (subscriptionArea.textContent === 'No subscriptions yet.') {
        subscriptionArea.textContent = '';
    }

    if (exists) {
        alert('You have already subscribed to this music.');
        return;
    }

    let musicDiv = document.createElement('div');
    musicDiv.className = 'musicItem';

    let image = document.createElement('img');
    const imageName = artist.replace(/ /g, '') + '.jpg';
    const imageUrl = `https://3994442.s3.amazonaws.com/${imageName}`;
    image.src = imageUrl;
    image.alt = 'Image of ' + artist;
    image.className = 'musicItemImage';

    let infoDiv = document.createElement('div');
    infoDiv.className = 'musicItemInfo';

    let titleEl = document.createElement('h4');
    titleEl.textContent = title;

    let artistEl = document.createElement('p');
    artistEl.textContent = 'Artist: ' + artist;

    let yearEl = document.createElement('p');
    yearEl.textContent = 'Year: ' + year;

    let button = document.createElement('button');
    button.textContent = 'Remove';
    button.onclick = function() {
        removeSubscription(title, artist);
    };

    infoDiv.appendChild(titleEl);
    infoDiv.appendChild(artistEl);
    infoDiv.appendChild(yearEl);
    infoDiv.appendChild(button);

    musicDiv.appendChild(image);
    musicDiv.appendChild(infoDiv);

    subscriptionArea.appendChild(musicDiv);
}

document.getElementById('logoutLink').addEventListener('click', function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
});
