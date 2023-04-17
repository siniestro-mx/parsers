const DEVICE_MODELS = require('./device_models.js');
const parse = require('./parser.js');
const device_index = require('./index.js');

class Gl200 {
  /*  se declaran las propiedades del objeto:
  *     data: objeto con los datos del paquete
  *     msg_type: tipo de mensaje: report, command, acknowledgment, config, buffer
  *     firmware: version del firmware
  *     model: modelo del dispositivo
  *     brand: marca del dispositivo
  *     event: evento del paquete, lo que generó el dispositivo gps enviara el paquete
  *     valid_position: indica si el paquete tiene una posicion válida
  *     is_valid: indica si el paquete es válido
  *     raw_data: datos del paquete en bruto
  *     error: error en el paquete
  */
  data = {};
  msg_type = null;
  firmware = null;
  model = 'gl200';
  brand = "queclink";
  event = null;
  valid_position = false;
  is_valid = false;
  raw_data = null;
  error = null;

  constructor(data, socket_info) {
    /*  el paquete que se recibe tiene el siguiente formato
    +RESP:GTFRI,060308,862894020601574,ZBT_CORPORACION,,10,1,1,0.0,0,1116.1,-103.437155,25.548303,20200923213604,0334,0020,0FBF,31DB,00,0.0,17756:02:35,,,0,210100,,,,20200923213610,20C3$
    como llega en Buffer, se convierte a string y este se convierte en el raw_data que luego guardaremos en la base de datos
    */
    this.raw_data = data.toString();

    /*  Para procesar el paquete, primero se utiliza la función split(',') para separar los diferentes valores del paquete en un array. 
        Luego, para identificar a qué propiedad corresponde cada valor, se utiliza un archivo que contiene un objeto con las claves 
        correspondientes a los diferentes tipos de paquete (GTFRI, GTTOW, GTING, etc.). Cada valor en el objeto corresponde a otro objeto
        que contiene las propiedades del paquete como claves y el índice correspondiente a esa propiedad en el array como valor de la clave.
        De esta manera, al analizar cada valor del array, se puede determinar a qué propiedad del paquete pertenece y asignarle su valor 
        correspondiente en el objeto. */
    data = data.toString().split(',');

    /*  si el paquete es menor a 2 valores, lo ignoramos porque no es un paquete válido
    TODO: guardar el paquete y notificar que se recibió un paquete anomalo */
    if (data.length < 2) {
      this.error = "Paquete incompleto";
      return;
    }

    /*  se obtiene el modelo del dispositivo, se obtiene el tipo de mensaje, se obtiene la version del firmware. Si el modelo
    obtenido del paquete no coincide con el esperado, ignorar paquete y notificar del error para que se asigne al puerto correcto */
    this.model = Gl200.#getModel(data[1]).toLowerCase();

    if (this.model !== socket_info.model) {
      this.error = "Modelo de dispositivo no coincide con el esperado";
      return;
    }

    this.msg_type = Gl200.#getMsgType(data[0]);

    if (!this.msg_type) {
      this.error = "No se pudo obtener el tipo de mensaje";
      return;
    }

    this.firmware = Gl200.#getFirmwareVersion(data[1]);
    this.event = Gl200.#getEvent(data[0]);

    /*  En el caso de la marca Queclink, se requiere conocer el modelo del equipo, el tipo de mensaje y el evento, para así, podre buscar 
    los indices de las propiedades para este paquete en particular. Si alguno de los datos falta, no se puede continuar y hay que detener el parseo */
    if (!this.model || !this.event || !this.msg_type) {
      this.error = "No se pudieron obtener los parametros necesarios para continuar";
      return;
    }

    /*  se intenta hacer el parseo del paquete */
    try {
      const parsed_data = Gl200.#parse(data, socket_info, this);
      if (parsed_data && typeof parsed_data === 'object') {
        this.data = parsed_data;
      }
    } catch (err) {
      this.error = err;
      return;
    }

    /*  si el paquete no es válido, se detiene el parseo */
    if (!this.data.valid) {
      this.error = 'Error en paquete Gl200';
      return;
    }

    /* El campo SendTime es necesario, ya que los paquetes se guardan en orden cronológico segun los genera el equipo. Si un paquete no contiene este dato,
    se marca un error; a menos que sea un paquete GTALC, GTCID, GTALM o GTALL */
    if (!this.data.SendTime && !["GTALC", "GTCID", "GTALM", "GTALL"].includes(this.event)) {
      if (!this.data.GPSUTCTime) {
        this.error = 'Paquete sin SendTime de Gl200';
        return;
      }
      else {
        this.data.SendTime = this.data.GPSUTCTime;
        this.is_valid = true;
      }
    }
    else {
      this.is_valid = true;
    }

    /** si es un paquete que tenga coordenadas, ponemos la propiedad valid_position=true **/
    if (this.data.Latitude && this.data.Longitude) {
      this.valid_position = true;
    }

    const received_at = socket_info.received_at;
    /*  esto es para ser compatible con la version de locanet frontend al dia 7 de abril del 2023, se removera en un futuro */
    this.data = {
      ...this.data,
      received_at,
      MessageType: this.msg_type,
      DeviceType: this.model,
      Model: this.model,
      DeviceBrand: this.brand,
      Brand: this.brand,
      Event: this.event,
      is_valid: this.is_valid,
      valid_position: this.valid_position
    };
  }

  getMsgType() {
    return this.msg_type;
  }

  getEvent() {
    return this.event;
  }

  getModel() {
    return this.model;
  }

  getBrand() {
    return this.brand;
  }

  hasValidPosition() {
    return this.valid_position;
  }

  isValid() {
    return this.is_valid;
  }

  getId() {
    return this.data.UniqueID;
  }

  getData() {
    return this.data;
  }

  static getIdFromRawData(data) {
    let id = data.toString().split(',');

    if (id.length && id[2] && id[2].length) {
      id = id[2];
    }
    else {
      id = null;
    }
    return id;
  }

  static #getMsgType(raw_msg_type) {
    const msgtype = raw_msg_type.split(':')[0];

    const msg_type_map = {
      'AT+GT': 'command',
      '+ACK': 'acknowledgment',
      '+RESP': 'report',
      '+BUFF': 'buffer'
    };

    if (raw_msg_type === '+RESP:GTALC' || raw_msg_type === '+RESP:GTCID' || raw_msg_type === '+RESP:GTALL' || raw_msg_type === '+RESP:GTALM') {
      return 'config';
    }

    return msg_type_map[msgtype] || null;
  }

  static #getFirmwareVersion(raw_version) {
    try {
      const majorVersion = parseInt(raw_version.slice(2, 4), 16);
      const minorVersion = parseInt(raw_version.slice(4, 6), 16) / 100.0;

      return majorVersion + minorVersion;
    } catch (e) {
      logger.error({
        message: `Error al obtener la versión del firmware`,
        source: `/locanet_modules/queclink/gps/getFirmwareVersion`,
        raw_version: raw_version,
        error: e.message
      });

      return null;
    }
  }

  static #getEvent(raw_msg_type) {
    try {
      const event_parts = raw_msg_type.split(':');

      if (event_parts.length >= 2) {
        return event_parts[1];
      }
    } catch (e) {
      logger.error({
        message: `Error al obtener el evento`,
        source: `/locanet_modules/queclink/gps/getEvent`,
        raw_msg_type: raw_msg_type,
        error: e.message
      });
    }

    return null;
  }

  static #getModel(raw_model) {
    const model_code = raw_model.slice(0, 2);
    const model = DEVICE_MODELS[model_code];

    return model || null;
  }

  static #parseAcknowledgement(data, socket_info, me) {
    const event = me.event;
    const index = JSON.parse(JSON.stringify(device_index.acknowledgment[event]));

    let parsed_data = { valid: false };

    /* intentamos buscar y parsear cada propiedad del paquete acorde a los datos del indice del paquete */
    for (let prop in index) {
      try {
        parsed_data[prop] = parse(data, prop, index[prop], event);
      } catch (e) {
        console.log(`error al leer ${prop} con la información:\n ${data[index[prop]]}`);
        console.dir(e);
        parsed_data[prop] = e.message;
      }
    }

    for (let prop in parsed_data) {
      if (parsed_data[prop] == null) delete parsed_data[prop];
    }

    if ((Object.keys(parsed_data).length === 0) || !parsed_data.UniqueID || !parsed_data.SendTime) parsed_data.valid = false;

    return parsed_data;
  }

  static #parseReport(data, socket_info, me) {
    const event = me.event;
    let index = JSON.parse(JSON.stringify(device_index.report[event]));
    let parsed_data = { valid: false };

    //Paquete con sensor de temperatura o gasolina

    if (event === "GTERI") {
      try {
        ({ index, data } = Gl200.#specialCases(data, index, me));
      } catch (e) {
        console.log("Error en paquete GTERI");
        console.log(e);
        return parsed_data;
      }
    }
    //Paquete con mas de 1 posicion gps de equipo GV300
    else if (event === "GTFRI" && data[6] !== "1") {
      try {
        ({ index, data } = Gl200.#specialCases(data, index, me));
      } catch (e) {
        console.log("Error en paquete GTFRI con mas de una posición");
        console.log(e);
        return parsed_data;
      }
    }

    for (let prop in index) {
      const propIndex = index[prop];
      try {
        parsed_data[prop] = parse(data, prop, propIndex, event);

        if (parsed_data[prop] === null) delete parsed_data[prop];
      }
      catch (e) {
        console.log(`error al leer ${prop} con la información:\n ${data[index[prop]]}`);
        console.dir(e);
        parsed_data[prop] = e.message;
      }
    }

    if (parsed_data && parsed_data.UniqueID && parsed_data.SendTime) {
      parsed_data.valid = true;


      /*if (model === "GV200" && ((parsed_data.DigitalInput || parsed_data.DigitalInput === "0") && (parsed_data.DigitalOutput || parsed_data.DigitalOutput === "0"))) {
        parsed_data.Engine = parsed_data.DigitalInput.charAt(0);
        parsed_data.EngineLock = parsed_data.DigitalOutput.charAt(0);
      }*/

      if (parsed_data.ReportIDAppendMask || parsed_data.ReportType) {
        parsed_data.ReportIDAndType = (parsed_data.ReportIDAppendMask ? parsed_data.ReportIDAppendMask : "") + "/" + (parsed_data.ReportType ? parsed_data.ReportType : "");
        delete parsed_data.ReportIDAppendMask;
        delete parsed_data.ReportType;
      }


      if (event == 'GTIOS') {
        while (parsed_data.DigitalInput.length < 4) {
          parsed_data.DigitalInput = "0" + parsed_data.DigitalInput;
        }

        while (parsed_data.DigitalOutput.length < 3) {
          parsed_data.DigitalOutput = "0" + parsed_data.DigitalOutput;
        }
        let engine = parsed_data.DigitalInput.charAt(3) === "1" ? true : false;
        let enginelock = parsed_data.DigitalOutput.charAt(0) === "1" ? true : false;

        parsed_data.IOStatus = { engine, enginelock };
        parsed_data.Engine = engine;
        parsed_data.EngineLock = enginelock;

        for (let input = 0; input < (parsed_data.DigitalInput.length - 1); input++) {
          parsed_data.IOStatus[`input_${input + 1}`] = parsed_data.DigitalInput.charAt(input) === "1" ? true : false;
        }

        for (let output = 1; output < parsed_data.DigitalOutput.length; output++) {
          parsed_data.IOStatus[`output_${output}`] = parsed_data.DigitalOutput.charAt(output) === "1" ? true : false;
        }
      }
    }

    if (event === "GTCID") {
      parsed_data = {
        valid: true,
        UniqueID: parsed_data.UniqueID,
        ICCID: parsed_data
      };
    }

    return parsed_data;
  }

  static #specialCases(data, index, me) {
    let event = me.event;
    let uartDeviceType;

    if (event === "GTERI") {
      if (data.length === 34) {
        data.splice(31, 1);
      }
      else if (data.length === 36) {
        /*  
         *   Paquete sin sensores conectados debe traer un 0 en 
         *   la posicion 26 que es el que indica si trae sensores conectados
         *   0 indica ninguno.
         */
        index.SendTime = 34;
        index.CountNumber = 35;
      }
      else if (data.length === 30) {
        /*  
         *   Paquete sin sensores conectados debe traer un 0 en 
         *   la posicion 26 que es el que indica si trae sensores conectados
         *   0 indica ninguno.
         */
        index.SendTime = 28;
        index.CountNumber = 29;
      }
      else {
        uartDeviceType = data[index.UARTDeviceType];
        //console.log(uartDeviceType);
        if (uartDeviceType === "0") {
          index.SendTime = 27;
          index.CountNumber = 28;
          //Paquete ERI sin nada conectado, no lo usamos
        }
        else if (uartDeviceType === "1") {
          //TODO Sensor de gasolina conectado 
          index.SendTime = 33;
          index.CountNumber = 34;
          index.FuelLevel = 30;
          index.FuelSensor1 = 31;
        }
        else if (uartDeviceType === "2") {
          let sensors_number = data[27] * 1,
            sensor_index = 28,
            sensors_index = [];

          if (sensors_number === 0) {
            index.SendTime = 40;
            index.CountNumber = 41;
            index.Temperature = null;
          }
          else {
            for (let c = 0; c < sensors_number; c++) {
              sensors_index.push({
                Id: sensor_index,
                Type: sensor_index + 1,
                Value: sensor_index + 2
              });
              sensor_index += 3;
            }
            index.Temperature = sensors_index;
            index.SendTime = sensor_index;
            index.CountNumber = sensor_index + 1;
          }
          //Sensor de temperatura conectado
        }
      }
    }
    else if (event == "GTFRI") {
      //Paquete con mas de una posicion;
      let number = parseInt(data[6], 10);
      let offset;

      if (isNaN(number)) throw new Error("Invalid number of positions");

      offset = (number - 1) * 12;

      index.Mileage += offset;
      index.HourMeterCount += offset;
      index.Analog1 += offset;
      index.Analog2 += offset;
      index.BackupBatteryPercentage += offset;
      index.DeviceStatus += offset;
      index.SendTime += offset;
      index.CountNumber += offset;
    }

    return { index, data };
  }

  static #parse(data, socket_info, me) {
    const msg_type = me.msg_type;

    switch (msg_type) {
      case "acknowledgment":
        return Gl200.#parseAcknowledgement(data, socket_info, me);
      case "report":
      case "buffer":
      case "config":
        return Gl200.#parseReport(data, socket_info, me);
    }
  }
}

module.exports = Gl200;