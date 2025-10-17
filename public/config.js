// Or detect automatically
const config = {
  API_URL: window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.protocol}//${window.location.hostname}/api`
};