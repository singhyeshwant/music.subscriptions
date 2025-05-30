function register() {
    var email = document.getElementById('email').value;
    var user_name = document.getElementById('user_name').value;
    var password = document.getElementById('password').value;
    var apiGatewayUrl = 'https://cnjwhtdnld.execute-api.ap-southeast-2.amazonaws.com/Production/register';

    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showNotification('Please enter a valid email address', true);
        return;
    }

    fetch(apiGatewayUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: email, user_name: user_name, password: password})
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.success === "false" || data.success === false) {
            showNotification(data.message || 'The email already exists', true);
        } else {
            showNotification(data.message || 'Registration successful! Redirecting...', false);
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('There was a problem with the registration process', true);
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
