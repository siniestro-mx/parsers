const dotenv = require('dotenv');
const dgram = require('dgram');
const net = require('net');
const Gl200 = require('./parser/gl200');
const MongooseModel = require('./model');
const brand = 'queclink';
const model = 'gl200';
const protocol = 'udp';
const port = 5502;

// Configurar variables de entorno
dotenv.config();

const { connectToMongoDB } = require('../../../common/dbConnection');

(async () => {
  // Conectar a MongoDB
  await connectToMongoDB();

  // Función para procesar datos GPS y guardarlos en MongoDB
  const processAndSaveGPSData = (gpsdata, socket_info) => {
    const gps = new Gl200(gpsdata, socket_info);
    
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

    udpServer.bind(port, process.env.LOCANET_IP);
    console.log(`Escuchando paquetes UDP en el puerto ${port} para el modelo ${model} de la marca ${brand}`);
  } else if (protocol === 'tcp') {
    const tcpServer = net.createServer();

    tcpServer.on('connection', (socket) => {
      const socket_info = { name: `${brand}-${model}`, type: protocol, socket: socket, brand: brand, model: model };
      socket.on('data', (gpsdata) => {
        processAndSaveGPSData(gpsdata, socket_info);
      });
    });

    tcpServer.listen(port, process.env.LOCANET_IP , () => {
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
      //console.log(`Datos guardados en MongoDB para el modelo ${model} de la marca ${brand}`);
    } catch (error) {
      console.error(`Error al guardar datos en MongoDB para el modelo ${model} de la marca ${brand}`, error);
    }
  };
})();
