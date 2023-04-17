/*{
  ip: '10.132.74.196',
  port: 8080,
  queclinkIp: '10.17.0.6',
  queclinkPort: 5500,
  enforaIp: '10.17.0.6',
  enforaPort: 1720,
  enforaPort2: 1722,
  enforaPort3: 1779,
  enforaPort4: 1740,
  oigoIp: '10.17.0.6',
  oigoPort: 13000,
  oigoPortAR: 13500,
  suntechIp: '10.17.0.6',
  ST310KPort: 11000,
  ST310FPort: 11001,
  UniversalPort: 11700,
  ruptelaIp: '10.17.0.6',
  ruptelaFMPRO4Port: 15000,
  teltonikaIp: '10.17.0.6',
  teltonikaFM3612Port: 12500,
  concoxIp: '10.17.0.6',
  topFlyIp: '10.17.0.6',
  topFlyPort: 18000,
  concoxGT06Port: 12000,
  SMS: false,
  VALIDATE: true,
  name: 'parser1'
}; */
const dotenv = require('dotenv');
const dgram = require('dgram');
const net = require('net');
const St4345lc = require('./parser/st4345lc');
const MongooseModel = require('./model');
const brand = 'suntech';
const model = 'st4345lc';
const protocol = 'udp';
const port = 11700;

// Configurar variables de entorno
dotenv.config();

const { connectToMongoDB } = require('../../../common/dbConnection');

(async () => {
  // Conectar a MongoDB
  await connectToMongoDB();

  // Función para procesar datos GPS y guardarlos en MongoDB
  const processAndSaveGPSData = (gpsdata, socket_info) => {
    const gps = new St4345lc(gpsdata, socket_info);
    console.dir(gps.getData(), { depth: null });
    if(gps.isValid()){
      saveDataToMongoDB(gps.getData());
    }else{
      console.log(gps.error);
    }
  };

  // Crear e iniciar servidores para cada modelo de dispositivo
  if (protocol === 'udp') {
    const udpServer = dgram.createSocket('udp4');

    udpServer.on('message', (gpsdata, rinfo) => {
      const socket_info = { name: `${brand}-${model}`, type: protocol, socket: udpServer, brand: brand, model: model, rinfo: rinfo, received_at: Date.now() };

      processAndSaveGPSData(gpsdata, socket_info);
    });

    udpServer.bind(port, '165.227.69.135');
    console.log(`Escuchando paquetes UDP en el puerto ${port} para el modelo ${model} de la marca ${brand}`);
  } else if (protocol === 'tcp') {
    const tcpServer = net.createServer();

    tcpServer.on('connection', (socket) => {
      const socket_info = { name: `${brand}-${model}`, type: protocol, socket: socket, brand: brand, model: model };
      socket.on('data', (gpsdata) => {
        processAndSaveGPSData(gpsdata, socket_info);
      });
    });

    tcpServer.listen(port, '165.227.69.135', () => {
      console.log(`Escuchando paquetes TCP en el puerto ${port} para el modelo ${model} de la marca ${brand}`);
    });
  } else {
    console.error(`Protocolo no soportado para el modelo ${model} de la marca ${brand}`);
  }

  // Implementar función para guardar datos en MongoDB
  const saveDataToMongoDB = async (gpsdata) => {
    const m_gpsdata = new MongooseModel(gpsdata);

    try {
      await m_gpsdata.save();
      console.log(`Datos guardados en MongoDB para el modelo ${model} de la marca ${brand}`);
    } catch (error) {
      console.error(`Error al guardar datos en MongoDB para el modelo ${model} de la marca ${brand}`, error);
    }
  };
})();