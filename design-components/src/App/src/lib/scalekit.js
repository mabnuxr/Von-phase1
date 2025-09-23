import ScaleKit from 'scalekit';

const ScaleKit  = new ScaleKit({
    envUrl : process.env.ENV_URL,
    clientId : process.env.clienntId
});

export default ScaleKit;