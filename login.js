
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const tokenStatus = document.getElementById('tokenStatus');

    function getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    async function exchangeCodeForTokens(clientID, clientSecret, code) {
        try {
            const response = await fetch(`https://www.strava.com/oauth/token?client_id=${clientID}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const data = await response.json();

            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('expires_at', data.expires_at);
            localStorage.setItem('refresh_token', data.refresh_token);

            tokenStatus.textContent = 'Login successful! Tokens stored in local storage.';
            populateTokenFields();
        } catch (error) {
            console.error('Error:', error);
            tokenStatus.textContent = 'Login failed! Please check your credentials and try again.';
        }
    }

    function populateTokenFields() {
        document.getElementById('redirectUri').value = localStorage.getItem('redirectUri');
        document.getElementById('clientID').value = localStorage.getItem('clientID');
        document.getElementById('clientSecret').value = localStorage.getItem('clientSecret');
        document.getElementById('expiresAt').value = localStorage.getItem('expires_at');
        document.getElementById('refreshToken').value = localStorage.getItem('refresh_token');

        const expiresAt = localStorage.getItem('expires_at');
        if (expiresAt) {
            const humanReadableExpiresAt = new Date(parseInt(expiresAt) * 1000).toLocaleString();
            document.getElementById('humanReadableExpiresAt').textContent = `(Expires: ${humanReadableExpiresAt})`;
        } else {
            document.getElementById('humanReadableExpiresAt').textContent = '';
        }
    }
        loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const redirectUri = document.getElementById('redirectUri').value;
        const clientID = document.getElementById('clientID').value;
        const clientSecret = document.getElementById('clientSecret').value;

        localStorage.setItem('clientID', clientID);
        localStorage.setItem('clientSecret', clientSecret);
        localStorage.setItem('redirectUri', redirectUri);

        const authURL = `https://www.strava.com/oauth/authorize?client_id=${clientID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=read,activity:read_all`;
        window.location.href = authURL;
    });

    const authCode = getQueryParam('code');

    if (authCode) {
        const clientID = localStorage.getItem('clientID');
        const clientSecret = localStorage.getItem('clientSecret');
        exchangeCodeForTokens(clientID, clientSecret, authCode);
    } else {
        populateTokenFields();
    }
    async function refreshAccessToken(clientID, clientSecret, refreshTokenValue) {
        try {
            const response = await fetch(`https://www.strava.com/oauth/token?client_id=${clientID}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshTokenValue}`, {
                method: 'POST',
            });
        
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
        
            const data = await response.json();
        
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('expires_at', data.expires_at);
            localStorage.setItem('refresh_token', data.refresh_token);
        
            tokenStatus.textContent = 'Token refreshed successfully!';
            populateTokenFields();
        } catch (error) {
            console.error('Error:', error);
            tokenStatus.textContent = 'Failed to refresh token. Please check your credentials and try again.';
        }
    }


    document.getElementById('refreshTokenBtn').addEventListener('click', async () => {
        const clientID = localStorage.getItem('clientID');
        const clientSecret = localStorage.getItem('clientSecret');
        const storedRefreshToken = localStorage.getItem('refresh_token');

        if (clientID && clientSecret && storedRefreshToken) {
            await refreshAccessToken(clientID, clientSecret, storedRefreshToken);
        } else {
            tokenStatus.textContent = 'Please provide valid credentials and obtain a refresh token.';
        }
    });

});


