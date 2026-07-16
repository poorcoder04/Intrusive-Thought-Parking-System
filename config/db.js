require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');

const connecDB = async()=>{
    try{
        if (process.env.DNS_SERVERS) {
            const dnsServers = process.env.DNS_SERVERS.split(',').map(server => server.trim()).filter(Boolean);
            dns.setServers(dnsServers);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch(error){
        console.log(error);
        process.exit(1);
    }
};

module.exports=connecDB;