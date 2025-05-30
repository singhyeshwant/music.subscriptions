function login() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    var apiGatewayUrl = 'https://cnjwhtdnld.execute-api.ap-southeast-2.amazonaws.com/Production/login';

    fetch(apiGatewayUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.result === "true") {
            showNotification('Login successful. Redirecting...', false);
            sessionStorage.setItem('userEmail', email);
            setTimeout(() => {
                window.location.href = 'main.html';
            }, 3000);
        } else {
            showNotification('Email or password is invalid', true);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('There was a problem with the login process', true);
    });
}

function showNotification(message, isError) {
    var notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.backgroundColor = isError ? '#f44336' : '#4CAF50';
    notification.style.display = 'block';

    setTimeout(() => {
        notification.classList.add('fadeOut');
        setTimeout(() => {
            notification.style.display = 'none';
            notification.classList.remove('fadeOut');
        }, 2000);
    }, 3000);
}