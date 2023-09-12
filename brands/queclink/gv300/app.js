require('dotenv').config();
const http = require('http');
const dgram = require('dgram');
const net = require('net');
const { devices } = require('./config');
const { HistoryModel, CacheModel } = require('./model');
const Device = require('./parser/device');
const { connectToMongoDB } = require('../../../common/dbConnection');
const { Server } = require('socket.io');
const server = http.createServer();
const io = new Server(server);
const WEBSOCKET_HOST = '10.132.166.214';
const WEBSOCKET_PORT = 3666;

(async () => {
  await connectToMongoDB();

  server.listen(WEBSOCKET_PORT, WEBSOCKET_HOST, () => {
    console.log(`Servidor websockets en el puerto ${WEBSOCKET_PORT} ip ${WEBSOCKET_HOST}`);
  });

  devices.forEach((device) => {
    createServerForDevice(device);
  });

  setInterval(() => {
    saveQueueToDb();
  }, 60000);
})();

function createServerForDevice(device) {
  if (device.protocol === 'udp') {
    const udpServer = dgram.createSocket('udp4');

    udpServer.on('message', (gpsdata, rinfo) => {
      const socketInfo = {
        name: `${device.brand}-${device.model}`,
        type: device.protocol,
        socket: udpServer,
        brand: device.brand,
        model: device.model,
        rinfo: rinfo,
        received_at: Date.now(),
      };

      try {
        processAndSaveGPSData(gpsdata, socketInfo, device);
      }
      catch (err) {
        console.dir(err);
      }
    });

    udpServer.bind(device.port, process.env.LOCANET_IP);
    console.log(`Listening to UDP packets on port ${device.port} for ${device.brand} ${device.model}`);
  } else if (device.protocol === 'tcp') {
    const tcpServer = net.createServer();

    tcpServer.on('connection', (socket) => {
      const socketInfo = {
        name: `${device.brand}-${device.model}`,
        type: device.protocol,
        socket: socket,
        brand: device.brand,
        model: device.model,
        received_at: Date.now(),
      };

      socket.on('data', (gpsdata) => {
        processAndSaveGPSData(gpsdata, socketInfo, device);
      });
    });

    tcpServer.listen(device.port, process.env.LOCANET_IP, () => {
      console.log(`Listening to TCP packets on port ${device.port} for ${device.brand} ${device.model}`);
    });
  } else {
    console.error(`Unsupported protocol for ${device.brand} ${device.model}`);
  }
}

async function processAndSaveGPSData(gpsdata, socketInfo, device) {
  const uniqueId = Device.getIdFromRawData(gpsdata);

  if (!uniqueId) {
    const error = new Error('No se pudo obtener el ID de la unidad, paquete no interpretable');

    error.raw_data = gpsdata.toString();

    throw error;
  }

  let cacheData = await getCacheData(uniqueId);

  const gps = new Device(gpsdata, socketInfo);

  if (!gps.isValid()) {
    const error = new Error('Paquete no interpretable');
    error.gps = gps;

    throw error;
  }

  try {
    const newData = gps.getData();
    const unitId = newData.UniqueID;
    const msgType = newData.MessageType;

    if (msgType === 'report') {
      processReport(newData, cacheData, device);
    }
    else if (msgType === 'buffer') {
      queueSaveData(gps);
    }
    else if (msgType === 'commandresponse') {
      var sequence = gps.data.SerialNumber,
        uniqueid = gps.data.UniqueID,
        cmd_id,
        response_data = {
          unique_id: id,
          response: "Ejecutado"
        },
        atcmd, split_cmd;

      //console.log("ACK recibido de " + uniqueid + '\n ' + prettyjson.render(gps));
      sequence = parseInt(sequence, 10).toString(16);
      while (sequence.length < 4) sequence = '0' + sequence;

      if (!UNITS[id] || !UNITS[id].pending_commands || !UNITS[id].pending_commands[sequence]) {
        if (gps.event == 'GTHBD') {
          //console.log("Heartbeat de " + id);
        }
        else {
          //console.log("Estan programando un equipo");
          //console.log(response_data);
          //console.log("Ack recibido: " + prettyjson.render(gps.data));
        }

        return;
      }

      cmd_id = UNITS[id].pending_commands[sequence].cmd_id;
      response_data.cmd = UNITS[id].pending_commands[sequence].cmd;
      delete UNITS[id].pending_commands[sequence];
      response_data.cmd_id = cmd_id;
      //console.log(response_data);
      //console.log("Ack recibido: " + prettyjson.render(gps.data));
      //Ya que los equipos queclink envian su contestacion
      //como un paquete RESP no es posible saber cual fue
      //exactamente el paquete correspondiente al comando enviado
      //en su lugar cuando se envia un comando a los equipos queclink
      //para confirmar de recibido contestan con un ACK que nosotros
      //utilizaremos como CommandResponse para la ventana de comandos
      //del programa Locanet
      atcmd = response_data.cmd.substr(0, 8);

      let active;
      if (atcmd === 'AT+GTOUT') {
        if (gps.device_type === 'GV75' || gps.device_type === 'GV55' || gps.device_type === 'GV75W') {
          active = response_data.cmd.split(',')[4];
        }
        else {
          active = response_data.cmd.split(',')[7];
        }

        sendCommand('iostatus', id);

        console.log("Paro de motor " + (active === "0" ? " desactivado a" : active === '1' ? "activado a" : "status desconocido de ") + id);
      }
      else if (atcmd == 'AT+GTCFG') {
        split_cmd = response_data.cmd.split ? response_data.cmd.split(',') : [];
        if (split_cmd.length && split_cmd[1] && UNITS[uniqueid]) {
          UNITS[uniqueid].DevicePassword = split_cmd[1];
        }
      }

      for (var u in USERS) {
        if (USERS[u] && (USERS[u].allowed === "all" || (USERS[u].allowed.indexOf(id) >= 0))) {
          for (var socket in USERS[u].socket) {
            USERS[u].socket[socket].emit("CommandResponse", response_data);

            if (atcmd === 'AT+GTOUT') {
              USERS[u].socket[socket].emit('enginelock', id, active);
            }
          }
        }
      }
      updateNetworkInfo(gps, ip, port, received_at);
      trySendCommand(gps, false, false, false, false);
    }
    else if (msgType === 'configuration') {
      //console.log("Configuracion de " + gps.data.UniqueID + " recibida con fecha " + new Date(gps.data.SendTime * 1000).toString());
      //console.log(prettyjson.render(gps));
      updateNetworkInfo(gps, ip, port, received_at);
      saveUnits(id);
      pushData(gps);
    }
  } catch (e) {
    console.log('Error al procesar los datos del GPS');
    console.error(e);
  }
}

async function getCacheData(uniqueId) {
  let cacheData = null;

  /** Buscamos en la base si tenemos ya información de este dispositivo, en caso de no encontrarlo, significa que es un dispositivo nuevo,
  *   asi que creamos un nuevo objeto cache para el dispositivo y lo retornamos.
    */
  cacheData = await CacheModel.findOne({ UniqueID: uniqueId });

  /** Configuración inicial del cache con default del sensor de ignición y paro de motor */
  if (!cacheData) {
    cacheData = {
      IOConfig: {
        Engine: 3,
        EngineLock: 1
      }
    };
  }

  /** Configuración default del sensor de ignición y paro de motor */
  if (!cacheData.IOConfig) {
    cacheData.IOConfig = {
      Engine: 3,
      EngineLock: 1
    };
  }

  return cacheData;
}

async function processReport(newData, cacheData, device) {
  /*  si la unidad esta en movimiento */
  newData.AddressInfo = await getAddress(newData, cacheData);
  
  pushData(newData);
  queueSaveData(gps);
  //Checamos si se activo alguna alerta
  checkForAlert(gps);
}

async function getAddress(newData, cacheData) {
  if(!cacheData.AddressInfo || needAddressUpdate(newData, cacheData)) {
    const address = await getAddressFromGeocoder(newData);
    return address;
  }else{
    return cacheData.AddressInfo;
  }
}

async function getAddressFromGeocoder(newData) {
  /*let id = unit.getId(),
    lat = unit.data.Latitude,
    lng = unit.data.Longitude;

  axios.get(`http://10.132.166.211/reverse.php?format=json&lat=${lat}&lon=${lng}&zoom=16&namedetails=1`).then((res) => {
    if (res.data && res.data.address) {
      unit.data.Address = `${res.data.address.road ? res.data.address.road + ', ' : ''}${res.data.address.neighbourhood ? 'Col.' + res.data.address.neighbourhood + ', ' : ''} ${res.data.address.city || res.data.address.county},${res.data.address.state},${res.data.address.country}`;
      unit.data.City = res.data.address.city;
      unit.data.State = res.data.address.state;
      unit.data.Country = res.data.address.country;
      if (UNITS[id]) {
        UNITS[id].lastLocation = UNITS[id].lastLocation || {};
        UNITS[id].lastLocation.address = unit.data.Address;
        UNITS[id].lastLocation.city = unit.data.City;
        UNITS[id].lastLocation.state = unit.data.State;
        UNITS[id].lastLocation.country = unit.data.Country;
        UNITS[id].lastLocation.lat = unit.data.Latitude;
        UNITS[id].lastLocation.lng = unit.data.Longitude;
      }
      callback(null);
    }
    else {
      //console.log(`No se enccontró direccion ${JSON.stringify(res.data)}`);
      callback('No se encontró');
    }
  }).catch((err) => {
    callback('Error al hacer peticion HTTP solicitando dirección Nominatim');
  });*/
}

function needAddressUpdate(newData, cacheData) {
  
}

function pushData(gpsdata) {

}

async function updateCache(newData, cacheData, device) {
  if (cacheData && cacheData.Timestamps) {
    for (const key in newData) {
      cacheData.Timestamps[key] = Date.now();
    }
  } else {
    const newTimestamps = {};
    for (const key in newData) {
      newTimestamps[key] = Date.now();
    }
    newData.Timestamps = newTimestamps;
  }

  /* 
  *  aqui actualizamos las propiedades que llegaron en el paquete nuevo, solo se crearan o sobreescribiran
  *  las propiedades que se encuentren presentse en newData, dejando las propiedades existentes de cacheData
  *  intactas, con eso tenemos un valor para todas las propiedades que en general envia el dispositivo, aunque no
  *  todas actualizadas a la misma fecha, algunas seran mas recientes que otras, pero al menos hay un valor, el ultimo recibido
  */
  const updateData = {
    ...newData,
    Timestamps: cacheData ? cacheData.Timestamps : newData.Timestamps,
  };

  /* 
  *  si el paquete contiene una posición valida, creamos un geoJSON tipo Point, con la posición, para poder utilizar
  *  esta propiedad en las consultas geoespaciales que se realizan para determinar si una unidad esta dentro de alguna geocerca 
  */
  if (newData.ValidPosition && newData.Latitude && newData.Longitude) {
    updateData.Position = {
      type: 'Point',
      coordinates: [newData.Longitude, newData.Latitude]
    };

    updateData.Timestamps.Position = Date.now();


    checkForGeofences(newData);
  }

  try {
    await Promise.all([
      m_gpsdata.save(),
      CacheModel.findOneAndUpdate(
        { UniqueID: unitId },
        { $set: updateData },
        { upsert: true, new: true }
      ),
    ]);

    // Emitir los datos GPS a través de Socket.IO
    io.emit('gpsdata', gpsdata);
  } catch (error) {
    console.error(`Error saving data to MongoDB for ${device.brand} ${device.model}, ${error.message}}`);
    console.log(gpsdata);
  }
}

async function queueForSave(newData, device) {

}

async function saveQueueToDb() {
}
/*async function checkAndUpdateOverlays(gpsdata) {
  const uniqueID = gpsdata.UniqueID;
  const lat = gpsdata.Latitude;
  const lng = gpsdata.Longitude;
  const point = { type: "Point", coordinates: [lng, lat] }; // reemplace con las coordenadas GPS del dispositivo
  const toleranceInMeters = 5000; // reemplace con la tolerancia en metros

  console.log(`Buscando overlays para el vehículo ${uniqueID}${gpsdata.Alias ? ("-" + gpsdata.Alias) : ""} en las coordenadas ${lat}, ${lng}`);

  let overlaysWithUnitPointOrCircleType = await Overlay.find({
    type: { $in: ["marker", "circle"] }, // Filtrar overlays de tipo Point o Circle
    vehicles: { $in: [uniqueID] }, // reemplace con el UniqueID del dispositivo
    overlay: {
      $near: {
        $geometry: point,
        $maxDistance: toleranceInMeters
      }
    }
  });

  console.log(`resultado de buscar en marker y circle`);
  console.log(util.inspect(overlaysWithUnitPointOrCircleType, false, null, true));

  let overlaysWithUnitOtherTypes = await Overlay.find({
    type: { $nin: ["marker", "circle"] }, // Excluir overlays de tipo Point y Circle
    vehicles: { $in: [uniqueID] }, // reemplace con el UniqueID del dispositivo
    overlay: { $geoIntersects: { $geometry: point } }
  });

  console.log(`resultado de buscar en polygon, rectangle y polyline`);
  console.log(util.inspect(overlaysWithUnitOtherTypes, false, null, true));
} */