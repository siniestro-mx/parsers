require('dotenv').config();
const dgram = require('dgram');
const net = require('net');
const { devices } = require('./config');
const { HistoryModel, CacheModel } = require('./model');
const { connectToMongoDB } = require('../../../common/dbConnection');

(async () => {
  await connectToMongoDB();

  devices.forEach((device) => {
    createServerForDevice(device);
  });
})();

const createServerForDevice = (device) => {
  if (device.protocol === 'udp') {
    const udpServer = dgram.createSocket('udp4');

    udpServer.on('message', (gpsdata, rinfo) => {
      const socket_info = {
        name: `${device.brand}-${device.model}`,
        type: device.protocol,
        socket: udpServer,
        brand: device.brand,
        model: device.model,
        rinfo: rinfo,
        received_at: Date.now(),
      };

      processAndSaveGPSData(gpsdata, socket_info, device);
    });

    udpServer.bind(device.port, process.env.LOCANET_IP);
    console.log(`Listening to UDP packets on port ${device.port} for ${device.brand} ${device.model}`);
  } else if (device.protocol === 'tcp') {
    const tcpServer = net.createServer();

    tcpServer.on('connection', (socket) => {
      const socket_info = {
        name: `${device.brand}-${device.model}`,
        type: device.protocol,
        socket: socket,
        brand: device.brand,
        model: device.model,
        received_at: Date.now(),
      };

      socket.on('data', (gpsdata) => {
        processAndSaveGPSData(gpsdata, socket_info, device);
      });
    });

    tcpServer.listen(device.port, process.env.LOCANET_IP, () => {
      console.log(`Listening to TCP packets on port ${device.port} for ${device.brand} ${device.model}`);
    });
  } else {
    console.error(`Unsupported protocol for ${device.brand} ${device.model}`);
  }
};

const processAndSaveGPSData = (gpsdata, socket_info, device) => {
  const Device = require('./parser/device');
  const gps = new Device(gpsdata, socket_info);

  if (gps.isValid()) {
    saveDataToMongoDB(gps.getData());
  } else {
    console.log(gps.error);
    console.log(gpsdata.toString());
    console.dir(gps);
  }
};

const saveDataToMongoDB = async (gpsdata) => {
  const m_gpsdata = new HistoryModel(gpsdata);
  const unitId = gpsdata.UniqueID;

  const unitCache = await CacheModel.findOne({ UniqueID: unitId });

  if (unitCache && unitCache.timestamps) {
    for (const key in gpsdata) {
      unitCache.timestamps[key] = Date.now();
    }
  } else {
    const newTimestamps = {};
    for (const key in gpsdata) {
      newTimestamps[key] = Date.now();
    }
    gpsdata.timestamps = newTimestamps;
  }

  const updateData = {
    ...gpsdata,
    timestamps: unitCache ? unitCache.timestamps : gpsdata.timestamps,
  };

  try {
    await Promise.all([
      m_gpsdata.save(),
      CacheModel.findOneAndUpdate(
        { UniqueID: unitId },
        { $set: updateData },
        { upsert: true, new: true }
      ),
    ]);
  } catch (error) {
    console.error(`Error saving data to MongoDB for ${device.brand} ${device.model}`, error);
  }
};