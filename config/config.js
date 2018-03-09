const convict = require('convict');

let config = convict({
        // authToken: {
        //     format: String,
        //     default: 'X-Authorization'
        // }
    });


module.exports = config;