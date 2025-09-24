import ScaleKitSdk from 'scalekit';

const scaleKit = new ScaleKitSdk({
    envUrl : import.meta.env.VITE_ENV_URL,
    clientId : import.meta.env.VITE_CLIENT_ID
});

export default scaleKit;