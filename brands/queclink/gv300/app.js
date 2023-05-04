require('dotenv').config();
const dgram = require('dgram');
const net = require('net');
const Gv300 = require('./parser/gv300');
const {
  HistoryModel,
  CacheModel
} = require('./model');
const brand = 'queclink';
const model = 'gv300';
const protocol = 'udp';
const port = 5500;

const {
  connectToMongoDB
} = require('../../../common/dbConnection');

(async () => {
  // Conectar a MongoDB
  await connectToMongoDB();

  // Función para procesar datos GPS y guardarlos en MongoDB
  const processAndSaveGPSData = (gpsdata, socket_info) => {
    const gps = new Gv300(gpsdata, socket_info);

    if (gps.isValid()) {
      saveDataToMongoDB(gps.getData());
    } else {
      console.log(gps.error);
      console.log(gpsdata.toString());
      console.dir(gps);
    }
  };

  // Crear e iniciar servidores para cada modelo de dispositivo
  if (protocol === 'udp') {
    const udpServer = dgram.createSocket('udp4');

    udpServer.on('message', (gpsdata, rinfo) => {
      const socket_info = {
        name: `${brand}-${model}`,
        type: protocol,
        socket: udpServer,
        brand: brand,
        model: model,
        rinfo: rinfo,
        received_at: Date.now()
      };

      processAndSaveGPSData(gpsdata, socket_info);
    });

    udpServer.bind(port, process.env.LOCANET_IP);
    console.log(`Escuchando paquetes UDP en el puerto ${port} para el modelo ${model} de la marca ${brand}`);
  } else if (protocol === 'tcp') {
    const tcpServer = net.createServer();

    tcpServer.on('connection', (socket) => {
      const socket_info = {
        name: `${brand}-${model}`,
        type: protocol,
        socket: socket,
        brand: brand,
        model: model
      };
      socket.on('data', (gpsdata) => {
        processAndSaveGPSData(gpsdata, socket_info);
      });
    });

    tcpServer.listen(port, process.env.LOCANET_IP, () => {
      console.log(`Escuchando paquetes TCP en el puerto ${port} para el modelo ${model} de la marca ${brand}`);
    });
  } else {
    console.error(`Protocolo no soportado para el modelo ${model} de la marca ${brand}`);
  }

  // Implementar función para guardar datos en MongoDB
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
      timestamps: unitCache ? unitCache.timestamps : gpsdata.timestamps
    };
  
    try {
      await Promise.all([
        m_gpsdata.save(),
        CacheModel.findOneAndUpdate({
          UniqueID: unitId
        }, {
          $set: updateData
        }, {
          upsert: true,
          new: true
        })
      ]);
      //console.log(`Datos guardados en MongoDB para el modelo ${model} de la marca ${brand}`);
    } catch (error) {
      console.error(`Error al guardar datos en MongoDB para el modelo ${model} de la marca ${brand}`, error);
    }
  };
  
})();