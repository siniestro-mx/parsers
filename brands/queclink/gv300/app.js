require('dotenv').config();
const http = require('http');
const dgram = require('dgram');
const net = require('net');
const axios = require('axios');
const { devices } = require('./config');
const mongoose = require('mongoose');
const { CacheModel, Overlay } = require('./model');
const Device = require('./parser/device');
const { connectToMongoDB } = require('../../../common/dbConnection');
const { Server } = require('socket.io');
const server = http.createServer();
const io = new Server(server);
const WEBSOCKET_HOST = '10.132.166.214';
const WEBSOCKET_PORT = 3666;
let QUEUE = [];

(async () => {
  /** conectamos a la base de datos donde se guardara tanto el cache como el historial */
  await connectToMongoDB();

  /*io.on('connection', (socket) => {
    console.log('a user connected');
    console.dir(socket.handshake.query);
    console.dir(socket.handshake);
  });*/
  /** Iniciamos el server de socket.io con el que se estará comunicando con otros microservicios del sistema */
  server.listen(WEBSOCKET_PORT, WEBSOCKET_HOST, () => {
    console.log(`Servidor websockets en el puerto ${WEBSOCKET_PORT} ip ${WEBSOCKET_HOST}`);
  });

  /** para cada dispositivo configurado creamos un socket de red http o udp, para escuchar por paquetes del dispositivo gps */
  devices.forEach((device) => {
    createServerForDevice(device);
  });

  setInterval(() => {
    saveQueueToDb();
  }, 2000);
})();

// Función optimizada para manejar errores
async function handleError(error, message) {
  console.error(`${message}: ${error.message}`);
  // Considera agregar un sistema de log más robusto aquí
}

function createServerForDevice(device) {
  if (device.protocol === 'udp') {
    const udpServer = dgram.createSocket('udp4');

    udpServer.on('message', async (gpsdata, rinfo) => {
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
        await processAndSaveGPSData(gpsdata, socketInfo, device);
      }
      catch (err) {
        console.log('Error al procesar los datos del GPS por UDP');
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

      socket.on('data', async (gpsdata) => {
        try {
          await processAndSaveGPSData(gpsdata, socketInfo, device);
        }
        catch (err) {
          console.log('Error al procesar los datos del GPS por TCP');
          console.dir(err);
        }
      });
    });

    tcpServer.listen(device.port, process.env.LOCANET_IP, () => {
      console.log(`Listening to TCP packets on port ${device.port} for ${device.brand} ${device.model}`);
    });
  } else {
    console.error(`Unsupported protocol for ${device.brand} ${device.model}`);
  }
}

/**
 * Processes and saves GPS data for a Queclink GV300 device.
 * @param {Buffer} gpsdata - The raw GPS data received from the device.
 * @param {Object} socketInfo - Information about the socket connection.
 * @param {Object} device - Information about the device.
 * @throws {Error} If the ID of the unit cannot be obtained or the package is not interpretable.
 */
async function processAndSaveGPSData(gpsdata, socketInfo, device) {
  const uniqueId = Device.getIdFromRawData(gpsdata);

  if (!uniqueId) {
    const error = new Error('No se pudo obtener el ID de la unidad, paquete no interpretable');

    error.raw_data = gpsdata.toString();

    throw error;
  }

  const gps = new Device(gpsdata, socketInfo);

  if (!gps.isValid()) {
    const error = new Error('Paquete no interpretable');
    error.gps = gps;

    throw error;
  }

  let cacheData = await getCacheData(uniqueId);

  try {
    const msgType = gps.getMsgType();

    if (msgType === 'report') {
      await processReport(gps, cacheData, device);
    }
    else if (msgType === 'buffer') {
      //queueSaveData(gps);
    }
    else if (msgType === 'commandresponse') {
      /*var sequence = gps.data.SerialNumber,
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
      trySendCommand(gps, false, false, false, false);*/
    }
    else if (msgType === 'configuration') {
      //console.log("Configuracion de " + gps.data.UniqueID + " recibida con fecha " + new Date(gps.data.SendTime * 1000).toString());
      //console.log(prettyjson.render(gps));
      //updateNetworkInfo(gps, ip, port, received_at);
      //saveUnits(id);
      //pushData(gps);
    }
  } catch (e) {
    throw e;
  }
}

async function getCacheData(uniqueId) {
  try {
    let cacheData = await CacheModel.findOne({ UniqueID: uniqueId });
    return cacheData || { Timestamps: {} }; // Simplificación del retorno y creación de cacheData
  } catch (e) {
    await handleError(e, `Error al buscar el cache de datos para la unidad ${uniqueId}`);
    return undefined;
  }
}

async function processReport(gps, cacheData, device) {
  /** dependiendo de si el paquete contiene coordenadas o no, y si estas son diferentes
   *  a las que tenemos en el cache, solicitamos la dirección de la unidad o utilizamos
   *  la que tenemos en el cache
   */
  const movedStatus = hasMoved(gps, cacheData);
  const addressInfo = await getAddress(gps, cacheData, movedStatus);

  /** puede darse el caso que el paquete no contenga coordenadas y tampoco se cuente con
   *  información en el cache, en cuyo caso se envia un paquete vacio, sin dirección.
   *  En un funcionamiento normal esto no pasaria salvo cuando una unidad comienza a reportar
   *  por primera vez en la historia del sistema, o cuando ocurre un error que impide obtener
   *  el cache de datos de la unidad.
   */
  if (addressInfo) {
    gps.data.AddressInfo = addressInfo;
  }
  else if (gps.hasValidPosition()) {
    gps.data.AddressInfo = "No se pudo encontrar la dirección";
  }

  /** agregamos el paquete a la cola de guardado */
  queueForSave(gps);

  //console.log(`Checando geocercas para la unidad ${gps.data.UniqueID} con posicion ${gps.hasValidPosition() ? 'valida' : 'invalida'}`);
  /** verificamos el status de la unidad dentro de las geocercas que tenga asignadas, si es que tiene */
  const overlays = await checkForGeofences(gps, cacheData, movedStatus);

  //console.log(`Overlays(process report): ${overlays}`);
  if (overlays) {
    //console.log(`Overlays encontradas: ${typeof overlays} - ${overlays}`);
    gps.data.Overlays = overlays;
    //console.log(`Overlays: ${gps.data.Overlays}`);
  }
  else {
    //console.log(`No se encontraron overlays para la unidad ${gps.data.UniqueID}`);
  }
  /** enviamos el paquete a los clientes conectados a traves de socket.io */
  pushData(gps);

  await updateCache(gps.data, cacheData, device);
}

async function getAddress(gps, cacheData, movedStatus) {
  /** si el paquete no contiene coordenadas, intentamos enviar la última dirección conocida si es que la hay, 
   *  si el paquete contiene coordenadas, intentamos obtener la dirección de la unidad, solo si es necesario
   *  de lo contrario, retornamos la dirección que tenemos en el cache
   */
  if (!gps.hasValidPosition()) return null;

  if (movedStatus || !cacheData?.AddressInfo) {
    try {
      const address = await getAddressFromGeocoder(gps);
      return address;
    } catch (e) {
      /** si ocurre un error en el servidor que se encarga de la geocodificación inversa, enviamos la información
       *  de dirección que tenemos en el cache, si es que la hay
       */
      console.log(`Error al obtener la dirección de la unidad ${newData.UniqueID}`);
      console.error(e);
      return null;
    }
  } else {
    return cacheData?.AddressInfo;
  }
}

async function getAddressFromGeocoder(gps) {
  const lat = gps.data.Latitude;
  const lng = gps.data.Longitude;
  let addressInfo = null;

  try {
    const res = await axios.get(`http://10.132.72.71/reverse.php?format=json&lat=${lat}&lon=${lng}&zoom=16&namedetails=1`);

    if (res.data && res.data.address) {
      addressInfo = {
        Address: `${res.data.address.road ? res.data.address.road + ', ' : ''}${res.data.address.neighbourhood ? 'Col.' + res.data.address.neighbourhood + ', ' : ''} ${res.data.address.city || res.data.address.county},${res.data.address.state},${res.data.address.country}`,
        City: res.data.address.city,
        State: res.data.address.state,
        Country: res.data.address.country
      };
      //console.dir(addressInfo);
    }
    else {
      console.log(`No se enccontró direccion ${JSON.stringify(res.data)}`);
    }

  } catch (err) {
    throw err;
  };

  return addressInfo;
}

function hasMoved(gps, cacheData) {
  if (!gps.hasValidPosition()) return false;
  /** si el cache tiene dirección comparamos las latitudes y longitudes, si son iguales, no solicitamos
   * una nueva dirección, si son diferentes, solicitamos una nueva dirección, a menos que
   * a ignición este apagada y la velocidad sea menor a 1 km/h.
   */
  if ((cacheData?.Latitude === gps.data.Latitude) && (cacheData?.Longitude === gps.data.Longitude)) {
    return false;
  } else if (gps.data.Engine === false && Number.isFinite(gps.data.Speed) && gps.data.Speed <= 1) {
    return false;
  }

  return true;
}

function pushData(gps) {
  // Emitir los datos GPS a través de Socket.IO
  io.emit('gpsdata', gps.getData());
}

async function updateCache(newData, cacheData, device) {
  const unitId = newData.UniqueID;

  if (!cacheData || !unitId) return;

  /* 
  *  aqui actualizamos las propiedades que llegaron en el paquete nuevo, solo se crearan o sobreescribiran
  *  las propiedades que se encuentren presentse en newData, dejando las propiedades existentes de cacheData
  *  intactas, con eso tenemos un valor para todas las propiedades que en general envia el dispositivo, aunque no
  *  todas actualizadas a la misma fecha, algunas seran mas recientes que otras, pero al menos hay un valor, el ultimo recibido
  */
  for (const key in newData) {
    cacheData[key] = newData[key];
    cacheData.Timestamps[key] = Date.now();
  }

  /* 
  *  si el paquete contiene una posición valida, creamos un geoJSON tipo Point, con la posición, para poder utilizar
  *  esta propiedad en las consultas geoespaciales que se realizan para determinar si una unidad esta dentro de alguna geocerca 
  */
  if (newData.ValidPosition && newData.Latitude && newData.Longitude) {
    cacheData.Position = {
      type: 'Point',
      coordinates: [newData.Longitude, newData.Latitude]
    };

    cacheData.Timestamps.Position = Date.now();
  }

  try {
    await CacheModel.findOneAndUpdate(
      { UniqueID: unitId },
      { $set: cacheData },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`Error saving data to MongoDB for ${device.brand} ${device.model}, ${error.message}}`);
    console.error(cacheData.RawData);
    console.error(cacheData);
  }
}

async function queueForSave(gps) {
  let data = gps.getData();

  data = structuredClone(data);

  //console.log("Agregando datos a la cola de guardado");

  QUEUE.push(data);
}

async function saveQueueToDb() {
  if (QUEUE.length === 0) return;

  const locanet = mongoose.connection.useDb('locanet');
  const gpsHistories = locanet.collection('gpsHistories');

  //console.log("Guardando datos en la base de datos");

  const data = QUEUE.splice(0, QUEUE.length);

  try {
    const res = await gpsHistories.insertMany(data);
    //console.log(`Se guardaron ${res.insertedCount} paquetes en la base de datos`);
  } catch (error) {
    console.error(`Error saving data to MongoDB, ${error.message}}`);
    console.error(data);
    QUEUE = data.concat(QUEUE);
  }
}

async function checkForGeofences(gps, cacheData, movedStatus) {
  if (!gps.hasValidPosition()) return null;

  const uniqueID = gps.data.UniqueID;
  const lat = gps.data.Latitude;
  const lng = gps.data.Longitude;
  const point = { type: "Point", coordinates: [lng, lat] };
  const toleranceInMeters = 5000;

  if (!cacheData?.Overlays || movedStatus) {
    try {
      console.log(cacheData?.Overlays ? `La unidad ${gps.data.Alias || uniqueID} se ha movido, buscando geocercas` : `No hay datos de geocercas en el caché para ${gps.data.Alias || uniqueID}, buscando geocercas`);
      // Obtener las nuevas geocercas
      const overlays = await getOverlays(uniqueID, point, toleranceInMeters);

      //console.log(`Overlays encontrados para el vehículo ${uniqueID}${gps.data.Alias ? ("-" + gps.data.Alias) : ""}: ${overlays.length} - ${overlays}`);

      // Comparar las nuevas geocercas con las antiguas
      const { addedOverlaysIds, removedOverlaysIds } = compareOverlays(overlays, cacheData?.Overlays || []);

      //console.log(`Geocercas añadidas (checkForGeofences): ${addedOverlaysIds}`);
      //console.log(`Geocercas removidas (checkForGeofences): ${removedOverlaysIds}`);

      try {
        // Si hay cambios, actualizar la base de datos
        if (addedOverlaysIds.length > 0 || removedOverlaysIds.length > 0) {
          await addAndRemoveUnitsFromOverlayInDatabase(uniqueID, addedOverlaysIds, removedOverlaysIds);

          /** si hay addedOverlays enviamos un mensaje de entered.overlay y 
           *  si hay removedOverlays enviamos un mensaje de exited.overlay
           */
          if (addedOverlaysIds.length > 0) {
            console.log(`La unidad ${gps.data.Alias || uniqueID} ha entrado a las geocercas ${addedOverlaysIds}`);
            io.emit('entered.overlays', uniqueId, addedOverlaysIds);
          }

          if (removedOverlaysIds.length > 0) {
            console.log(`La unidad ${gps.data.Alias || uniqueID} ha salido de las geocercas ${removedOverlaysIds}`);
            io.emit('exited.overlays', uniqueId, removedOverlaysIds);
          }
        }
      }
      catch (error) {
        console.log(`Ya se cago este pedo ${error}`);
        //await handleError(error, `Error al actualizar la base de datos para la unidad ${uniqueID}`);
        return;
      }

      //console.log(`Overlays (checkForGeofences) ${overlays}`);
      return overlays;
    }
    catch (error) {
      await handleError(error, `Error al buscar geocercas para la unidad ${uniqueID}`);
      return;
    }
  }
  else {
    // Si la unidad no se ha movido y hay datos de geocercas en el caché, 
    // asignamos los datos del caché a gps.Overlays y salimos de la función.
    console.log(`La unidad ${gps.data.Alias || uniqueID} NO se ha movido, asignando datos de geocercas del caché ${cacheData.Overlays}`);
    return cacheData.Overlays;
  }
}

async function getOverlays(uniqueID, point, toleranceInMeters) {
  const [pointOrCircleOverlays, otherTypeOverlays] = await Promise.all([
    findPointOrCircleOverlays(uniqueID, point, toleranceInMeters),
    findOtherTypeOverlays(uniqueID, point)
  ]);

  const overlays = pointOrCircleOverlays.concat(otherTypeOverlays).map(overlay => overlay._id.toString());

  return overlays;
}

async function findPointOrCircleOverlays(uniqueID, point, toleranceInMeters) {
  try {
    return await Overlay.find({
      type: { $in: ["marker", "circle"] },
      vehicles: { $in: [uniqueID] },
      overlay: {
        $near: {
          $geometry: point,
          $maxDistance: toleranceInMeters
        }
      }
    }).lean();
  } catch (error) {
    console.log(`Error al buscar geocercas para la unidad ${uniqueID}`);
    console.log(error);

    return [];
  }
}

async function findOtherTypeOverlays(uniqueID, point) {
  try {
    return await Overlay.find({
      type: { $nin: ["marker", "circle"] },
      vehicles: { $in: [uniqueID] },
      overlay: { $geoIntersects: { $geometry: point } }
    }).lean();
  } catch (error) {
    console.log(`Error al buscar geocercas para la unidad ${uniqueID}`);
    console.log(error);

    return [];
  }
}

function compareOverlays(overlays, oldOverlays) {
  //console.log("Comparando geocercas");
  //console.dir(overlays);
  //console.dir(oldOverlays);
  try {
    const addedOverlaysIds = overlays.filter(overlay => !oldOverlays.includes(overlay));
    const removedOverlaysIds = oldOverlays.filter(overlay => !overlays.includes(overlay));
    //console.log("Termine de comparar geocercas");
    //console.log("Geocercas añadidas (compareOverlays)");
    //console.dir(addedOverlaysIds);
    //console.log("Geocercas removidas (compareOverlays)");
    //console.dir(removedOverlaysIds);
    return { addedOverlaysIds, removedOverlaysIds };
  }
  catch (e) {
    console.log("Error al comparar geocercas");
    console.dir(e);
    return { addedOverlays: [], removedOverlays: [] };
  }
}

/**
 * Updates the database to add and remove a unit from overlays.
 * 
 * This function takes a unit's unique ID, a list of overlay IDs it was just added to, 
 * and a list of overlay IDs it was just removed from. It constructs MongoDB bulk write
 * operations to add the unit ID to the "unitsInOverlay" array for any added overlays,
 * and remove the unit ID from the "unitsInOverlay" array for any removed overlays.
 * 
 * The bulk write operations are then executed to update the database in one batch.
 */
/**
 * Updates the unitsInOverlay field of the overlays in the database by adding or removing the given uniqueID.
 * @param {string} uniqueID - The unique identifier of the unit to be added or removed from the overlays.
 * @param {Array<string>} addedOverlays - An array of overlay IDs to which the unit should be added.
 * @param {Array<string>} removedOverlays - An array of overlay IDs from which the unit should be removed.
 * @returns {Promise<void>} - A Promise that resolves when the updates are complete.
 */
async function addAndRemoveUnitsFromOverlayInDatabase(uniqueID, addedOverlays, removedOverlays) {
  // Crear operaciones en lote para actualizar las colecciones
  const bulkOps = [];

  // Agregar operaciones para añadir la unidad a las nuevas geocercas
  for (const overlay of addedOverlays) {
    bulkOps.push({
      updateOne: {
        filter: { _id: overlay },
        update: { $addToSet: { unitsInOverlay: uniqueID } },
      },
    });
  }

  // Agregar operaciones para eliminar la unidad de las geocercas antiguas
  for (const overlay of removedOverlays) {
    bulkOps.push({
      updateOne: {
        filter: { _id: overlay },
        update: { $pull: { unitsInOverlay: uniqueID } },
      },
    });
  }

  // Ejecutar las operaciones en lote
  //console.log("Actualizando overlays en la base");
  await Overlay.bulkWrite(bulkOps);
  //console.log("Overlays actualizados");
}
